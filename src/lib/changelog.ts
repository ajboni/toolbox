import type { Tool } from '../data/tools';
import { isIsoDate } from './toolFreshness';

export interface ChangelogEntry {
  date: string;
  tools?: string[];
  notes?: string[];
}

export interface ResolvedChangelogEntry {
  date: string;
  tools: Tool[];
  notes: string[];
}

interface PendingEntry {
  notes: string[];
  seenNotes: Set<string>;
  tools: Tool[];
  seenTools: Set<string>;
}

export function resolveChangelog(
  entries: readonly ChangelogEntry[],
  tools: readonly Tool[],
): ResolvedChangelogEntry[] {
  const toolsByPath = new Map(tools.map((tool) => [tool.path, tool]));
  const byDate = new Map<string, PendingEntry>();

  for (const entry of entries) {
    if (!isIsoDate(entry.date)) continue;

    const pending = byDate.get(entry.date) ?? {
      notes: [],
      seenNotes: new Set<string>(),
      tools: [],
      seenTools: new Set<string>(),
    };

    for (const rawNote of entry.notes ?? []) {
      const note = rawNote.trim();
      if (!note || pending.seenNotes.has(note)) continue;
      pending.seenNotes.add(note);
      pending.notes.push(note);
    }

    for (const path of entry.tools ?? []) {
      if (pending.seenTools.has(path)) continue;
      const tool = toolsByPath.get(path);
      if (!tool) continue;
      pending.seenTools.add(path);
      pending.tools.push(tool);
    }

    if (pending.notes.length > 0 || pending.tools.length > 0) byDate.set(entry.date, pending);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, pending]) => ({
      date,
      notes: pending.notes,
      tools: pending.tools,
    }));
}

const LONG_DATE = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatChangelogDate(value: string): string {
  if (!isIsoDate(value)) return value;
  return LONG_DATE.format(new Date(`${value}T00:00:00Z`));
}
