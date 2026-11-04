import { accentClasses } from '../data/site';
import { parseSearchItems, type SearchItem } from '../lib/search';
import { loadRecents } from './recentTools';

const MAX_HOME_RECENTS = 3;

const root = document.querySelector<HTMLElement>('[data-recent-tools]');
const label = document.querySelector<HTMLElement>('[data-recent-label]');
const list = document.querySelector<HTMLUListElement>('[data-recent-list]');

function chip(item: SearchItem): HTMLLIElement {
  const entry = document.createElement('li');
  const link = document.createElement('a');

  link.href = item.path;
  link.className =
    'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100';

  const dot = document.createElement('span');
  dot.className = `h-1.5 w-1.5 rounded-full ${accentClasses(item.accent).bg}`;
  dot.setAttribute('aria-hidden', 'true');

  link.append(dot, document.createTextNode(item.title));
  entry.append(link);

  return entry;
}

function render(items: SearchItem[]): void {
  if (!label || !list || items.length === 0) return;

  items.forEach((item) => list.append(chip(item)));
  label.hidden = false;
}

const paths = loadRecents().slice(0, MAX_HOME_RECENTS);

if (root && list && paths.length > 0) {
  fetch('/search.json')
    .then((response) => {
      if (!response.ok) throw new Error(`Search index returned ${response.status}`);
      return response.json();
    })
    .then((payload: unknown) => {
      const byPath = new Map(parseSearchItems(payload).map((item) => [item.path, item]));
      const items = paths
        .map((path) => byPath.get(path))
        .filter((item): item is SearchItem => item !== undefined);
      render(items);
    })
    .catch(() => {
      return;
    });
}
