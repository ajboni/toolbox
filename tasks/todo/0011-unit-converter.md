# 0011 — Unit converter

Status: todo
Created: 2026-10-07

## Goal

A new `/converters/` category with a general unit converter covering length,
mass, temperature, area, volume, speed and data.

## Plan

- Category in `src/data/site.ts` (pick an unused accent), tools in
  `src/data/tools.ts`.
- Pure logic in `src/lib/units.ts` + `src/lib/units.test.ts`: unit tables with a
  base-unit factor per dimension, plus special-cased temperature offsets.
  - `convert(value, from, to)`, `unitsFor(dimension)`.
- Route: `/converters/units/` with a dimension selector and from/to units.
- Shareable state: `?dim=&from=&to=&v=`.
- Widget `UnitsWidget.astro` + `src/scripts/units.ts`.
- Add `src/pages/converters/index.astro` hub and a `Sidebar` entry via
  `CATEGORIES` (already data-driven).

## Notes

- Prefer exact integer factors where possible; be careful with temperature.
- Show a small result table of all units in the active dimension.
