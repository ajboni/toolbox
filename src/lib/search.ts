import { ACCENTS, type AccentName } from '../data/site';

export interface SearchItem {
  path: string;
  title: string;
  description: string;
  category: string;
  categoryName: string;
  accent: AccentName;
}

export interface TextRange {
  start: number;
  end: number;
}

export interface RankedItem {
  item: SearchItem;
  score: number;
  titleRanges: TextRange[];
  descriptionRanges: TextRange[];
}

export interface SearchGroup {
  category: string;
  categoryName: string;
  accent: AccentName;
  score: number;
  items: RankedItem[];
}

export interface FoldedText {
  text: string;
  starts: number[];
  ends: number[];
}

const TITLE_WEIGHT = 10;
const CATEGORY_WEIGHT = 4;
const DESCRIPTION_WEIGHT = 2;

export function foldText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function fold(text: string): FoldedText {
  let folded = '';
  const starts: number[] = [];
  const ends: number[] = [];

  for (let index = 0; index < text.length; ) {
    const code = text.codePointAt(index) ?? text.charCodeAt(index);
    const char = String.fromCodePoint(code);
    const stripped = char.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const normalized = stripped.length > 0 ? stripped : char.toLowerCase();

    for (let offset = 0; offset < normalized.length; offset += 1) {
      folded += normalized[offset];
      starts.push(index);
      ends.push(index + char.length);
    }

    index += char.length;
  }

  return { text: folded, starts, ends };
}

export function tokenize(query: string): string[] {
  return foldText(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0);
}

function subsequenceScore(field: string, token: string): number {
  if (token.length < 4) return 0;

  let position = 0;
  let gaps = 0;
  for (const char of token) {
    const found = field.indexOf(char, position);
    if (found < 0) return 0;
    gaps += found - position;
    position = found + 1;
  }

  if (gaps > Math.ceil(token.length / 2)) return 0;

  return Math.max(0.5, 3 - gaps * 0.1);
}

function matchScore(field: string, token: string, fuzzy = false): number {
  if (!field || !token) return 0;
  if (field === token) return 12;

  if (field.startsWith(token)) {
    const after = field[token.length];
    return after === undefined || !/[\p{L}\p{N}]/u.test(after) ? 9 : 6;
  }

  const index = field.indexOf(token);
  if (index >= 0) {
    const before = field[index - 1];
    const atBoundary = before !== undefined && !/[\p{L}\p{N}]/u.test(before);
    return atBoundary ? 7 : 4;
  }

  return fuzzy ? subsequenceScore(field, token) : 0;
}

function mergeRanges(ranges: TextRange[]): TextRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: TextRange[] = [{ ...sorted[0] }];

  for (const range of sorted.slice(1)) {
    const last = merged[merged.length - 1];
    if (range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }

  return merged;
}

export function findMatchRanges(text: string, tokens: string[]): TextRange[] {
  const folded = fold(text);
  const ranges: TextRange[] = [];

  for (const token of tokens) {
    if (!token) continue;

    let from = 0;
    while (from <= folded.text.length - token.length) {
      const index = folded.text.indexOf(token, from);
      if (index < 0) break;

      const last = index + token.length - 1;
      ranges.push({ start: folded.starts[index], end: folded.ends[last] });
      from = index + token.length;
    }
  }

  return mergeRanges(ranges);
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

export function highlightSegments(text: string, ranges: TextRange[]): HighlightSegment[] {
  if (ranges.length === 0) return [{ text, match: false }];

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const range of mergeRanges(ranges)) {
    const start = Math.max(0, Math.min(range.start, text.length));
    const end = Math.max(start, Math.min(range.end, text.length));

    if (start > cursor) segments.push({ text: text.slice(cursor, start), match: false });
    if (end > start) segments.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false });

  return segments;
}

export function searchItems(items: SearchItem[], query: string, limit = Number.POSITIVE_INFINITY): RankedItem[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const combined = tokens.join(' ');
  const ranked: RankedItem[] = [];

  for (const item of items) {
    const title = fold(item.title);
    const category = fold(item.categoryName);
    const description = fold(item.description);

    let score = 0;
    let matchesAll = true;

    for (const token of tokens) {
      const tokenScore = Math.max(
        matchScore(title.text, token, true) * TITLE_WEIGHT,
        matchScore(category.text, token) * CATEGORY_WEIGHT,
        matchScore(description.text, token) * DESCRIPTION_WEIGHT,
      );

      if (tokenScore <= 0) {
        matchesAll = false;
        break;
      }

      score += tokenScore;
    }

    if (!matchesAll) continue;

    if (title.text === combined) score += 120;
    else if (title.text.startsWith(combined)) score += 60;
    else if (title.text.includes(combined)) score += 25;

    ranked.push({
      item,
      score,
      titleRanges: findMatchRanges(item.title, tokens),
      descriptionRanges: findMatchRanges(item.description, tokens),
    });
  }

  ranked.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

  return Number.isFinite(limit) ? ranked.slice(0, limit) : ranked;
}

function categoryRank(category: string, order: string[]): number {
  const index = order.indexOf(category);
  return index < 0 ? order.length : index;
}

export function groupResults(ranked: RankedItem[], categoryOrder: string[]): SearchGroup[] {
  const groups = new Map<string, SearchGroup>();

  for (const entry of ranked) {
    const existing = groups.get(entry.item.category);
    if (existing) {
      existing.items.push(entry);
      existing.score = Math.max(existing.score, entry.score);
      continue;
    }

    groups.set(entry.item.category, {
      category: entry.item.category,
      categoryName: entry.item.categoryName,
      accent: entry.item.accent,
      score: entry.score,
      items: [entry],
    });
  }

  return [...groups.values()].sort(
    (a, b) => b.score - a.score || categoryRank(a.category, categoryOrder) - categoryRank(b.category, categoryOrder),
  );
}

export function groupByCategory(items: SearchItem[], categoryOrder: string[]): SearchGroup[] {
  const groups = new Map<string, SearchGroup>();

  for (const item of items) {
    const existing = groups.get(item.category);
    const entry: RankedItem = {
      item,
      score: 0,
      titleRanges: [],
      descriptionRanges: [],
    };

    if (existing) {
      existing.items.push(entry);
      continue;
    }

    groups.set(item.category, {
      category: item.category,
      categoryName: item.categoryName,
      accent: item.accent,
      score: 0,
      items: [entry],
    });
  }

  return [...groups.values()]
    .sort((a, b) => categoryRank(a.category, categoryOrder) - categoryRank(b.category, categoryOrder))
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => a.item.title.localeCompare(b.item.title)),
    }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseSearchItems(value: unknown): SearchItem[] {
  if (!Array.isArray(value)) return [];

  const items: SearchItem[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) continue;

    const { path, title, description, category, categoryName, accent } = entry;
    if (
      typeof path !== 'string' ||
      !path.startsWith('/') ||
      typeof title !== 'string' ||
      typeof description !== 'string' ||
      typeof category !== 'string' ||
      typeof categoryName !== 'string' ||
      typeof accent !== 'string' ||
      !ACCENTS.includes(accent as AccentName)
    ) {
      continue;
    }

    items.push({
      path,
      title,
      description,
      category,
      categoryName,
      accent: accent as AccentName,
    });
  }

  return items;
}
