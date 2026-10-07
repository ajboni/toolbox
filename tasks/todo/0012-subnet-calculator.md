# 0012 — Subnet calculator

Status: todo
Created: 2026-10-07

## Goal

A new `/networking/` category with an IPv4 CIDR subnet calculator.

## Plan

- Category in `src/data/site.ts`, tools in `src/data/tools.ts`.
- Pure logic in `src/lib/subnet.ts` + `src/lib/subnet.test.ts`:
  - Parse `a.b.c.d/n` (and a netmask), validate octets.
  - Return network, broadcast, first/last usable host, host count, wildcard.
  - Use 32-bit unsigned math to avoid sign issues.
- Route: `/networking/subnet/` with `?cidr=`.
- Widget `SubnetWidget.astro` + `src/scripts/subnet.ts`.
- Add `src/pages/networking/index.astro` hub.

## Notes

- Follow-ups from `tasks/ideas/networking-tools.md`: range checker, CIDR
  summarizer, port reference.
- Pure client-side, no network calls.
