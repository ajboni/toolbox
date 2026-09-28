# 0001 — Initial scaffold + Days Until tool

Status: done
Created: 2026-09-28

## Delivered

- Astro 7 static site with Tailwind v4 and strict TypeScript.
- Category-based routing: `/dates/` and `/dates/days-until/`.
- `Days Until` tool with a date picker, live countdown and shareable
  `?date=YYYY-MM-DD` URL state.
- Six SEO landing pages under `/dates/days-until/<occasion>/` for global,
  fixed-date occasions (New Year, Christmas, Valentine's Day, Halloween,
  New Year's Eve, Earth Day). Countdowns recalculate automatically.
- `SeoHead` metadata, Open Graph, JSON-LD (`WebApplication` + `BreadcrumbList`),
  sitemap and `robots.txt`.
- GitHub Actions workflow to deploy `dist/` to GitHub Pages at
  `toolbox.aboni.dev`.
- Vitest coverage for `src/lib/dates.ts`.

## Follow-ups

- Create the GitHub repo, enable Pages, and configure DNS.
- Add an analytics-free performance/SEO check once live.
