# 0025 · Full screen mode for tools

Status: done
Created: 2026-11-04

## Goal

Let any tool take the whole window, with no sidebar, header, footer, title or
intro around it, so wide tools are not squeezed by the site shell.

## Delivered

- `src/scripts/focusMode.ts`: delegates clicks on `[data-focus-toggle]` and
  toggles `data-focus` on `<html>`. Moving focus to the exit button on entry.
- `src/styles/global.css`: hides `[data-sidebar]`, `header`, `footer` and
  `[data-chrome]`, drops the `max-width` on `#main`, and hides the direct
  `nav`, `h1`, `p` and `section` children of `#main`, which is the pattern
  every tool page follows. Extra top padding below `lg` keeps the exit button
  clear of the content.
- `src/components/FullscreenIcon.astro`: enter and exit glyphs.
- `BaseLayout.astro`: computes `focusable` from `TOOLS` (exact path or prefix,
  so generated pages such as `/dates/days-until/<occasion>/` qualify), renders
  the floating exit button and imports the script.
- `Sidebar.astro` and `Header.astro`: entry button, shown only when
  `focusable`.
- `sidebar.ts`: closes the drawer when the toggle is used, so the mobile menu
  does not stay open over the tool.
- `music/metronome.astro`: capped the widget at `max-w-5xl` so it stays
  centred in full screen instead of stretching.
- Changelog note for the release.

## Decisions

- No `Escape` handler: it clashes with the search dialog, the mobile drawer and
  the inspector planned for future tools. The exit button is the only way out.
- No `height: 100dvh` on `#main`. The mode only removes the width cap; filling
  the viewport is the tool's job.
- Structural hiding instead of marking chrome on every page. `[data-chrome]`
  stays as an escape hatch for pages that do not follow the usual order.

## Verified

`pnpm check`, `pnpm test` and `pnpm build`, plus a headless Chrome pass:
desktop entry from the sidebar, mobile entry from the header, exit button,
restored state, home page with no button, and a scrolled wide page (diff)
resetting to the top on entry.
