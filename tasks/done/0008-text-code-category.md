# 0008 — Text & Code category

Status: done
Created: 2026-10-01

## Delivered

- New `text` category ("Text & Code", `sky` accent) with hub at `/text/`.
- Seven tools, each sharing state via the query string:
  - `/text/case-converter/` — camel/Pascal/snake/kebab/CONSTANT/Title/Sentence/
    lower/upper in one view (`?in=`).
  - `/text/base64/` — encode/decode with an optional URL-safe variant
    (`?in=&dir=&urlSafe=`).
  - `/text/url-encode/` — `encodeURIComponent`/decode (`?in=&dir=`).
  - `/text/counter/` — characters, words, sentences, lines, paragraphs and a
    reading-time estimate (`?in=`).
  - `/text/uuid/` — random v4 UUIDs, one to many, optional uppercase (`?n=&upper=`).
  - `/text/hash/` — SHA-1/256/384/512 digests via Web Crypto (`?in=&alg=`).
  - `/text/lorem-ipsum/` — seeded placeholder paragraphs/sentences/words
    (`?units=&count=&seed=&lorem=`).
- Pure logic with tests: `caseConvert.ts`, `base64.ts`, `urlEncode.ts`,
  `textStats.ts`, `id.ts`, `hash.ts`, `lorem.ts`.
- Shared script helper `src/scripts/ui.ts` (`wireShare`, `wireCopy`) to avoid
  repeating clipboard logic across the text tools.
- Registered in `src/data/tools.ts`; `RelatedTools` cross-links the category.

## Notes

- One page per tool variant, per the chosen convention; encode/decode direction
  stays a control inside its own page rather than a separate URL.
- Lorem output is deterministic for a given seed, which keeps links shareable.
- Hash uses `crypto.subtle`; the component hashes at build time for the initial
  server-rendered digest.

## Verification

- `pnpm test` (138 passed), `pnpm check` (0 errors), `pnpm build` (39 pages).

## Files

- `src/data/site.ts`, `src/data/tools.ts`
- `src/lib/{caseConvert,base64,urlEncode,textStats,id,hash,lorem}.ts` (+ tests)
- `src/components/{CaseConverter,Base64,UrlEncode,Counter,Uuid,Hash,Lorem}Widget.astro`
- `src/scripts/{ui,case-converter,base64,url-encode,counter,uuid,hash,lorem}.ts`
- `src/pages/text/{index,case-converter,base64,url-encode,counter,uuid,hash,lorem-ipsum}.astro`
