import { describe, expect, it } from 'vitest';
import {
  analemma,
  compassLabel,
  compassPoint,
  dateForDayOfYear,
  dayBounds,
  dayLengthRing,
  dayOfYear,
  dayOfYearFor,
  daysInYear,
  formatClockMinutes,
  isoForDayOfYear,
  offsetForDay,
  parseCivilDate,
  shadowFor,
  solarGeometryForDay,
  solarPosition,
  sunPath,
  zoneOffsetMinutes,
} from './solar';

const MADRID = { latitude: 40.4168, longitude: -3.7038, offsetMinutes: 60 };

describe('civil dates', () => {
  it('counts days from 1 January', () => {
    expect(dayOfYearFor(2026, 1, 1)).toBe(1);
    expect(dayOfYearFor(2026, 10, 27)).toBe(300);
    expect(dayOfYearFor(2028, 12, 31)).toBe(366);
    expect(daysInYear(2026)).toBe(365);
    expect(daysInYear(2028)).toBe(366);
  });

  it('round-trips between day numbers and dates', () => {
    expect(dateForDayOfYear(2026, 300)).toEqual({ year: 2026, month: 10, day: 27 });
    expect(isoForDayOfYear(2026, 60)).toBe('2026-03-01');
    expect(isoForDayOfYear(2028, 60)).toBe('2028-02-29');
    expect(isoForDayOfYear(2026, 400)).toBe('2026-12-31');
    expect(isoForDayOfYear(2026, -3)).toBe('2026-01-01');
  });

  it('parses only real ISO dates', () => {
    expect(parseCivilDate('2026-10-27')).toEqual({ year: 2026, month: 10, day: 27 });
    expect(parseCivilDate('2026-02-30')).toBeNull();
    expect(parseCivilDate('27/10/2026')).toBeNull();
    expect(parseCivilDate('')).toBeNull();
  });
});

describe('solarPosition', () => {
  it('finds the sun over Madrid in late October', () => {
    const position = solarPosition({
      dayOfYear: 300,
      minutes: 660,
      latitude: MADRID.latitude,
      longitude: MADRID.longitude,
    });
    expect(position.elevation).toBeGreaterThan(34.5);
    expect(position.elevation).toBeLessThan(35.5);
    expect(position.azimuth).toBeGreaterThan(160);
    expect(position.azimuth).toBeLessThan(166);
  });

  it('peaks almost overhead on the equator at the equinox', () => {
    const { eqTime } = solarGeometryForDay(79);
    const position = solarPosition({
      dayOfYear: 79,
      minutes: 720 - eqTime,
      latitude: 0,
      longitude: 0,
    });
    expect(position.elevation).toBeGreaterThan(89.2);
  });

  it('looks north from the southern hemisphere', () => {
    const { eqTime } = solarGeometryForDay(15);
    const position = solarPosition({
      dayOfYear: 15,
      minutes: 720 - 4 * 151.2093 - eqTime,
      latitude: -33.8688,
      longitude: 151.2093,
    });
    expect(position.elevation).toBeGreaterThan(75);
    expect(position.azimuth < 1 || position.azimuth > 359).toBe(true);
  });

  it('mirrors the morning and the afternoon', () => {
    const { eqTime } = solarGeometryForDay(79);
    const noonUtc = 720 - 4 * MADRID.longitude - eqTime;
    const morning = solarPosition({
      dayOfYear: 79,
      minutes: noonUtc - 120,
      ...MADRID,
    });
    const afternoon = solarPosition({
      dayOfYear: 79,
      minutes: noonUtc + 120,
      ...MADRID,
    });
    expect(morning.elevation).toBeCloseTo(afternoon.elevation, 0);
    expect(morning.azimuth + afternoon.azimuth).toBeCloseTo(360, 0);
    expect(morning.azimuth).toBeLessThan(180);
    expect(afternoon.azimuth).toBeGreaterThan(180);
  });

  it('puts the sun below the horizon at midnight', () => {
    const position = solarPosition({
      dayOfYear: 300,
      minutes: 0,
      latitude: MADRID.latitude,
      longitude: MADRID.longitude,
    });
    expect(position.elevation).toBeLessThan(0);
  });
});

describe('dayBounds', () => {
  it('matches London on the summer solstice', () => {
    const bounds = dayBounds(172, 51.5074, -0.1278, 60);
    expect(bounds.state).toBe('normal');
    expect(bounds.dayLengthMinutes!).toBeGreaterThan(990);
    expect(bounds.dayLengthMinutes!).toBeLessThan(1005);
    expect(bounds.sunrise!).toBeGreaterThan(275);
    expect(bounds.sunrise!).toBeLessThan(285);
    expect(bounds.sunset!).toBeGreaterThan(1275);
    expect(bounds.sunset!).toBeLessThan(1285);
    expect(bounds.sunriseAzimuth!).toBeGreaterThan(40);
    expect(bounds.sunriseAzimuth!).toBeLessThan(60);
  });

  it('flags the polar day and the polar night', () => {
    expect(dayBounds(172, 78.2232, 15.6469, 120).state).toBe('polar-day');
    expect(dayBounds(355, 78.2232, 15.6469, 60).state).toBe('polar-night');
  });
});

describe('sunPath', () => {
  it('samples the whole local day', () => {
    const points = sunPath({ dayOfYear: 300, ...MADRID, stepMinutes: 10 });
    expect(points).toHaveLength(145);
    expect(points[0].minutes).toBe(0);
    expect(points[points.length - 1].minutes).toBe(1440);
    const highest = points.reduce((best, point) =>
      point.elevation > best.elevation ? point : best,
    );
    expect(highest.elevation).toBeGreaterThan(36);
    expect(highest.minutes).toBeGreaterThan(12 * 60);
    expect(points.some((point) => point.elevation < 0)).toBe(true);
  });
});

describe('analemma', () => {
  it('draws a figure eight width from the equation of time', () => {
    const points = analemma({ ...MADRID, minutes: 12 * 60, year: 2026 });
    expect(points).toHaveLength(365);
    const azimuths = points.map((point) => point.azimuth);
    const elevations = points.map((point) => point.elevation);
    const azimuthSpread = Math.max(...azimuths) - Math.min(...azimuths);
    const elevationSpread = Math.max(...elevations) - Math.min(...elevations);
    expect(azimuthSpread).toBeGreaterThan(4);
    expect(azimuthSpread).toBeLessThan(45);
    expect(elevationSpread).toBeGreaterThan(20);
  });
});

describe('shadowFor', () => {
  it('equals the height when the sun sits at 45 degrees', () => {
    const shadow = shadowFor({ elevation: 45, azimuth: 135 }, 2);
    expect(shadow!.ratio).toBeCloseTo(1, 6);
    expect(shadow!.length).toBeCloseTo(2, 6);
    expect(shadow!.azimuth).toBe(315);
  });

  it('stretches as the sun drops', () => {
    const high = shadowFor({ elevation: 60, azimuth: 180 }, 1)!;
    const low = shadowFor({ elevation: 10, azimuth: 180 }, 1)!;
    expect(low.length).toBeGreaterThan(high.length * 4);
    expect(low.azimuth).toBe(0);
  });

  it('returns nothing below the horizon', () => {
    expect(shadowFor({ elevation: 0, azimuth: 90 }, 1)).toBeNull();
    expect(shadowFor({ elevation: -4, azimuth: 90 }, 1)).toBeNull();
  });
});

describe('dayLengthRing', () => {
  it('follows the seasons at mid latitude', () => {
    const ring = dayLengthRing(2026, 51.5074);
    expect(ring).toHaveLength(365);
    const longest = ring.reduce((best, day) =>
      day.daylightMinutes > best.daylightMinutes ? day : best,
    );
    const shortest = ring.reduce((best, day) =>
      day.daylightMinutes < best.daylightMinutes ? day : best,
    );
    expect(longest.day).toBeGreaterThanOrEqual(171);
    expect(longest.day).toBeLessThanOrEqual(173);
    expect(longest.daylightMinutes).toBeGreaterThan(990);
    expect(shortest.day).toBeGreaterThanOrEqual(350);
    expect(shortest.day).toBeLessThanOrEqual(360);
    expect(shortest.daylightMinutes).toBeLessThan(490);
  });

  it('barely changes on the equator', () => {
    const ring = dayLengthRing(2026, 0);
    for (const day of ring) {
      expect(day.daylightMinutes).toBeGreaterThan(720);
      expect(day.daylightMinutes).toBeLessThan(732);
    }
  });

  it('fills the whole day or none of it near the pole', () => {
    const ring = dayLengthRing(2026, 78.2232);
    expect(ring[171].daylightMinutes).toBe(1440);
    expect(ring[171].state).toBe('polar-day');
    expect(ring[354].daylightMinutes).toBe(0);
    expect(ring[354].state).toBe('polar-night');
  });
});

describe('compassPoint', () => {
  it('maps north to the top and east to the right', () => {
    const radius = 100;
    const zenith = compassPoint(0, 90, radius);
    expect(zenith.x).toBeCloseTo(0, 6);
    expect(zenith.y).toBeCloseTo(0, 6);
    const north = compassPoint(0, 0, radius);
    expect(north.x).toBeCloseTo(0, 6);
    expect(north.y).toBeCloseTo(-100, 6);
    const east = compassPoint(90, 0, radius);
    expect(east.x).toBeCloseTo(100, 6);
    expect(east.y).toBeCloseTo(0, 6);
    const south = compassPoint(180, 0, radius);
    expect(south.x).toBeCloseTo(0, 6);
    expect(south.y).toBeCloseTo(100, 6);
  });

  it('pushes the sun outside the horizon circle when it is below it', () => {
    const point = compassPoint(180, -30, 100);
    expect(point.y).toBeCloseTo(133.33, 1);
  });
});

describe('compassLabel', () => {
  it('names the sixteen winds', () => {
    expect(compassLabel(0)).toBe('N');
    expect(compassLabel(90)).toBe('E');
    expect(compassLabel(135)).toBe('SE');
    expect(compassLabel(225)).toBe('SW');
    expect(compassLabel(350)).toBe('N');
    expect(compassLabel(-90)).toBe('W');
  });
});

describe('formatClockMinutes', () => {
  it('wraps around midnight', () => {
    expect(formatClockMinutes(0)).toBe('00:00');
    expect(formatClockMinutes(875)).toBe('14:35');
    expect(formatClockMinutes(1440)).toBe('00:00');
    expect(formatClockMinutes(-60)).toBe('23:00');
    expect(formatClockMinutes(60 * 60 + 5)).toBe('12:05');
  });
});

describe('zoneOffsetMinutes', () => {
  it('knows about daylight saving', () => {
    expect(zoneOffsetMinutes(new Date('2026-01-15T12:00:00Z'), 'Europe/Madrid')).toBe(60);
    expect(zoneOffsetMinutes(new Date('2026-07-15T12:00:00Z'), 'Europe/Madrid')).toBe(120);
    expect(zoneOffsetMinutes(new Date('2026-01-15T12:00:00Z'), 'America/New_York')).toBe(-300);
    expect(zoneOffsetMinutes(new Date('2026-07-15T12:00:00Z'), 'America/New_York')).toBe(-240);
    expect(zoneOffsetMinutes(new Date('2026-07-15T12:00:00Z'), 'UTC')).toBe(0);
  });

  it('picks the offset for a day of the year', () => {
    expect(offsetForDay(dayOfYearFor(2026, 1, 15), 2026, 'Europe/Madrid')).toBe(60);
    expect(offsetForDay(dayOfYearFor(2026, 7, 15), 2026, 'Europe/Madrid')).toBe(120);
  });
});

describe('dayOfYear', () => {
  it('accepts UTC dates', () => {
    expect(dayOfYear(new Date(Date.UTC(2026, 0, 1)))).toBe(1);
    expect(dayOfYear(new Date(Date.UTC(2026, 9, 27)))).toBe(300);
  });
});
