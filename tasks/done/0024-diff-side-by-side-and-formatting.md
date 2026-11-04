# 0024: Diff side by side and JSON/XML formatting

Status: done
Created: 2026-11-04

## Goal

Make the diff checker compare minified JSON and XML without a manual
beautify step, and show diffs side by side.

## Plan

- `src/lib/codeFormat.ts` + tests: detect JSON and XML per input and pretty-print
  them with two-space indentation. XML uses a small tokenizer, keeps text-only
  elements inline, preserves CDATA and comments, and falls back to the raw text
  when the document is not well-formed.
- `src/lib/diff.ts`: `splitDiffLines` pairs removals and additions for the two
  column view, `diffIsTooLarge` guards big inputs, line splitting now handles
  CRLF and optionally ignores trailing whitespace.
- `DiffWidget.astro` + `src/scripts/diff.ts`: side-by-side view by default with a
  switch to unified, a format toggle per input, and an ignore-trailing-spaces
  toggle.
- Shareable state: `?a=&b=&view=&fa=&fb=&ws=`. Defaults (split, both format
  toggles on, ignore trailing spaces) are omitted from the URL, and only the raw
  text is stored, never the formatted version.
- Update the page copy and the tool description, and add a changelog entry.

## Notes

- Formatting is display-only: the textareas keep exactly what was pasted.
- The diff page opts into the wider `max-w-6xl` layout and uses 12px code text,
  so the two columns get roughly twice the characters per line.
- Pasted text is kept in `sessionStorage`; only the view settings travel in the
  URL. The AGENTS guide records the tools that still need the same treatment.
- JSON key order is not normalised, so a semantic JSON comparison would still
  need its own tool.
- XML mixed content stays inline to avoid introducing significant whitespace.
