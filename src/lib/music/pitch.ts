const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export const DEFAULT_REFERENCE = 440;

export interface PitchOptions {
  minHz?: number;
  maxHz?: number;
  threshold?: number;
  silence?: number;
}

export interface PitchResult {
  frequency: number;
  clarity: number;
  rms: number;
}

export interface NoteReading {
  midi: number;
  name: string;
  octave: number;
  frequency: number;
  cents: number;
}

export function frequencyForMidi(
  midi: number,
  reference: number = DEFAULT_REFERENCE,
): number {
  return reference * 2 ** ((midi - 69) / 12);
}

export function midiForFrequency(
  frequency: number,
  reference: number = DEFAULT_REFERENCE,
): number {
  return 69 + 12 * Math.log2(frequency / reference);
}

export function centsBetween(frequency: number, target: number): number {
  return 1200 * Math.log2(frequency / target);
}

export function readingFor(
  frequency: number,
  reference: number = DEFAULT_REFERENCE,
): NoteReading | null {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  const exact = midiForFrequency(frequency, reference);
  const midi = Math.round(exact);
  const target = frequencyForMidi(midi, reference);
  const pitchClass = ((midi % 12) + 12) % 12;
  return {
    midi,
    name: NOTE_NAMES[pitchClass],
    octave: Math.floor(midi / 12) - 1,
    frequency: target,
    cents: centsBetween(frequency, target),
  };
}

export function nearestTarget(frequency: number, targets: number[]): number | null {
  if (targets.length === 0) return null;
  let best = targets[0];
  let bestDistance = Math.abs(centsBetween(frequency, best));
  for (const target of targets.slice(1)) {
    const distance = Math.abs(centsBetween(frequency, target));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = target;
    }
  }
  return best;
}

export function formatCents(cents: number, digits = 0): string {
  const rounded = Number(cents.toFixed(digits));
  if (Math.abs(rounded) < 0.5) return '0';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(digits)}`;
}

function rmsOf(frame: Float32Array): number {
  let sum = 0;
  for (let index = 0; index < frame.length; index += 1) {
    sum += frame[index] * frame[index];
  }
  return Math.sqrt(sum / frame.length);
}

function decimate(frame: Float32Array, step: number): Float32Array {
  const length = Math.floor(frame.length / step);
  const output = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    output[index] = frame[index * step];
  }
  return output;
}

export function detectPitch(
  frame: Float32Array,
  sampleRate: number,
  options: PitchOptions = {},
): PitchResult | null {
  const {
    minHz = 55,
    maxHz = 1500,
    threshold = 0.15,
    silence = 0.004,
  } = options;

  if (frame.length < 256 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return null;
  }

  const rms = rmsOf(frame);
  if (rms < silence) return null;

  const step = sampleRate > 30_000 ? 2 : 1;
  const data = step === 1 ? frame : decimate(frame, step);
  const rate = sampleRate / step;

  const minLag = Math.max(2, Math.floor(rate / maxHz));
  const maxLag = Math.min(
    Math.floor(data.length / 2),
    Math.floor(rate / minHz),
  );
  if (maxLag <= minLag + 2) return null;

  const windowSize = Math.min(data.length - maxLag - 1, 2048);
  if (windowSize < 64) return null;

  const difference = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag += 1) {
    let sum = 0;
    for (let index = 0; index < windowSize; index += 1) {
      const delta = data[index] - data[index + lag];
      sum += delta * delta;
    }
    difference[lag] = sum;
  }

  const normalized = new Float32Array(maxLag + 2);
  let running = 0;
  for (let lag = minLag; lag <= maxLag + 1; lag += 1) {
    running += difference[lag];
    const count = lag - minLag + 1;
    normalized[lag] = running === 0 ? 1 : (difference[lag] * count) / running;
  }

  let candidate = -1;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    if (normalized[lag] < threshold) {
      while (lag + 1 <= maxLag && normalized[lag + 1] < normalized[lag]) {
        lag += 1;
      }
      candidate = lag;
      break;
    }
  }

  if (candidate < 0) {
    let best = minLag;
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      if (normalized[lag] < normalized[best]) best = lag;
    }
    if (1 - normalized[best] < 0.6) return null;
    candidate = best;
  }

  const middle = normalized[candidate];

  let bestValue = Number.POSITIVE_INFINITY;
  let lag = candidate;
  for (let probe = candidate - 1; probe <= candidate + 1; probe += 0.02) {
    const base = Math.floor(probe);
    const fraction = probe - base;
    let sum = 0;
    for (let index = 0; index < windowSize; index += 1) {
      const sample =
        data[index + base] * (1 - fraction) + data[index + base + 1] * fraction;
      const delta = data[index] - sample;
      sum += delta * delta;
    }
    if (sum < bestValue) {
      bestValue = sum;
      lag = probe;
    }
  }

  const frequency = rate / lag;

  if (frequency < minHz || frequency > maxHz) return null;

  return {
    frequency,
    clarity: Math.max(0, Math.min(1, 1 - middle)),
    rms,
  };
}
