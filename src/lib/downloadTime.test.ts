import { describe, expect, it } from 'vitest';
import { formatDuration, transferSeconds } from './downloadTime';

describe('transferSeconds', () => {
  it('computes time from size and speed', () => {
    expect(transferSeconds(1000, 'mb', 10, 'MBps')).toBeCloseTo(100, 6);
    expect(transferSeconds(1, 'gb', 100, 'mbps')).toBeCloseTo(80, 6);
    expect(transferSeconds(1, 'mib', 1, 'MiBps')).toBeCloseTo(1, 9);
  });

  it('rejects invalid input', () => {
    expect(transferSeconds(1000, 'mb', 0, 'MBps')).toBeNull();
    expect(transferSeconds(-1, 'mb', 10, 'MBps')).toBeNull();
    expect(transferSeconds(1000, 'nope', 10, 'MBps')).toBeNull();
    expect(transferSeconds(1000, 'mb', 10, 'nope')).toBeNull();
    expect(transferSeconds(Number.NaN, 'mb', 10, 'MBps')).toBeNull();
  });
});

describe('formatDuration', () => {
  it('formats seconds, minutes, hours and days', () => {
    expect(formatDuration(100)).toBe('1 min 40 s');
    expect(formatDuration(80)).toBe('1 min 20 s');
    expect(formatDuration(3600)).toBe('1 h');
    expect(formatDuration(3665)).toBe('1 h 1 min 5 s');
    expect(formatDuration(90000)).toBe('1 d 1 h');
    expect(formatDuration(5)).toBe('5 s');
  });

  it('handles sub-second and zero', () => {
    expect(formatDuration(0)).toBe('0 s');
    expect(formatDuration(0.4)).toBe('under a second');
  });

  it('handles invalid values', () => {
    expect(formatDuration(Number.NaN)).toBe('–');
    expect(formatDuration(-5)).toBe('–');
  });
});
