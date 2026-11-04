# Ideas: Text & Code follow-ups

Status: idea
Created: 2026-10-01

Next text tools that fit the existing `text` category and patterns:

- **JSON Compare**: semantic JSON diff: ignore key and array order, report by
  path (`user.address.city`), flag type changes and key additions or removals.
  Different engine and output than the line-based diff, so it deserves its own
  route (`/text/json-compare/`) and cross-links both ways.
- **URL parser**: split a URL into protocol, host, path and query params
  (`?url=`), reusing `src/lib/urlEncode.ts`.
- **Regex tester**: highlight matches of a pattern in a sample text, with flags.
- **Markdown / HTML escape**: escape or unescape HTML entities.
- **CSV ↔ JSON**: convert between delimited text and JSON arrays.

Follow-ups for the diff checker:

- **JSONC / JSON5**: settings and `tsconfig.json` often carry comments and
  trailing commas. Formatting would strip comments, so it has to be opt-in and
  say so, never the default.
- **JSON Lines / NDJSON**: one object per line; pretty-print each record to
  make log diffs readable.
- **CSS**: minified build files in a single line are a real comparison case.
  A brace-based formatter has to respect strings, `url(data:...)`, custom
  properties and `@media`, so it needs strong tests before shipping.
- **Word-level highlighting** inside changed pairs, shown in the side-by-side
  view.
- **HTML** is out of scope for automatic formatting: `DOMParser` normalises the
  markup and changes the content instead of just indenting it.

Notes:

- Keep each tool a single static page with a shareable query string.
- Prefer pure `src/lib/*.ts` + unit tests; reuse `src/scripts/ui.ts` for the
  copy/share buttons.
- Formats that need a full parser (YAML, TOML, SQL, JS/TS) stay out: a heuristic
  formatter produces false diffs, which is worse than comparing the raw text.
