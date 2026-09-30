# 0005 — Music category, Scale & Chord Finder and Circle of Fifths

Status: done
Created: 2026-09-30

## Delivered

- New `music` category ("Music", `fuchsia` accent) with hub at `/music/`.
- Two tools, each sharing state via the query string:
  - `/music/chord-finder/` — root + scale → notes and the seven diatonic
    chords (`?root=C&scale=major&sev=1`).
  - `/music/circle-of-fifths/` — clickable circle of fifths that selects a
    major key (`?key=C`) and shows its scale and chords.
- Reusable music engine under `src/lib/music/`, decoupled from any single tool
  so future scale tools (e.g. a blues scale viewer) can reuse it:
  - `notes.ts` — `SpelledNote`, note parsing/spelling, `ROOTS`, `mod12`,
    `pitchClasses()`.
  - `scales.ts` — `SCALES` registry (`{ id, name, intervals }`, any length) and
    `buildScale(root, scaleId)`. Covers major, natural minor, the five other
    modes, harmonic minor and melodic minor.
  - `chords.ts` — `buildDiatonicChords(scale, { seventh })` with quality
    detection, roman numerals and chord symbols.
  - `circle.ts` — the 12 circle-of-fifths positions, relative minors, key
    signature helpers and the F#/Gb enharmonic pair.
  - `view.ts` — shared schema/defaults and `renderScaleChords()` so the default
    result is server-rendered and the client reuses the same code.
- Correct enharmonic spelling derived from the key signature (F# major writes
  E#, Db major writes Gb).
- `ScaleChordsPanel.astro` (shared), `ScaleChordsWidget.astro` and
  `CircleOfFifths.astro`; scripts `musicPanel.ts`, `chordFinder.ts` and
  `circleOfFifths.ts`. No new dependencies; SVG/CSS only.
- `RelatedTools.astro` cross-links the two tools.

## Notes

- The selector is a flat list of scales (no family grouping), as requested.
- Pentatonic/blues scales are intentionally out of scope; `buildScale` already
  supports arbitrary interval sets for when they are added.
- Piano/guitar visualisation deferred; see `tasks/ideas/music-visualization.md`.

## Verification

- `pnpm test` (58 passed), `pnpm check` (0 errors), `pnpm build` (26 pages).

## Files

- `src/data/site.ts`, `src/data/tools.ts`
- `src/lib/music/{notes,scales,chords,circle,view,index}.ts`
- `src/lib/music/{notes,scales,chords,circle}.test.ts`
- `src/components/{ScaleChordsPanel,ScaleChordsWidget,CircleOfFifths}.astro`
- `src/scripts/{musicPanel,chordFinder,circleOfFifths}.ts`
- `src/pages/music/{index,chord-finder,circle-of-fifths}.astro`
