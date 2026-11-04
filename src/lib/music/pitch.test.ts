import { describe, expect, it } from 'vitest';
import {
  centsBetween,
  detectPitch,
  formatCents,
  frequencyForMidi,
  midiForFrequency,
  nearestTarget,
  readingFor,
} from './pitch';

const SAMPLE_RATE = 48_000;
const LENGTH = 4096;

function tone(
  frequency: number,
  { harmonics = [1], amplitude = 0.4 }: { harmonics?: number[]; amplitude?: number } = {},
): Float32Array {
  const frame = new Float32Array(LENGTH);
  for (let index = 0; index < LENGTH; index += 1) {
    const t = index / SAMPLE_RATE;
    let value = 0;
    for (let harmonic = 0; harmonic < harmonics.length; harmonic += 1) {
      value += harmonics[harmonic] * Math.sin(2 * Math.PI * frequency * (harmonic + 1) * t);
    }
    frame[index] = (amplitude * value) / harmonics.length;
  }
  return frame;
}

function noise(seed = 1): Float32Array {
  let state = seed;
  const frame = new Float32Array(LENGTH);
  for (let index = 0; index < LENGTH; index += 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    frame[index] = (state / 0xffffffff - 0.5) * 0.4;
  }
  return frame;
}

describe('detectPitch', () => {
  it('finds concert A', () => {
    const result = detectPitch(tone(440), SAMPLE_RATE)!;
    expect(result).not.toBeNull();
    expect(result.frequency).toBeCloseTo(440, 1);
    expect(result.clarity).toBeGreaterThan(0.9);
  });

  it('finds the low E of a guitar', () => {
    const result = detectPitch(tone(82.41), SAMPLE_RATE)!;
    expect(result.frequency).toBeCloseTo(82.41, 1);
  });

  it('finds high notes', () => {
    const result = detectPitch(tone(880), SAMPLE_RATE)!;
    expect(result.frequency).toBeCloseTo(880, 0);
  });

  it('does not jump an octave when a harmonic is louder', () => {
    const result = detectPitch(
      tone(110, { harmonics: [1, 1.4, 0.5, 0.3, 0.2] }),
      SAMPLE_RATE,
    )!;
    expect(result.frequency).toBeGreaterThan(105);
    expect(result.frequency).toBeLessThan(115);
  });

  it('ignores silence and quiet background', () => {
    expect(detectPitch(new Float32Array(LENGTH), SAMPLE_RATE)).toBeNull();
    expect(detectPitch(tone(440, { amplitude: 0.001 }), SAMPLE_RATE)).toBeNull();
  });

  it('rejects white noise', () => {
    expect(detectPitch(noise(), SAMPLE_RATE)).toBeNull();
  });

  it('works at lower sample rates', () => {
    const frame = new Float32Array(2048);
    for (let index = 0; index < frame.length; index += 1) {
      frame[index] = 0.4 * Math.sin((2 * Math.PI * 220 * index) / 22_050);
    }
    const result = detectPitch(frame, 22_050)!;
    expect(result.frequency).toBeCloseTo(220, 0);
  });
});

describe('note readings', () => {
  it('maps MIDI and frequency both ways', () => {
    expect(midiForFrequency(440)).toBeCloseTo(69, 6);
    expect(frequencyForMidi(69)).toBeCloseTo(440, 6);
    expect(frequencyForMidi(40)).toBeCloseTo(82.41, 1);
  });

  it('reads A4 in tune', () => {
    const reading = readingFor(440)!;
    expect(reading.name).toBe('A');
    expect(reading.octave).toBe(4);
    expect(reading.cents).toBeCloseTo(0, 6);
  });

  it('reads sharp and flat notes', () => {
    expect(readingFor(441.5)!.cents).toBeCloseTo(5.9, 0);
    expect(readingFor(430)!.cents).toBeCloseTo(-39.8, 0);
    expect(readingFor(430)!.name).toBe('A');
    expect(readingFor(431)!.name).toBe('A');
  });

  it('names the pitch class and octave', () => {
    const low = readingFor(82.41)!;
    expect(low.name).toBe('E');
    expect(low.octave).toBe(2);
    expect(readingFor(261.63)!.name).toBe('C');
    expect(readingFor(261.63)!.octave).toBe(4);
  });

  it('honours a different concert pitch', () => {
    const reading = readingFor(442, 442)!;
    expect(reading.name).toBe('A');
    expect(reading.cents).toBeCloseTo(0, 6);
    expect(readingFor(440, 442)!.cents).toBeCloseTo(-7.9, 0);
  });

  it('rejects impossible frequencies', () => {
    expect(readingFor(0)).toBeNull();
    expect(readingFor(Number.NaN)).toBeNull();
    expect(readingFor(-10)).toBeNull();
  });

  it('measures cents between two frequencies', () => {
    expect(centsBetween(440, 440)).toBeCloseTo(0, 6);
    expect(centsBetween(880, 440)).toBeCloseTo(1200, 6);
    expect(centsBetween(220, 440)).toBeCloseTo(-1200, 6);
  });
});

describe('nearestTarget', () => {
  const guitar = [82.41, 110, 146.83, 196, 246.94, 329.63];

  it('picks the closest string', () => {
    expect(nearestTarget(108, guitar)).toBe(110);
    expect(nearestTarget(84, guitar)).toBe(82.41);
    expect(nearestTarget(320, guitar)).toBe(329.63);
  });

  it('copes with an empty tuning', () => {
    expect(nearestTarget(440, [])).toBeNull();
  });
});

describe('formatCents', () => {
  it('prints signed cents', () => {
    expect(formatCents(0)).toBe('0');
    expect(formatCents(0.2)).toBe('0');
    expect(formatCents(12.4)).toBe('+12');
    expect(formatCents(-12.4)).toBe('−12');
    expect(formatCents(5.4, 1)).toBe('+5.4');
  });
});
