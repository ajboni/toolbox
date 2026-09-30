# 0006 — Scale & chord audio player

Status: done
Created: 2026-09-30

## Delivered

- Optional playback for the music tools using the native **Web Audio API**
  (no dependency, ~2 KB of client JS; Tone.js intentionally avoided).
- `/music/chord-finder/`:
  - A "Play scale" / "Stop" toggle that plays the current scale ascending,
    highlighting each note pill as it sounds.
  - Each diatonic chord card is now a button that arpeggiates the chord on
    click and highlights the card while it plays.
- `/music/circle-of-fifths/`: the shared chord cards play the selected key's
  chords too.
- `src/lib/music/audio.ts`:
  - Pure helpers `midiForPitchClass`, `frequencyForMidi`, `ascendingMidi`,
    `notesMidi` (unit tested).
  - `createPlayer()` wraps a lazily-created `AudioContext` (created on the
    first user gesture) with a triangle oscillator + gain envelope per note.
    Returns `null` when Web Audio is unavailable; the UI then disables the
    play controls.
- Playback stops on input changes, `popstate` and when the tab is hidden.

## Notes

- Autoplay policy is respected by only creating/resuming the context from a
  click.
- `ascendingMidi` voices each note at or above the previous one, so out-of-order
  pitch classes still produce an ascending line.
- No URL/SEO changes; playback state is not serialized.

## Verification

- `pnpm test` (67 passed), `pnpm check` (0 errors), `pnpm build` (26 pages).

## Files

- `src/lib/music/audio.ts`, `src/lib/music/audio.test.ts`
- `src/components/ScaleChords{Widget,Panel}.astro`
- `src/scripts/{chordFinder,circleOfFifths}.ts`
