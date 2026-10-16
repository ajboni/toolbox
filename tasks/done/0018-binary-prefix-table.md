# 0018 — Decimal vs binary prefixes reference table

Status: done
Created: 2026-10-15

## Goal

Explain kibi/mebi/gibi prefixes right on the pages where they matter.

## Delivered

- `src/data/converters.ts`: optional `reference` field on `ConverterPage` plus a
  shared `BINARY_PREFIXES` table (KB/MB/GB/TB vs KiB/MiB/GiB/TiB) with a note.
- Attached to the `data` and `bandwidth` pages only.
- `src/pages/converters/[dimension].astro`: renders a "Decimal and binary
  prefixes" section below "How it works" when `page.reference` is set, with the
  same table styling as the widget (`overflow-x-auto` on mobile).

## Verification

- `pnpm test` (253 passed), `pnpm check` (0 errors), `pnpm build` (59 pages).
- Headless screenshot of `/converters/data/` confirms the table and note.

## Files

- `src/data/converters.ts`
- `src/pages/converters/[dimension].astro`
