# 0031: Full screen entry in the tool header

Status: done
Created: 2026-11-05

## Goal

Move the desktop full screen entry from the sidebar to the tool area without
editing every tool page.

## Plan

- `BaseLayout` renders a small fullscreen icon for every focusable page.
- The icon is absolutely positioned at the top right of the breadcrumb row on
  desktop, using `data-focus-toggle`.
- `#main` gets `position: relative`.
- The icon is hidden in focus mode and below `lg`; the mobile header keeps its
  own icon.
- Remove the "Full screen" button and the `focusable` prop from the sidebar.
- Document the generic entry in AGENTS.

## Notes

- The icon does not affect the page flow and does not overlap the breadcrumb or
  title.
- Non-tool pages do not render it.
- The exit button stays at the top right in focus mode.
