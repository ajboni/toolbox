import { CATEGORIES, SITE } from '../data/site';
import {
  groupByCategory,
  groupResults,
  parseSearchItems,
  searchItems,
  type SearchGroup,
  type SearchItem,
} from '../lib/search';
import { searchPillClasses } from '../lib/searchPills';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { rememberTool } from './recentTools';
import { renderGroups, renderMessage } from './searchResults';

const form = document.querySelector<HTMLFormElement>('[data-search-form]');
const input = document.querySelector<HTMLInputElement>('[data-search-input]');
const results = document.querySelector<HTMLElement>('[data-search-results]');
const filters = document.querySelector<HTMLElement>('[data-search-filters]');
const count = document.querySelector<HTMLElement>('[data-search-count]');

const schema = { q: 'string', cat: 'string' } as const;
const defaults = { q: '', cat: 'all' };
const categoryOrder = CATEGORIES.map((category) => category.slug);
const categories = new Map(CATEGORIES.map((category) => [category.slug, category]));

let items: SearchItem[] = [];
let indexState: 'loading' | 'ready' | 'error' = 'loading';
let query = '';
let category = 'all';
let frame = 0;

function validCategory(value: unknown): string {
  return typeof value === 'string' && categories.has(value) ? value : 'all';
}

function readState(): void {
  const state = readUrlState(schema);
  query = typeof state.q === 'string' ? state.q : '';
  category = validCategory(state.cat);
}

function setPills(): void {
  if (!filters) return;

  filters.querySelectorAll<HTMLAnchorElement>('[data-search-filter]').forEach((link) => {
    const slug = link.dataset.searchFilter ?? 'all';
    const active = slug === category;
    const accent = categories.get(slug)?.accent ?? null;

    link.className = searchPillClasses(accent, active);

    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function render(): void {
  if (!results) return;

  const trimmed = query.trim();
  document.title = trimmed
    ? `${trimmed} · Search · ${SITE.name}`
    : `Search tools · ${SITE.name}`;

  if (indexState === 'loading') {
    if (count) count.textContent = 'Loading tools…';
    return;
  }

  if (indexState === 'error') {
    renderMessage(
      results,
      'Search is unavailable',
      'Reload the page, or browse every tool from the home page.',
    );
    if (count) count.textContent = '';
    return;
  }

  let groups: SearchGroup[];

  if (trimmed) {
    groups = groupResults(searchItems(items, trimmed), categoryOrder);
    if (category !== 'all') groups = groups.filter((group) => group.category === category);
  } else {
    const pool =
      category === 'all' ? items : items.filter((item) => item.category === category);
    groups = groupByCategory(pool, categoryOrder);
  }

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  if (total === 0) {
    renderMessage(
      results,
      'No tools found',
      category === 'all'
        ? 'Try another word, or press the All filter to browse everything.'
        : 'Try another word, or switch back to All.',
    );
  } else {
    renderGroups(results, groups, 'page');
  }

  if (count) {
    if (total === 0) count.textContent = 'No tools found';
    else count.textContent = `${total} tool${total === 1 ? '' : 's'}`;
  }
}

function schedule(): void {
  if (frame) cancelAnimationFrame(frame);
  frame = requestAnimationFrame(render);
}

function update(nextQuery: string, nextCategory: string): void {
  query = nextQuery;
  category = validCategory(nextCategory);

  writeUrlState(schema, { q: query, cat: category }, { defaults });
  setPills();
  schedule();
}

input?.addEventListener('input', () => {
  update(input.value, category);
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (input) update(input.value, category);
});

filters?.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('[data-search-filter]');
  if (!link) return;

  event.preventDefault();
  update(query, link.dataset.searchFilter ?? 'all');
});

results?.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-search-result]');
  if (link) rememberTool(link.dataset.path ?? link.pathname);
});

window.addEventListener('popstate', () => {
  readState();
  if (input) input.value = query;
  setPills();
  render();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;

  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable)
  ) {
    return;
  }

  event.preventDefault();
  input?.focus();
  input?.select();
});

readState();
if (input) input.value = query;
setPills();
render();

fetch('/search.json')
  .then((response) => {
    if (!response.ok) throw new Error(`Search index returned ${response.status}`);
    return response.json();
  })
  .then((payload: unknown) => {
    items = parseSearchItems(payload);
    indexState = 'ready';
    render();
  })
  .catch(() => {
    indexState = 'error';
    render();
  });
