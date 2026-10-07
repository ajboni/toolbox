# 0010 — Diff checker

Status: todo
Created: 2026-10-07

## Goal

Compare two blocks of text line by line and highlight additions and removals.

## Plan

- Route: `/text/diff/`.
- Pure logic in `src/lib/diff.ts` + `src/lib/diff.test.ts`: an LCS-based line
  diff producing `{ type: 'same' | 'add' | 'remove', text }[]`.
- Widget `DiffWidget.astro` + `src/scripts/diff.ts`, client-only.
- Shareable state: `?a=&b=` (can get long; consider `?id=` with an in-memory
  store later, but start with plain params).
- Register in `src/data/tools.ts`.

## Notes

- No dependencies; keep the algorithm simple and well tested.
- Add a line-number gutter and a summary (adds / removes).
