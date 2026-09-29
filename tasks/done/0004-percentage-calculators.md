# 0004 — Math & Numbers category + percentage calculators

Status: done
Created: 2026-09-29

## Delivered

- New `math` category ("Math & Numbers", `emerald` accent) with hub at
  `/math/`.
- Five tools, each sharing state via the query string:
  - `/math/percent-of/` — X% of Y (`?p=&v=`).
  - `/math/what-percent/` — X is what percent of Y (`?part=&whole=`, e.g.
    `?part=25000&whole=10000` → 250%).
  - `/math/percent-change/` — increase/decrease (`?from=&to=`).
  - `/math/add-percent/` — add or subtract a percentage (`?v=&p=&op=`).
  - `/math/rule-of-three/` — solve `a / b = c / x` for any term
    (`?a=&b=&c=&x=&unknown=`).
- Pure logic in `src/lib/percent.ts` and `src/lib/proportion.ts` with tests;
  shared view/state in `src/lib/percentView.ts` so the default result is
  server-rendered and the client script reuses the same code.
- `PercentWidget.astro` + `scripts/percent.ts`; `RelatedTools.astro` cross-links;
  five entries in `src/data/tools.ts`.
- Division by zero returns `null` and shows a friendly message instead of
  throwing.

## Notes

- Dedicated pages per calculation (not one multi-mode page) because query
  strings are never canonical/indexed, so each mode needs its own indexable URL.
- Query strings stay out of `canonical` and the sitemap, per the repo rule.

## Verification

- `pnpm test` (33 passed), `pnpm check` (0 errors), `pnpm build` (23 pages).

## Files

- `src/data/site.ts`, `src/data/tools.ts`
- `src/lib/percent.ts`, `src/lib/percent.test.ts`
- `src/lib/proportion.ts`, `src/lib/proportion.test.ts`
- `src/lib/percentView.ts`
- `src/components/PercentWidget.astro`, `src/components/RelatedTools.astro`
- `src/scripts/percent.ts`
- `src/pages/math/index.astro`
- `src/pages/math/percent-of.astro`, `what-percent.astro`,
  `percent-change.astro`, `add-percent.astro`, `rule-of-three.astro`
