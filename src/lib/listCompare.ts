export type SeparatorMode = 'lines' | 'commas' | 'wide';

export interface CompareOptions {
  trim?: boolean;
  ignoreCase?: boolean;
  separators?: SeparatorMode;
  sort?: boolean;
}

export type Group = 'onlyA' | 'both' | 'onlyB';

export interface ListEntry {
  value: string;
  inA: number;
  inB: number;
}

export interface ListComparison {
  onlyA: ListEntry[];
  both: ListEntry[];
  onlyB: ListEntry[];
  totalA: number;
  totalB: number;
  uniqueA: number;
  uniqueB: number;
  duplicatesA: number;
  duplicatesB: number;
}

interface Collected {
  entries: Map<string, { value: string; count: number }>;
  total: number;
}

const SEPARATORS: Record<SeparatorMode, RegExp> = {
  lines: /\r?\n/,
  commas: /\r?\n|,/,
  wide: /\r?\n|[,;\t]/,
};

const COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function keyFor(value: string, ignoreCase: boolean): string {
  return ignoreCase ? value.toLowerCase() : value;
}

function collect(text: string, options: Required<CompareOptions>): Collected {
  const entries = new Map<string, { value: string; count: number }>();
  let total = 0;

  for (const raw of text.split(SEPARATORS[options.separators])) {
    const value = options.trim ? raw.trim() : raw;
    if (!value) continue;
    total += 1;
    const key = keyFor(value, options.ignoreCase);
    const existing = entries.get(key);
    if (existing) existing.count += 1;
    else entries.set(key, { value, count: 1 });
  }

  return { entries, total };
}

function sortEntries(entries: ListEntry[]): ListEntry[] {
  return [...entries].sort((a, b) => COLLATOR.compare(a.value, b.value));
}

export function compareLists(
  aText: string,
  bText: string,
  options: CompareOptions = {},
): ListComparison {
  const resolved: Required<CompareOptions> = {
    trim: true,
    ignoreCase: false,
    separators: 'lines',
    sort: false,
    ...options,
  };

  const a = collect(aText, resolved);
  const b = collect(bText, resolved);

  const onlyA: ListEntry[] = [];
  const both: ListEntry[] = [];

  for (const [key, entry] of a.entries) {
    const other = b.entries.get(key);
    if (other) both.push({ value: entry.value, inA: entry.count, inB: other.count });
    else onlyA.push({ value: entry.value, inA: entry.count, inB: 0 });
  }

  const onlyB: ListEntry[] = [];
  for (const [key, entry] of b.entries) {
    if (!a.entries.has(key)) onlyB.push({ value: entry.value, inA: 0, inB: entry.count });
  }

  return {
    onlyA: resolved.sort ? sortEntries(onlyA) : onlyA,
    both: resolved.sort ? sortEntries(both) : both,
    onlyB: resolved.sort ? sortEntries(onlyB) : onlyB,
    totalA: a.total,
    totalB: b.total,
    uniqueA: a.entries.size,
    uniqueB: b.entries.size,
    duplicatesA: a.total - a.entries.size,
    duplicatesB: b.total - b.entries.size,
  };
}

export function formatEntry(entry: ListEntry, group: Group, showCounts: boolean): string {
  if (!showCounts) return entry.value;
  if (group === 'both') {
    if (entry.inA === 1 && entry.inB === 1) return entry.value;
    return `${entry.value}  (A: ${entry.inA}, B: ${entry.inB})`;
  }
  const count = group === 'onlyA' ? entry.inA : entry.inB;
  return count > 1 ? `${entry.value}  ×${count}` : entry.value;
}

export function formatGroup(entries: ListEntry[], group: Group, showCounts: boolean): string {
  return entries.map((entry) => formatEntry(entry, group, showCounts)).join('\n');
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function describeComparison(comparison: ListComparison): string {
  const a = comparison.duplicatesA
    ? `${plural(comparison.totalA, 'item', 'items')} (${plural(comparison.duplicatesA, 'duplicate', 'duplicates')})`
    : plural(comparison.totalA, 'item', 'items');
  const b = comparison.duplicatesB
    ? `${plural(comparison.totalB, 'item', 'items')} (${plural(comparison.duplicatesB, 'duplicate', 'duplicates')})`
    : plural(comparison.totalB, 'item', 'items');
  return `A: ${a} · B: ${b} · ${comparison.both.length} shared`;
}

export function comparisonText(comparison: ListComparison, showCounts: boolean): string {
  const groups: Array<[Group, string, ListEntry[]]> = [
    ['onlyA', 'Only in A', comparison.onlyA],
    ['both', 'In both', comparison.both],
    ['onlyB', 'Only in B', comparison.onlyB],
  ];

  const lines: string[] = [];
  for (const [group, title, entries] of groups) {
    lines.push(`# ${title} (${entries.length})`);
    for (const entry of entries) lines.push(formatEntry(entry, group, showCounts));
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}
