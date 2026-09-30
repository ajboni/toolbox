import type { ParamSchema } from '../urlState';
import { ROOTS } from './notes';
import { buildDiatonicChords, type ChordKind } from './chords';
import { buildScale, findScale } from './scales';

export const SCALE_CHORD_SCHEMA: ParamSchema = {
  root: 'string',
  scale: 'string',
  sev: 'string',
};

export const SCALE_CHORD_DEFAULTS = {
  root: 'C',
  scale: 'major',
  sev: '0',
};

export interface ViewNote {
  name: string;
  pitchClass: number;
}

export interface ViewChord {
  degree: number;
  roman: string;
  symbol: string;
  quality: string;
  kind: ChordKind;
  notes: ViewNote[];
}

export interface ScaleChordView {
  rootName: string;
  scaleId: string;
  scaleName: string;
  seventh: boolean;
  notes: ViewNote[];
  chords: ViewChord[];
}

function toViewNotes(notes: { name: string; pitchClass: number }[]): ViewNote[] {
  return notes.map((note) => ({ name: note.name, pitchClass: note.pitchClass }));
}

export function renderScaleChords(
  values: Record<string, string | number | null | undefined>,
): ScaleChordView {
  const rootName =
    typeof values.root === 'string' ? values.root : SCALE_CHORD_DEFAULTS.root;
  const scaleId =
    typeof values.scale === 'string' ? values.scale : SCALE_CHORD_DEFAULTS.scale;
  const seventh = values.sev === '1' || values.sev === 1 || values.sev === 'true';

  const root =
    ROOTS.find((item) => item.name === rootName) ??
    ROOTS.find((item) => item.name === SCALE_CHORD_DEFAULTS.root)!;
  const scale =
    findScale(scaleId) ?? findScale(SCALE_CHORD_DEFAULTS.scale)!;
  const built = buildScale(root, scale.id);
  const chords = buildDiatonicChords(built, { seventh });

  return {
    rootName: root.name,
    scaleId: scale.id,
    scaleName: scale.name,
    seventh,
    notes: toViewNotes(built.notes),
    chords: chords.map((chord) => ({
      degree: chord.degree,
      roman: chord.roman,
      symbol: chord.symbol,
      quality: chord.quality,
      kind: chord.kind,
      notes: toViewNotes(chord.notes),
    })),
  };
}
