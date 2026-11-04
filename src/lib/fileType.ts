import { decodeUtf8 } from './base64';

export type FileKind = 'text' | 'binary';

export interface FileType {
  kind: FileKind;
  mime: string;
  extension: string;
  label: string;
}

interface Signature {
  bytes: number[];
  offset?: number;
  extra?: number;
  mime: string;
  extension: string;
  label: string;
}

const SIGNATURES: Signature[] = [
  { bytes: [0x25, 0x50, 0x44, 0x46], mime: 'application/pdf', extension: 'pdf', label: 'PDF' },
  {
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    mime: 'image/png',
    extension: 'png',
    label: 'PNG image',
  },
  {
    bytes: [0xff, 0xd8, 0xff],
    mime: 'image/jpeg',
    extension: 'jpg',
    label: 'JPEG image',
  },
  {
    bytes: [0x47, 0x49, 0x46, 0x38],
    mime: 'image/gif',
    extension: 'gif',
    label: 'GIF image',
  },
  {
    bytes: [0x52, 0x49, 0x46, 0x46],
    mime: 'image/webp',
    extension: 'webp',
    label: 'WebP image',
    extra: 8,
  },
  {
    bytes: [0x50, 0x4b, 0x03, 0x04],
    mime: 'application/zip',
    extension: 'zip',
    label: 'ZIP archive',
  },
  {
    bytes: [0x1f, 0x8b],
    mime: 'application/gzip',
    extension: 'gz',
    label: 'GZIP archive',
  },
  {
    bytes: [0x00, 0x00, 0x01, 0x00],
    mime: 'image/x-icon',
    extension: 'ico',
    label: 'ICO icon',
  },
  {
    bytes: [0x42, 0x4d],
    mime: 'image/bmp',
    extension: 'bmp',
    label: 'BMP image',
  },
  {
    bytes: [0x49, 0x44, 0x33],
    mime: 'audio/mpeg',
    extension: 'mp3',
    label: 'MP3 audio',
  },
  {
    bytes: [0x66, 0x74, 0x79, 0x70],
    offset: 4,
    mime: 'video/mp4',
    extension: 'mp4',
    label: 'MP4 video',
  },
];

const BINARY_TYPE: FileType = {
  kind: 'binary',
  mime: 'application/octet-stream',
  extension: 'bin',
  label: 'Binary data',
};

const TEXT_TYPE: FileType = {
  kind: 'text',
  mime: 'text/plain;charset=utf-8',
  extension: 'txt',
  label: 'Text',
};

const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function matches(bytes: Uint8Array, signature: Signature): boolean {
  const offset = signature.offset ?? 0;
  if (bytes.length < offset + signature.bytes.length) return false;
  for (let index = 0; index < signature.bytes.length; index += 1) {
    if (bytes[offset + index] !== signature.bytes[index]) return false;
  }
  if (signature.extra != null) {
    const tag = decodeUtf8(bytes.subarray(signature.extra, signature.extra + 4));
    if (tag !== 'WEBP') return false;
  }
  return true;
}

export function sniffFileType(bytes: Uint8Array): FileType {
  for (const signature of SIGNATURES) {
    if (matches(bytes, signature)) {
      return {
        kind: 'binary',
        mime: signature.mime,
        extension: signature.extension,
        label: signature.label,
      };
    }
  }

  const text = decodeUtf8(bytes);
  if (text != null && !CONTROL_CHARS.test(text)) return TEXT_TYPE;

  return BINARY_TYPE;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '–';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = value >= 10 ? Math.round(value).toString() : value.toFixed(1).replace(/\.0$/, '');
  return `${rounded} ${units[unit]}`;
}

export function safeFilename(name: string, fallbackExtension: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .replace(/[. ]+$/, '');
  const base = cleaned || 'download';
  const extension = fallbackExtension.replace(/^\./, '').replace(/[^a-z0-9]/gi, '');
  if (!extension) return base;
  const hasExtension = /\.[a-z0-9]{1,8}$/i.test(base);
  return hasExtension ? base : `${base}.${extension}`;
}
