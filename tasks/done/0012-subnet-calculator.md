# 0012 — Subnet calculator

Status: done
Created: 2026-10-07

## Delivered

- New `networking` category ("Networking", `teal` accent) with hub at
  `/networking/`.
- `/networking/subnet/` parses an IPv4 CIDR block (or a dotted netmask) and
  reports network, broadcast, first/last usable host, netmask, wildcard, total
  addresses and usable hosts.
- Pure logic in `src/lib/subnet.ts` (+ `subnet.test.ts`): 32-bit unsigned math
  (`>>> 0`), octet and prefix validation, contiguous-netmask checking, and
  RFC 3021 handling for `/31` plus `/32` single-host blocks.
- `SubnetWidget.astro` + `scripts/subnet.ts`: CIDR input, live results grid,
  inline error messages and a copy-link button.
- Shareable state `?cidr=`; default `192.168.1.0/24`.
- Registered in `src/data/site.ts` and `src/data/tools.ts`; hub page plus
  JSON-LD (`webApplication` + `breadcrumbs`) and `RelatedTools`.

## Notes

- `/0` reports 4,294,967,296 total addresses and 4,294,967,294 usable hosts.
- `/31` is a point-to-point link (both addresses usable); `/32` is a single host.
- Invalid input falls back to a friendly message and never throws.

## Verification

- `pnpm test` (247 passed), `pnpm check` (0 errors), `pnpm build` (50 pages).

## Files

- `src/data/site.ts`, `src/data/tools.ts`
- `src/lib/subnet.ts`, `src/lib/subnet.test.ts`
- `src/components/SubnetWidget.astro`, `src/scripts/subnet.ts`
- `src/pages/networking/index.astro`, `src/pages/networking/subnet.astro`
