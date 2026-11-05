# 0029 · Padel scoreboard

Status: done
Created: 2026-11-05

## Goal

A padel scoreboard in a new `sports` category: points, games and sets, serve
tracking, team names and colours, a match timer, undo and a shareable link. The
defaults are best of 3, tie-break at 6-6 and golden point.

## Delivered

- `src/lib/padel.ts` (+ `padel.test.ts`): the match is a log of point winners.
  `replay()` derives points, games, sets, serve and the winner. Supports full
  matches (best of 1, 3 or 5), advantage or golden point, a tie-break at 6-6,
  serve rotation 1-2-2 and a stand-alone tie-break to 7. Includes clock helpers,
  name and match sanitising, point labels, status text and a text summary.
- `src/lib/padelShare.ts` (+ `padelShare.test.ts`): versioned binary payload in
  base64url with mode, rules, first server, point bits, colours, optional UTF-8
  names, elapsed seconds and a 16-bit FNV-1a checksum. Decoding rejects bad
  versions, checksums, truncated data and points recorded after the match ended.
- `src/lib/persistedState.ts`: generic `readStoredJson` and `writeStoredJson`,
  with tests, used for the session snapshot.
- `PadelScoreboardWidget.astro` + `src/scripts/padelScoreboard.ts`: live
  scoreboard, editable names, cycling team colours, point buttons, undo, new
  match with a two-step confirmation, golden point, tie-break-only mode, timer
  with pause and resume, Wake Lock, copy result and copy match link.
- Share links use `#m=...`, keep the score out of server logs and never touch
  the canonical URL. Names are included only when the user opts in, and the
  panel warns that names travel in the URL.
- Imported linked matches are written to the session and the fragment is
  removed with `replaceState`, so a reload keeps any later scoring.
- `src/pages/sports/padel-score.astro` and `src/pages/sports/index.astro`, plus
  the `sports` category in `site.ts`, the tool entry in `tools.ts` and the
  changelog entry for 2026-11-05.
- `AGENTS.md` documents the opt-in, fragment-only exception for free text in a
  shared link.

## Notes

- Settings are locked after the first point. Team names, colours, Wake Lock and
  sharing remain available. New match clears the log and timer but keeps the
  format, names and colours.
- The timer starts with the first point, stays paused if the user paused it, and
  stops when the match ends.
- The link is a snapshot, not a live feed. It carries the elapsed time at the
  moment it was copied.
- A share link without names is about 58 characters long including the base URL.
- The default team colours are blue (`sky`) and red (`rose`). Matches saved in
  the tab with the old `sky`/`amber` default pair are migrated on load, so the
  new default does not flash amber. Custom colour pairs are left alone.

## Verification

- `pnpm test` (515 passed, including the new padel and share suites).
- `pnpm check` (0 errors, 0 warnings, 0 hints).
- `pnpm build` (69 pages, including `/sports/` and `/sports/padel-score/`).
- Headless Chromium end to end: initial layout, name and colour changes, timer
  pause and resume, golden point, undo, game and set progression, best of 3
  match end, tie-break only 7-5 and undo, advantage scoring, single set,
  session reload, shared link with names in a fresh context, shared link
  without names, and an invalid link falling back with a notice.
- Screenshots at 320 px, 390 px, desktop and dark mode.

## Files

- `src/lib/padel.ts`, `src/lib/padel.test.ts`
- `src/lib/padelShare.ts`, `src/lib/padelShare.test.ts`
- `src/lib/persistedState.ts`, `src/lib/persistedState.test.ts`
- `src/components/PadelScoreboardWidget.astro`
- `src/scripts/padelScoreboard.ts`
- `src/pages/sports/index.astro`, `src/pages/sports/padel-score.astro`
- `src/data/site.ts`, `src/data/tools.ts`, `src/data/changelog.ts`
- `AGENTS.md`
