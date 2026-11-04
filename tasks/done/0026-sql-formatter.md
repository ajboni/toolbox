# 0026: SQL formatter

Status: done
Created: 2026-11-04

## Goal

Add a text tool to format or minify SQL with a dialect picker, keyword case and
indentation options.

## Plan

- Route: `/text/sql/`.
- Use `sql-formatter` through `formatDialect`, importing only the curated
  dialects (Standard SQL, PostgreSQL, MySQL, SQLite, SQL Server, BigQuery,
  Snowflake) to keep the page bundle around 37 KB gzip instead of 78 KB for all
  dialects.
- `src/lib/sqlFormat.ts` + tests:
  - `formatSql(input, { dialect, keywordCase, indent })` returns
    `{ ok, output, error? }` and never throws.
  - `minifySql` formats first to validate and apply keyword case, then collapses
    the result with a token-aware minifier.
  - Reject unterminated block comments before the parser turns `/*` into
    division.
  - Cap input at 100,000 characters.
- `SqlWidget.astro` + `src/scripts/sql.ts`:
  - Format and minify modes, dialect, keyword case, indent.
  - Query text in `sessionStorage` (`sql:content`); settings in
    `?mode=&lang=&case=&indent=`.
  - Copy output and `popstate` restore.
- Register in `src/data/tools.ts` and add the changelog entry.

## Notes

- The library handles layout and dialect parsing; the minifier is custom because
  the library has no minify mode.
- Minify keeps optimizer hints (`/*! ... */`, `/*+ ... */`) and drops ordinary
  comments.
- Formatting is display-only. The tool does not validate against a schema.
- SQL stays out of the diff checker's automatic formatting: guessing at SQL
  layout there would create false diffs.
- `added` and the changelog date are `2026-11-04`.
