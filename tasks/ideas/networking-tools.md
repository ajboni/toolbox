# Ideas — Networking tools

Status: idea
Created: 2026-09-28

A `/networking/` category for quick, client-side network utilities:

- **Subnet calculator** — CIDR to network/broadcast/host range.
- **IPv4 range checker** — is an IP inside a CIDR?
- **CIDR merger / summarizer** — collapse a list of prefixes.
- **MAC address lookup** — OUI vendor lookup (offline dataset).
- **Port reference** — searchable table of common TCP/UDP ports.
- **URL / query string parser** — split a URL into its parts.

Notes:

- Prefer pure `src/lib/*.ts` implementations with unit tests.
- Make inputs shareable via query strings (`/networking/subnet/?cidr=...`).
- Pure client-side, no network calls unless a static dataset is bundled.
