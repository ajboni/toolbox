# Ideas: Line and column text templating

Status: idea
Created: 2026-11-04

A visual take on `awk` for people who do not want to learn `awk`, inspired by
NimbleText: input text at the top, a pattern that references columns and rows in
the middle, generated output at the bottom, updating live.

Typical use: paste a CSV or a table, write `INSERT INTO users VALUES ('$1',
'$2');`, get one statement per line. Same idea for extracting emails, building
Markdown lists, renaming files or reordering columns.

## Placement

- Route: `/text/text-template/` (alternative: `/text/columns/`, which reads
  clearer to anyone who has never used `awk`).
- Cross-link with `/text/diff/` and `/text/case-converter/`.

## Model

- One row per line; columns split by an auto-detected delimiter (tab, comma,
  semicolon, pipe, two or more spaces) or a custom delimiter or regex.
- Tokens: `$1`..`$n` for columns, `$0` for the whole line, `$NR` for the line
  number, `$NF` for the last column. With the header row enabled, `{name}` also
  works.
- Transforms: `upper()`, `lower()`, `trim()`, `title()`, `pad()`, `substr()`,
  `replace()`. Keep it to a token grammar; do not grow it into a scripting
  language.
- Row handling: skip blank lines, trim cells, sort, dedupe, filter by "contains"
  or regex, limit the number of rows, and choose the output separator or a
  per-row suffix.
- Presets from real tasks (CSV to `INSERT`, extract emails, Markdown list,
  filename generator, swap two columns) double as documentation.

## Implementation notes

- Tokenizer plus row evaluator in `src/lib/textTemplate.ts`, with tests covering
  quoting, escaped dollars, missing columns and empty input. The page script
  only reads the textareas and renders the result.
- One static page, no framework, no dependency.
- State: input text in `sessionStorage` (`pattern:content`, `'session'` area).
  Options can go in the query string. The pattern is user-authored and may carry
  data copied from the input, so the safer default is to keep it out of the URL
  and offer "Copy result" through `wireCopy`.
- Missing columns must render as empty, never throw and never drop the row.
