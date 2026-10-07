# 0009 — JSON formatter / minifier

Status: todo
Created: 2026-10-07

## Goal

Add a `text` tool to pretty-print or minify JSON with clear parse errors.

## Plan

- Route: `/text/json/`.
- Pure logic in `src/lib/json.ts` + `src/lib/json.test.ts`:
  - `formatJson(input, { indent })`, `minifyJson(input)`.
  - Return a result object with `ok`, `output` and a readable `error`
    (line/column from the parse message) instead of throwing.
- Widget `JsonWidget.astro` + `src/scripts/json.ts`.
- Shareable state: `?in=&mode=pretty|min` (see `src/lib/urlState.ts`).
- Register in `src/data/tools.ts`; cross-link from `RelatedTools`.

## Notes

- No dependencies: use the native `JSON.parse` / `JSON.stringify`.
- Keep the raw input in the textarea; never send it anywhere.
