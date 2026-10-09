import { describe, expect, it } from 'vitest';
import { BIP39_WORDS } from '../data/bip39';
import {
  activeCharacterSets,
  AMBIGUOUS,
  generatePassphrase,
  generatePassphrases,
  generatePassword,
  generatePasswords,
  passwordAlphabet,
  passwordEntropyBits,
  passphraseEntropyBits,
  strength,
  type PasswordOptions,
  type Rng,
} from './password';

const first: Rng = () => 0;

const all: PasswordOptions = {
  length: 16,
  lower: true,
  upper: true,
  digits: true,
  symbols: true,
};

describe('activeCharacterSets', () => {
  it('returns only the selected sets', () => {
    const sets = activeCharacterSets({ ...all, upper: false, symbols: false });
    expect(sets).toHaveLength(2);
  });

  it('strips ambiguous characters when asked', () => {
    const sets = activeCharacterSets({ ...all, excludeAmbiguous: true });
    const joined = sets.join('');
    for (const char of AMBIGUOUS) expect(joined).not.toContain(char);
  });
});

describe('generatePassword', () => {
  it('respects the requested length', () => {
    expect(generatePassword({ ...all, length: 24 })).toHaveLength(24);
  });

  it('clamps the length to a safe range', () => {
    expect(generatePassword({ ...all, length: 1 })).toHaveLength(4);
    expect(generatePassword({ ...all, length: 999 })).toHaveLength(128);
  });

  it('includes at least one character from every active set', () => {
    const password = generatePassword(all);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[^a-zA-Z0-9]/);
  });

  it('never includes ambiguous characters when excluded', () => {
    for (let run = 0; run < 50; run += 1) {
      const password = generatePassword({ ...all, length: 64, excludeAmbiguous: true });
      for (const char of AMBIGUOUS) expect(password).not.toContain(char);
    }
  });

  it('is deterministic for a fixed rng', () => {
    expect(generatePassword({ lower: true, length: 8 }, first)).toBe('aaaaaaaa');
  });

  it('falls back to lowercase when no set is selected', () => {
    expect(passwordAlphabet({ ...all, lower: false, upper: false, digits: false, symbols: false })).toBe(
      'abcdefghijklmnopqrstuvwxyz',
    );
  });
});

describe('generatePassphrase', () => {
  const wordlist = ['alpha', 'beta', 'gamma'];

  it('joins the requested number of words', () => {
    const phrase = generatePassphrase({ words: 4, separator: '-', wordlist }, first);
    expect(phrase).toBe('alpha-alpha-alpha-alpha');
  });

  it('attaches the digit to a random word, not as a separate token', () => {
    const phrase = generatePassphrase(
      { words: 3, separator: '.', capitalize: true, appendNumber: true, wordlist },
      first,
    );
    expect(phrase).toBe('0Alpha.Alpha.Alpha');
  });

  it('never appends the digit as its own token', () => {
    for (let run = 0; run < 20; run += 1) {
      const phrase = generatePassphrase({ words: 4, separator: '-', appendNumber: true, wordlist });
      const parts = phrase.split('-');
      expect(parts).toHaveLength(4);
      expect(parts.filter((part) => /^\d/.test(part))).toHaveLength(1);
    }
  });

  it('returns an empty string for an empty wordlist', () => {
    expect(generatePassphrase({ words: 3, separator: '-', wordlist: [] })).toBe('');
  });
});

describe('bulk generation', () => {
  it('creates the requested number of passwords', () => {
    expect(generatePasswords(all, 7)).toHaveLength(7);
  });

  it('creates the requested number of passphrases', () => {
    expect(generatePassphrases({ words: 3, separator: '-', wordlist: ['a', 'b'] }, 5)).toHaveLength(5);
  });

  it('clamps the count', () => {
    expect(generatePasswords(all, 0)).toHaveLength(1);
    expect(generatePasswords(all, 5000)).toHaveLength(100);
  });
});

describe('entropy', () => {
  it('computes password entropy from the alphabet size', () => {
    const bits = passwordEntropyBits({ length: 10, lower: true });
    expect(bits).toBeCloseTo(10 * Math.log2(26), 5);
  });

  it('computes passphrase entropy from the wordlist size', () => {
    const bits = passphraseEntropyBits({ words: 4, separator: '-', wordlist: new Array(2048).fill('x') });
    expect(bits).toBeCloseTo(4 * Math.log2(2048), 5);
  });

  it('adds the digit and position entropy when a number is appended', () => {
    const base = passphraseEntropyBits({ words: 4, separator: '-', wordlist: new Array(2048).fill('x') });
    const withNumber = passphraseEntropyBits({
      words: 4,
      separator: '-',
      appendNumber: true,
      wordlist: new Array(2048).fill('x'),
    });
    expect(withNumber - base).toBeCloseTo(Math.log2(10) + Math.log2(4), 5);
  });
});

describe('strength', () => {
  it('classifies bits into labels', () => {
    expect(strength(30)).toBe('Weak');
    expect(strength(60)).toBe('Fair');
    expect(strength(120)).toBe('Strong');
  });
});

describe('BIP-39 wordlist', () => {
  it('has the expected size and shape', () => {
    expect(BIP39_WORDS).toHaveLength(2048);
    expect(new Set(BIP39_WORDS).size).toBe(2048);
    for (const word of BIP39_WORDS) {
      expect(word).toBe(word.toLowerCase());
      expect(word).toMatch(/^[a-z]{3,8}$/);
    }
  });
});
