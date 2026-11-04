# 0020 · Shadow length and solar compass

Status: done
Created: 2026-10-27

## Goal

A `dates` tool that answers "how long is a shadow right now, and which way does
it point?", with the whole year, the sun's path and the analemma as a single
drag-and-drop SVG dial. No dropdowns.

## Delivered

- `src/lib/solar.ts` (+ `solar.test.ts`): `solarPosition()` (elevation, azimuth,
  hour angle from the NOAA declination and equation of time), `dayBounds()`
  (sunrise, sunset, their azimuths, day length, polar states), `sunPath()`,
  `analemma()`, `shadowFor()`, `dayLengthRing()`, `compassPoint()`,
  `compassLabel()`, `solarNoonLocal()`, civil-date helpers and
  `zoneOffsetMinutes()` for DST.
- `src/lib/sun.ts` now re-exports `dayOfYear`, `solarGeometry` and `PolarState`
  from `solar.ts`; its own copies are gone, so there is one set of equations.
- `src/lib/solarView.ts`: builds every SVG path (year ring, day path, analemma,
  shadow ray, horizon marks) plus the side-view scene and the formatted
  readouts, so the server and the client share the same maths.
- `SolarCompassWidget.astro` + `src/scripts/solarCompass.ts`: compass dial with
  north up and the rim as the horizon, a draggable sun that snaps to the nearest
  sample of the day's path, a draggable year ring (rolls into the next or
  previous year), latitude and height sliders, a person whose head can be
  dragged to change height, a scene with the shadow to scale, city chips, "Now",
  "Noon", geolocation, and an "Exact values" panel for keyboards and precision.
- `?date=&t=&lat=&lon=&tz=&h=`, defaults omitted, `replaceState` on release.
- Page `/dates/shadow/` with unique SEO, breadcrumb, JSON-LD, "How it works",
  "Reading the numbers", cross-link from Sunrise & Sunset and `RelatedTools`.
- Registered in `src/data/tools.ts`.

## Notes

- The dial maps azimuth to angle and zenith distance to radius, so the sun path
  crosses the rim exactly where it rises and sets.
- The ring has one tick per day and the tick length is that day's daylight, so
  dragging latitude reshapes the whole year.
- The analemma is not a layer or a mode: it is where the sun sits at the same
  clock time on every day, so dragging the ring slides the sun along the figure
  eight. The eight exists because the time is mean clock time, not true solar
  time.
- The grey line shows the shadow direction only; the length is drawn to scale in
  the side-view scene and printed in the cards.
- The year ring rolls over at the December/January boundary while dragging.

## Verification

- `pnpm test` (327 passed, 25 of them in `solar.test.ts`).
- `pnpm check` (0 errors, 0 warnings, 0 hints).
- `pnpm build` (63 pages).
- Headless screenshots at 1200px and 390px, light and dark.
- CDP interaction run: sun drag (12:40 to 07:38, shadow 15 m), ring drag
  (April, July, January), year rollover (20 Dec 2026 to 1 Jan 2027), height drag
  (1.8 to 4.2 m), city chip, "Noon" (13:04, matching solar noon) and URL state.
- Polar latitudes (89°N, −89.5°) and leap day checked for NaN and sane states.

## Files

- `src/lib/solar.ts`, `src/lib/solar.test.ts`, `src/lib/solarView.ts`
- `src/lib/sun.ts` (refactor)
- `src/components/SolarCompassWidget.astro`, `src/scripts/solarCompass.ts`
- `src/pages/dates/shadow.astro`, `src/pages/dates/sunrise-sunset.astro`
- `src/data/tools.ts`
