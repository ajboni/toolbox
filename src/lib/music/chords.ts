import { mod12, type SpelledNote } from './notes';
import type { BuiltScale } from './scales';

export type ChordKind = 'major' | 'minor' | 'diminished' | 'augmented';

export interface DiatonicChord {
  degree: number;
  roman: string;
  symbol: string;
  quality: string;
  kind: ChordKind;
  notes: SpelledNote[];
}

interface QualityDef {
  id: string;
  label: string;
  kind: ChordKind;
  symbol: string;
  roman: string;
  intervals: number[];
}

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const TRIADS: QualityDef[] = [
  { id: 'major', label: 'major', kind: 'major', symbol: '', roman: '', intervals: [0, 4, 7] },
  { id: 'minor', label: 'minor', kind: 'minor', symbol: 'm', roman: '', intervals: [0, 3, 7] },
  {
    id: 'diminished',
    label: 'diminished',
    kind: 'diminished',
    symbol: '°',
    roman: '°',
    intervals: [0, 3, 6],
  },
  {
    id: 'augmented',
    label: 'augmented',
    kind: 'augmented',
    symbol: '+',
    roman: '+',
    intervals: [0, 4, 8],
  },
];

const SEVENTHS: QualityDef[] = [
  {
    id: 'major7',
    label: 'major 7th',
    kind: 'major',
    symbol: 'maj7',
    roman: 'maj7',
    intervals: [0, 4, 7, 11],
  },
  {
    id: 'dominant7',
    label: 'dominant 7th',
    kind: 'major',
    symbol: '7',
    roman: '7',
    intervals: [0, 4, 7, 10],
  },
  {
    id: 'minor7',
    label: 'minor 7th',
    kind: 'minor',
    symbol: 'm7',
    roman: '7',
    intervals: [0, 3, 7, 10],
  },
  {
    id: 'half-diminished7',
    label: 'half-diminished 7th',
    kind: 'diminished',
    symbol: 'm7b5',
    roman: 'ø7',
    intervals: [0, 3, 6, 10],
  },
  {
    id: 'diminished7',
    label: 'diminished 7th',
    kind: 'diminished',
    symbol: '°7',
    roman: '°7',
    intervals: [0, 3, 6, 9],
  },
  {
    id: 'minor-major7',
    label: 'minor-major 7th',
    kind: 'minor',
    symbol: 'mMaj7',
    roman: 'mMaj7',
    intervals: [0, 3, 7, 11],
  },
  {
    id: 'augmented7',
    label: 'augmented 7th',
    kind: 'augmented',
    symbol: '7#5',
    roman: '+7',
    intervals: [0, 4, 8, 10],
  },
  {
    id: 'augmented-major7',
    label: 'augmented major 7th',
    kind: 'augmented',
    symbol: 'maj7#5',
    roman: '+maj7',
    intervals: [0, 4, 8, 11],
  },
  {
    id: 'diminished-major7',
    label: 'diminished major 7th',
    kind: 'diminished',
    symbol: '°maj7',
    roman: '°maj7',
    intervals: [0, 3, 6, 11],
  },
];

function intervalsFrom(notes: SpelledNote[], indices: number[]): number[] {
  const rootPitch = notes[indices[0]].pitchClass;
  return indices.map((index) => mod12(notes[index].pitchClass - rootPitch));
}

function matchQuality(defs: QualityDef[], intervals: number[]): QualityDef | undefined {
  return defs.find(
    (def) =>
      def.intervals.length === intervals.length &&
      def.intervals.every((value, index) => value === intervals[index]),
  );
}

function romanFor(degree: number, quality: QualityDef): string {
  const numeral = ROMANS[degree];
  const upper = quality.kind === 'major' || quality.kind === 'augmented';
  return (upper ? numeral : numeral.toLowerCase()) + quality.roman;
}

export function buildDiatonicChords(
  scale: BuiltScale,
  options: { seventh?: boolean } = {},
): DiatonicChord[] {
  const { seventh = false } = options;
  if (scale.notes.length !== 7) return [];
  return scale.notes.map((_, degree) => {
    const steps = seventh ? 4 : 3;
    const indices = Array.from({ length: steps }, (_, step) => (degree + step * 2) % 7);
    const intervals = intervalsFrom(scale.notes, indices);
    const quality = matchQuality(seventh ? SEVENTHS : TRIADS, intervals);
    const notes = indices.map((index) => scale.notes[index]);
    if (!quality) {
      return {
        degree: degree + 1,
        roman: ROMANS[degree],
        symbol: notes[0].name,
        quality: 'unknown',
        kind: 'major' as ChordKind,
        notes,
      };
    }
    return {
      degree: degree + 1,
      roman: romanFor(degree, quality),
      symbol: notes[0].name + quality.symbol,
      quality: quality.label,
      kind: quality.kind,
      notes,
    };
  });
}
