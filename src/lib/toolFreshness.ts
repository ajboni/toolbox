import type { Tool } from '../data/tools';

export const NEW_TOOL_COUNT = 5;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month &&
    date.getUTCDate() === day
  );
}

export function latestTools(tools: readonly Tool[], count = NEW_TOOL_COUNT): Tool[] {
  if (count <= 0) return [];

  return [...tools]
    .filter((tool) => isIsoDate(tool.added))
    .sort((a, b) => (a.added < b.added ? 1 : a.added > b.added ? -1 : 0))
    .slice(0, count);
}

export function newToolPaths(tools: readonly Tool[], count = NEW_TOOL_COUNT): Set<string> {
  return new Set(latestTools(tools, count).map((tool) => tool.path));
}

const SHORT_DATE = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatAdded(value: string): string {
  if (!isIsoDate(value)) return '–';
  return SHORT_DATE.format(new Date(`${value}T00:00:00Z`));
}
