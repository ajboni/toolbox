import {
  analemma,
  compassLabel,
  dayBounds,
  dayLengthRing,
  dayOfYearFor,
  dateForDayOfYear,
  daysInYear,
  formatClockMinutes,
  MINUTES_PER_DAY,
  OFFICIAL_ZENITH,
  shadowFor,
  solarNoonLocal,
  solarPosition,
  sunPath,
  type DayBounds,
  type Point,
  type SolarPosition,
} from './solar';

export const COMPASS_RADIUS = 100;
export const RING_INNER = 106;
export const RING_TICK = 26;
export const RING_LABEL_RADIUS = 132;
export const COMPASS_VIEWBOX = '-150 -150 300 300';

const SCENE_WIDTH = 320;
const SCENE_HEIGHT = 120;
const SCENE_GROUND = 100;
const SCENE_FIGURE_X = 56;
const SCENE_MAX_SHADOW = 248;

export const SCENE_VIEWBOX = `0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export interface SolarViewInput {
  year: number;
  dayOfYear: number;
  minutes: number;
  latitude: number;
  longitude: number;
  offsetMinutes: number;
  height: number;
}

export interface SceneSun {
  x: number;
  y: number;
}

export interface Scene {
  groundY: number;
  figureX: number;
  figureHeight: number;
  head: SceneSun;
  shadowLength: number;
  shadowPath: string;
  clipped: boolean;
  sun: SceneSun | null;
  ray: { x1: number; y1: number; x2: number; y2: number } | null;
}

export interface SolarView {
  dateLabel: string;
  ringPath: string;
  ringKnob: Point;
  ringTickStart: Point;
  ringTickEnd: Point;
  dayPath: string;
  analemmaPath: string;
  sunPoint: Point;
  sunUp: boolean;
  shadowEnd: Point | null;
  sunriseMark: Point | null;
  sunsetMark: Point | null;
  position: SolarPosition;
  bounds: DayBounds;
  shadowLength: number | null;
  shadowRatio: number | null;
  shadowAzimuth: number | null;
  scene: Scene;
}

function fixed(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}

function polyline(points: Point[], close = false): string {
  if (points.length === 0) return '';
  const head = `M${fixed(points[0].x)} ${fixed(points[0].y)}`;
  const body = points
    .slice(1)
    .map((point) => `L${fixed(point.x)} ${fixed(point.y)}`)
    .join('');
  return `${head}${body}${close ? 'Z' : ''}`;
}

export function safeCompassPoint(azimuth: number, elevation: number): Point {
  const distance = COMPASS_RADIUS * (1 - elevation / 90);
  const clamped = Math.min(distance, COMPASS_RADIUS);
  const angle = (azimuth * Math.PI) / 180;
  return {
    x: clamped * Math.sin(angle),
    y: -clamped * Math.cos(angle),
  };
}

function ringAngle(day: number, total: number): number {
  return ((day - 1) / total) * 360;
}

function ringPoint(day: number, total: number, radius: number): Point {
  const angle = (ringAngle(day, total) * Math.PI) / 180;
  return { x: radius * Math.sin(angle), y: -radius * Math.cos(angle) };
}

export function dayFromRingAngle(angle: number, total: number): number {
  const normalized = ((angle % 360) + 360) % 360;
  return Math.min(total, Math.max(1, Math.floor((normalized / 360) * total) + 1));
}

export function monthLabels(year: number): Array<{ label: string; x: number; y: number }> {
  const total = daysInYear(year);
  return MONTHS.map((label, index) => {
    const day = dayOfYearFor(year, index + 1, 1);
    const point = ringPoint(day, total, RING_LABEL_RADIUS);
    return { label, x: point.x, y: point.y };
  });
}

export function formatMeters(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  if (value >= 10) return `${value.toFixed(0)} m`;
  if (value >= 1) return `${value.toFixed(1)} m`;
  return `${value.toFixed(2)} m`;
}

export function formatRatio(value: number): string {
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)}×`;
}

export function formatDayLength(minutes: number | null): string {
  if (minutes == null) return '–';
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return `${hours} h ${String(rest).padStart(2, '0')} min`;
}

export function formatDateLabel(year: number, day: number): string {
  const { month, day: dayOfMonth } = dateForDayOfYear(year, day);
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth));
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function sceneFor(
  position: SolarPosition,
  shadowRatio: number | null,
  height: number,
): Scene {
  const normalized = Math.min(Math.max((height - 0.2) / 9.8, 0), 1);
  const figureHeight = 46 + 34 * normalized;
  const head = {
    x: SCENE_FIGURE_X,
    y: SCENE_GROUND - figureHeight,
  };
  const rawShadow =
    shadowRatio == null ? 0 : Math.min(shadowRatio * figureHeight, SCENE_MAX_SHADOW);
  const clipped =
    shadowRatio != null && shadowRatio * figureHeight > SCENE_MAX_SHADOW;

  let sun: SceneSun | null = null;
  let ray: Scene['ray'] = null;
  if (position.elevation > 0) {
    const angle = (position.elevation * Math.PI) / 180;
    const distance = 74;
    sun = {
      x: head.x - Math.cos(angle) * distance,
      y: Math.max(8, head.y - Math.sin(angle) * distance),
    };
    ray = { x1: sun.x, y1: sun.y, x2: head.x, y2: head.y };
  }

  return {
    groundY: SCENE_GROUND,
    figureX: SCENE_FIGURE_X,
    figureHeight,
    head,
    shadowLength: rawShadow,
    shadowPath:
      rawShadow <= 0.5
        ? ''
        : `M${SCENE_FIGURE_X} ${SCENE_GROUND - 2}L${fixed(SCENE_FIGURE_X + rawShadow)} ${SCENE_GROUND - 1}L${fixed(SCENE_FIGURE_X + rawShadow)} ${SCENE_GROUND + 2}L${SCENE_FIGURE_X} ${SCENE_GROUND + 6}Z`,
    clipped,
    sun,
    ray,
  };
}

export function buildSolarView(input: SolarViewInput): SolarView {
  const { year, dayOfYear, minutes, latitude, longitude, offsetMinutes, height } = input;
  const total = daysInYear(year);
  const position = solarPosition({
    dayOfYear,
    minutes: minutes - offsetMinutes,
    latitude,
    longitude,
  });
  const bounds = dayBounds(dayOfYear, latitude, longitude, offsetMinutes);
  const shadow = shadowFor(position, height);

  const samples = sunPath({
    dayOfYear,
    latitude,
    longitude,
    offsetMinutes,
    stepMinutes: 2,
  });
  const daylight = samples.filter(
    (sample) => sample.elevation >= -(OFFICIAL_ZENITH - 90),
  );
  const dayPoints = daylight.map((sample) =>
    safeCompassPoint(sample.azimuth, sample.elevation),
  );
  const closed =
    daylight.length > 0 &&
    daylight[0].minutes === 0 &&
    daylight[daylight.length - 1].minutes === MINUTES_PER_DAY;

  const analemmaPoints = analemma({
    year,
    latitude,
    longitude,
    offsetMinutes,
    minutes,
    stepDays: 2,
  }).map((point) => safeCompassPoint(point.azimuth, point.elevation));

  const ringDays = dayLengthRing(year, latitude);
  const ringSegments: string[] = [];
  for (const ringDay of ringDays) {
    const length = 1 + RING_TICK * (ringDay.daylightMinutes / MINUTES_PER_DAY);
    const inner = ringPoint(ringDay.day, total, RING_INNER);
    const outer = ringPoint(ringDay.day, total, RING_INNER + length);
    ringSegments.push(
      `M${fixed(inner.x)} ${fixed(inner.y)}L${fixed(outer.x)} ${fixed(outer.y)}`,
    );
  }

  const currentRingDay = ringDays.find((day) => day.day === dayOfYear);
  const currentLength = currentRingDay
    ? 1 + RING_TICK * (currentRingDay.daylightMinutes / MINUTES_PER_DAY)
    : 1;

  const sunPoint = safeCompassPoint(position.azimuth, position.elevation);
  const shadowEnd =
    shadow == null
      ? null
      : (() => {
          const angle = (shadow.azimuth * Math.PI) / 180;
          const distance = COMPASS_RADIUS * 0.62;
          return { x: distance * Math.sin(angle), y: -distance * Math.cos(angle) };
        })();

  return {
    dateLabel: formatDateLabel(year, dayOfYear),
    ringPath: ringSegments.join(''),
    ringKnob: ringPoint(dayOfYear, total, RING_INNER + currentLength),
    ringTickStart: ringPoint(dayOfYear, total, RING_INNER),
    ringTickEnd: ringPoint(dayOfYear, total, RING_INNER + currentLength),
    dayPath: polyline(dayPoints, closed),
    analemmaPath: polyline(analemmaPoints, true),
    sunPoint,
    sunUp: position.elevation > 0,
    shadowEnd,
    sunriseMark:
      bounds.sunriseAzimuth == null
        ? null
        : safeCompassPoint(bounds.sunriseAzimuth, 0),
    sunsetMark:
      bounds.sunsetAzimuth == null
        ? null
        : safeCompassPoint(bounds.sunsetAzimuth, 0),
    position,
    bounds,
    shadowLength: shadow?.length ?? null,
    shadowRatio: shadow?.ratio ?? null,
    shadowAzimuth: shadow?.azimuth ?? null,
    scene: sceneFor(position, shadow?.ratio ?? null, height),
  };
}

export interface Readout {
  time: string;
  date: string;
  elevation: string;
  azimuth: string;
  shadow: string;
  ratio: string;
  direction: string;
  sunrise: string;
  sunset: string;
  dayLength: string;
  solarNoon: string;
  status: string;
  sceneNote: string;
}

export function readoutsFor(view: SolarView, input: SolarViewInput): Readout {
  const status =
    view.bounds.state === 'polar-night'
      ? 'Polar night: the sun stays below the horizon all day.'
      : view.bounds.state === 'polar-day'
        ? 'Polar day: the sun never sets.'
        : view.position.elevation <= 0
          ? 'The sun is below the horizon, so there is no shadow.'
          : '';

  const shadowSentence =
    view.shadowLength == null
      ? ''
      : `Shadow ${formatMeters(view.shadowLength)} (${formatRatio(view.shadowRatio ?? 0)}) pointing ${compassLabel(view.shadowAzimuth ?? 0)}`;

  return {
    time: formatClockMinutes(input.minutes),
    date: view.dateLabel,
    elevation: `${view.position.elevation.toFixed(1)}°`,
    azimuth: `${view.position.azimuth.toFixed(0)}° ${compassLabel(view.position.azimuth)}`,
    shadow:
      view.shadowLength == null ? '–' : formatMeters(view.shadowLength),
    ratio: view.shadowRatio == null ? '–' : formatRatio(view.shadowRatio),
    direction:
      view.shadowAzimuth == null
        ? '–'
        : `${compassLabel(view.shadowAzimuth)} ${view.shadowAzimuth.toFixed(0)}°`,
    sunrise:
      view.bounds.sunrise == null ? '–' : formatClockMinutes(view.bounds.sunrise),
    sunset: view.bounds.sunset == null ? '–' : formatClockMinutes(view.bounds.sunset),
    dayLength: formatDayLength(view.bounds.dayLengthMinutes),
    solarNoon: formatClockMinutes(
      solarNoonLocal(input.dayOfYear, input.longitude, input.offsetMinutes),
    ),
    status,
    sceneNote: status || shadowSentence,
  };
}
