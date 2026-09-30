import { describe, expect, it } from 'vitest';
import {
  CIRCLE,
  chordFamily,
  circleChords,
  circleForKey,
  keySignatureLabel,
  keySignatureSymbol,
  relativeMinor,
} from './circle';

describe('CIRCLE', () => {
  it('follows the order of fifths', () => {
    expect(CIRCLE.map((entry) => entry.major)).toEqual([
      'C',
      'G',
      'D',
      'A',
      'E',
      'B',
      'F#',
      'Db',
      'Ab',
      'Eb',
      'Bb',
      'F',
    ]);
  });

  it('tracks the number of accidentals', () => {
    expect(CIRCLE[0].accidentals).toBe(0);
    expect(CIRCLE[1].accidentals).toBe(1);
    expect(CIRCLE[7].accidentals).toBe(-5);
    expect(CIRCLE[11].accidentals).toBe(-1);
  });
});

describe('circleForKey', () => {
  it('returns the entry for a major key', () => {
    expect(circleForKey('G')?.minor).toBe('E');
  });

  it('maps the enharmonic Gb to F#', () => {
    expect(circleForKey('Gb')?.major).toBe('F#');
  });

  it('returns undefined for unknown keys', () => {
    expect(circleForKey('X')).toBeUndefined();
  });
});

describe('relativeMinor', () => {
  it('finds relative minors', () => {
    expect(relativeMinor('C')).toBe('A');
    expect(relativeMinor('F#')).toBe('D#');
    expect(relativeMinor('Gb')).toBe('Eb');
  });
});

describe('key signature labels', () => {
  it('formats sharps and flats', () => {
    expect(keySignatureLabel(0)).toBe('no accidentals');
    expect(keySignatureLabel(1)).toBe('1 sharp');
    expect(keySignatureLabel(-3)).toBe('3 flats');
    expect(keySignatureSymbol(2)).toBe('2♯');
    expect(keySignatureSymbol(-2)).toBe('2♭');
  });
});

describe('circleChords', () => {
  it('builds three chords for every sector', () => {
    expect(circleChords()).toHaveLength(CIRCLE.length * 3);
  });

  it('labels the C sector', () => {
    const chords = circleChords().filter((chord) => chord.index === 0);
    expect(chords.find((chord) => chord.ring === 'major')?.symbol).toBe('C');
    expect(chords.find((chord) => chord.ring === 'minor')?.symbol).toBe('Am');
    expect(chords.find((chord) => chord.ring === 'dim')?.symbol).toBe('B°');
  });
});

describe('chordFamily', () => {
  it('places the seven diatonic chords of C on neighbouring sectors', () => {
    const family = chordFamily('C');
    const byRoman = Object.fromEntries(family.map((chord) => [chord.roman, chord]));

    expect(byRoman.I).toMatchObject({ ring: 'major', index: 0, symbol: 'C' });
    expect(byRoman.IV).toMatchObject({ ring: 'major', index: 11, symbol: 'F' });
    expect(byRoman.V).toMatchObject({ ring: 'major', index: 1, symbol: 'G' });
    expect(byRoman.ii).toMatchObject({ ring: 'minor', index: 11, symbol: 'Dm' });
    expect(byRoman.iii).toMatchObject({ ring: 'minor', index: 1, symbol: 'Em' });
    expect(byRoman.vi).toMatchObject({ ring: 'minor', index: 0, symbol: 'Am' });
    expect(byRoman['vii°']).toMatchObject({ ring: 'dim', index: 0, symbol: 'B°' });
  });

  it('handles sharp keys through pitch classes', () => {
    const dim = chordFamily('F#').find((chord) => chord.ring === 'dim');
    expect(dim).toMatchObject({ index: 6, symbol: 'E#°' });
  });

  it('resolves enharmonic spellings', () => {
    expect(chordFamily('Gb').map((chord) => chord.symbol)).toEqual(
      chordFamily('F#').map((chord) => chord.symbol),
    );
  });
});
