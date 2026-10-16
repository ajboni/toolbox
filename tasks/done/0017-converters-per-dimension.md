# 0017 — One converter page per dimension (+ bandwidth)

Status: done
Created: 2026-10-15

## Goal

Split the single `/converters/units/` page into one indexable page per unit
dimension (the repo rule: query strings are never canonical, so each mode needs
its own URL), and add a data transfer rate (bandwidth) converter.

## Delivered

- Removed the all-in-one `/converters/units/` page (no redirect).
- New data module `src/data/converters.ts` (`CONVERTER_PAGES` +
  `findConverterPage`) with SEO title/description, intro and "how it works"
  copy per dimension.
- Dynamic route `src/pages/converters/[dimension].astro` (`getStaticPaths` over
  `CONVERTER_PAGES`), one page each: `/converters/{length,mass,temperature,
  area,volume,speed,time,data,bandwidth}/`.
- New `bandwidth` dimension in `src/lib/units.ts` (base bit/s): bit/s, kbit/s,
  Mbit/s, Gbit/s, B/s, kB/s, MB/s, GB/s, KiB/s, MiB/s; default Mbit/s to MB/s.
- `src/data/tools.ts` now derives converter entries from `CONVERTER_PAGES`, so
  the registry and the pages cannot drift.
- `UnitsWidget.astro` takes a fixed `dimension` prop (no dimension selector);
  `Amount` is full width and `From | swap | To` stay aligned (`h-11`). Select
  labels show the unit name only, so long names no longer truncate.
- `src/scripts/units.ts` state is now `?from=&to=&v=`; defaults per dimension.

## Notes

- Hub `/converters/` and the sidebar update automatically (data-driven).
- Converters listed: Length, Weight, Temperature, Area, Volume, Speed, Time,
  Data Size, Bandwidth.

## Verification

- `pnpm test` (248 passed), `pnpm check` (0 errors), `pnpm build` (58 pages).

## Files

- `src/lib/units.ts`, `src/lib/units.test.ts`
- `src/data/converters.ts`, `src/data/tools.ts`
- `src/components/UnitsWidget.astro`, `src/scripts/units.ts`
- `src/pages/converters/[dimension].astro` (removed `units.astro`)
