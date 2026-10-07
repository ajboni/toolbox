import { describe, expect, it } from 'vitest';
import {
  dayOfYear,
  formatDuration,
  formatTime,
  isValidLatitude,
  isValidLongitude,
  isValidTimeZone,
  solarTimes,
  twilightTimes,
} from './sun';

const utcMinutes = (date: Date): number =>
  date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;

describe('dayOfYear', () => {
  it('counts from 1 January', () => {
    expect(dayOfYear(new Date(Date.UTC(2026, 0, 1)))).toBe(1);
    expect(dayOfYear(new Date(Date.UTC(2026, 11, 31)))).toBe(365);
  });

  it('accounts for leap years', () => {
    expect(dayOfYear(new Date(Date.UTC(2028, 11, 31)))).toBe(366);
  });
});

describe('solarTimes', () => {
  it('matches London on the summer solstice', () => {
    const times = solarTimes(new Date(Date.UTC(2026, 5, 21)), 51.5074, -0.1278);
    expect(times.state).toBe('normal');
    expect(utcMinutes(times.sunrise!)).toBeCloseTo(223, -1);
    expect(utcMinutes(times.sunset!)).toBeCloseTo(1221.5, -1);
    expect(times.dayLengthMinutes!).toBeCloseTo(998, -1);
  });

  it('matches New York on New Year', () => {
    const times = solarTimes(new Date(Date.UTC(2026, 0, 1)), 40.7128, -74.006);
    expect(utcMinutes(times.sunrise!)).toBeCloseTo(739.6, -1);
    expect(utcMinutes(times.sunset!)).toBeCloseTo(1298.4, -1);
  });

  it('reports near-equal day and night on the equator', () => {
    const times = solarTimes(new Date(Date.UTC(2026, 2, 20)), 0, 0);
    expect(times.dayLengthMinutes!).toBeGreaterThan(718);
    expect(times.dayLengthMinutes!).toBeLessThan(742);
  });

  it('flags the polar day and polar night', () => {
    const summer = solarTimes(new Date(Date.UTC(2026, 5, 21)), 69.6492, 18.9553);
    expect(summer.state).toBe('polar-day');
    expect(summer.sunrise).toBeNull();
    expect(summer.dayLengthMinutes).toBe(1440);

    const winter = solarTimes(new Date(Date.UTC(2026, 11, 21)), 69.6492, 18.9553);
    expect(winter.state).toBe('polar-night');
    expect(winter.sunset).toBeNull();
    expect(winter.dayLengthMinutes).toBeNull();
  });

  it('always returns a solar noon', () => {
    const times = solarTimes(new Date(Date.UTC(2026, 0, 1)), 40.7128, -74.006);
    expect(times.solarNoon).toBeInstanceOf(Date);
  });
});

describe('twilightTimes', () => {
  it('has no astronomical darkness in a London summer', () => {
    const twilight = twilightTimes(new Date(Date.UTC(2026, 5, 21)), 51.5074, -0.1278);
    expect(twilight.civil.state).toBe('normal');
    expect(twilight.astronomical.state).toBe('polar-day');
  });
});

describe('formatDuration', () => {
  it('renders hours and minutes', () => {
    expect(formatDuration(998)).toBe('16 h 38 min');
    expect(formatDuration(65)).toBe('1 h 05 min');
  });
});

describe('formatTime', () => {
  it('formats in a given zone', () => {
    const date = new Date(Date.UTC(2026, 0, 1, 12, 20));
    expect(formatTime(date, 'UTC')).toBe('12:20');
  });
});

describe('validators', () => {
  it('checks coordinate ranges', () => {
    expect(isValidLatitude(51.5)).toBe(true);
    expect(isValidLatitude(91)).toBe(false);
    expect(isValidLongitude(-180)).toBe(true);
    expect(isValidLongitude(180.1)).toBe(false);
    expect(isValidLatitude(Number.NaN)).toBe(false);
  });

  it('checks IANA time zones', () => {
    expect(isValidTimeZone('Europe/London')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});
