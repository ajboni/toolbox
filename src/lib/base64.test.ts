import { describe, expect, it } from 'vitest';
import {
  decodeBase64,
  decodeBase64Text,
  decodeBase64ToBytes,
  decodeUtf8,
  encodeBase64,
  encodeBytesToBase64,
  wrapBase64,
} from './base64';

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

describe('decodeBase64ToBytes', () => {
  it('round-trips every byte value', () => {
    const bytes = new Uint8Array(256);
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = index;
    const encoded = encodeBytesToBase64(bytes);
    expect(Array.from(decodeBase64ToBytes(encoded) ?? [])).toEqual(Array.from(bytes));
  });

  it('ignores whitespace and missing padding', () => {
    expect(Array.from(decodeBase64ToBytes('aGVs\nbG8g d29y\tbGQ') ?? [])).toEqual(
      Array.from(new TextEncoder().encode('hello world')),
    );
  });

  it('accepts URL-safe input', () => {
    const encoded = encodeBytesToBase64(new Uint8Array([0xfb, 0xff]), true);
    expect(decodeBase64ToBytes(encoded)).not.toBeNull();
  });

  it('accepts a data URL', () => {
    expect(decodeBase64('data:text/plain;base64,aGVsbG8=')).toBe('hello');
  });

  it('returns no bytes for an empty string', () => {
    expect(decodeBase64ToBytes('')).toEqual(new Uint8Array());
  });

  it('returns null for bad input', () => {
    expect(decodeBase64ToBytes('abcde')).toBeNull();
    expect(decodeBase64ToBytes('not valid !!!')).toBeNull();
  });
});

describe('decodeUtf8 / decodeBase64Text', () => {
  it('returns null for bytes that are not UTF-8', () => {
    expect(decodeUtf8(new Uint8Array([0xff, 0xfe, 0x00]))).toBeNull();
    expect(decodeBase64Text(encodeBytesToBase64(new Uint8Array([0xff, 0xfe])))).toBeNull();
  });

  it('keeps the text when the bytes are UTF-8', () => {
    expect(decodeBase64Text(encodeBase64('hello'))).toBe('hello');
  });
});

describe('wrapBase64', () => {
  it('splits the string into fixed-width lines', () => {
    expect(wrapBase64('abcdefghij', 4)).toBe('abcd\nefgh\nij');
  });

  it('leaves the string alone for a non-positive width', () => {
    expect(wrapBase64('abcdef', 0)).toBe('abcdef');
  });
});
