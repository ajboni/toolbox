# AGENTS.md

Guidance for agents and contributors working in this repository.

## What this is

**bajtools** is a static website that hosts a growing collection of small,
single-purpose web tools. Each tool lives on its own URL, grouped by category.
It is **not** a SPA: every page is pre-rendered HTML for speed and SEO.

- Production: https://toolbox.aboni.dev
- Deploy target: GitHub Pages (repo `ajboni/toolbox`)

## Stack

- **Astro 7** with `output: 'static'`.
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin.
- **TypeScript** in strict mode (`astro/tsconfigs/strict`).
- **Vitest** for unit tests of pure logic.
- **pnpm** as the package manager. Build-script allowlist lives in
  `pnpm-workspace.yaml` (`allowBuilds`).

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build the static site into `dist/` |
| `pnpm preview` | Preview the production build locally |
| `pnpm check` | `astro check`: type/diagnostic check |
| `pnpm test` | Run Vitest once |

Run `pnpm check` and `pnpm build` (and `pnpm test` when logic changed) before
considering a change done.

## Structure

```
astro.config.mjs        # site URL, sitemap, tailwind vite plugin
public/                 # static assets, CNAME, robots.txt, favicon
src/
  data/                 # site config, tools registry, occasions, offsets
  lib/                  # pure logic + helpers (tests live next to them)
  layouts/BaseLayout    # <html>, head/SEO, sidebar, footer
  components/           # Sidebar, Header, Footer, SeoHead, ToolCard, widgets
  scripts/              # client-side entrypoints imported by components
  pages/                # file-based routes (one file = one URL)
  styles/global.css     # Tailwind entrypoint
tasks/                  # todo / done / ideas notes
```

## Conventions

- Content and UI copy are in **English**.
- Avoid em dashes (U+2014) in content and UI copy: use commas, colons, periods or parentheses. Use a middot (·) as a separator in titles and labels; use an en dash (–) for empty-value placeholders.
- Base color palette is **zinc** (neutral, no blue tint); dark mode is the
  automatic `prefers-color-scheme` variant with a `zinc-950` background.
- Each category has an `accent` (Tailwind color name) in `src/data/site.ts`.
  Accent classes are literal strings in `ACCENT_CLASSES` so Tailwind detects
  them. Use `accentClasses(category.accent)` instead of hardcoding colors.
- Navigation is data-driven: `Sidebar.astro` renders `CATEGORIES` and
  `toolsInCategory()`. New tools appear automatically once registered in
  `src/data/tools.ts`.
- URLs are organized by category: `/<category>/<tool>/` (e.g.
  `/dates/days-until/`). Always use trailing slashes in links.
- Keep JavaScript on the client to a minimum; use a plain `<script>` module,
  no UI framework.
- Pure logic goes in `src/lib/*.ts` with unit tests in `src/lib/*.test.ts`.
- Metadata is driven by `SeoHead.astro`. Every page passes a unique `title`,
  `description` and `canonicalPath`.
- Do not add comments unless they explain non-obvious intent.

## Adding a new tool

1. Create the route under `src/pages/<category>/<tool>.astro`.
2. Register the tool in `src/data/tools.ts` so it appears on the home page and
   in its category hub.
3. Put reusable logic in `src/lib/` and add a `*.test.ts`.
4. Pass a unique `title`, `description` and `canonicalPath` to `BaseLayout`,
   plus `JSON-LD` via `src/lib/jsonld.ts` (`webApplication` + `breadcrumbs`).
5. If the tool has inputs, make them **shareable via the URL** (see below).
6. Link the tool from its category page and cross-link related tools.

## Shareable URLs (query strings)

Tool state is serialized into the query string so any state is one copy-paste
away.

- Use the helpers in `src/lib/urlState.ts`:
  - `readUrlState(schema)`: parse + validate params on load.
  - `writeUrlState(schema, values, { defaults })`: update the URL.
- On change, call `writeUrlState` with `replace: true` (default) so the history
  is not polluted. Handle `popstate` to restore state on back/forward.
- Omit values equal to the default (pass `defaults`) to keep URLs clean.
- Invalid or missing params must fall back to the tool's default; never throw.
- Add a "Copy link" button (`navigator.clipboard.writeText(location.href)`).
- **SEO rule:** `canonical` and the sitemap must never include query strings.
  Query params are for sharing only; they are not meant to be indexed.
- Example: `/dates/days-until/?date=2026-12-25`.

## Deploy

- `.github/workflows/deploy.yml` builds on every push to `main` and publishes
  `dist/` to GitHub Pages.
- `public/CNAME` contains `toolbox.aboni.dev`.
- One-time setup in GitHub: **Settings → Pages → Source: GitHub Actions**, set
  the custom domain, and enable HTTPS. DNS needs `CNAME toolbox → ajboni.github.io`.

## Tasks

Work notes live in `tasks/`:

- `tasks/todo/`: planned work.
- `tasks/done/`: completed work.
- `tasks/ideas/`: backlog and future tools/categories.

One file per task, named `NNNN-short-slug.md`. When a task is finished, move it
from `todo/` to `done/`.

## Rules

- Do not commit changes unless explicitly asked.
- Never commit secrets or credentials.
- Keep pages fast: prefer static HTML and the smallest possible client script.
