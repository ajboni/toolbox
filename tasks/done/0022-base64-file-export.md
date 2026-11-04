# 0022 — Base64 file export

Status: done
Created: 2026-11-04

## Goal

Decode Base64 payloads into real bytes and download them, so PDFs and other
binary files can be opened. Also encode a local file to Base64.

## Plan

- `src/lib/base64.ts`: `decodeBase64ToBytes`, `decodeUtf8`,
  `encodeBytesToBase64`, chunked binary conversion and `wrapBase64`.
- `src/lib/fileType.ts`: signature sniffing (PDF, PNG, JPEG, GIF, WebP, ZIP,
  GZIP, ICO, BMP, MP3, MP4, text fallback), `formatBytes` and `safeFilename`.
- `Base64Widget.astro` + `src/scripts/base64.ts`: file picker, wrap select,
  filename field and Download button; binary output shows a placeholder.
- `src/scripts/download.ts`: shared Blob download helper.
- URL state keeps only `dir` and `urlSafe`; legacy `?in=` links still load.
- Tests for the byte round-trip, detection and filenames.

## Notes

- 10 MB soft warning only; no hard limit because everything runs locally.
- Decoded text is shown only when the bytes are valid UTF-8.
- Wrap presets are None, 64 and 76 columns, disabled with URL-safe.
