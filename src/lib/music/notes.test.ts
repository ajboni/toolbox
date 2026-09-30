import { describe, expect, it } from 'vitest';
import {
  accidentalSymbol,
  mod12,
  parseNote,
  pitchClasses,
  spell,
  spellOnLetter,
} from './notes';

describe('parseNote', () => {
  it('parses natural, sharp and flat names', () => {
    expect(parseNote('C').pitchClass).toBe(0);
    expect(parseNote('F#').pitchClass).toBe(6);
    expect(parseNote('Bb').pitchClass).toBe(10);
    expect(parseNote('Bb').name).toBe('Bb');
  });

  it('throws on an invalid name', () => {
    expect(() => parseNote('H')).toThrow();
    expect(() => parseNote('C#b')).toThrow();
  });
});

describe('spellOnLetter', () => {
  it('chooses the accidental that keeps the letter', () => {
    expect(spellOnLetter(5, 'E').name).toBe('E#');
    expect(spellOnLetter(6, 'G').name).toBe('Gb');
    expect(spellOnLetter(11, 'C').name).toBe('Cb');
  });
});

describe('spell', () => {
  it('renders accidentals and wraps the pitch class', () => {
    expect(spell('F', 2).name).toBe('F##');
    expect(spell('B', -1).name).toBe('Bb');
    expect(spell('C', -1).pitchClass).toBe(11);
  });
});

describe('accidentalSymbol', () => {
  it('maps accidentals to # and b', () => {
    expect(accidentalSymbol(0)).toBe('');
    expect(accidentalSymbol(1)).toBe('#');
    expect(accidentalSymbol(-2)).toBe('bb');
  });
});

describe('mod12', () => {
  it('wraps into 0..11', () => {
    expect(mod12(-1)).toBe(11);
    expect(mod12(13)).toBe(1);
  });
});

describe('pitchClasses', () => {
  it('deduplicates enharmonic duplicates', () => {
    expect(pitchClasses([parseNote('C'), parseNote('B#')])).toEqual([0]);
  });
});
