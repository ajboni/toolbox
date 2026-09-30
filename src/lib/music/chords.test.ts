import { describe, expect, it } from 'vitest';
import { buildDiatonicChords } from './chords';
import { buildScale } from './scales';

function triads(root: string, scale: string) {
  return buildDiatonicChords(buildScale(root, scale));
}

function sevenths(root: string, scale: string) {
  return buildDiatonicChords(buildScale(root, scale), { seventh: true });
}

describe('buildDiatonicChords triads', () => {
  it('builds the seven triads of C major', () => {
    const chords = triads('C', 'major');
    expect(chords.map((chord) => chord.symbol)).toEqual([
      'C',
      'Dm',
      'Em',
      'F',
      'G',
      'Am',
      'B°',
    ]);
    expect(chords.map((chord) => chord.roman)).toEqual([
      'I',
      'ii',
      'iii',
      'IV',
      'V',
      'vi',
      'vii°',
    ]);
  });

  it('builds the triads of A harmonic minor', () => {
    const chords = triads('A', 'harmonic-minor');
    expect(chords.map((chord) => chord.symbol)).toEqual([
      'Am',
      'B°',
      'C+',
      'Dm',
      'E',
      'F',
      'G#°',
    ]);
    expect(chords.map((chord) => chord.roman)).toEqual([
      'i',
      'ii°',
      'III+',
      'iv',
      'V',
      'VI',
      'vii°',
    ]);
  });
});

describe('buildDiatonicChords sevenths', () => {
  it('builds the seven seventh chords of C major', () => {
    const chords = sevenths('C', 'major');
    expect(chords.map((chord) => chord.symbol)).toEqual([
      'Cmaj7',
      'Dm7',
      'Em7',
      'Fmaj7',
      'G7',
      'Am7',
      'Bm7b5',
    ]);
  });

  it('builds the seventh chords of A harmonic minor', () => {
    const chords = sevenths('A', 'harmonic-minor');
    expect(chords.map((chord) => chord.symbol)).toEqual([
      'AmMaj7',
      'Bm7b5',
      'Cmaj7#5',
      'Dm7',
      'E7',
      'Fmaj7',
      'G#°7',
    ]);
  });
});
