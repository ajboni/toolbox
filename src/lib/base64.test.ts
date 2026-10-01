import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64 } from './base64';

describe('encodeBase64 / decodeBase64', () => {
  it('round-trips ASCII text', () => {
    const encoded = encodeBase64('hello world');
    expect(encoded).toBe('aGVsbG8gd29ybGQ=');
    expect(decodeBase64(encoded)).toBe('hello world');
  });

  it('round-trips Unicode text', () => {
    const text = 'año · 日本語 🎸';
    expect(decodeBase64(encodeBase64(text))).toBe(text);
  });

  it('produces URL-safe output when asked', () => {
    const encoded = encodeBase64('??>>', true);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeBase64(encoded)).toBe('??>>');
  });

  it('returns null on invalid input', () => {
    expect(decodeBase64('not valid !!!')).toBeNull();
  });
});
