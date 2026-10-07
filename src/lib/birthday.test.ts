import { describe, expect, it } from 'vitest';
import {
  birthdayOccurrences,
  mostCommonWeekday,
  weekdayCounts,
} from './birthday';
import { toISODate } from './dates';

describe('birthdayOccurrences', () => {
  it('lists one occurrence per year from birth to end', () => {
    const list = birthdayOccurrences(new Date(2000, 0, 1), 2000, 2009);
    expect(list).toHaveLength(10);
    expect(list[0]).toMatchObject({ year: 2000, age: 0 });
    expect(list[9]).toMatchObject({ year: 2009, age: 9 });
  });

  it('never starts before the birth year', () => {
    const list = birthdayOccurrences(new Date(1990, 5, 1), 1900, 1992);
    expect(list.map((item) => item.year)).toEqual([1990, 1991, 1992]);
  });

  it('knows the weekday of a known date', () => {
    const [first] = birthdayOccurrences(new Date(2000, 0, 1), 2000, 2000);
    expect(first.weekday).toBe(6);
  });

  it('clamps Feb 29 to Feb 28 in non-leap years', () => {
    const list = birthdayOccurrences(new Date(2000, 1, 29), 2026, 2028);
    expect(toISODate(list[0].date)).toBe('2026-02-28');
    expect(list[0].isClamped).toBe(true);
    expect(toISODate(list[1].date)).toBe('2027-02-28');
    expect(toISODate(list[2].date)).toBe('2028-02-29');
    expect(list[2].isClamped).toBe(false);
  });

  it('does not mark regular birthdays as clamped', () => {
    const list = birthdayOccurrences(new Date(1990, 4, 15), 2026, 2026);
    expect(list[0].isClamped).toBe(false);
  });
});

describe('weekdayCounts', () => {
  it('totals occurrences per weekday and sums to the row count', () => {
    const list = birthdayOccurrences(new Date(2000, 0, 1), 2000, 2099);
    const counts = weekdayCounts(list);
    expect(counts).toHaveLength(7);
    const total = counts.reduce((sum, item) => sum + item.count, 0);
    expect(total).toBe(list.length);
  });

  it('names the weekdays in order', () => {
    const counts = weekdayCounts([]);
    expect(counts.map((item) => item.name)).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
  });
});

describe('mostCommonWeekday', () => {
  it('returns null for an empty list', () => {
    expect(mostCommonWeekday([])).toBeNull();
  });

  it('picks the weekday with the highest count', () => {
    const list = birthdayOccurrences(new Date(2000, 0, 1), 2000, 2099);
    const best = mostCommonWeekday(list);
    const max = Math.max(...weekdayCounts(list).map((item) => item.count));
    expect(best?.count).toBe(max);
  });
});
