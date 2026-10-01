import { describe, expect, it } from 'vitest';
import { durationBetween, weeksAndDays } from './duration';

describe('durationBetween', () => {
  it('breaks a span into years, months and days', () => {
    const result = durationBetween(new Date(2024, 0, 15), new Date(2026, 2, 20));
    expect(result).toMatchObject({ years: 2, months: 2, days: 5, backwards: false });
  });

  it('computes total days, weeks and hours', () => {
    const result = durationBetween(new Date(2026, 0, 1), new Date(2026, 0, 15));
    expect(result).toMatchObject({ totalDays: 14, totalWeeks: 2, totalHours: 336 });
  });

  it('flags reversed ranges', () => {
    const result = durationBetween(new Date(2026, 0, 15), new Date(2026, 0, 1));
    expect(result.backwards).toBe(true);
    expect(result.totalDays).toBe(14);
  });

  it('spans leap years', () => {
    const result = durationBetween(new Date(2028, 1, 28), new Date(2028, 2, 1));
    expect(result.totalDays).toBe(2);
  });
});

describe('weeksAndDays', () => {
  it('splits days into weeks and remainder', () => {
    expect(weeksAndDays(17)).toEqual({ weeks: 2, days: 3 });
  });
});
