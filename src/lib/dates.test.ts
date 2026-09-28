import { describe, expect, it } from 'vitest';
import {
  daysUntil,
  humanizeDays,
  nextAnnualOccurrence,
  nextNewYear,
  parseISODate,
  toISODate,
} from './dates';

describe('parseISODate', () => {
  it('parses a valid date', () => {
    const date = parseISODate('2026-12-25');
    expect(date).not.toBeNull();
    expect(toISODate(date!)).toBe('2026-12-25');
  });

  it('rejects malformed input', () => {
    expect(parseISODate('25/12/2026')).toBeNull();
    expect(parseISODate('2026-13-01')).toBeNull();
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(parseISODate('')).toBeNull();
    expect(parseISODate(null)).toBeNull();
  });
});

describe('daysUntil', () => {
  it('is zero for the same day', () => {
    expect(daysUntil(new Date(2026, 5, 15), new Date(2026, 5, 15, 23, 59))).toBe(0);
  });

  it('counts whole days forward', () => {
    expect(daysUntil(new Date(2026, 0, 2), new Date(2026, 0, 1))).toBe(1);
    expect(daysUntil(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(-1);
  });

  it('crosses a year boundary', () => {
    expect(daysUntil(new Date(2027, 0, 1), new Date(2026, 11, 31))).toBe(1);
  });

  it('handles leap years', () => {
    expect(daysUntil(new Date(2028, 2, 1), new Date(2028, 1, 28))).toBe(2);
    expect(daysUntil(new Date(2026, 2, 1), new Date(2026, 1, 28))).toBe(1);
  });
});

describe('nextAnnualOccurrence', () => {
  it('returns this year when the date is ahead', () => {
    const next = nextAnnualOccurrence(12, 25, new Date(2026, 5, 1));
    expect(toISODate(next)).toBe('2026-12-25');
  });

  it('returns next year when the date has passed', () => {
    const next = nextAnnualOccurrence(1, 1, new Date(2026, 5, 1));
    expect(toISODate(next)).toBe('2027-01-01');
  });

  it('returns today when the date is today', () => {
    const next = nextAnnualOccurrence(6, 15, new Date(2026, 5, 15, 8));
    expect(toISODate(next)).toBe('2026-06-15');
  });
});

describe('nextNewYear', () => {
  it('points to 1 January', () => {
    const next = nextNewYear(new Date(2026, 11, 31));
    expect(toISODate(next)).toBe('2027-01-01');
  });
});

describe('humanizeDays', () => {
  it('breaks days into weeks and remainder', () => {
    expect(humanizeDays(17)).toEqual({
      days: 17,
      weeks: 2,
      remainderDays: 3,
      months: 0,
    });
  });

  it('uses absolute values', () => {
    expect(humanizeDays(-10).days).toBe(10);
  });
});
