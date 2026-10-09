# 0016 · Password & Passphrase Generator

Status: done
Created: 2026-10-09

## Goal

Add a `security` tool to generate strong random passwords or Diceware-style
passphrases, entirely in the browser.

## Plan

- New `security` category in `src/data/site.ts` (accent `rose`).
- Route: `/security/password/` plus `/security/index.astro`.
- Wordlist: `src/data/bip39.ts` (BIP-39, 2048 common words) bundled offline.
- Passphrase defaults to 8 words; the optional digit is fused onto a random word.
- Pure logic in `src/lib/password.ts` + `src/lib/password.test.ts`:
  - `generatePassword`, `generatePassphrase`, bulk variants.
  - Rejection sampling over `crypto.getRandomValues`, RNG injectable for tests.
  - `passwordEntropyBits`, `passphraseEntropyBits`, `strength`.
- Widget `PasswordWidget.astro` + `src/scripts/password.ts`.
- Shareable state: `?mode=&len=&lower=&upper=&num=&sym=&amb=&n=&words=&sep=&cap=&appnum=`.
- Register in `src/data/tools.ts`.

## Notes

- No dependencies; everything runs client-side.
- Canonical URL never includes the query string.
