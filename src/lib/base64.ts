export function bytesToBinary(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return binary;
}

export function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toUrlSafe(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeBase64(text: string, urlSafe = false): string {
  const encoded = btoa(bytesToBinary(new TextEncoder().encode(text)));
  return urlSafe ? toUrlSafe(encoded) : encoded;
}

export function decodeBase64(input: string): string | null {
  try {
    let normalized = input.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const remainder = normalized.length % 4;
    if (remainder) normalized += '='.repeat(4 - remainder);
    return new TextDecoder().decode(binaryToBytes(atob(normalized)));
  } catch {
    return null;
  }
}
