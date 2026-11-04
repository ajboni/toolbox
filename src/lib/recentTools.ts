export const RECENT_TOOLS_KEY = 'bajtools:recent-tools';
export const MAX_RECENTS = 5;

export function sanitizeRecents(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const recents: string[] = [];

  for (const entry of value) {
    if (typeof entry !== 'string' || !entry.startsWith('/')) continue;
    if (seen.has(entry)) continue;

    seen.add(entry);
    recents.push(entry);

    if (recents.length >= MAX_RECENTS) break;
  }

  return recents;
}

export function pushRecent(recents: string[], path: string): string[] {
  if (!path.startsWith('/')) return sanitizeRecents(recents);
  return sanitizeRecents([path, ...recents]);
}
