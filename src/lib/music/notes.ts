export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export interface SpelledNote {
  letter: Letter;
  accidental: number;
  pitchClass: number;
  name: string;
}

export const LETTERS: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const LETTER_SEMITONES: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function mod12(value: number): number {
  return ((value % 12) + 12) % 12;
}

export function accidentalSymbol(accidental: number): string {
  if (accidental > 0) return '#'.repeat(accidental);
  if (accidental < 0) return 'b'.repeat(-accidental);
  return '';
}

export function spell(letter: Letter, accidental: number): SpelledNote {
  return {
    letter,
    accidental,
    pitchClass: mod12(LETTER_SEMITONES[letter] + accidental),
    name: `${letter}${accidentalSymbol(accidental)}`,
  };
}

export function spellOnLetter(pitchClass: number, letter: Letter): SpelledNote {
  let accidental = mod12(pitchClass - LETTER_SEMITONES[letter]);
  if (accidental > 6) accidental -= 12;
  return spell(letter, accidental);
}

export function parseNote(name: string): SpelledNote {
  const match = /^([A-Ga-g])(#{1,2}|b{1,2})?$/.exec(name.trim());
  if (!match) throw new Error(`Invalid note name: ${name}`);
  const letter = match[1].toUpperCase() as Letter;
  const raw = match[2] ?? '';
  const accidental = raw.startsWith('#') ? raw.length : -raw.length;
  return spell(letter, accidental);
}

export const ROOTS: SpelledNote[] = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
].map(parseNote);

export function isRoot(name: string): boolean {
  return ROOTS.some((root) => root.name === name);
}

export function pitchClasses(notes: SpelledNote[]): number[] {
  return [...new Set(notes.map((note) => note.pitchClass))];
}
