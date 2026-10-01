import { describe, expect, it } from 'vitest';
import { epochToMillis, formatRelative, isValidDate, millisToEpoch } from './timestamp';

describe('epochToMillis', () => {
  it('treats 10-digit values as seconds', () => {
    expect(epochToMillis('1700000000')).toBe(1_700_000_000_000);
  });

  it('treats 13-digit values as milliseconds', () => {
    expect(epochToMillis('1700000000000')).toBe(1_700_000_000_000);
  });

  it('supports negative values', () => {
    expect(epochToMillis('-100')).toBe(-100_000);
  });

  it('rejects non-numeric input', () => {
    expect(epochToMillis('2026-01-01')).toBeNull();
    expect(epochToMillis('')).toBeNull();
    expect(epochToMillis('1.5')).toBeNull();
  });
});

describe('millisToEpoch', () => {
  it('returns whole seconds and milliseconds', () => {
    expect(millisToEpoch(new Date(1_700_000_000_500))).toEqual({
      seconds: 1_700_000_000,
      milliseconds: 1_700_000_000_500,
    });
  });
});

describe('isValidDate', () => {
  it('detects invalid dates', () => {
    expect(isValidDate(new Date('nope'))).toBe(false);
    expect(isValidDate(new Date(2026, 0, 1))).toBe(true);
  });
});

describe('formatRelative', () => {
  it('describes past and future', () => {
    const now = 1_700_000_000_000;
    expect(formatRelative(now - 2 * 86_400_000, now)).toBe('2 days ago');
    expect(formatRelative(now + 2 * 86_400_000, now)).toBe('in 2 days');
  });
});
