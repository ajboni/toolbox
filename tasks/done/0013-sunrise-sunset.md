# 0013 — Sunrise / sunset calculator

Status: done
Created: 2026-10-07
Completed: 2026-10-07

## Delivered

- New tool `/dates/sunrise-sunset/` with shareable state
  `?lat=&lon=&date=&tz=` (defaults omitted, see `src/lib/urlState.ts`).
- Pure NOAA logic in `src/lib/sun.ts` + `src/lib/sun.test.ts`:
  - `solarTimes(date, lat, lon, zenith)` returns solar noon, sunrise/sunset
    (UTC) and day length, plus a `normal | polar-day | polar-night` state.
  - `twilightTimes()` for civil / nautical / astronomical (zenith 96/102/108).
  - `dayOfYear`, `solarGeometry`, coordinate/time-zone validators,
    `formatTime` and `formatDuration`.
- City presets in `src/data/cities.ts` (40 cities with lat/lon/IANA zone),
  exposed as a selector rather than one page per city; `nearestCity()` maps
  coordinates back to a preset.
- `SunWidget.astro` + `src/scripts/sun.ts`: city/date/lat/lon/time-zone inputs,
  result cards, twilight table, "Use my location" (`navigator.geolocation`),
  `popstate` restore and a "Copy link" button. Times computed in UTC and
  formatted with `Intl.DateTimeFormat` in the selected zone.
- Registered in `src/data/tools.ts`; appears on the home page, the dates hub and
  in `RelatedTools`.

## Notes

- Canonical stays `/dates/sunrise-sunset/`; the sitemap has no query strings.
- The server-rendered default is the first preset (London), keeping the initial
  HTML consistent with the first client render.
- At high latitudes the page reports the polar day/night instead of a time.

## Verification

- `pnpm test` (150 passed), `pnpm check` (0 errors), `pnpm build` (40 pages).

## Files

- `src/lib/sun.ts` (+ `src/lib/sun.test.ts`)
- `src/data/cities.ts`
- `src/components/SunWidget.astro`
- `src/scripts/sun.ts`
- `src/pages/dates/sunrise-sunset.astro`
- `src/data/tools.ts`
