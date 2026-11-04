# 0022 · Search palette, search page and llms.txt

Status: done
Created: 2026-11-04

## Goal

Make every tool reachable from anywhere with a fast command palette and a
dedicated search page, grouped by category with the category colours. Add an
`llms.txt` directory generated from the tool registry.

## Delivered

- `src/lib/search.ts` (+ `search.test.ts`): accent folding that keeps highlight
  indices aligned, tokenising, title/category/description scoring, a
  subsequence fallback limited to titles, merged match ranges, grouping by
  category and a validator for the JSON index.
- `src/lib/recentTools.ts` (+ test): recent tools with a cap of five, stored in
  `localStorage` under `bajtools:recent-tools`.
- `src/lib/searchPills.ts`: shared pill classes for the category filters.
- `src/data/searchIndex.ts` and `src/pages/search.json.ts`: static index with
  title, description, path, category and accent.
- `SearchPalette.astro` + `src/scripts/searchPalette.ts`: native `<dialog>`,
  `Ctrl/⌘ + K`, arrow keys, Enter, Escape, focus handling, recent tools and
  lazy index loading. Results are grouped under coloured category pills.
- `/search/` page with a shareable `?q=` and `?cat=`, colour pills, live
  filtering, a server-rendered directory for no-JS and crawlers, and a `/`
  shortcut to focus the input.
- Triggers in the sidebar, mobile header, home hero and footer.
- `llms.txt` generated from `TOOLS`, plus a `<link rel="sitemap">` in the head
  and `Disallow: /search.json` in `robots.txt`.
- Search page included in the sitemap automatically; query strings are never
  canonical.

## Verification

- `pnpm check`, `pnpm test`, `pnpm build`.
- Manual: `Ctrl+K`, arrow keys, Enter, Escape, focus restore, recents, category
  filters, `?q=`/`?cat=` and back/forward, mobile dialog and dark mode.
- `sitemap-0.xml` includes `/search/` and excludes `search.json` and
  `llms.txt`.
