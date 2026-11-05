# 0030: Full height focus mode for text tools

Status: done
Created: 2026-11-05

## Goal

Let the SQL formatter, JSON formatter and diff checker use the full height of
the window in focus mode on desktop.

## Plan

- `BaseLayout`: add `data-app-shell`, `data-main-column` and the `focusFill`
  prop.
- Opt in on the SQL, JSON and diff pages.
- Add a `@media (min-width: 1024px)` focus block that turns the main, the widget
  wrapper and the widget root into a flex column.
- SQL and JSON: make the input/output grid fill the height and let the textareas
  and the SQL output share it.
- Diff: keep the input textareas at 16rem and let the diff result fill the rest.
- Tighten focus padding for every tool: 24px top, 16px sides and bottom. Keep
  the widget's normal padding.
- Place the exit button at `top-3.5 right-4`, hide its text on mobile and remove
  the reserved mobile padding. Its bottom edge lines up with the tool content.
- Document the pattern in AGENTS.

## Notes

- Desktop only. On smaller screens, focus mode keeps the normal layout and page
  scroll.
- Only tools that grow opt in. Calculators, dials, boards and games stay
  content-sized.
- The diff result scrolls inside its box; the inputs stay at a usable height.
- The exit button is fixed and does not reserve a row.
