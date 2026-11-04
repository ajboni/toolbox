# Ideas: Image optimizer

Status: idea
Created: 2026-11-04

An image converter and optimizer that runs entirely in the browser: drop one or
more files, pick a format and quality, compare weight before and after, and
download. Nothing is uploaded, which is the whole point for photos and
screenshots that are not meant to leave the machine.

## Placement

- No images category exists yet. Only the `amber` accent is still unused, so a
  new `images` category ("Images & Media") with `amber` fits without touching
  the others.
- Route: `/images/optimizer/` (alternative: `/images/compress/`).
- Follow-up: a separate SVG optimizer (SVGO) would belong to the same category.

## Options

- Output format: WebP by default, plus JPEG, PNG, AVIF and "keep input format".
  AVIF encoding is not available everywhere: feature-detect it with
  `canvas.toBlob('image/avif')` and hide the option when it fails. JPEG cannot
  carry transparency, so fall back to WebP (or composite on white) when the
  source has an alpha channel.
- Quality slider with a live size estimate.
- Maximum width and height: resizing is the biggest win and deserves to be
  prominent, not buried under an "advanced" toggle.
- Target weight mode: binary search the quality until the result fits a limit
  (for example 200 KB).
- Batch support with per-file before/after bytes and percentage saved, plus a
  download-all action.

## Pipeline

- `createImageBitmap(file, { imageOrientation: 'from-image' })` so EXIF rotation
  is applied before encoding instead of producing sideways output.
- Draw on `OffscreenCanvas` (with a regular `canvas` fallback) and re-encode with
  `convertToBlob` / `toBlob`.
- Missing pieces to be explicit about in the UI: re-encoding drops EXIF, GPS and
  the ICC profile (good for privacy and weight, but it does flatten colour), and
  canvas cannot do true lossless PNG optimization.
- Real lossless PNG and WebP would need WASM codecs (`@jsquash/oxipng`,
  `@jsquash/webp`). Start with canvas only and note WASM behind a lazy-loaded
  import as a follow-up, so the base page stays light.

## Implementation notes

- Pure logic in `src/lib/imageOptimizer.ts` with unit tests: option parsing,
  byte formatting, savings percentage, target-size quality search, format
  compatibility checks. Keep the DOM and canvas work in the page script.
- Shareable settings in the query string (`?format=webp&q=80&w=1600`); the files
  themselves never go anywhere near the URL.
- Compare preview with a before/after slider before downloading.
- Multi-download: prefer individual downloads; if a zip is really needed,
  `fflate` is the smallest sensible dependency.
- SEO: unique `title`, `description`, `canonicalPath` and JSON-LD like every
  other tool, and cross-link with `/text/base64/`, which already handles files.
