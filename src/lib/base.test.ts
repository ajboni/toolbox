import { describe, expect, it } from 'vitest';
import { convertBase, parseInBase, toBase } from './base';

describe('parseInBase', () => {
  it('parses common bases', () => {
    expect(parseInBase('255', 10)).toBe(255n);
    expect(parseInBase('ff', 16)).toBe(255n);
    expect(parseInBase('11111111', 2)).toBe(255n);
    expect(parseInBase('377', 8)).toBe(255n);
  });

  it('is case-insensitive and ignores separators', () => {
    expect(parseInBase('FF FF', 16)).toBe(65535n);
    expect(parseInBase('1_000', 10)).toBe(1000n);
  });

  it('supports negatives', () => {
    expect(parseInBase('-ff', 16)).toBe(-255n);
  });

  it('rejects digits outside the base', () => {
    expect(parseInBase('2', 2)).toBeNull();
    expect(parseInBase('g', 16)).toBeNull();
    expect(parseInBase('', 10)).toBeNull();
  });

  it('rejects invalid bases', () => {
    expect(parseInBase('10', 1)).toBeNull();
    expect(parseInBase('10', 37)).toBeNull();
  });
});

describe('toBase', () => {
  it('formats numbers in the target base', () => {
    expect(toBase(255n, 16)).toBe('ff');
    expect(toBase(255n, 2)).toBe('11111111');
    expect(toBase(0n, 16)).toBe('0');
    expect(toBase(-255n, 16)).toBe('-ff');
  });
});

describe('convertBase', () => {
  it('round-trips between bases', () => {
    expect(convertBase('ff', 16, 2)).toBe('11111111');
    expect(convertBase('1000', 10, 16)).toBe('3e8');
  });

  it('handles values beyond Number precision', () => {
    expect(convertBase('ffffffffffffffff', 16, 10)).toBe('18446744073709551615');
  });

  it('returns null on invalid input', () => {
    expect(convertBase('xyz', 10, 16)).toBeNull();
  });
});
