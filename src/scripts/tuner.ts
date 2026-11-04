import {
  DEFAULT_INSTRUMENT,
  findInstrument,
  INSTRUMENTS,
  MAX_REFERENCE,
  MIN_REFERENCE,
} from '../data/instruments';
import { createPlayer } from '../lib/music/audio';
import {
  centsBetween,
  detectPitch,
  formatCents,
  frequencyForMidi,
  midiForFrequency,
  readingFor,
} from '../lib/music/pitch';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

const SCHEMA = { ref: 'number', inst: 'string' } as const;
const PROCESS_INTERVAL_MS = 45;
const SILENCE_TIMEOUT_MS = 420;
const MIN_CLARITY = 0.75;
const IN_TUNE_CENTS = 3;
const NEEDLE_SCALE = 2.8;
const NEEDLE_CENTER = 160;

type AudioContextCtor = typeof AudioContext;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function audioContextCtor(): AudioContextCtor | null {
  const scope = globalThis as typeof globalThis & {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

function initRoot(root: HTMLElement): void {
  const q = <T extends Element>(selector: string): T | null =>
    root.querySelector<T>(selector);

  const noteEl = q<HTMLElement>('[data-out="note"]');
  const centsEl = q<HTMLElement>('[data-out="cents"]');
  const detailEl = q<HTMLElement>('[data-out="detail"]');
  const statusEl = q<HTMLElement>('[data-out="status"]');
  const refEl = q<HTMLElement>('[data-out="ref"]');
  const needle = q<SVGLineElement>('[data-part="needle"]');
  const startButton = q<HTMLButtonElement>('[data-start]');
  const instrumentButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-instrument]'),
  );
  const stringsWrap = q<HTMLElement>('[data-strings-wrap]');
  const stringsEl = q<HTMLElement>('[data-strings]');
  const stepButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-ref-step]'),
  );
  const refRange = q<HTMLInputElement>('[data-ref-range]');

  if (!startButton) return;

  const minRef = Number(root.dataset.minRef ?? MIN_REFERENCE);
  const maxRef = Number(root.dataset.maxRef ?? MAX_REFERENCE);
  const defaultRef = Number(root.dataset.defaultRef ?? 440);
  const defaultInstrument = root.dataset.defaultInstrument ?? DEFAULT_INSTRUMENT;

  const params = readUrlState(SCHEMA);
  const urlRef =
    typeof params.ref === 'number' && params.ref >= minRef && params.ref <= maxRef
      ? Math.round(params.ref)
      : defaultRef;
  const urlInstrument =
    typeof params.inst === 'string' && findInstrument(params.inst)
      ? params.inst
      : defaultInstrument;

  let reference = urlRef;
  let instrument = findInstrument(urlInstrument) ?? findInstrument(defaultInstrument) ?? INSTRUMENTS[0];

  let context: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let analyser: AnalyserNode | null = null;
  let buffer: Float32Array<ArrayBuffer> | null = null;
  let frameId = 0;
  let lastProcess = 0;
  let lastSeen = 0;
  let running = false;
  let history: number[] = [];
  let activeString: number | null = null;
  let player: ReturnType<typeof createPlayer> = null;

  const setStatus = (text: string): void => {
    if (statusEl) statusEl.textContent = text;
  };

  const writeUrl = (): void => {
    writeUrlState(
      SCHEMA,
      { ref: reference, inst: instrument.slug },
      { defaults: { ref: defaultRef, inst: defaultInstrument } },
    );
  };

  const setNeedle = (cents: number | null, inTune: boolean): void => {
    if (!needle) return;
    const clamped = Math.max(-50, Math.min(50, cents ?? 0));
    const x = NEEDLE_CENTER + clamped * NEEDLE_SCALE;
    needle.setAttribute('x1', String(x));
    needle.setAttribute('x2', String(x));
    needle.setAttribute('data-tune', inTune ? '1' : '0');
    needle.style.opacity = cents == null ? '0.35' : '1';
    if (noteEl) noteEl.setAttribute('data-tune', inTune ? '1' : '0');
  };

  const showIdle = (message: string): void => {
    if (noteEl) noteEl.textContent = '♪';
    if (centsEl) centsEl.textContent = message;
    if (detailEl) detailEl.textContent = '\u00a0';
    setNeedle(null, false);
    if (activeString != null) {
      activeString = null;
      syncStringButtons();
    }
  };

  const syncStringButtons = (): void => {
    for (const button of stringsEl?.querySelectorAll<HTMLButtonElement>('[data-string]') ?? []) {
      const midi = Number(button.dataset.string);
      if (midi === activeString) button.dataset.active = '1';
      else delete button.dataset.active;
    }
  };

  const renderStrings = (): void => {
    if (!stringsEl || !stringsWrap) return;
    stringsWrap.hidden = instrument.strings.length === 0;
    const buttons: HTMLButtonElement[] = [];
    for (const string of instrument.strings) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.string = String(string.midi);
      button.textContent = string.label;
      button.className =
        'rounded-full border border-zinc-300 px-3 py-1 text-sm font-semibold tabular-nums text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100 data-[active]:border-fuchsia-500 data-[active]:bg-fuchsia-50 dark:data-[active]:border-fuchsia-500/60 dark:data-[active]:bg-fuchsia-950/40';
      button.addEventListener('click', () => playString(string.midi));
      buttons.push(button);
    }
    stringsEl.replaceChildren(...buttons);
    activeString = null;
  };

  const playString = (midi: number): void => {
    player ??= createPlayer();
    const frequency = frequencyForMidi(midi, reference);
    player?.playNote(midiForFrequency(frequency), { duration: 1.2 });
  };

  const syncInstrumentButtons = (): void => {
    for (const button of instrumentButtons) {
      if (button.dataset.instrument === instrument.slug) button.dataset.active = '1';
      else delete button.dataset.active;
    }
  };

  const syncReference = (): void => {
    if (refEl) refEl.textContent = `${reference} Hz`;
    if (refRange) refRange.value = String(reference);
  };

  const targetFor = (
    frequency: number,
  ): { frequency: number; midi: number | null } => {
    const strings = instrument.strings;
    if (strings.length > 0) {
      let best = strings[0];
      let bestCents = Number.POSITIVE_INFINITY;
      for (const string of strings) {
        const target = frequencyForMidi(string.midi, reference);
        const distance = Math.abs(centsBetween(frequency, target));
        if (distance < bestCents) {
          bestCents = distance;
          best = string;
        }
      }
      return { frequency: frequencyForMidi(best.midi, reference), midi: best.midi };
    }
    const midi = Math.round(midiForFrequency(frequency, reference));
    return { frequency: frequencyForMidi(midi, reference), midi: null };
  };

  const handlePitch = (raw: number): void => {
    if (history.length > 0 && Math.abs(centsBetween(raw, median(history))) > 150) {
      history = [];
    }
    history.push(raw);
    if (history.length > 5) history.shift();
    const frequency = median(history);

    const target = targetFor(frequency);
    const cents = centsBetween(frequency, target.frequency);
    const reading = readingFor(target.frequency, reference);
    if (!reading) return;

    const inTune = Math.abs(cents) <= IN_TUNE_CENTS;
    if (noteEl) noteEl.textContent = `${reading.name}${reading.octave}`;
    if (centsEl) {
      centsEl.textContent = `${formatCents(cents)} cents`;
    }
    if (detailEl) {
      detailEl.textContent = `${frequency.toFixed(1)} Hz · target ${target.frequency.toFixed(1)} Hz`;
    }
    setNeedle(cents, inTune);
    setStatus(inTune ? 'In tune' : 'Listening…');

    if (target.midi !== activeString) {
      activeString = target.midi;
      syncStringButtons();
    }
  };

  const stop = (): void => {
    running = false;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    analyser?.disconnect();
    analyser = null;
    buffer = null;
    for (const track of stream?.getTracks() ?? []) track.stop();
    stream = null;
    if (context) {
      void context.close();
      context = null;
    }
    history = [];
    startButton.textContent = 'Start listening';
    setStatus('The microphone is only used while the tuner is running.');
    showIdle('Play a note');
  };

  const loop = (time: number): void => {
    if (!running) return;
    frameId = requestAnimationFrame(loop);
    if (!context || !analyser || !buffer) return;
    if (time - lastProcess < PROCESS_INTERVAL_MS) return;
    lastProcess = time;

    analyser.getFloatTimeDomainData(buffer);
    const result = detectPitch(buffer, context.sampleRate, {
      minHz: 55,
      maxHz: 1400,
      silence: 0.003,
    });

    if (result && result.clarity >= MIN_CLARITY) {
      lastSeen = time;
      handlePitch(result.frequency);
    } else if (time - lastSeen > SILENCE_TIMEOUT_MS) {
      history = [];
      showIdle('Play a note');
      setStatus('Listening…');
    }
  };

  const start = async (): Promise<void> => {
    if (running) {
      stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('This browser does not expose the microphone to web pages.');
      return;
    }
    const Ctor = audioContextCtor();
    if (!Ctor) {
      setStatus('This browser does not support the Web Audio API.');
      return;
    }

    startButton.disabled = true;
    setStatus('Waiting for microphone permission…');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch {
      startButton.disabled = false;
      setStatus('Microphone access was blocked. Allow it and try again.');
      return;
    }

    try {
      context = new Ctor();
      await context.resume();
      analyser = context.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      context.createMediaStreamSource(stream).connect(analyser);
      buffer = new Float32Array(analyser.fftSize);
    } catch {
      for (const track of stream.getTracks()) track.stop();
      stream = null;
      context = null;
      startButton.disabled = false;
      setStatus('The audio engine could not start on this device.');
      return;
    }

    running = true;
    lastSeen = performance.now();
    lastProcess = 0;
    startButton.disabled = false;
    startButton.textContent = 'Stop';
    setStatus('Listening…');
    showIdle('Play a note');
    frameId = requestAnimationFrame(loop);
  };

  startButton.addEventListener('click', () => {
    void start();
  });

  for (const button of instrumentButtons) {
    button.addEventListener('click', () => {
      const next = findInstrument(button.dataset.instrument ?? '');
      if (!next) return;
      instrument = next;
      history = [];
      syncInstrumentButtons();
      renderStrings();
      showIdle('Play a note');
      writeUrl();
    });
  }

  for (const button of stepButtons) {
    button.addEventListener('click', () => {
      const step = Number(button.dataset.refStep ?? 0);
      reference = Math.min(maxRef, Math.max(minRef, reference + step));
      syncReference();
      history = [];
      showIdle('Play a note');
      writeUrl();
    });
  }

  refRange?.addEventListener('input', () => {
    reference = Math.min(maxRef, Math.max(minRef, Math.round(Number(refRange.value))));
    if (refEl) refEl.textContent = `${reference} Hz`;
    history = [];
    showIdle('Play a note');
  });
  refRange?.addEventListener('change', () => writeUrl());

  window.addEventListener('pagehide', stop);

  syncInstrumentButtons();
  syncReference();
  renderStrings();
  showIdle('Play a note');
  wireShare(root);
}

const roots = document.querySelectorAll<HTMLElement>('[data-tuner]');
roots.forEach(initRoot);
