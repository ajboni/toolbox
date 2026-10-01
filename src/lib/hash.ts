export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;

export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export async function hashText(
  text: string,
  algorithm: HashAlgorithm = 'SHA-256',
): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest(algorithm, data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
