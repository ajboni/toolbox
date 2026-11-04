import { findCity, nearestCity } from '../data/cities';
import {
  dayOfYearFor,
  daysInYear,
  formatClockMinutes,
  isoForDayOfYear,
  MINUTES_PER_DAY,
  offsetForDay,
  parseCivilDate,
  solarNoonLocal,
  sunPath,
  type SunPathPoint,
} from '../lib/solar';
import {
  buildSolarView,
  dayFromRingAngle,
  readoutsFor,
  safeCompassPoint,
  formatMeters,
  RING_INNER,
  type SolarViewInput,
} from '../lib/solarView';
import { isValidTimeZone } from '../lib/sun';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

const SCHEMA = {
  date: 'date',
  t: 'number',
  lat: 'number',
  lon: 'number',
  tz: 'string',
  h: 'number',
} as const;

const MIN_LATITUDE = -89.5;
const MAX_LATITUDE = 89.5;
const MIN_HEIGHT = 0.2;
const MAX_HEIGHT = 20;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

interface CompassState {
  year: number;
  dayOfYear: number;
  minutes: number;
  latitude: number;
  longitude: number;
  tz: string;
  height: number;
}

interface ZonedNow {
  year: number;
  dayOfYear: number;
  minutes: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function zonedNow(timeZone: string): ZonedNow {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(now);
    const get = (type: string): number =>
      Number(parts.find((part) => part.type === type)?.value ?? '0');
    const year = get('year') || now.getFullYear();
    const month = get('month') || now.getMonth() + 1;
    const day = get('day') || now.getDate();
    return {
      year,
      dayOfYear: dayOfYearFor(year, month, day),
      minutes: (get('hour') % 24) * 60 + get('minute'),
    };
  } catch {
    return {
      year: now.getFullYear(),
      dayOfYear: dayOfYearFor(now.getFullYear(), now.getMonth() + 1, now.getDate()),
      minutes: now.getHours() * 60 + now.getMinutes(),
    };
  }
}

function initRoot(root: HTMLElement): void {
  const number = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const defaultLat = number(root.dataset.defaultLat, 40.4168);
  const defaultLon = number(root.dataset.defaultLon, -3.7038);
  const defaultTz = root.dataset.defaultTz ?? 'Europe/Madrid';
  const defaultHeight = number(root.dataset.defaultHeight, 1.8);

  const dial = root.querySelector<SVGSVGElement>('[data-dial]');
  const figureHit = root.querySelector<SVGCircleElement>('[data-part="figure-hit"]');
  const latRange = root.querySelector<HTMLInputElement>('[data-lat-range]');
  const heightRange = root.querySelector<HTMLInputElement>('[data-height-range]');
  const dateInput = root.querySelector<HTMLInputElement>('[data-input="date"]');
  const timeInput = root.querySelector<HTMLInputElement>('[data-input="time"]');
  const tzInput = root.querySelector<HTMLInputElement>('[data-input="tz"]');
  const latInput = root.querySelector<HTMLInputElement>('[data-input="lat"]');
  const lonInput = root.querySelector<HTMLInputElement>('[data-input="lon"]');
  const heightInput = root.querySelector<HTMLInputElement>('[data-input="height"]');
  const nowButton = root.querySelector<HTMLButtonElement>('[data-now]');
  const noonButton = root.querySelector<HTMLButtonElement>('[data-noon]');
  const geoButton = root.querySelector<HTMLButtonElement>('[data-geo]');
  const cityButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-city]'),
  );

  const part = (name: string): SVGElement | null =>
    root.querySelector<SVGElement>(`[data-part="${name}"]`);
  const out = (name: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-out="${name}"]`);

  const ring = part('ring');
  const ringTick = part('ring-tick');
  const ringKnob = part('ring-knob');
  const dayPath = part('day-path');
  const analemma = part('analemma');
  const sun = part('sun');
  const sunriseMark = part('sunrise-mark');
  const sunsetMark = part('sunset-mark');
  const shadowRay = part('shadow-ray');
  const sceneShadow = part('scene-shadow');
  const sceneRay = part('scene-ray');
  const sceneSun = part('scene-sun');
  const figure = part('figure');

  const setAttr = (
    element: Element | null,
    name: string,
    value: string | number,
  ): void => {
    element?.setAttribute(name, typeof value === 'number' ? value.toFixed(2) : value);
  };

  const setText = (name: string, value: string): void => {
    const element = out(name);
    if (element) element.textContent = value;
  };

  const stateFromUrl = (): CompassState => {
    const params = readUrlState(SCHEMA);
    const fallback = zonedNow(defaultTz);
    const civil =
      typeof params.date === 'string' ? parseCivilDate(params.date) : null;
    const year = clamp(
      civil?.year ?? fallback.year,
      MIN_YEAR,
      MAX_YEAR,
    );
    const dayOfYear = civil
      ? dayOfYearFor(year, civil.month, civil.day)
      : fallback.dayOfYear;
    const minutes =
      typeof params.t === 'number' && Number.isFinite(params.t)
        ? clamp(Math.round(params.t), 0, MINUTES_PER_DAY - 1)
        : fallback.minutes;
    const latitude =
      typeof params.lat === 'number' && Math.abs(params.lat) <= 89.9
        ? params.lat
        : defaultLat;
    const longitude =
      typeof params.lon === 'number' && Math.abs(params.lon) <= 180
        ? params.lon
        : defaultLon;
    const tz =
      typeof params.tz === 'string' && isValidTimeZone(params.tz)
        ? params.tz
        : defaultTz;
    const height =
      typeof params.h === 'number' && params.h >= MIN_HEIGHT && params.h <= MAX_HEIGHT
        ? params.h
        : defaultHeight;
    return {
      year,
      dayOfYear,
      minutes,
      latitude: clamp(latitude, MIN_LATITUDE, MAX_LATITUDE),
      longitude,
      tz,
      height,
    };
  };

  const state = stateFromUrl();
  const initial = { ...state };
  let offsetCacheKey = '';
  let offsetCache = 0;
  let sampleCacheKey = '';
  let samples: SunPathPoint[] = [];
  let dragMode: 'ring' | 'sun' | null = null;
  let heightDrag: { startY: number; startHeight: number } | null = null;

  const offsetFor = (): number => {
    const key = `${state.year}:${state.dayOfYear}:${state.tz}`;
    if (key !== offsetCacheKey) {
      offsetCacheKey = key;
      offsetCache = offsetForDay(state.dayOfYear, state.year, state.tz);
    }
    return offsetCache;
  };

  const inputFor = (): SolarViewInput => ({
    year: state.year,
    dayOfYear: state.dayOfYear,
    minutes: state.minutes,
    latitude: state.latitude,
    longitude: state.longitude,
    offsetMinutes: offsetFor(),
    height: state.height,
  });

  const ensureSamples = (input: SolarViewInput): void => {
    const key = [
      input.year,
      input.dayOfYear,
      round(input.latitude, 3),
      round(input.longitude, 3),
      input.offsetMinutes,
    ].join(':');
    if (key === sampleCacheKey) return;
    sampleCacheKey = key;
    samples = sunPath({ ...input, stepMinutes: 2 }).filter(
      (sample) => sample.elevation >= -0.833,
    );
  };

  const syncInputs = (): void => {
    const iso = isoForDayOfYear(state.year, state.dayOfYear);
    const clock = formatClockMinutes(state.minutes);
    const values: Array<[HTMLInputElement | null, string]> = [
      [dateInput, iso],
      [timeInput, clock],
      [tzInput, state.tz],
      [latInput, String(round(state.latitude, 4))],
      [lonInput, String(round(state.longitude, 4))],
      [heightInput, String(round(state.height, 2))],
    ];
    for (const [element, value] of values) {
      if (element && document.activeElement !== element) element.value = value;
    }
    if (latRange && document.activeElement !== latRange) {
      latRange.value = String(clamp(state.latitude, MIN_LATITUDE, MAX_LATITUDE));
    }
    if (heightRange && document.activeElement !== heightRange) {
      heightRange.value = String(clamp(state.height, MIN_HEIGHT, 10));
    }

    const city = nearestCity(state.latitude, state.longitude);
    for (const button of cityButtons) {
      const active = city != null && button.dataset.city === city.slug;
      if (active) button.dataset.active = '1';
      else delete button.dataset.active;
    }
  };

  const render = (write: boolean): void => {
    const input = inputFor();
    const view = buildSolarView(input);
    const readout = readoutsFor(view, input);
    ensureSamples(input);

    setAttr(ring, 'd', view.ringPath);
    setAttr(ringTick, 'x1', view.ringTickStart.x);
    setAttr(ringTick, 'y1', view.ringTickStart.y);
    setAttr(ringTick, 'x2', view.ringTickEnd.x);
    setAttr(ringTick, 'y2', view.ringTickEnd.y);
    setAttr(ringKnob, 'cx', view.ringKnob.x);
    setAttr(ringKnob, 'cy', view.ringKnob.y);
    setAttr(dayPath, 'd', view.dayPath);
    setAttr(analemma, 'd', view.analemmaPath);

    setAttr(sun, 'cx', view.sunPoint.x);
    setAttr(sun, 'cy', view.sunPoint.y);
    sun?.setAttribute('data-up', view.sunUp ? '1' : '0');

    const hide = (element: Element | null, hidden: boolean): void => {
      if (element instanceof SVGElement) {
        element.style.display = hidden ? 'none' : '';
      }
    };

    if (view.sunriseMark) {
      setAttr(sunriseMark, 'cx', view.sunriseMark.x);
      setAttr(sunriseMark, 'cy', view.sunriseMark.y);
    }
    hide(sunriseMark, view.sunriseMark == null);
    if (view.sunsetMark) {
      setAttr(sunsetMark, 'cx', view.sunsetMark.x);
      setAttr(sunsetMark, 'cy', view.sunsetMark.y);
    }
    hide(sunsetMark, view.sunsetMark == null);

    if (view.shadowEnd) {
      setAttr(shadowRay, 'x1', 0);
      setAttr(shadowRay, 'y1', 0);
      setAttr(shadowRay, 'x2', view.shadowEnd.x);
      setAttr(shadowRay, 'y2', view.shadowEnd.y);
    }
    hide(shadowRay, view.shadowEnd == null);

    setAttr(sceneShadow, 'd', view.scene.shadowPath);
    hide(sceneShadow, view.scene.shadowPath === '');
    if (view.scene.sun) {
      setAttr(sceneSun, 'cx', view.scene.sun.x);
      setAttr(sceneSun, 'cy', view.scene.sun.y);
    }
    hide(sceneSun, view.scene.sun == null);
    if (view.scene.ray) {
      setAttr(sceneRay, 'x1', view.scene.ray.x1);
      setAttr(sceneRay, 'y1', view.scene.ray.y1);
      setAttr(sceneRay, 'x2', view.scene.ray.x2);
      setAttr(sceneRay, 'y2', view.scene.ray.y2);
    }
    hide(sceneRay, view.scene.ray == null);

    setAttr(
      figure,
      'transform',
      `translate(${view.scene.figureX} ${view.scene.groundY}) scale(${round(view.scene.figureHeight / 100, 3)})`,
    );
    setAttr(figureHit, 'cx', view.scene.head.x);
    setAttr(figureHit, 'cy', view.scene.head.y);

    setText('time', readout.time);
    setText('date', readout.date);
    setText('elevation', readout.elevation);
    setText('azimuth', readout.azimuth);
    setText('shadow', readout.shadow);
    setText('ratio', readout.ratio);
    setText('direction', readout.direction);
    setText('sunrise', readout.sunrise);
    setText('solar-noon', readout.solarNoon);
    setText('sunset', readout.sunset);
    setText('day-length', readout.dayLength);
    setText('scene-note', readout.sceneNote);
    setText('latitude', `${Math.abs(state.latitude).toFixed(1)}° ${state.latitude >= 0 ? 'N' : 'S'}`);
    setText('height', formatMeters(state.height));

    const status = out('status');
    if (status) {
      status.textContent = readout.status;
      status.style.display = readout.status ? '' : 'none';
    }

    dial?.setAttribute(
      'aria-label',
      `Solar compass. ${readout.time} on ${readout.date}. The sun is ${readout.elevation} above the horizon and the shadow is ${readout.shadow} long, pointing ${readout.direction}. Drag the dial to change the time, the outer ring to change the date.`,
    );

    syncInputs();
    if (write) writeUrl();
  };

  const writeUrl = (): void => {
    writeUrlState(
      SCHEMA,
      {
        date: isoForDayOfYear(state.year, state.dayOfYear),
        t: state.minutes,
        lat: round(state.latitude, 4),
        lon: round(state.longitude, 4),
        tz: state.tz,
        h: round(state.height, 2),
      },
      {
        defaults: {
          date: isoForDayOfYear(initial.year, initial.dayOfYear),
          t: initial.minutes,
          lat: defaultLat,
          lon: defaultLon,
          tz: defaultTz,
          h: defaultHeight,
        },
      },
    );
  };

  const pointFromEvent = (event: PointerEvent): { x: number; y: number } => {
    const rect = dial!.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) || 300;
    const scale = size / 300;
    return {
      x: (event.clientX - rect.left - rect.width / 2) / scale,
      y: (event.clientY - rect.top - rect.height / 2) / scale,
    };
  };

  const applyRing = (point: { x: number; y: number }): void => {
    const angle = (Math.atan2(point.x, -point.y) * 180) / Math.PI;
    const total = daysInYear(state.year);
    const day = dayFromRingAngle(angle, total);
    if (day < 30 && state.dayOfYear > total - 30) {
      state.year = clamp(state.year + 1, MIN_YEAR, MAX_YEAR);
    } else if (day > total - 30 && state.dayOfYear < 30) {
      state.year = clamp(state.year - 1, MIN_YEAR, MAX_YEAR);
    }
    state.dayOfYear = clamp(day, 1, daysInYear(state.year));
    render(false);
  };

  const applySun = (point: { x: number; y: number }): void => {
    let bestMinutes = state.minutes;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const sample of samples) {
      const projected = safeCompassPoint(sample.azimuth, sample.elevation);
      const distance =
        (projected.x - point.x) ** 2 + (projected.y - point.y) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMinutes = sample.minutes;
      }
    }
    state.minutes = bestMinutes % MINUTES_PER_DAY;
    render(false);
  };

  dial?.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dial.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    const radius = Math.hypot(point.x, point.y);
    dragMode = radius >= RING_INNER - 3 ? 'ring' : 'sun';
    if (dragMode === 'ring') applyRing(point);
    else applySun(point);
  });

  dial?.addEventListener('pointermove', (event) => {
    if (!dragMode) return;
    const point = pointFromEvent(event);
    if (dragMode === 'ring') applyRing(point);
    else applySun(point);
  });

  const endDrag = (event: PointerEvent): void => {
    if (!dragMode) return;
    dragMode = null;
    if (dial?.hasPointerCapture(event.pointerId)) {
      dial.releasePointerCapture(event.pointerId);
    }
    writeUrl();
  };

  dial?.addEventListener('pointerup', endDrag);
  dial?.addEventListener('pointercancel', endDrag);

  dial?.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 1 : 10;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const delta = event.key === 'ArrowRight' ? step : -step;
      state.minutes = (state.minutes + delta + MINUTES_PER_DAY) % MINUTES_PER_DAY;
      event.preventDefault();
      render(false);
      writeUrl();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      state.dayOfYear = clamp(state.dayOfYear + delta, 1, daysInYear(state.year));
      event.preventDefault();
      render(false);
      writeUrl();
    }
  });

  figureHit?.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    figureHit.setPointerCapture(event.pointerId);
    heightDrag = { startY: event.clientY, startHeight: state.height };
  });

  figureHit?.addEventListener('pointermove', (event) => {
    if (!heightDrag) return;
    const factor = Math.exp(-(event.clientY - heightDrag.startY) / 70);
    state.height = clamp(
      round(heightDrag.startHeight * factor, 2),
      MIN_HEIGHT,
      MAX_HEIGHT,
    );
    render(false);
  });

  const endHeightDrag = (event: PointerEvent): void => {
    if (!heightDrag) return;
    heightDrag = null;
    if (figureHit?.hasPointerCapture(event.pointerId)) {
      figureHit.releasePointerCapture(event.pointerId);
    }
    writeUrl();
  };

  figureHit?.addEventListener('pointerup', endHeightDrag);
  figureHit?.addEventListener('pointercancel', endHeightDrag);

  latRange?.addEventListener('input', () => {
    state.latitude = clamp(Number(latRange.value), MIN_LATITUDE, MAX_LATITUDE);
    render(false);
  });
  latRange?.addEventListener('change', () => writeUrl());

  heightRange?.addEventListener('input', () => {
    state.height = clamp(Number(heightRange.value), MIN_HEIGHT, MAX_HEIGHT);
    render(false);
  });
  heightRange?.addEventListener('change', () => writeUrl());

  dateInput?.addEventListener('change', () => {
    const civil = parseCivilDate(dateInput.value);
    if (!civil) return;
    state.year = clamp(civil.year, MIN_YEAR, MAX_YEAR);
    state.dayOfYear = clamp(
      dayOfYearFor(state.year, civil.month, civil.day),
      1,
      daysInYear(state.year),
    );
    render(true);
  });

  timeInput?.addEventListener('change', () => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(timeInput.value);
    if (!match) return;
    const hours = clamp(Number(match[1]), 0, 23);
    const minutes = clamp(Number(match[2]), 0, 59);
    state.minutes = hours * 60 + minutes;
    render(true);
  });

  tzInput?.addEventListener('change', () => {
    if (!isValidTimeZone(tzInput.value.trim())) {
      syncInputs();
      return;
    }
    state.tz = tzInput.value.trim();
    render(true);
  });

  latInput?.addEventListener('change', () => {
    const value = Number(latInput.value);
    if (!Number.isFinite(value)) return;
    state.latitude = clamp(value, MIN_LATITUDE, MAX_LATITUDE);
    render(true);
  });

  lonInput?.addEventListener('change', () => {
    const value = Number(lonInput.value);
    if (!Number.isFinite(value)) return;
    state.longitude = clamp(value, -180, 180);
    render(true);
  });

  heightInput?.addEventListener('change', () => {
    const value = Number(heightInput.value);
    if (!Number.isFinite(value)) return;
    state.height = clamp(value, MIN_HEIGHT, MAX_HEIGHT);
    render(true);
  });

  for (const button of cityButtons) {
    button.addEventListener('click', () => {
      const city = findCity(button.dataset.city ?? '');
      if (!city) return;
      state.latitude = city.lat;
      state.longitude = city.lon;
      state.tz = city.tz;
      render(true);
    });
  }

  nowButton?.addEventListener('click', () => {
    const now = zonedNow(state.tz);
    state.year = now.year;
    state.dayOfYear = now.dayOfYear;
    state.minutes = Math.round(now.minutes / 5) * 5 % MINUTES_PER_DAY;
    render(true);
  });

  noonButton?.addEventListener('click', () => {
    state.minutes = Math.round(
      solarNoonLocal(state.dayOfYear, state.longitude, offsetFor()),
    ) % MINUTES_PER_DAY;
    render(true);
  });

  geoButton?.addEventListener('click', () => {
    if (!navigator.geolocation) return;
    const original = geoButton.textContent;
    geoButton.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        geoButton.textContent = original;
        state.latitude = clamp(position.coords.latitude, MIN_LATITUDE, MAX_LATITUDE);
        state.longitude = clamp(position.coords.longitude, -180, 180);
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (isValidTimeZone(tz)) state.tz = tz;
        render(true);
      },
      () => {
        geoButton.textContent = 'Location unavailable';
        window.setTimeout(() => {
          geoButton.textContent = original;
        }, 1500);
      },
    );
  });

  window.addEventListener('popstate', () => {
    Object.assign(state, stateFromUrl());
    offsetCacheKey = '';
    sampleCacheKey = '';
    render(false);
  });

  wireShare(root);
  render(false);
}

const roots = document.querySelectorAll<HTMLElement>('[data-solar-compass]');
roots.forEach(initRoot);
