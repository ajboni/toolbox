# 0027: SQL syntax highlighting

Status: done
Created: 2026-11-04

## Goal

Highlight the formatted SQL output with a general-purpose highlighter that can
be reused by other tools.

## Plan

- Add `prismjs` and `@types/prismjs`.
- `src/lib/highlight.ts`: core wrapper with `highlightCode(code, language)`,
  HTML escaping, and a 50,000-character fallback to plain escaped text.
- `src/lib/highlightSql.ts`: register `prism-sql` and export `highlightSql`.
  Future tools can add their own module with `prism-json`, `prism-markup`, etc.
  while sharing the core.
- `src/lib/highlight.test.ts` and `src/lib/highlightSql.test.ts`: fallback,
  escaping, token classes and text preservation.
- `src/styles/global.css`: shared Prism token theme with light and dark colors.
- `SqlWidget.astro`: replace the output textarea with a `<pre><code>` and
  render highlighted HTML with `set:html`.
- `src/scripts/sql.ts`: update the output with `innerHTML` after each render.
- Changelog note in the 2026-11-04 entry.

## Notes

- Prism's SQL grammar is generic, not dialect-specific. Most keywords, strings,
  comments, numbers, functions and operators are covered. Very specific words
  such as `QUALIFY` may stay plain.
- The output `<pre>` keeps the copy button working because `wireCopy` reads
  `textContent`.
- The SQL page bundle grows by about 8 KB gzip (Prism core plus the SQL
  grammar). Other tools can reuse the core with a small per-language module.
- Input highlighting stays out of scope: a textarea cannot show colored text
  without an overlay.
