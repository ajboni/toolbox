# 0014 — World clock dashboard

Status: done
Created: 2026-10-07

## Goal

A dashboard showing the current time in several time zones at once, bookmarkable
via the query string (for example `?clock=cz,ar,usa`), with watchface presets.

## Plan

- Route: `/dates/world-clock/`.
- Time zones use the IANA database (the Linux/`Intl` standard). Canonical URL
  tokens are IANA names; short aliases (`cz`, `ar`, `usa`, `uk`, `jp`, ...) are
  normalized on read. `local` resolves to the browser zone.
- Data in `src/data/timezones.ts`: curated popular zones, alias map,
  `DEFAULT_CLOCKS`, `MAX_CLOCKS`.
- Pure logic in `src/lib/timezoneClocks.ts` + tests: parse/serialize a comma
  list, validate zones, format time/date/offset, day/night phase.
- `WorldClockCard.astro` + `WorldClockWidget.astro`: card grid, add-zone
  picker (`<datalist>` filled from `Intl.supportedValuesOf('timeZone')`),
  watchface selector, copy link.
- Watchfaces: `?face=digital|analog|minimal`; analog uses SVG hands updated
  every second.
- Shareable state via `src/lib/urlState.ts` with a `pretty` option so lists
  stay readable (`clock=Europe/Prague,America/New_York`).
- Register in `src/data/tools.ts`; cross-link from `RelatedTools`.

## Notes

- Ticks every second with a small client script; everything stays in the
  browser.
- Cap the board at `MAX_CLOCKS` to keep URLs and the DOM sane.
