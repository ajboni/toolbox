# 0028: SQL input and output side by side

Status: done
Created: 2026-11-04

## Goal

Use the width of the SQL formatter page to show the input and output next to
each other on desktop.

## Plan

- Mark the SQL page as `wide` so the tool gets the `max-w-6xl` layout.
- Limit the "How it works" prose to `max-w-3xl`.
- Change the input/output grid to `lg:grid-cols-2`, keeping the stacked layout on
  smaller screens.
- Give both boxes the same `h-80`, `resize-y` and `leading-6` styles so the
  columns align.
- Add `min-w-0` to both grid items so long queries scroll inside the boxes.
- Add a changelog note.

## Notes

- The input and output still scroll horizontally inside their boxes.
- The copy button keeps targeting the output `<pre>`.
- The page is wider now, so the tool has room for two comfortable columns on
  desktop without squeezing the prose.
