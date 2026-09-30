import type { ViewNote } from './view';

const A4_MIDI = 69;
const A4_FREQUENCY = 440;

export function midiForPitchClass(pitchClass: number, octave = 4): number {
  return 12 * (octave + 1) + pitchClass;
}

export function frequencyForMidi(midi: number): number {
  return A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12);
}

export function ascendingMidi(pitchClasses: number[], octave = 4): number[] {
  const result: number[] = [];
  let previous: number | null = null;
  for (const pitchClass of pitchClasses) {
    if (previous === null) {
      result.push(midiForPitchClass(pitchClass, octave));
    } else {
      const delta = ((pitchClass - previous + 12) % 12) || 12;
      result.push(result[result.length - 1] + delta);
    }
    previous = pitchClass;
  }
  return result;
}

export function notesMidi(notes: ViewNote[], octave = 4): number[] {
  return ascendingMidi(
    notes.map((note) => note.pitchClass),
    octave,
  );
}

export interface SequenceOptions {
  bpm?: number;
  onStep?: (index: number) => void;
  onEnd?: () => void;
}

export interface ChordOptions {
  duration?: number;
  onEnd?: () => void;
}

export interface NoteOptions {
  duration?: number;
  onEnd?: () => void;
}

export interface Player {
  playSequence(midis: number[], options?: SequenceOptions): void;
  playNote(midi: number, options?: NoteOptions): void;
  playChord(midis: number[], options?: ChordOptions): void;
  stop(): void;
}

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
}

type AudioContextCtor = typeof AudioContext;

export function createPlayer(): Player | null {
  if (typeof window === 'undefined') return null;
  const scope = globalThis as typeof globalThis & {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  const Ctor = scope.AudioContext ?? scope.webkitAudioContext;
  if (!Ctor) return null;

  const AudioCtor: AudioContextCtor = Ctor;
  let context: AudioContext | null = null;
  const active = new Set<Voice>();
  const timers: number[] = [];

  const ensureContext = (): AudioContext | null => {
    if (!context) {
      try {
        context = new AudioCtor();
      } catch {
        return null;
      }
    }
    return context;
  };

  const stop = (): void => {
    for (const id of timers) window.clearTimeout(id);
    timers.length = 0;
    for (const voice of active) {
      try {
        voice.osc.stop();
      } catch {
        // already stopped
      }
      voice.osc.disconnect();
      voice.gain.disconnect();
    }
    active.clear();
  };

  const startVoice = (
    ctx: AudioContext,
    midi: number,
    start: number,
    duration: number,
    peak: number,
  ): void => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequencyForMidi(midi), start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    const voice: Voice = { osc, gain };
    active.add(voice);
    osc.onended = () => {
      active.delete(voice);
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(start);
    osc.stop(start + duration + 0.05);
  };

  const playSequence = (midis: number[], options: SequenceOptions = {}): void => {
    const { bpm = 100, onStep, onEnd } = options;
    stop();
    const ctx = ensureContext();
    if (!ctx || midis.length === 0) {
      onEnd?.();
      return;
    }
    void ctx.resume();
    const beat = 60 / bpm;
    const noteDuration = Math.max(beat * 2.6, 1.1);
    const now = ctx.currentTime + 0.08;
    midis.forEach((midi, index) => {
      startVoice(ctx, midi, now + index * beat, noteDuration, 0.22);
      if (onStep) {
        const delay = (now - ctx.currentTime + index * beat) * 1000;
        timers.push(window.setTimeout(() => onStep(index), Math.max(0, delay)));
      }
    });
    const lastEnd = now - ctx.currentTime + (midis.length - 1) * beat + noteDuration;
    timers.push(window.setTimeout(() => onEnd?.(), Math.max(0, lastEnd * 1000)));
  };

  const playNote = (midi: number, options: NoteOptions = {}): void => {
    const { duration = 1.1, onEnd } = options;
    stop();
    const ctx = ensureContext();
    if (!ctx) {
      onEnd?.();
      return;
    }
    void ctx.resume();
    const now = ctx.currentTime + 0.05;
    startVoice(ctx, midi, now, duration, 0.22);
    timers.push(window.setTimeout(() => onEnd?.(), (duration + 0.1) * 1000));
  };

  const playChord = (midis: number[], options: ChordOptions = {}): void => {
    const { duration = 1.6, onEnd } = options;
    stop();
    const ctx = ensureContext();
    if (!ctx || midis.length === 0) {
      onEnd?.();
      return;
    }
    void ctx.resume();
    const now = ctx.currentTime + 0.05;
    midis.forEach((midi) => startVoice(ctx, midi, now, duration, 0.18));
    timers.push(window.setTimeout(() => onEnd?.(), (duration + 0.1) * 1000));
  };

  return { playSequence, playNote, playChord, stop };
}
