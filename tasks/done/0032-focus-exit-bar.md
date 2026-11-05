# 0032: Focus bar for the full screen exit

Status: done
Created: 2026-11-05

## Goal

Give the full screen exit a single, consistent position. The floating button
overlapped the tool card and sat right above the padel scoreboard's own pause
control, and each tool could end up competing with it.

## Delivered

- `BaseLayout.astro`: 36px sticky bar above `#main` with the category, the tool
  name and the exit button. Rendered only for focusable pages, from `TOOLS`.
- `global.css`: the bar is hidden outside focus mode, focus content starts 12px
  below it with 16px on the sides and bottom, and the fixed exit styling is
  gone.
- `focusMode.ts`: `Escape` leaves focus mode unless a dialog or the mobile
  drawer is open, and quitting returns focus to the button that entered.
- `AGENTS.md`: tools never render or position the exit button.
- Changelog note for the release.

## Decisions

- No `data-focus-exit-host` slots: one rule for every tool beats per-tool
  placement.
- The bar is a `div`, not a `header`, because `:root[data-focus] header` hides
  every header in focus mode.
- Sticky instead of fixed, so the bar keeps its place in the flow and no
  padding has to compensate for it while scrolling.
- The trade-off is about 24px of vertical space at the top of the tool.

## Verified

`pnpm check`, `pnpm test` and `pnpm build`, plus a manual pass on the padel
scoreboard, the diff checker and the JSON formatter (entry, exit, Escape,
scroll and fill height).
