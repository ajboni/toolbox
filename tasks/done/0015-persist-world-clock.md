# 0015 · Persist world clock board in localStorage

Status: done
Created: 2026-10-08

## Goal

Remember the world clock board (zones, watchface, seconds) across visits so the
user does not have to bookmark a long query-string URL to keep it.

## Plan

- New `src/lib/persistedState.ts`: safe `localStorage` read/write/clear with
  guards for SSR, private mode and corrupt JSON, plus a pure
  `resolveBoardState(url, stored, defaults)` with precedence URL > stored >
  defaults. Tests in `src/lib/persistedState.test.ts`.
- `src/scripts/world-clock.ts`: `currentState()` resolves through the helper;
  `persist()` writes to both the URL and `localStorage` on every change. Opening
  a shared link never overwrites the saved board because writes only happen on
  user edits.
- Add a `Reset board` button that clears the saved state and restores the
  defaults.
- Update the "Shareable boards" copy to mention the local memory.

## Notes

- Share links stay authoritative: URL params win over the saved board.
- Storage key: `world-clock:board`.
- No new dependencies; no changes to `urlState.ts` or `timezones.ts`.
