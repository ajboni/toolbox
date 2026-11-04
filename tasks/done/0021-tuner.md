# 0021 · Instrument tuner

Status: done
Created: 2026-10-27

## Goal

A browser tuner in the `music` category that works for guitar, bass, ukulele,
violin and cello, with a chromatic fallback and an adjustable A4 reference.

## Delivered

- `src/lib/music/pitch.ts` (+ `pitch.test.ts`): `detectPitch()` with a YIN-style
  normalised difference function, decimation above 30 kHz, a first-minimum
  threshold and a fine search with linear interpolation for the winning lag.
  Helpers: `frequencyForMidi()`, `midiForFrequency()`, `centsBetween()`,
  `readingFor()`, `nearestTarget()`, `formatCents()`.
- `src/data/instruments.ts`: chromatic, guitar, bass, ukulele, violin and cello
  with MIDI note numbers, plus the 415 to 466 Hz reference range.
- `TunerWidget.astro` + `src/scripts/tuner.ts`: start/stop button, big note and
  cents readout, needle meter with a green ±5 cent band, instrument chips,
  string targets that play a reference tone, reference pitch buttons and slider,
  and a privacy note. The nearest string is used for the reading so the display
  does not flip between adjacent notes.
- `?ref=&inst=`, defaults omitted, `replaceState`.
- Page `/music/tuner/` with unique SEO, breadcrumb, JSON-LD, "How it works",
  microphone tips, cross-links to the chord finder and the metronome, and
  `RelatedTools`. Registered in `src/data/tools.ts`.

## Notes

- Detected pitch is smoothed with a median of five frames and reset when the new
  value is more than 150 cents away.
- A frame is processed every 45 ms; the microphone stops and the `AudioContext`
  closes when the tuner is stopped or the page is hidden.
- The reference tone reuses `createPlayer()` from `music/audio.ts` by passing a
  fractional MIDI value, so it follows the chosen A4 instead of hardcoded 440.
- Chromatic mode hides the string row and measures against the nearest note.

## Verification

- `pnpm test` (327 passed, 17 of them in `pitch.test.ts`, including 82.41 Hz,
  110 Hz with a louder second harmonic, silence and white noise).
- `pnpm check` (0 errors, 0 warnings, 0 hints).
- `pnpm build` (63 pages).
- End to end with Chromium's fake microphone fed a 110 Hz WAV: the tuner read
  `A2`, `0 cents`, "In tune", highlighted the A string and the needle sat at the
  centre. Switching to bass re-targeted G2 (+200 cents), the reference stepped to
  441 Hz (+196 cents) and updated the URL, and stopping returned to the idle
  state.
- Mobile (390px) and dark mode screenshots.

## Files

- `src/lib/music/pitch.ts`, `src/lib/music/pitch.test.ts`
- `src/data/instruments.ts`
- `src/components/TunerWidget.astro`, `src/scripts/tuner.ts`
- `src/pages/music/tuner.astro`, `src/data/tools.ts`
