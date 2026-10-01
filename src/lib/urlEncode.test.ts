import { describe, expect, it } from 'vitest';
import { decodeUrl, encodeUrl, encodeUrlForm } from './urlEncode';

describe('encodeUrl', () => {
  it('encodes reserved characters', () => {
    expect(encodeUrl('a b&c=d')).toBe('a%20b%26c%3Dd');
  });
});

describe('decodeUrl', () => {
  it('decodes percent-encoding', () => {
    expect(decodeUrl('a%20b%26c')).toBe('a b&c');
  });

  it('treats plus as space', () => {
    expect(decodeUrl('a+b')).toBe('a b');
  });

  it('returns null on malformed input', () => {
    expect(decodeUrl('%E0%A4%A')).toBeNull();
  });
});

describe('encodeUrlForm', () => {
  it('uses plus for spaces', () => {
    expect(encodeUrlForm('a b')).toBe('a+b');
  });
});
