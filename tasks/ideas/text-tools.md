# Ideas — Text & Code follow-ups

Status: idea
Created: 2026-10-01

Next text tools that fit the existing `text` category and patterns:

- **JSON formatter / minifier** — pretty-print or compact JSON with clear parse
  errors (`?in=&mode=`). Logic in `src/lib/json.ts`.
- **URL parser** — split a URL into protocol, host, path and query params
  (`?url=`), reusing `src/lib/urlEncode.ts`.
- **Diff checker** — line-by-line comparison of two blocks of text, highlighting
  additions and removals; client-only, no dependencies.
- **Regex tester** — highlight matches of a pattern in a sample text, with flags.
- **Markdown / HTML escape** — escape or unescape HTML entities.
- **CSV ↔ JSON** — convert between delimited text and JSON arrays.

Notes:

- Keep each tool a single static page with a shareable query string.
- Prefer pure `src/lib/*.ts` + unit tests; reuse `src/scripts/ui.ts` for the
  copy/share buttons.
