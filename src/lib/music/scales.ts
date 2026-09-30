import { LETTERS, mod12, parseNote, spellOnLetter, type SpelledNote } from './notes';

export interface ScaleDef {
  id: string;
  name: string;
  intervals: number[];
}

export const SCALES: ScaleDef[] = [
  { id: 'major', name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'natural-minor', name: 'Natural minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'locrian', name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: 'harmonic-minor', name: 'Harmonic minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodic-minor', name: 'Melodic minor (ascending)', intervals: [0, 2, 3, 5, 7, 9, 11] },
];

export function findScale(id: string): ScaleDef | undefined {
  return SCALES.find((scale) => scale.id === id);
}

export interface BuiltScale {
  root: SpelledNote;
  scale: ScaleDef;
  notes: SpelledNote[];
}

export function buildScale(root: string | SpelledNote, scaleId: string): BuiltScale {
  const scale = findScale(scaleId);
  if (!scale) throw new Error(`Unknown scale: ${scaleId}`);
  const rootNote = typeof root === 'string' ? parseNote(root) : root;
  const rootIndex = LETTERS.indexOf(rootNote.letter);
  const notes = scale.intervals.map((interval, degree) => {
    const letter = LETTERS[(rootIndex + degree) % LETTERS.length];
    const pitch = mod12(rootNote.pitchClass + interval);
    return spellOnLetter(pitch, letter);
  });
  return { root: rootNote, scale, notes };
}
