import { MAX_CLOCKS, TIMEZONES, ZONE_ALIASES } from '../data/timezones';

export interface ZoneTime {
  time: string;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
  dateShort: string;
  isDay: boolean;
}

export function isValidZone(zone: string): boolean {
  const value = zone.trim();
  if (!value) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

const NAMED_ZONES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [key, zone] of Object.entries(ZONE_ALIASES)) {
    map[normalizeKey(key)] = zone;
  }
  for (const entry of TIMEZONES) {
    const key = normalizeKey(entry.label);
    if (!(key in map)) map[key] = entry.zone;
  }
  return map;
})();

export function normalizeZone(token: string): string | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const alias = NAMED_ZONES[normalizeKey(trimmed)];
  const candidate = alias ?? trimmed;
  return isValidZone(candidate) ? candidate : null;
}

export function parseClocks(raw: string | null | undefined, max = MAX_CLOCKS): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const zones: string[] = [];
  for (const token of raw.split(',')) {
    if (zones.length >= max) break;
    const zone = normalizeZone(token);
    if (!zone || seen.has(zone)) continue;
    seen.add(zone);
    zones.push(zone);
  }
  return zones;
}

export function serializeClocks(zones: string[]): string {
  return zones.join(',');
}

export function zoneLabel(zone: string): string {
  const segment = zone.split('/').pop() ?? zone;
  return segment.replace(/_/g, ' ');
}

export function dayPhase(hour: number): 'day' | 'night' {
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

export function formatZoneTime(date: Date, zone: string): ZoneTime {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  const hour = Number(get('hour'));
  const time = `${get('hour')}:${get('minute')}:${get('second')}`;

  return {
    time,
    hour,
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: get('weekday'),
    dateShort: `${get('month')} ${get('day')}`,
    isDay: dayPhase(hour) === 'day',
  };
}

export function zoneOffsetLabel(date: Date, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    timeZoneName: 'shortOffset',
  }).formatToParts(date);
  const name = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
  if (!name) return 'UTC';
  const label = name.replace('GMT', 'UTC');
  return label === 'UTC+0' || label === 'UTC-0' ? 'UTC' : label;
}
