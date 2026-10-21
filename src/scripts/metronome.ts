import {
  clampBpm,
  DEFAULT_BPM,
  DEFAULT_SIGNATURE,
  formatTimeSignature,
  MIN_TAP_GAP_MS,
  normalizeSignature,
  normalizeSubdivision,
  parseTimeSignature,
  stepDuration,
  tapTempo,
  ticksPerBar,
  ticksPerBeat,
  type Subdivision,
  type TimeSignature,
} from '../lib/metronome';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

const schema = {
  bpm: 'number',
  sig: 'string',
  sub: 'number',
  accent: 'number',
  vol: 'number',
} as const;

const defaults = {
  bpm: DEFAULT_BPM,
  sig: formatTimeSignature(DEFAULT_SIGNATURE),
  sub: 0,
  accent: 1,
  vol: 0.7,
};

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;
const DEFAULT_VOLUME = 0.7;

type ClickKind = 'down' | 'beat' | 'sub';

const CLICK: Record<ClickKind, { frequency: number; gain: number }> = {
  down: { frequency: 1600, gain: 0.5 },
  beat: { frequency: 1100, gain: 0.28 },
  sub: { frequency: 800, gain: 0.12 },
};

const transportButton =
  'inline-flex h-9 flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none';
const startButtonClass = `${transportButton} bg-fuchsia-600 text-white shadow-sm hover:opacity-90 dark:bg-fuchsia-500`;
const stopButtonClass = `${transportButton} bg-rose-600 text-white shadow-sm hover:opacity-90 dark:bg-rose-500`;

const dotClass = 'h-3 w-3 rounded-full transition-transform duration-75';
const dotIdleClasses = ['bg-zinc-300', 'dark:bg-zinc-700'];
const dotActiveClasses = ['scale-150', 'bg-fuchsia-600', 'dark:bg-fuchsia-400'];

type AudioContextCtor = typeof AudioContext;

function initRoot(root: HTMLElement): void {
  const q = <T extends HTMLElement>(selector: string) =>
    root.querySelector<T>(selector);

  const bpmInput = q<HTMLInputElement>('[data-bpm-input]');
  const bpmRange = q<HTMLInputElement>('[data-bpm-range]');
  const tapButton = q<HTMLButtonElement>('[data-tap]');
  const tapHint = q<HTMLElement>('[data-tap-hint]');
  const numeratorSelect = q<HTMLSelectElement>('[data-numerator]');
  const denominatorSelect = q<HTMLSelectElement>('[data-denominator]');
  const subdivisionSelect = q<HTMLSelectElement>('[data-subdivision]');
  const accentInput = q<HTMLInputElement>('[data-accent]');
  const volumeInput = q<HTMLInputElement>('[data-volume]');
  const volumeLabel = q<HTMLElement>('[data-volume-label]');
  const toggleButton = q<HTMLButtonElement>('[data-toggle]');
  const beatContainer = q<HTMLElement>('[data-beats]');
  const beatLabel = q<HTMLElement>('[data-beat-label]');
  const pulseEl = q<HTMLElement>('[data-pulse]');

  if (!toggleButton) return;

  let bpm = DEFAULT_BPM;
  let signature: TimeSignature = { ...DEFAULT_SIGNATURE };
  let subdivision: Subdivision = 0;
  let accent = true;
  let volume = DEFAULT_VOLUME;
  let activeBeat = -1;
  let taps: number[] = [];

  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let timerId: number | null = null;
  let nextStepTime = 0;
  let stepIndex = 0;
  let playing = false;
  const voices = new Set<{ osc: OscillatorNode; gain: GainNode }>();
  const visualTimers: number[] = [];

  const reducedMotion = window.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  const scope = globalThis as typeof globalThis & {
    webkitAudioContext?: AudioContextCtor;
  };
  const AudioCtor = scope.AudioContext ?? scope.webkitAudioContext;

  const ensureContext = (): AudioContext | null => {
    if (!AudioCtor) return null;
    if (!context) {
      try {
        context = new AudioCtor();
      } catch {
        return null;
      }
      masterGain = context.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(context.destination);
    }
    return context;
  };

  const applyVolume = (): void => {
    if (!context || !masterGain) return;
    masterGain.gain.setTargetAtTime(volume, context.currentTime, 0.01);
  };

  const pulse = (): void => {
    if (!pulseEl || reducedMotion || typeof pulseEl.animate !== 'function') return;
    pulseEl.animate(
      [
        { transform: 'scale(1)', opacity: '1' },
        { transform: 'scale(1.12)', opacity: '0.55' },
        { transform: 'scale(1)', opacity: '1' },
      ],
      { duration: 120, easing: 'ease-out' },
    );
  };

  const setActiveBeat = (index: number): void => {
    activeBeat = index;
    const dots = beatContainer
      ? Array.from(beatContainer.querySelectorAll<HTMLElement>('[data-beat-dot]'))
      : [];
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === index;
      dotIdleClasses.forEach((name) => dot.classList.toggle(name, !isActive));
      dotActiveClasses.forEach((name) => dot.classList.toggle(name, isActive));
    });
  };

  const buildDots = (): void => {
    if (!beatContainer) return;
    const dots = Array.from({ length: signature.numerator }, (_, index) => {
      const dot = document.createElement('span');
      dot.dataset.beatDot = String(index);
      dot.className = dotClass;
      dotIdleClasses.forEach((name) => dot.classList.add(name));
      return dot;
    });
    beatContainer.replaceChildren(...dots);
    setActiveBeat(-1);
  };

  const paintBpm = (): void => {
    if (bpmInput) bpmInput.value = String(bpm);
    if (bpmRange) bpmRange.value = String(bpm);
  };

  const paintControls = (): void => {
    paintBpm();
    if (numeratorSelect) numeratorSelect.value = String(signature.numerator);
    if (denominatorSelect) denominatorSelect.value = String(signature.denominator);
    if (subdivisionSelect) subdivisionSelect.value = String(subdivision);
    if (accentInput) accentInput.checked = accent;
    if (volumeInput) volumeInput.value = String(Math.round(volume * 100));
    if (volumeLabel) volumeLabel.textContent = `${Math.round(volume * 100)}%`;
    if (beatLabel) {
      beatLabel.textContent =
        playing && activeBeat >= 0
          ? `${activeBeat + 1} / ${signature.numerator}`
          : 'Ready';
    }
    if (
      beatContainer &&
      beatContainer.querySelectorAll('[data-beat-dot]').length !== signature.numerator
    ) {
      buildDots();
    }
  };

  const paintToggle = (): void => {
    toggleButton.textContent = playing ? 'Stop' : 'Start';
    toggleButton.setAttribute('aria-pressed', playing ? 'true' : 'false');
    toggleButton.className = playing ? stopButtonClass : startButtonClass;
  };

  const saveState = (): void => {
    writeUrlState(
      schema,
      {
        bpm,
        sig: formatTimeSignature(signature),
        sub: subdivision,
        accent: accent ? 1 : 0,
        vol: volume,
      },
      { defaults, pretty: true },
    );
  };

  const applyUrl = (): void => {
    const state = readUrlState(schema);
    bpm = clampBpm(typeof state.bpm === 'number' ? state.bpm : DEFAULT_BPM);
    signature = normalizeSignature(
      typeof state.sig === 'string'
        ? parseTimeSignature(state.sig) ?? DEFAULT_SIGNATURE
        : DEFAULT_SIGNATURE,
    );
    subdivision = normalizeSubdivision(
      typeof state.sub === 'number' ? state.sub : 0,
    );
    accent = state.accent !== 0;
    const rawVolume = typeof state.vol === 'number' ? state.vol : DEFAULT_VOLUME;
    volume = Math.min(1, Math.max(0, rawVolume));
    activeBeat = -1;
    stepIndex = 0;
    paintControls();
    applyVolume();
  };

  const setBpm = (value: number): void => {
    bpm = clampBpm(value);
    taps = [];
    if (tapHint) tapHint.textContent = 'Tap four times to set the tempo.';
    paintBpm();
    saveState();
  };

  const scheduleClick = (
    ctx: AudioContext,
    time: number,
    kind: ClickKind,
  ): void => {
    const config = CLICK[kind];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(config.frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(config.gain, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
    osc.connect(gain);
    if (masterGain) gain.connect(masterGain);
    else gain.connect(ctx.destination);

    const voice = { osc, gain };
    voices.add(voice);
    osc.onended = () => {
      voices.delete(voice);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(time);
    osc.stop(time + 0.06);
  };

  const scheduleVisual = (
    ctx: AudioContext,
    time: number,
    tick: number,
    ticksBeat: number,
    beatsInBar: number,
  ): void => {
    const delay = Math.max(0, (time - ctx.currentTime) * 1000);
    const id = window.setTimeout(() => {
      const pending = visualTimers.indexOf(id);
      if (pending >= 0) visualTimers.splice(pending, 1);
      if (!playing) return;
      const beat = Math.floor(tick / ticksBeat);
      if (tick % ticksBeat === 0) {
        setActiveBeat(beat);
        if (beatLabel) beatLabel.textContent = `${beat + 1} / ${beatsInBar}`;
      }
      pulse();
    }, delay);
    visualTimers.push(id);
  };

  const schedule = (): void => {
    const ctx = context;
    if (!ctx || !playing) return;

    const ticksBeat = ticksPerBeat(subdivision);
    const barTicks = ticksPerBar(signature, subdivision);
    while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const tick = stepIndex % barTicks;
      const isDownbeat = tick === 0;
      const isBeat = tick % ticksBeat === 0;
      const kind: ClickKind = isDownbeat && accent ? 'down' : isBeat ? 'beat' : 'sub';
      scheduleClick(ctx, nextStepTime, kind);
      scheduleVisual(ctx, nextStepTime, tick, ticksBeat, signature.numerator);
      nextStepTime += stepDuration(bpm, subdivision);
      stepIndex = (stepIndex + 1) % barTicks;
    }
  };

  const start = (): void => {
    if (playing) return;
    const ctx = ensureContext();
    if (!ctx) return;
    void ctx.resume().catch(() => stop());
    playing = true;
    stepIndex = 0;
    activeBeat = -1;
    nextStepTime = ctx.currentTime + 0.08;
    paintToggle();
    schedule();
    timerId = window.setInterval(schedule, LOOKAHEAD_MS);
  };

  const stop = (): void => {
    playing = false;
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    visualTimers.forEach((id) => window.clearTimeout(id));
    visualTimers.length = 0;
    voices.forEach((voice) => {
      voice.osc.onended = null;
      try {
        voice.osc.stop();
      } catch {
        // already stopped
      }
      voice.osc.disconnect();
      voice.gain.disconnect();
    });
    voices.clear();
    setActiveBeat(-1);
    if (beatLabel) beatLabel.textContent = 'Ready';
    paintToggle();
  };

  const toggle = (): void => {
    if (playing) stop();
    else start();
  };

  const registerTap = (): void => {
    const now = performance.now();
    if (taps.length > 0 && now - taps[taps.length - 1] > MIN_TAP_GAP_MS) {
      taps = [];
    }
    taps.push(now);
    if (taps.length > 8) taps = taps.slice(-8);

    const next = tapTempo(taps);
    if (next === null) {
      if (tapHint) tapHint.textContent = 'Keep tapping.';
      return;
    }
    bpm = next;
    paintBpm();
    saveState();
    if (tapHint) tapHint.textContent = `${taps.length} taps · ${bpm} BPM`;
  };

  const updateSignature = (): void => {
    signature = normalizeSignature({
      numerator: Number(numeratorSelect?.value),
      denominator: Number(denominatorSelect?.value),
    });
    stepIndex = 0;
    activeBeat = -1;
    paintControls();
    saveState();
  };

  const updateSubdivision = (): void => {
    subdivision = normalizeSubdivision(Number(subdivisionSelect?.value));
    stepIndex = 0;
    activeBeat = -1;
    paintControls();
    saveState();
  };

  bpmInput?.addEventListener('change', () => {
    setBpm(Number(bpmInput.value));
  });

  bpmRange?.addEventListener('input', () => {
    setBpm(Number(bpmRange.value));
  });

  root.querySelectorAll<HTMLButtonElement>('[data-bpm-step]').forEach((button) => {
    button.addEventListener('click', () => {
      setBpm(bpm + Number(button.dataset.bpmStep));
    });
  });

  tapButton?.addEventListener('click', registerTap);
  numeratorSelect?.addEventListener('change', updateSignature);
  denominatorSelect?.addEventListener('change', updateSignature);
  subdivisionSelect?.addEventListener('change', updateSubdivision);

  accentInput?.addEventListener('change', () => {
    accent = accentInput.checked;
    saveState();
  });

  volumeInput?.addEventListener('input', () => {
    volume = Math.min(1, Math.max(0, Number(volumeInput.value) / 100));
    if (volumeLabel) volumeLabel.textContent = `${Math.round(volume * 100)}%`;
    applyVolume();
    saveState();
  });

  toggleButton.addEventListener('click', toggle);

  document.addEventListener('keydown', (event) => {
    if (event.key !== ' ' && event.code !== 'Space') return;
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;
    if (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      tag === 'BUTTON' ||
      target?.isContentEditable
    ) {
      return;
    }
    event.preventDefault();
    toggle();
  });

  window.addEventListener('popstate', applyUrl);
  window.addEventListener('pagehide', stop);

  if (!AudioCtor) {
    toggleButton.disabled = true;
    toggleButton.textContent = 'Audio unavailable';
  }

  applyUrl();
  paintToggle();
  wireShare(root);
}

document.querySelectorAll<HTMLElement>('[data-metronome]').forEach(initRoot);
