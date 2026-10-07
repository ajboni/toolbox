import { CITIES, DEFAULT_CITY, nearestCity } from '../data/cities';
import { parseISODate, toISODate } from '../lib/dates';
import {
  formatDuration,
  formatTime,
  isValidLatitude,
  isValidLongitude,
  isValidTimeZone,
  solarTimes,
  twilightTimes,
  type SunTimes,
} from '../lib/sun';
import { readUrlState, writeUrlState } from '../lib/urlState';

const schema = { lat: 'number', lon: 'number', date: 'date', tz: 'string' } as const;
const DASH = '–';

function time(value: Date | null, tz: string): string {
  return value ? formatTime(value, tz) : DASH;
}

function dayLength(times: SunTimes): string {
  if (times.dayLengthMinutes != null) return formatDuration(times.dayLengthMinutes);
  if (times.state === 'polar-day') return '24 h 00 min';
  if (times.state === 'polar-night') return '0 h 00 min';
  return DASH;
}

function range(times: SunTimes, tz: string): string {
  return `${time(times.sunrise, tz)} – ${time(times.sunset, tz)}`;
}

interface SunState {
  lat: number;
  lon: number;
  date: Date;
  tz: string;
}

function initRoot(root: HTMLElement): void {
  const defaultLat = Number(root.dataset.defaultLat ?? DEFAULT_CITY.lat);
  const defaultLon = Number(root.dataset.defaultLon ?? DEFAULT_CITY.lon);
  const defaultTz = root.dataset.defaultTz ?? DEFAULT_CITY.tz;
  const defaultDate = toISODate(new Date());

  const citySelect = root.querySelector<HTMLSelectElement>('[data-city-select]');
  const dateInput = root.querySelector<HTMLInputElement>('[data-date-input]');
  const latInput = root.querySelector<HTMLInputElement>('[data-lat-input]');
  const lonInput = root.querySelector<HTMLInputElement>('[data-lon-input]');
  const tzInput = root.querySelector<HTMLInputElement>('[data-tz-input]');
  const geoBtn = root.querySelector<HTMLButtonElement>('[data-geo]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  const stateEl = root.querySelector<HTMLElement>('[data-out="state"]');
  const inputs = [latInput, lonInput, dateInput, tzInput];

  const out = (name: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-out="${name}"]`);

  const set = (name: string, value: string): void => {
    const el = out(name);
    if (el) el.textContent = value;
  };

  const stateFromUrl = (): SunState => {
    const state = readUrlState(schema);
    const lat =
      typeof state.lat === 'number' && isValidLatitude(state.lat)
        ? state.lat
        : defaultLat;
    const lon =
      typeof state.lon === 'number' && isValidLongitude(state.lon)
        ? state.lon
        : defaultLon;
    const date =
      parseISODate(typeof state.date === 'string' ? state.date : null) ??
      parseISODate(defaultDate)!;
    const tz =
      typeof state.tz === 'string' && isValidTimeZone(state.tz)
        ? state.tz
        : defaultTz;
    return { lat, lon, date, tz };
  };

  const syncCitySelect = (lat: number, lon: number): void => {
    if (!citySelect) return;
    const city = nearestCity(lat, lon);
    citySelect.value = city ? city.slug : '';
  };

  const render = ({ lat, lon, date, tz }: SunState): void => {
    if (!isValidLatitude(lat) || !isValidLongitude(lon) || !isValidTimeZone(tz)) {
      for (const name of [
        'sunrise',
        'sunset',
        'noon',
        'daylength',
        'civil',
        'nautical',
        'astronomical',
      ]) {
        set(name, DASH);
      }
      if (stateEl) {
        stateEl.textContent =
          'Enter a valid latitude, longitude and IANA time zone.';
      }
      return;
    }

    const sun = solarTimes(date, lat, lon);
    const twilight = twilightTimes(date, lat, lon);

    set('sunrise', time(sun.sunrise, tz));
    set('sunset', time(sun.sunset, tz));
    set('noon', time(sun.solarNoon, tz));
    set('daylength', dayLength(sun));
    set('civil', range(twilight.civil, tz));
    set('nautical', range(twilight.nautical, tz));
    set('astronomical', range(twilight.astronomical, tz));

    if (stateEl) {
      stateEl.textContent =
        sun.state === 'polar-day'
          ? 'The sun stays above the horizon all day.'
          : sun.state === 'polar-night'
            ? 'The sun stays below the horizon all day.'
            : '';
    }
  };

  const readInputs = (): SunState => {
    const lat = latInput ? Number(latInput.value) : defaultLat;
    const lon = lonInput ? Number(lonInput.value) : defaultLon;
    const date = dateInput
      ? parseISODate(dateInput.value) ?? parseISODate(defaultDate)!
      : parseISODate(defaultDate)!;
    const tz = tzInput ? tzInput.value.trim() : defaultTz;
    return { lat, lon, date, tz };
  };

  const update = (write: boolean): void => {
    const state = readInputs();
    render(state);
    syncCitySelect(state.lat, state.lon);
    if (write) {
      writeUrlState(
        schema,
        { lat: state.lat, lon: state.lon, date: toISODate(state.date), tz: state.tz },
        { defaults: { lat: defaultLat, lon: defaultLon, date: defaultDate, tz: defaultTz } },
      );
    }
  };

  const initial = stateFromUrl();
  if (latInput) latInput.value = String(initial.lat);
  if (lonInput) lonInput.value = String(initial.lon);
  if (dateInput) dateInput.value = toISODate(initial.date);
  if (tzInput) tzInput.value = initial.tz;
  syncCitySelect(initial.lat, initial.lon);
  render(initial);

  citySelect?.addEventListener('change', () => {
    const city = CITIES.find((item) => item.slug === citySelect.value);
    if (!city) return;
    if (latInput) latInput.value = String(city.lat);
    if (lonInput) lonInput.value = String(city.lon);
    if (tzInput) tzInput.value = city.tz;
    update(true);
  });

  for (const input of inputs) {
    input?.addEventListener('input', () => update(true));
    input?.addEventListener('change', () => update(true));
  }

  geoBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) return;
    const original = geoBtn.textContent;
    geoBtn.textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        geoBtn.textContent = original;
        if (latInput) latInput.value = position.coords.latitude.toFixed(4);
        if (lonInput) lonInput.value = position.coords.longitude.toFixed(4);
        if (tzInput) {
          tzInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
        }
        update(true);
      },
      () => {
        geoBtn.textContent = 'Location unavailable';
        window.setTimeout(() => {
          geoBtn.textContent = original;
        }, 1500);
      },
    );
  });

  shareBtn?.addEventListener('click', async () => {
    const original = shareBtn.textContent;
    try {
      await navigator.clipboard.writeText(window.location.href);
      shareBtn.textContent = 'Link copied';
    } catch {
      shareBtn.textContent = 'Copy failed';
    }
    window.setTimeout(() => {
      shareBtn.textContent = original;
    }, 1500);
  });

  window.addEventListener('popstate', () => {
    const state = stateFromUrl();
    if (latInput) latInput.value = String(state.lat);
    if (lonInput) lonInput.value = String(state.lon);
    if (dateInput) dateInput.value = toISODate(state.date);
    if (tzInput) tzInput.value = state.tz;
    syncCitySelect(state.lat, state.lon);
    render(state);
  });
}

const roots = document.querySelectorAll<HTMLElement>('[data-sun-widget]');
roots.forEach(initRoot);
