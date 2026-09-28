# 0002 — Days From Today tool

Status: done
Created: 2026-09-28

## Delivered

- New tool `/dates/days-from/`: pick a start date (default today) and a number
  of days (default 30, negatives allowed) to get the resulting date, weekday and
  weekly breakdown. State is shareable via `?from=YYYY-MM-DD&days=N`.
- Six SEO landing pages under `/dates/days-from/<offset>/` (30, 60, 90, 120,
  180, 365 days) that recalculate from the visitor's current date.
- `addDays` added to `src/lib/dates.ts` with unit tests (rollover, leap years,
  negatives).
- Cross-links between `days-until` and `days-from`, plus chips on the `/dates/`
  hub and home-page listing via `src/data/tools.ts`.

## Files

- `src/lib/dates.ts`, `src/lib/dates.test.ts`
- `src/data/offsets.ts`, `src/data/tools.ts`
- `src/scripts/days-from.ts`, `src/components/DaysFromWidget.astro`
- `src/pages/dates/days-from.astro`, `src/pages/dates/days-from/[offset].astro`
- `src/pages/dates/index.astro`, `src/pages/dates/days-until.astro`
