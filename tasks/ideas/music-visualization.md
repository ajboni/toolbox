# Ideas — Music visualization (piano & guitar)

Status: idea
Created: 2026-09-30

Add lightweight, dependency-free visualisations of the notes the music tools
already compute, reusing `src/lib/music`.

## Piano

- Server-rendered SVG keyboard (one or two octaves).
- Highlight every key whose `pitchClass` is in the active scale/chord; the
  client script only toggles classes.
- `pitchClasses()` in `src/lib/music/notes.ts` already returns the set to mark.

## Guitar

- SVG fretboard for standard tuning (E A D G B e).
- Compute each string/fret's `pitchClass` and highlight matches for the active
  scale or chord.
- Chord *diagrams with fingerings* need a shape database and are a bigger task;
  start with scale/note highlighting only.

## Notes

- Keep it SVG/CSS only. VexFlow is overkill (notation) and `tonal`/`vexchords`
  would add dependencies that fight the "minimal client JS" rule.
- Candidate placements: a small toggle inside `ScaleChordsPanel.astro`, or a
  dedicated "Fretboard / Keyboard" tool under `/music/`.
