# 0023 — List compare

Status: done
Created: 2026-11-04

## Goal

Compare two lists and show what only A has, what only B has and what both
share, with a Venn diagram and downloadable results.

## Plan

- Route `/text/list-compare/`.
- `src/lib/listCompare.ts` + tests: parsing by lines, commas, tabs and
  semicolons, trim, case-insensitive mode, occurrence counts and natural sort.
- `ListCompareWidget.astro` + `src/scripts/list-compare.ts`: two textareas,
  options, inline SVG Venn diagram, three copyable panels and a `.txt` download.
- Shareable state: `?a=&b=&ci=&trim=&dup=&sep=&sort=`.
- Register in `src/data/tools.ts`.

## Notes

- Values are compared as sets; duplicates collapse and the optional counts show
  how many times each value appears on each side.
- Multi-list comparisons, pairwise matrices and SVG/PNG export are out of scope
  for now.
