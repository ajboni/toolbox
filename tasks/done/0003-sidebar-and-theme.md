# 0003 — Sidebar navigation and per-category theme

Status: done
Created: 2026-09-28

## Delivered

- Left **sidebar** (`src/components/Sidebar.astro`) driven by `CATEGORIES` and
  `toolsInCategory()`; each category is a native `<details>` that auto-opens
  when active. Active links use `aria-current="page"` and the category accent.
- Responsive layout in `BaseLayout`: sticky full-height sidebar on desktop,
  off-canvas drawer on mobile with overlay, toggled by `src/scripts/sidebar.ts`
  (closes on Escape, overlay click or navigation). Content column widened to
  `max-w-4xl`; `Header` is now a mobile-only top bar.
- Accessibility: skip-link, `aria-expanded`/`aria-controls`, hidden markers.

## Theme

- Neutral palette switched from `slate` (blue-tinted) to **`zinc`** everywhere;
  dark-mode background moved from navy `slate-950` to neutral `zinc-950`.
- **Per-category accent** system in `src/data/site.ts`: `accent` on each
  category plus literal class maps in `ACCENT_CLASSES`, exposed via
  `accentClasses()`. `dates` = violet. Used in the sidebar, `ToolCard`, and the
  widget results.
- `favicon.svg` and `og-default.svg` reworked to zinc-950 + violet.

## Files

- `src/components/Sidebar.astro`, `src/scripts/sidebar.ts` (new)
- `src/components/Header.astro`, `src/layouts/BaseLayout.astro`,
  `src/styles/global.css`
- `src/data/site.ts`, `src/components/ToolCard.astro`,
  `src/components/Days{Until,From}Widget.astro`
- `public/favicon.svg`, `public/og-default.svg`
- All `src/**` files: `slate-*` → `zinc-*`
