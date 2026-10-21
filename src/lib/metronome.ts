export const MIN_BPM = 20;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 100;

export const DENOMINATORS = [2, 4, 8, 16] as const;
export type Denominator = (typeof DENOMINATORS)[number];

export const SUBDIVISIONS = [
  { value: 0, label: 'Off' },
  { value: 2, label: 'Eighths' },
  { value: 3, label: 'Triplets' },
  { value: 4, label: 'Sixteenths' },
] as const;

export type Subdivision = (typeof SUBDIVISIONS)[number]['value'];

export const MIN_NUMERATOR = 1;
export const MAX_NUMERATOR = 16;
export const MIN_TAP_GAP_MS = 4_000;

export interface TimeSignature {
  numerator: number;
  denominator: Denominator;
}

export const DEFAULT_SIGNATURE: TimeSignature = {
  numerator: 4,
  denominator: 4,
};

export function clampBpm(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BPM;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
}

export function secondsPerBeat(bpm: number): number {
  return 60 / clampBpm(bpm);
}

export function isDenominator(value: number): value is Denominator {
  return (DENOMINATORS as readonly number[]).includes(value);
}

export function parseTimeSignature(input: string): TimeSignature | null {
  const match = /^\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*$/.exec(input);
  if (!match) return null;

  const numerator = Number(match[1]);
  const denominator = Number(match[2]);

  if (numerator < MIN_NUMERATOR || numerator > MAX_NUMERATOR) return null;
  if (!isDenominator(denominator)) return null;

  return { numerator, denominator };
}

export function formatTimeSignature(signature: TimeSignature): string {
  return `${signature.numerator}/${signature.denominator}`;
}

export interface SignatureInput {
  numerator?: number;
  denominator?: number;
}

export function normalizeSignature(input: SignatureInput): TimeSignature {
  const numerator = Math.trunc(Number(input.numerator) || 4);
  const denominator = Number(input.denominator);
  return {
    numerator: Math.min(MAX_NUMERATOR, Math.max(MIN_NUMERATOR, numerator)),
    denominator: isDenominator(denominator) ? denominator : 4,
  };
}

export function isSubdivision(value: number): value is Subdivision {
  return SUBDIVISIONS.some((option) => option.value === value);
}

export function normalizeSubdivision(value: number): Subdivision {
  return isSubdivision(value) ? value : 0;
}

export function ticksPerBeat(subdivision: number): number {
  switch (subdivision) {
    case 2:
    case 3:
    case 4:
      return subdivision;
    default:
      return 1;
  }
}

export function ticksPerBar(
  signature: TimeSignature,
  subdivision: number,
): number {
  return signature.numerator * ticksPerBeat(subdivision);
}

export function stepDuration(bpm: number, subdivision: number): number {
  return secondsPerBeat(bpm) / ticksPerBeat(subdivision);
}

export function tapTempo(
  timestamps: number[],
  resetAfterMs: number = MIN_TAP_GAP_MS,
): number | null {
  const taps = timestamps.filter((value) => Number.isFinite(value));
  if (taps.length < 2) return null;

  let start = 0;
  for (let index = 1; index < taps.length; index += 1) {
    if (taps[index] - taps[index - 1] > resetAfterMs) start = index;
  }
  if (taps.length - start < 2) return null;

  const intervals: number[] = [];
  for (let index = start + 1; index < taps.length; index += 1) {
    const interval = taps[index] - taps[index - 1];
    if (interval > 0) intervals.push(interval);
  }
  if (intervals.length === 0) return null;

  const average =
    intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  return clampBpm(60_000 / average);
}
