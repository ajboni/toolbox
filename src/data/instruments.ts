export interface TuningString {
  label: string;
  midi: number;
}

export interface Instrument {
  slug: string;
  name: string;
  strings: TuningString[];
}

export const INSTRUMENTS: Instrument[] = [
  { slug: 'chromatic', name: 'Any note', strings: [] },
  {
    slug: 'guitar',
    name: 'Guitar',
    strings: [
      { label: 'E2', midi: 40 },
      { label: 'A2', midi: 45 },
      { label: 'D3', midi: 50 },
      { label: 'G3', midi: 55 },
      { label: 'B3', midi: 59 },
      { label: 'E4', midi: 64 },
    ],
  },
  {
    slug: 'bass',
    name: 'Bass',
    strings: [
      { label: 'E1', midi: 28 },
      { label: 'A1', midi: 33 },
      { label: 'D2', midi: 38 },
      { label: 'G2', midi: 43 },
    ],
  },
  {
    slug: 'ukulele',
    name: 'Ukulele',
    strings: [
      { label: 'G4', midi: 67 },
      { label: 'C4', midi: 60 },
      { label: 'E4', midi: 64 },
      { label: 'A4', midi: 69 },
    ],
  },
  {
    slug: 'violin',
    name: 'Violin',
    strings: [
      { label: 'G3', midi: 55 },
      { label: 'D4', midi: 62 },
      { label: 'A4', midi: 69 },
      { label: 'E5', midi: 76 },
    ],
  },
  {
    slug: 'cello',
    name: 'Cello',
    strings: [
      { label: 'C2', midi: 36 },
      { label: 'G2', midi: 43 },
      { label: 'D3', midi: 50 },
      { label: 'A3', midi: 57 },
    ],
  },
];

export const DEFAULT_INSTRUMENT = 'guitar';

export const MIN_REFERENCE = 415;
export const MAX_REFERENCE = 466;

export function findInstrument(slug: string): Instrument | undefined {
  return INSTRUMENTS.find((instrument) => instrument.slug === slug);
}

export function findString(
  instrument: Instrument,
  midi: number,
): TuningString | undefined {
  return instrument.strings.find((string) => string.midi === midi);
}
