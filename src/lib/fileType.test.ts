import { describe, expect, it } from 'vitest';
import { formatBytes, safeFilename, sniffFileType } from './fileType';

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function ascii(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

describe('sniffFileType', () => {
  it('detects a PDF', () => {
    expect(sniffFileType(bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31))).toMatchObject({
      mime: 'application/pdf',
      extension: 'pdf',
      kind: 'binary',
    });
  });

  it('detects a PNG', () => {
    expect(sniffFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toMatchObject({
      extension: 'png',
      kind: 'binary',
    });
  });

  it('detects a JPEG', () => {
    expect(sniffFileType(bytes(0xff, 0xd8, 0xff, 0xe0))).toMatchObject({ extension: 'jpg' });
  });

  it('detects a ZIP archive', () => {
    expect(sniffFileType(bytes(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00))).toMatchObject({
      extension: 'zip',
    });
  });

  it('detects a WebP image', () => {
    const webp = bytes(...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP'), 0);
    expect(sniffFileType(webp)).toMatchObject({ extension: 'webp', label: 'WebP image' });
  });

  it('detects an MP4 video', () => {
    const mp4 = bytes(0, 0, 0, 0x18, ...ascii('ftyp'), ...ascii('isom'));
    expect(sniffFileType(mp4)).toMatchObject({ extension: 'mp4' });
  });

  it('detects UTF-8 text', () => {
    expect(sniffFileType(bytes(...ascii('hola, año')))).toMatchObject({
      kind: 'text',
      extension: 'txt',
    });
  });

  it('treats empty data as text', () => {
    expect(sniffFileType(new Uint8Array())).toMatchObject({ kind: 'text' });
  });

  it('falls back to binary for unknown data', () => {
    expect(sniffFileType(bytes(0x00, 0x01, 0x02, 0x03))).toMatchObject({
      kind: 'binary',
      mime: 'application/octet-stream',
      extension: 'bin',
    });
  });
});

describe('formatBytes', () => {
  it('formats small sizes in bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(999)).toBe('999 B');
  });

  it('formats larger sizes with one decimal', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1234567)).toBe('1.2 MB');
  });

  it('rounds values above ten units', () => {
    expect(formatBytes(10 * 1024 * 1024)).toBe('10 MB');
    expect(formatBytes(11010048)).toBe('11 MB');
  });
});

describe('safeFilename', () => {
  it('adds the detected extension when the name has none', () => {
    expect(safeFilename('report 2026', 'pdf')).toBe('report 2026.pdf');
  });

  it('respects an extension the user typed', () => {
    expect(safeFilename('invoice.PDF', 'pdf')).toBe('invoice.PDF');
  });

  it('strips path separators and leading dots', () => {
    expect(safeFilename('../secret', 'pdf')).toBe('secret.pdf');
    expect(safeFilename('a/b\\c', 'txt')).toBe('abc.txt');
  });

  it('strips trailing dots and spaces', () => {
    expect(safeFilename('name. ', 'png')).toBe('name.png');
  });

  it('falls back to a default name', () => {
    expect(safeFilename('   ', 'zip')).toBe('download.zip');
    expect(safeFilename('..', 'bin')).toBe('download.bin');
  });
});
