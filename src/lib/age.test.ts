import { describe, expect, it } from 'vitest';
import { ageBetween, daysUntilBirthday, nextBirthday } from './age';
import { toISODate } from './dates';

describe('ageBetween', () => {
  it('reports exact years, months and days', () => {
    const age = ageBetween(new Date(1990, 4, 15), new Date(2026, 4, 15));
    expect(age).toMatchObject({ years: 36, months: 0, days: 0, totalMonths: 432 });
  });

  it('counts partial years correctly', () => {
    const age = ageBetween(new Date(2000, 0, 10), new Date(2026, 2, 5));
    expect(age).toMatchObject({ years: 26, months: 1, days: 23 });
  });

  it('handles birthdays on Feb 29', () => {
    const age = ageBetween(new Date(2000, 1, 29), new Date(2026, 2, 1));
    expect(age?.years).toBe(26);
    expect(age?.months).toBe(0);
    expect(age?.days).toBe(0);
  });

  it('computes totals', () => {
    const age = ageBetween(new Date(2026, 0, 1), new Date(2026, 0, 15));
    expect(age).toMatchObject({ totalDays: 14, totalWeeks: 2 });
  });

  it('rejects a future birth date', () => {
    expect(ageBetween(new Date(2030, 0, 1), new Date(2026, 0, 1))).toBeNull();
  });
});

describe('nextBirthday', () => {
  it('returns this year when the birthday is ahead', () => {
    const next = nextBirthday(new Date(1990, 11, 25), new Date(2026, 5, 1));
    expect(toISODate(next)).toBe('2026-12-25');
  });

  it('rolls to next year when it has passed', () => {
    const next = nextBirthday(new Date(1990, 0, 1), new Date(2026, 5, 1));
    expect(toISODate(next)).toBe('2027-01-01');
  });

  it('clamps Feb 29 to Feb 28 in non-leap years', () => {
    const next = nextBirthday(new Date(2000, 1, 29), new Date(2026, 0, 1));
    expect(toISODate(next)).toBe('2026-02-28');
  });
});

describe('daysUntilBirthday', () => {
  it('counts days to the next birthday', () => {
    expect(daysUntilBirthday(new Date(1990, 11, 25), new Date(2026, 11, 20))).toBe(5);
  });
});
