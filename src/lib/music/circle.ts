import { mod12, parseNote } from './notes';
import { buildScale } from './scales';
import { buildDiatonicChords, type ChordKind } from './chords';

export interface CircleKey {
  index: number;
  major: string;
  minor: string;
  accidentals: number;
  kind: 'sharp' | 'flat' | 'none';
  majorEnharmonic?: string;
  minorEnharmonic?: string;
}

export const CIRCLE: CircleKey[] = [
  { index: 0, major: 'C', minor: 'A', accidentals: 0, kind: 'none' },
  { index: 1, major: 'G', minor: 'E', accidentals: 1, kind: 'sharp' },
  { index: 2, major: 'D', minor: 'B', accidentals: 2, kind: 'sharp' },
  { index: 3, major: 'A', minor: 'F#', accidentals: 3, kind: 'sharp' },
  { index: 4, major: 'E', minor: 'C#', accidentals: 4, kind: 'sharp' },
  { index: 5, major: 'B', minor: 'G#', accidentals: 5, kind: 'sharp' },
  {
    index: 6,
    major: 'F#',
    minor: 'D#',
    accidentals: 6,
    kind: 'sharp',
    majorEnharmonic: 'Gb',
    minorEnharmonic: 'Eb',
  },
  { index: 7, major: 'Db', minor: 'Bb', accidentals: -5, kind: 'flat' },
  { index: 8, major: 'Ab', minor: 'F', accidentals: -4, kind: 'flat' },
  { index: 9, major: 'Eb', minor: 'C', accidentals: -3, kind: 'flat' },
  { index: 10, major: 'Bb', minor: 'G', accidentals: -2, kind: 'flat' },
  { index: 11, major: 'F', minor: 'D', accidentals: -1, kind: 'flat' },
];

export function circleForKey(major: string): CircleKey | undefined {
  return CIRCLE.find((entry) => entry.major === major || entry.majorEnharmonic === major);
}

export function relativeMinor(major: string): string | undefined {
  const entry = circleForKey(major);
  if (!entry) return undefined;
  return major === entry.majorEnharmonic ? entry.minorEnharmonic : entry.minor;
}

export function keySignatureSymbol(accidentals: number): string {
  if (accidentals === 0) return '—';
  const symbol = accidentals > 0 ? '♯' : '♭';
  return `${Math.abs(accidentals)}${symbol}`;
}

export function keySignatureLabel(accidentals: number): string {
  if (accidentals === 0) return 'no accidentals';
  const count = Math.abs(accidentals);
  return `${count} ${accidentals > 0 ? 'sharp' : 'flat'}${count === 1 ? '' : 's'}`;
}

export type CircleRing = 'major' | 'minor' | 'dim';

export interface NoteRef {
  name: string;
  pitchClass: number;
}

export interface RingChord {
  ring: CircleRing;
  index: number;
  symbol: string;
  kind: ChordKind;
  notes: NoteRef[];
}

export interface FamilyChord extends RingChord {
  degree: number;
  roman: string;
}

const PITCH_INDEX = new Map<number, number>(
  CIRCLE.map((entry) => [parseNote(entry.major).pitchClass, entry.index]),
);

function sectorForPitchClass(pitchClass: number): number {
  return PITCH_INDEX.get(mod12(pitchClass)) ?? 0;
}

function diatonic(root: string, scaleId: string) {
  return buildDiatonicChords(buildScale(root, scaleId), { seventh: false });
}

function toNotes(notes: { name: string; pitchClass: number }[]): NoteRef[] {
  return notes.map((note) => ({ name: note.name, pitchClass: note.pitchClass }));
}

export function circleChords(): RingChord[] {
  const result: RingChord[] = [];
  for (const entry of CIRCLE) {
    const major = diatonic(entry.major, 'major')[0];
    result.push({
      ring: 'major',
      index: entry.index,
      symbol: major.symbol,
      kind: major.kind,
      notes: toNotes(major.notes),
    });

    const minor = diatonic(entry.minor, 'natural-minor')[0];
    result.push({
      ring: 'minor',
      index: entry.index,
      symbol: minor.symbol,
      kind: minor.kind,
      notes: toNotes(minor.notes),
    });

    const dim = diatonic(entry.major, 'major')[6];
    result.push({
      ring: 'dim',
      index: entry.index,
      symbol: dim.symbol,
      kind: dim.kind,
      notes: toNotes(dim.notes),
    });
  }
  return result;
}

export function chordFamily(major: string): FamilyChord[] {
  const entry = circleForKey(major);
  if (!entry) return [];

  return diatonic(entry.major, 'major').map((chord, degree) => {
    const rootPitch = chord.notes[0].pitchClass;
    let ring: CircleRing;
    let index: number;
    if (chord.kind === 'minor') {
      ring = 'minor';
      index = sectorForPitchClass(rootPitch + 3);
    } else if (chord.kind === 'diminished') {
      ring = 'dim';
      index = sectorForPitchClass(rootPitch + 1);
    } else {
      ring = 'major';
      index = sectorForPitchClass(rootPitch);
    }
    return {
      ring,
      index,
      degree: degree + 1,
      roman: chord.roman,
      symbol: chord.symbol,
      kind: chord.kind,
      notes: toNotes(chord.notes),
    };
  });
}
