const BINARY_CHUNK = 0x8000;

export function bytesToBinary(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += BINARY_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BINARY_CHUNK));
  }
  return binary;
}

export function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function toUrlSafe(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function encodeBytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  const encoded = btoa(bytesToBinary(bytes));
  return urlSafe ? toUrlSafe(encoded) : encoded;
}

export function encodeBase64(text: string, urlSafe = false): string {
  return encodeBytesToBase64(new TextEncoder().encode(text), urlSafe);
}

export function decodeBase64ToBytes(input: string): Uint8Array | null {
  try {
    const source = input.replace(/^\s*data:[^,]*;base64,/i, '');
    let normalized = source.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (normalized.length % 4 === 1) return null;
    const remainder = normalized.length % 4;
    if (remainder) normalized += '='.repeat(4 - remainder);
    return binaryToBytes(atob(normalized));
  } catch {
    return null;
  }
}

export function decodeBase64(input: string): string | null {
  const bytes = decodeBase64ToBytes(input);
  return bytes ? new TextDecoder().decode(bytes) : null;
}

export function decodeBase64Text(input: string): string | null {
  const bytes = decodeBase64ToBytes(input);
  return bytes ? decodeUtf8(bytes) : null;
}

export function wrapBase64(encoded: string, width: number): string {
  if (!Number.isFinite(width) || width < 1) return encoded;
  const lines: string[] = [];
  for (let index = 0; index < encoded.length; index += width) {
    lines.push(encoded.slice(index, index + width));
  }
  return lines.join('\n');
}
