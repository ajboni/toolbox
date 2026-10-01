# 0007 — Quick wins: date and math tools

Status: done
Created: 2026-10-01

## Delivered

- New tools, each sharing state via the query string:
  - `/dates/age/` — exact age in years, months and days from a birth date,
    total days/weeks and a next-birthday countdown (`?birth=&on=`).
  - `/dates/duration/` — time between two dates in y/m/d plus total
    days/weeks/hours; reversed ranges are flagged (`?from=&to=`).
  - `/dates/unix/` — epoch ↔ readable date, local and UTC, ten-digit values
    read as seconds and thirteen-digit as milliseconds (`?t=`).
  - `/math/tip-splitter/` — tip amount, total and per-person split
    (`?bill=&tip=&people=`).
  - `/math/base-converter/` — binary/octal/decimal/hex/any base 2–36 output,
    exact for values beyond `Number` precision (`?v=&from=`).
- Pure logic with tests: `src/lib/age.ts`, `src/lib/duration.ts`,
  `src/lib/timestamp.ts`, `src/lib/tip.ts`, `src/lib/base.ts`.
- Shared `diffYmd`/`formatYmd` helpers added to `src/lib/dates.ts`.
- Widgets + scripts: `AgeWidget`, `DurationWidget`, `UnixWidget`, `TipWidget`,
  `BaseConverterWidget` and their `src/scripts/*.ts` entrypoints.
- Registered in `src/data/tools.ts`; `RelatedTools` cross-links each category.

## Notes

- Leap-day birthdays are clamped to the last day of February in non-leap years.
- The Unix page uses a 10 vs 13 digit heuristic instead of asking for units.
- The tip splitter shows amounts in US dollars (site copy is English).

## Verification

- `pnpm test` (138 passed), `pnpm check` (0 errors), `pnpm build` (39 pages).

## Files

- `src/data/tools.ts`
- `src/lib/{age,duration,timestamp,tip,base}.ts` (+ `*.test.ts`)
- `src/lib/dates.ts` (`diffYmd`, `formatYmd`)
- `src/components/{AgeWidget,DurationWidget,UnixWidget,TipWidget,BaseConverterWidget}.astro`
- `src/scripts/{age,duration,unix,tip,base-converter}.ts`
- `src/pages/dates/{age,duration,unix}.astro`
- `src/pages/math/{tip-splitter,base-converter}.astro`
