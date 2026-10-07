const DEG = Math.PI / 180;
const MINUTES_PER_DAY = 1440;

export type PolarState = 'normal' | 'polar-day' | 'polar-night';

export interface SunTimes {
  solarNoon: Date;
  sunrise: Date | null;
  sunset: Date | null;
  dayLengthMinutes: number | null;
  state: PolarState;
}

export interface TwilightTimes {
  civil: SunTimes;
  nautical: SunTimes;
  astronomical: SunTimes;
}

export const ZENITH = {
  official: 90.833,
  civil: 96,
  nautical: 102,
  astronomical: 108,
} as const;

export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const current = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.round((current - start) / 86_400_000);
}

interface SolarGeometry {
  declination: number;
  eqTime: number;
}

export function solarGeometry(date: Date): SolarGeometry {
  const days = dayOfYear(date);
  const gamma = ((2 * Math.PI) / 365) * (days - 1);
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

function minutesOnDate(date: Date, minutes: number): Date {
  const midnightUtc = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return new Date(midnightUtc + minutes * 60_000);
}

export function solarTimes(
  date: Date,
  latitude: number,
  longitude: number,
  zenith: number = ZENITH.official,
): SunTimes {
  const { declination, eqTime } = solarGeometry(date);
  const latRad = latitude * DEG;
  const cosHourAngle =
    (Math.cos(zenith * DEG) - Math.sin(latRad) * Math.sin(declination)) /
    (Math.cos(latRad) * Math.cos(declination));

  const noonMinutes = 720 - 4 * longitude - eqTime;
  const solarNoon = minutesOnDate(date, noonMinutes);

  if (cosHourAngle > 1) {
    return {
      solarNoon,
      sunrise: null,
      sunset: null,
      dayLengthMinutes: null,
      state: 'polar-night',
    };
  }

  if (cosHourAngle < -1) {
    return {
      solarNoon,
      sunrise: null,
      sunset: null,
      dayLengthMinutes: zenith === ZENITH.official ? MINUTES_PER_DAY : null,
      state: 'polar-day',
    };
  }

  const hourAngle = Math.acos(cosHourAngle) / DEG;
  return {
    solarNoon,
    sunrise: minutesOnDate(date, noonMinutes - 4 * hourAngle),
    sunset: minutesOnDate(date, noonMinutes + 4 * hourAngle),
    dayLengthMinutes: 8 * hourAngle,
    state: 'normal',
  };
}

export function twilightTimes(
  date: Date,
  latitude: number,
  longitude: number,
): TwilightTimes {
  return {
    civil: solarTimes(date, latitude, longitude, ZENITH.civil),
    nautical: solarTimes(date, latitude, longitude, ZENITH.nautical),
    astronomical: solarTimes(date, latitude, longitude, ZENITH.astronomical),
  };
}

export function isValidLatitude(latitude: number): boolean {
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

export function isValidLongitude(longitude: number): boolean {
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(date);
}

export function formatDuration(minutes: number): string {
  const total = Math.round(Math.abs(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return `${hours} h ${String(rest).padStart(2, '0')} min`;
}
