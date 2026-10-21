import { describe, expect, it } from 'vitest';
import {
  clampBpm,
  formatTimeSignature,
  normalizeSignature,
  normalizeSubdivision,
  parseTimeSignature,
  secondsPerBeat,
  stepDuration,
  tapTempo,
  ticksPerBar,
  ticksPerBeat,
} from './metronome';

describe('clampBpm', () => {
  it('keeps values inside the supported range', () => {
    expect(clampBpm(10)).toBe(20);
    expect(clampBpm(999)).toBe(300);
  });

  it('rounds to whole beats per minute', () => {
    expect(clampBpm(100.6)).toBe(101);
  });

  it('falls back to the default for invalid input', () => {
    expect(clampBpm(Number.NaN)).toBe(100);
    expect(clampBpm(Number.POSITIVE_INFINITY)).toBe(100);
  });
});

describe('secondsPerBeat', () => {
  it('converts beats per minute to seconds', () => {
    expect(secondsPerBeat(60)).toBeCloseTo(1);
    expect(secondsPerBeat(120)).toBeCloseTo(0.5);
    expect(secondsPerBeat(100)).toBeCloseTo(0.6);
  });
});

describe('time signatures', () => {
  it('parses common signatures', () => {
    expect(parseTimeSignature('4/4')).toEqual({ numerator: 4, denominator: 4 });
    expect(parseTimeSignature(' 6 / 8 ')).toEqual({ numerator: 6, denominator: 8 });
    expect(parseTimeSignature('16/2')).toEqual({ numerator: 16, denominator: 2 });
  });

  it('rejects invalid signatures', () => {
    for (const input of ['0/4', '17/4', '4/3', '4', '4/4/4', '']) {
      expect(parseTimeSignature(input)).toBeNull();
    }
  });

  it('formats a signature', () => {
    expect(formatTimeSignature({ numerator: 3, denominator: 4 })).toBe('3/4');
  });

  it('normalizes partial or invalid signatures', () => {
    expect(normalizeSignature({ numerator: 0, denominator: 3 })).toEqual({
      numerator: 4,
      denominator: 4,
    });
    expect(normalizeSignature({ numerator: 99, denominator: 8 })).toEqual({
      numerator: 16,
      denominator: 8,
    });
  });
});

describe('subdivision timings', () => {
  it('normalizes unsupported subdivisions to off', () => {
    expect(normalizeSubdivision(2)).toBe(2);
    expect(normalizeSubdivision(7)).toBe(0);
  });

  it('uses one tick per beat when subdivisions are off', () => {
    expect(ticksPerBeat(0)).toBe(1);
    expect(ticksPerBeat(99)).toBe(1);
  });

  it('matches the requested subdivision', () => {
    expect(ticksPerBeat(2)).toBe(2);
    expect(ticksPerBeat(3)).toBe(3);
    expect(ticksPerBeat(4)).toBe(4);
  });

  it('counts ticks per bar', () => {
    expect(ticksPerBar({ numerator: 3, denominator: 4 }, 0)).toBe(3);
    expect(ticksPerBar({ numerator: 3, denominator: 4 }, 2)).toBe(6);
    expect(ticksPerBar({ numerator: 6, denominator: 8 }, 3)).toBe(18);
  });

  it('divides the beat by the subdivision', () => {
    expect(stepDuration(60, 0)).toBeCloseTo(1);
    expect(stepDuration(60, 2)).toBeCloseTo(0.5);
    expect(stepDuration(60, 3)).toBeCloseTo(1 / 3);
  });
});

describe('tapTempo', () => {
  it('returns null with fewer than two taps', () => {
    expect(tapTempo([])).toBeNull();
    expect(tapTempo([100])).toBeNull();
  });

  it('averages regular taps', () => {
    expect(tapTempo([0, 500, 1000])).toBe(120);
    expect(tapTempo([0, 600, 1200, 1800])).toBe(100);
  });

  it('ignores taps before a long pause', () => {
    expect(tapTempo([0, 500, 5000, 5500])).toBe(120);
    expect(tapTempo([0, 500, 5000])).toBeNull();
  });

  it('clamps very fast and very slow taps', () => {
    expect(tapTempo([0, 100])).toBe(300);
    expect(tapTempo([0, 3000])).toBe(20);
  });
});
