# 0019 — Download time calculator

Status: done
Created: 2026-10-15

## Goal

A small tool that answers "how long to download X MB at X MB/s?", placed in the
`networking` category.

## Delivered

- `src/lib/downloadTime.ts` (+ test): `transferSeconds()` reuses `convert()`
  from `units.ts` (size in bits divided by speed in bit/s), `formatDuration()`
  (days/hours/minutes/seconds, `under a second` below 0.5 s, `–` for invalid)
  and `SPEED_PRESETS` for the reference table.
- `DownloadTimeWidget.astro` + `src/scripts/downloadTime.ts`: file size (data
  units) and speed (bandwidth units), big duration result, a table of times at
  common speeds (5 Mbit/s through 1 Gbit/s plus MB/s presets), copy link.
- Shareable state `?size=&sunit=&rate=&runit=`; defaults 1000 MB at 10 MB/s
  (1 min 40 s), theoretical only.
- Page `/networking/download-time/` with unique SEO, breadcrumb, JSON-LD,
  "How it works" and `RelatedTools`; registered in `src/data/tools.ts`.

## Notes

- Size units come from the `data` dimension, speed units from `bandwidth`.
- The preset table depends only on the file size, so it stays useful while the
  user tweaks the speed.

## Verification

- `pnpm test` (253 passed), `pnpm check` (0 errors), `pnpm build` (59 pages).
- Headless screenshot of `/networking/download-time/`.

## Files

- `src/lib/downloadTime.ts`, `src/lib/downloadTime.test.ts`
- `src/components/DownloadTimeWidget.astro`, `src/scripts/download-time.ts`
- `src/pages/networking/download-time.astro`, `src/data/tools.ts`
