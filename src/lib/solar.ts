const DEG = Math.PI / 180;
const MS_PER_DAY = 86_400_000;

export const MINUTES_PER_DAY = 1440;

export const OFFICIAL_ZENITH = 90.833;

export type PolarState = 'normal' | 'polar-day' | 'polar-night';

export interface SolarGeometry {
  declination: number;
  eqTime: number;
}

export interface SolarPosition {
  elevation: number;
  azimuth: number;
  hourAngle: number;
  declination: number;
  eqTime: number;
}

export interface DayBounds {
  sunrise: number | null;
  sunset: number | null;
  sunriseAzimuth: number | null;
  sunsetAzimuth: number | null;
  dayLengthMinutes: number | null;
  state: PolarState;
}

export interface SunPathPoint {
  minutes: number;
  elevation: number;
  azimuth: number;
}

export interface AnalemmaPoint {
  day: number;
  elevation: number;
  azimuth: number;
}

export interface RingDay {
  day: number;
  daylightMinutes: number;
  state: PolarState;
}

export interface Shadow {
  length: number;
  ratio: number;
  azimuth: number;
}

export interface PositionInput {
  dayOfYear: number;
  minutes: number;
  latitude: number;
  longitude: number;
}

export interface PathInput {
  dayOfYear: number;
  latitude: number;
  longitude: number;
  offsetMinutes: number;
  stepMinutes?: number;
}

export interface AnalemmaInput {
  latitude: number;
  longitude: number;
  offsetMinutes: number;
  minutes: number;
  year: number;
  stepDays?: number;
}

export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const current = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.round((current - start) / MS_PER_DAY);
}

export function daysInYear(year: number): number {
  return dayOfYear(new Date(Date.UTC(year, 11, 31)));
}

export function dayOfYearFor(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.round((current - start) / MS_PER_DAY) + 1;
}

export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

export function parseCivilDate(value: string | null | undefined): CivilDate | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function dateForDayOfYear(year: number, day: number): CivilDate {
  const clamped = Math.min(Math.max(Math.trunc(day), 1), daysInYear(year));
  const date = new Date(Date.UTC(year, 0, clamped));
  return {
    year,
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function isoForDayOfYear(year: number, day: number): string {
  const { month, day: dayOfMonth } = dateForDayOfYear(year, day);
  return `${year}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
}

export function solarGeometryForDay(day: number): SolarGeometry {
  const gamma = ((2 * Math.PI) / 365) * (day - 1);
  const cos1 = Math.cos(gamma);
  const sin1 = Math.sin(gamma);
  const cos2 = Math.cos(2 * gamma);
  const sin2 = Math.sin(2 * gamma);
  const cos3 = Math.cos(3 * gamma);
  const sin3 = Math.sin(3 * gamma);

  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * cos1 -
      0.032077 * sin1 -
      0.014615 * cos2 -
      0.040849 * sin2);

  const declination =
    0.006918 -
    0.399912 * cos1 +
    0.070257 * sin1 -
    0.006758 * cos2 +
    0.000907 * sin2 -
    0.002697 * cos3 +
    0.00148 * sin3;

  return { declination, eqTime };
}

export function solarGeometry(date: Date): SolarGeometry {
  return solarGeometryForDay(dayOfYear(date));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function solarPosition({
  dayOfYear: day,
  minutes,
  latitude,
  longitude,
}: PositionInput): SolarPosition {
  const { declination, eqTime } = solarGeometryForDay(day);
  const trueSolarMinutes = minutes + 4 * longitude + eqTime;
  const hourAngle = (trueSolarMinutes - 720) / 4;

  const latRad = latitude * DEG;
  const hourRad = hourAngle * DEG;
  const sinElevation =
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourRad);
  const elevation = Math.asin(clamp(sinElevation, -1, 1)) / DEG;

  const east = -Math.cos(declination) * Math.sin(hourRad);
  const north =
    Math.cos(latRad) * Math.sin(declination) -
    Math.sin(latRad) * Math.cos(declination) * Math.cos(hourRad);
  let azimuth = Math.atan2(east, north) / DEG;
  if (azimuth < 0) azimuth += 360;

  return { elevation, azimuth, hourAngle, declination, eqTime };
}

export function dayBounds(
  day: number,
  latitude: number,
  longitude: number,
  offsetMinutes: number,
  zenith: number = OFFICIAL_ZENITH,
): DayBounds {
  const { declination, eqTime } = solarGeometryForDay(day);
  const latRad = latitude * DEG;
  const cosHourAngle =
    (Math.cos(zenith * DEG) - Math.sin(latRad) * Math.sin(declination)) /
    (Math.cos(latRad) * Math.cos(declination));

  if (cosHourAngle > 1) {
    return {
      sunrise: null,
      sunset: null,
      sunriseAzimuth: null,
      sunsetAzimuth: null,
      dayLengthMinutes: 0,
      state: 'polar-night',
    };
  }

  if (cosHourAngle < -1) {
    return {
      sunrise: null,
      sunset: null,
      sunriseAzimuth: null,
      sunsetAzimuth: null,
      dayLengthMinutes: MINUTES_PER_DAY,
      state: 'polar-day',
    };
  }

  const hourAngle = Math.acos(cosHourAngle) / DEG;
  const dayLengthMinutes = 8 * hourAngle;
  const toLocal = (trueSolarMinutes: number): number => {
    const local = trueSolarMinutes - 4 * longitude - eqTime + offsetMinutes;
    return ((local % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  };

  const rise = solarPosition({
    dayOfYear: day,
    minutes: 720 - 4 * hourAngle - 4 * longitude - eqTime,
    latitude,
    longitude,
  });
  const set = solarPosition({
    dayOfYear: day,
    minutes: 720 + 4 * hourAngle - 4 * longitude - eqTime,
    latitude,
    longitude,
  });

  return {
    sunrise: toLocal(720 - 4 * hourAngle),
    sunset: toLocal(720 + 4 * hourAngle),
    sunriseAzimuth: rise.azimuth,
    sunsetAzimuth: set.azimuth,
    dayLengthMinutes,
    state: 'normal',
  };
}

export function sunPath({
  dayOfYear: day,
  latitude,
  longitude,
  offsetMinutes,
  stepMinutes = 4,
}: PathInput): SunPathPoint[] {
  const points: SunPathPoint[] = [];
  const step = Math.max(1, Math.round(stepMinutes));
  for (let minutes = 0; minutes <= MINUTES_PER_DAY; minutes += step) {
    const utcMinutes = minutes - offsetMinutes;
    const position = solarPosition({
      dayOfYear: day,
      minutes: utcMinutes,
      latitude,
      longitude,
    });
    points.push({
      minutes,
      elevation: position.elevation,
      azimuth: position.azimuth,
    });
  }
  return points;
}

export function analemma({
  latitude,
  longitude,
  offsetMinutes,
  minutes,
  year,
  stepDays = 1,
}: AnalemmaInput): AnalemmaPoint[] {
  const total = daysInYear(year);
  const points: AnalemmaPoint[] = [];
  const step = Math.max(1, Math.round(stepDays));
  for (let day = 1; day <= total; day += step) {
    const position = solarPosition({
      dayOfYear: day,
      minutes: minutes - offsetMinutes,
      latitude,
      longitude,
    });
    points.push({
      day,
      elevation: position.elevation,
      azimuth: position.azimuth,
    });
  }
  return points;
}

export interface ShadowInput {
  elevation: number;
  azimuth: number;
}

export function shadowFor(position: ShadowInput, height: number): Shadow | null {
  if (position.elevation <= 0) return null;
  const ratio = 1 / Math.tan(position.elevation * DEG);
  return {
    length: height * ratio,
    ratio,
    azimuth: (position.azimuth + 180) % 360,
  };
}

export function dayLengthRing(year: number, latitude: number): RingDay[] {
  const total = daysInYear(year);
  const days: RingDay[] = [];
  for (let day = 1; day <= total; day += 1) {
    const { declination } = solarGeometryForDay(day);
    const latRad = latitude * DEG;
    const cosHourAngle =
      (Math.cos(OFFICIAL_ZENITH * DEG) - Math.sin(latRad) * Math.sin(declination)) /
      (Math.cos(latRad) * Math.cos(declination));
    if (cosHourAngle > 1) {
      days.push({ day, daylightMinutes: 0, state: 'polar-night' });
    } else if (cosHourAngle < -1) {
      days.push({ day, daylightMinutes: MINUTES_PER_DAY, state: 'polar-day' });
    } else {
      days.push({
        day,
        daylightMinutes: (8 * Math.acos(cosHourAngle)) / DEG,
        state: 'normal',
      });
    }
  }
  return days;
}

export interface Point {
  x: number;
  y: number;
}

export function compassPoint(
  azimuth: number,
  elevation: number,
  radius: number,
): Point {
  const distance = radius * (1 - elevation / 90);
  const angle = azimuth * DEG;
  return {
    x: distance * Math.sin(angle),
    y: -distance * Math.cos(angle),
  };
}

const COMPASS_LABELS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
] as const;

export function compassLabel(azimuth: number): string {
  const index = Math.round((((azimuth % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS_LABELS[index];
}

export function solarNoonLocal(
  day: number,
  longitude: number,
  offsetMinutes: number,
): number {
  const { eqTime } = solarGeometryForDay(day);
  const noon = 720 - 4 * longitude - eqTime + offsetMinutes;
  return ((noon % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

export function formatClockMinutes(minutes: number): string {
  const wrapped =
    ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(wrapped / 60);
  const rest = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function zoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second'),
  );
  return Math.round((asUtc - date.getTime()) / 60_000);
}

export function offsetForDay(day: number, year: number, timeZone: string): number {
  const noonUtc = Date.UTC(year, 0, 1, 12) + (day - 1) * MS_PER_DAY;
  return zoneOffsetMinutes(new Date(noonUtc), timeZone);
}
