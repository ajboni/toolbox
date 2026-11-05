import { ACCENTS, type AccentName } from '../data/site';
import {
  DEFAULT_COLORS,
  DEFAULT_NAMES,
  MAX_POINTS,
  elapsedFor,
  replay,
  sanitizeName,
  type BestOf,
  type MatchMode,
  type PadelMatch,
  type PadelRules,
  type Team,
} from './padel';

const VERSION = 1;
const HEADER_BYTES = 4;
const COLOR_BYTES = 1;
const ELAPSED_BYTES = 2;
const CHECKSUM_BYTES = 2;
const MAX_NAME_BYTES = 48;

export interface ShareOptions {
  includeNames: boolean;
  now?: number;
}

function colorIndex(color: AccentName): number {
  const index = ACCENTS.indexOf(color);
  return index >= 0 ? index : 0;
}

function checksum(bytes: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash & 0xffff;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  try {
    const binary = atob(normalized + '='.repeat(padding));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
}

function fitName(name: string, index: number): string {
  const encoder = new TextEncoder();
  let text = sanitizeName(name, DEFAULT_NAMES[index]);
  while (encoder.encode(text).length > MAX_NAME_BYTES) {
    text = Array.from(text).slice(0, -1).join('');
  }
  return text || DEFAULT_NAMES[index];
}

export function encodeMatch(match: PadelMatch, options: ShareOptions): string {
  const { includeNames, now = Date.now() } = options;
  const count = match.log.length;
  if (count > MAX_POINTS) throw new Error('Too many points to encode');

  const pointBytes = Math.ceil(count / 8);
  const bestIndex = match.rules.bestOf === 1 ? 0 : match.rules.bestOf === 3 ? 1 : 2;
  const header0 =
    (VERSION << 4) |
    (match.rules.mode === 'tiebreak' ? 0x08 : 0) |
    (bestIndex << 1) |
    (match.rules.goldenPoint ? 1 : 0);
  const header1 = (match.firstServer & 1) | (includeNames ? 0x02 : 0);

  const encodedNames = includeNames
    ? [fitName(match.names[0], 0), fitName(match.names[1], 1)].map((name) =>
        new TextEncoder().encode(name),
      )
    : [];
  const namesBytes = encodedNames.reduce((sum, bytes) => sum + 1 + bytes.length, 0);

  const bytes = new Uint8Array(
    HEADER_BYTES +
      pointBytes +
      COLOR_BYTES +
      namesBytes +
      ELAPSED_BYTES +
      CHECKSUM_BYTES,
  );

  let offset = 0;
  bytes[offset++] = header0;
  bytes[offset++] = header1;
  bytes[offset++] = count & 0xff;
  bytes[offset++] = (count >> 8) & 0xff;

  for (let index = 0; index < count; index += 1) {
    if (match.log[index] === 1) {
      bytes[offset + (index >> 3)] |= 1 << (index & 7);
    }
  }
  offset += pointBytes;

  bytes[offset++] = colorIndex(match.colors[0]) | (colorIndex(match.colors[1]) << 3);

  for (const encoded of encodedNames) {
    bytes[offset++] = encoded.length;
    bytes.set(encoded, offset);
    offset += encoded.length;
  }

  const elapsedSeconds = Math.min(
    0xffff,
    Math.max(0, Math.floor(elapsedFor(match.clock, now) / 1000)),
  );
  bytes[offset++] = elapsedSeconds & 0xff;
  bytes[offset++] = (elapsedSeconds >> 8) & 0xff;

  const sum = checksum(bytes.subarray(0, offset));
  bytes[offset++] = sum & 0xff;
  bytes[offset++] = (sum >> 8) & 0xff;

  return toBase64Url(bytes);
}

export function decodeMatch(seed: string): PadelMatch | null {
  const bytes = fromBase64Url(seed.trim());
  if (
    !bytes ||
    bytes.length < HEADER_BYTES + COLOR_BYTES + ELAPSED_BYTES + CHECKSUM_BYTES
  ) {
    return null;
  }

  const dataLength = bytes.length - CHECKSUM_BYTES;
  const expected = bytes[dataLength] | (bytes[dataLength + 1] << 8);
  if (checksum(bytes.subarray(0, dataLength)) !== expected) return null;

  const header0 = bytes[0];
  if (header0 >> 4 !== VERSION) return null;

  const mode: MatchMode = (header0 & 0x08) !== 0 ? 'tiebreak' : 'full';
  const bestIndex = (header0 >> 1) & 0x03;
  const bestOf: BestOf | null =
    bestIndex === 0 ? 1 : bestIndex === 1 ? 3 : bestIndex === 2 ? 5 : null;
  if (bestOf === null) return null;
  const goldenPoint = (header0 & 0x01) !== 0;

  const header1 = bytes[1];
  const firstServer: Team = (header1 & 0x01) !== 0 ? 1 : 0;
  const hasNames = (header1 & 0x02) !== 0;

  const count = bytes[2] | (bytes[3] << 8);
  if (count > MAX_POINTS) return null;

  const pointBytes = Math.ceil(count / 8);
  let offset = HEADER_BYTES;
  if (offset + pointBytes + COLOR_BYTES + ELAPSED_BYTES > dataLength) return null;

  const log: Team[] = [];
  for (let index = 0; index < count; index += 1) {
    const bit = bytes[offset + (index >> 3)] & (1 << (index & 7));
    log.push(bit !== 0 ? 1 : 0);
  }
  offset += pointBytes;

  const colorByte = bytes[offset++];
  const color0: AccentName = ACCENTS[colorByte & 0x07] ?? DEFAULT_COLORS[0];
  const color1: AccentName = ACCENTS[(colorByte >> 3) & 0x07] ?? DEFAULT_COLORS[1];

  const names: [string, string] = [DEFAULT_NAMES[0], DEFAULT_NAMES[1]];
  if (hasNames) {
    for (let index = 0; index < 2; index += 1) {
      if (offset >= dataLength) return null;
      const length = bytes[offset++];
      if (length > MAX_NAME_BYTES || offset + length > dataLength) return null;
      let text: string;
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(
          bytes.subarray(offset, offset + length),
        );
      } catch {
        return null;
      }
      names[index] = sanitizeName(text, DEFAULT_NAMES[index]);
      offset += length;
    }
  }

  if (offset + ELAPSED_BYTES !== dataLength) return null;
  const elapsedSeconds = bytes[offset] | (bytes[offset + 1] << 8);

  const rules: PadelRules = { mode, bestOf, goldenPoint };
  const score = replay(rules, firstServer, log);
  if (score.played !== log.length) return null;

  return {
    version: 1,
    rules,
    firstServer,
    log,
    names,
    colors: [color0, color1],
    clock: {
      startedAt: null,
      elapsedMs: elapsedSeconds * 1000,
      running: false,
    },
    wakeLock: false,
  };
}
