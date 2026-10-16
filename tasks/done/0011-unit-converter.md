# 0011 — Unit converter

Status: done
Created: 2026-10-07

> Superseded by `0017-converters-per-dimension.md`: the single
> `/converters/units/` page was split into one page per dimension and a
> bandwidth converter was added.

## Delivered

- New `converters` category ("Converters", `cyan` accent) with hub at
  `/converters/`.
- `/converters/units/` converts length, mass, temperature, area, volume, speed,
  time and data.
- Pure logic in `src/lib/units.ts` (+ `units.test.ts`): factor-based unit tables
  with a base unit per dimension, dedicated offset formulas for temperature,
  decimal and binary data units, plus `convert`, `convertAll` and
  `formatUnitValue`.
- `UnitsWidget.astro` + `scripts/units.ts`: dimension/from/to selects, amount
  input, live result, a full conversion table for the active dimension and a
  copy-link button.
- Shareable state `?dim=&from=&to=&v=`; defaults `length`, `m` to `ft`, `1`.
- Registered in `src/data/site.ts` and `src/data/tools.ts`; hub page plus
  JSON-LD (`webApplication` + `breadcrumbs`) and `RelatedTools`.

## Notes

- Temperature is special-cased (Celsius as base, offsets for Fahrenheit and
  Kelvin); every other unit is a single factor against the base.
- The data dimension keeps decimal (1000) and binary (1024) units side by side.
- Changing the dimension resets from/to to that dimension's defaults.
- Extreme values fall back to exponential notation.

## Verification

- `pnpm test` (247 passed), `pnpm check` (0 errors), `pnpm build` (50 pages).

## Files

- `src/data/site.ts`, `src/data/tools.ts`
- `src/lib/units.ts`, `src/lib/units.test.ts`
- `src/components/UnitsWidget.astro`, `src/scripts/units.ts`
- `src/pages/converters/index.astro`, `src/pages/converters/units.astro`
