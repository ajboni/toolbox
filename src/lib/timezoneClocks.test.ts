import { describe, expect, it } from 'vitest';
import {
  dayPhase,
  formatZoneTime,
  isValidZone,
  normalizeZone,
  parseClocks,
  serializeClocks,
  zoneLabel,
  zoneOffsetLabel,
} from './timezoneClocks';

const WINTER = new Date('2026-01-15T12:00:00Z');
const SUMMER = new Date('2026-07-15T12:00:00Z');

describe('normalizeZone', () => {
  it('resolves aliases to IANA zones', () => {
    expect(normalizeZone('cz')).toBe('Europe/Prague');
    expect(normalizeZone('usa')).toBe('America/New_York');
    expect(normalizeZone('ar')).toBe('America/Argentina/Buenos_Aires');
  });

  it('passes through valid IANA zones', () => {
    expect(normalizeZone('Asia/Tokyo')).toBe('Asia/Tokyo');
  });

  it('maps European abbreviations, including the DST forms', () => {
    expect(normalizeZone('CET')).toBe('Europe/Berlin');
    expect(normalizeZone('cest')).toBe('Europe/Berlin');
    expect(normalizeZone('eest')).toBe('Europe/Athens');
    expect(normalizeZone('west')).toBe('Europe/Lisbon');
  });

  it('accepts city and country names, ignoring case and accents', () => {
    expect(normalizeZone('london')).toBe('Europe/London');
    expect(normalizeZone('India')).toBe('Asia/Kolkata');
    expect(normalizeZone('New York')).toBe('America/New_York');
    expect(normalizeZone('reykjavik')).toBe('Atlantic/Reykjavik');
    expect(normalizeZone('São Paulo')).toBe('America/Sao_Paulo');
  });

  it('rejects unknown and empty tokens', () => {
    expect(normalizeZone('atlantis')).toBeNull();
    expect(normalizeZone('')).toBeNull();
  });
});

describe('parseClocks', () => {
  it('splits, normalizes and dedupes a comma list', () => {
    expect(parseClocks('cz, ar, usa')).toEqual([
      'Europe/Prague',
      'America/Argentina/Buenos_Aires',
      'America/New_York',
    ]);
    expect(parseClocks('Europe/Prague,Europe/Prague')).toEqual(['Europe/Prague']);
    expect(parseClocks('cet,cest')).toEqual(['Europe/Berlin']);
  });

  it('drops invalid entries and handles empty input', () => {
    expect(parseClocks('bogus,Asia/Tokyo')).toEqual(['Asia/Tokyo']);
    expect(parseClocks('')).toEqual([]);
    expect(parseClocks(null)).toEqual([]);
  });

  it('caps the number of clocks', () => {
    const raw = ['UTC', 'Asia/Tokyo', 'Europe/London'].join(',');
    expect(parseClocks(raw, 2)).toEqual(['UTC', 'Asia/Tokyo']);
  });
});

describe('serializeClocks', () => {
  it('joins zones with commas', () => {
    expect(serializeClocks(['Europe/Prague', 'Asia/Tokyo'])).toBe(
      'Europe/Prague,Asia/Tokyo',
    );
  });
});

describe('zoneLabel', () => {
  it('derives a readable label from the last segment', () => {
    expect(zoneLabel('America/New_York')).toBe('New York');
    expect(zoneLabel('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
    expect(zoneLabel('UTC')).toBe('UTC');
  });
});

describe('isValidZone', () => {
  it('checks IANA validity', () => {
    expect(isValidZone('Europe/Prague')).toBe(true);
    expect(isValidZone('Nowhere/Here')).toBe(false);
  });
});

describe('formatZoneTime', () => {
  it('formats the time, weekday and date in the given zone', () => {
    expect(formatZoneTime(WINTER, 'UTC')).toEqual({
      time: '12:00:00',
      hour: 12,
      minute: 0,
      second: 0,
      weekday: 'Thu',
      dateShort: 'Jan 15',
      isDay: true,
    });
  });

  it('respects the zone offset', () => {
    expect(formatZoneTime(WINTER, 'America/New_York').time).toBe('07:00:00');
  });
});

describe('zoneOffsetLabel', () => {
  it('reports the offset for the date, including DST', () => {
    expect(zoneOffsetLabel(WINTER, 'America/New_York')).toBe('UTC-5');
    expect(zoneOffsetLabel(SUMMER, 'America/New_York')).toBe('UTC-4');
    expect(zoneOffsetLabel(WINTER, 'Asia/Tokyo')).toBe('UTC+9');
    expect(zoneOffsetLabel(WINTER, 'UTC')).toBe('UTC');
  });
});

describe('dayPhase', () => {
  it('marks daytime hours', () => {
    expect(dayPhase(6)).toBe('day');
    expect(dayPhase(17)).toBe('day');
    expect(dayPhase(18)).toBe('night');
    expect(dayPhase(5)).toBe('night');
  });
});
