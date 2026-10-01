import { describe, expect, it } from 'vitest';
import { hashText } from './hash';

describe('hashText', () => {
  it('matches the known SHA-256 digest', async () => {
    await expect(hashText('abc', 'SHA-256')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('matches the known SHA-1 digest', async () => {
    await expect(hashText('abc', 'SHA-1')).resolves.toBe(
      'a9993e364706816aba3e25717850c26c9cd0d89d',
    );
  });

  it('hashes Unicode text', async () => {
    const digest = await hashText('año');
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });
});
