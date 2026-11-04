import { CATEGORIES } from '../data/site';
import {
  groupResults,
  parseSearchItems,
  searchItems,
  type SearchItem,
} from '../lib/search';
import { loadRecents, rememberTool } from './recentTools';
import { renderGroups, renderMessage, renderRecents } from './searchResults';

const dialog = document.querySelector<HTMLDialogElement>('[data-search-dialog]');
const input = dialog?.querySelector<HTMLInputElement>('[data-search-input]');
const results = dialog?.querySelector<HTMLElement>('[data-search-results]');
const status = dialog?.querySelector<HTMLElement>('[data-search-status]');
const allLink = dialog?.querySelector<HTMLAnchorElement>('[data-search-all]');

const categoryOrder = CATEGORIES.map((category) => category.slug);

let items: SearchItem[] = [];
let indexState: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
let indexPromise: Promise<SearchItem[]> | null = null;
let options: HTMLAnchorElement[] = [];
let activeIndex = -1;
let previousOverflow = '';
let frame = 0;

function ensureIndex(): Promise<SearchItem[]> {
  if (indexPromise) return indexPromise;

  indexState = 'loading';
  indexPromise = fetch('/search.json')
    .then((response) => {
      if (!response.ok) throw new Error(`Search index returned ${response.status}`);
      return response.json();
    })
    .then((payload: unknown) => {
      items = parseSearchItems(payload);
      indexState = 'ready';
      return items;
    })
    .catch((error: unknown) => {
      indexState = 'error';
      indexPromise = null;
      throw error;
    });

  return indexPromise;
}

function setActive(index: number, scroll = true): void {
  if (!input) return;

  options.forEach((option, optionIndex) => {
    const selected = optionIndex === index;
    option.setAttribute('aria-selected', String(selected));
    option.classList.toggle('bg-zinc-100', selected);
    option.classList.toggle('dark:bg-zinc-900', selected);
  });

  activeIndex = index;

  if (index >= 0 && options[index]) {
    input.setAttribute('aria-activedescendant', options[index].id);
    if (scroll) options[index].scrollIntoView({ block: 'nearest' });
  } else {
    input.removeAttribute('aria-activedescendant');
  }
}

function render(query: string): void {
  if (!results || !status || !allLink) return;

  const trimmed = query.trim();
  allLink.href = trimmed ? `/search/?q=${encodeURIComponent(trimmed)}` : '/search/';

  if (indexState === 'loading' || indexState === 'idle') {
    renderMessage(results, 'Loading tools…', 'The search index is on its way.');
    status.textContent = '';
    options = [];
    setActive(-1, false);
    return;
  }

  if (indexState === 'error') {
    renderMessage(results, 'Search is unavailable', 'Open the full search page instead.');
    status.textContent = '';
    options = [];
    setActive(-1, false);
    return;
  }

  if (!trimmed) {
    const recents = loadRecents()
      .map((path) => items.find((item) => item.path === path))
      .filter((item): item is SearchItem => item !== undefined);

    if (recents.length > 0) {
      options = renderRecents(results, recents, 'palette');
      options.forEach((option, index) => {
        option.id = `search-option-${index}`;
      });
      status.textContent = `${items.length} tools indexed`;
      setActive(0, false);
    } else {
      renderMessage(
        results,
        'Search the toolbox',
        'Type a tool name, category or keyword. Press Enter to browse everything.',
      );
      status.textContent = `${items.length} tools indexed`;
      options = [];
      setActive(-1, false);
    }
    return;
  }

  const groups = groupResults(searchItems(items, trimmed), categoryOrder);
  const total = groups.reduce((count, group) => count + group.items.length, 0);

  if (total === 0) {
    renderMessage(
      results,
      'No tools found',
      'Try a shorter word, or press Enter to see the full directory.',
    );
    status.textContent = 'No results';
    options = [];
    setActive(-1, false);
    return;
  }

  options = renderGroups(results, groups, 'palette');
  options.forEach((option, index) => {
    option.id = `search-option-${index}`;
  });
  status.textContent = `${total} result${total === 1 ? '' : 's'}`;
  setActive(0, false);
}

function open(): void {
  if (!dialog || !input) return;

  if (dialog.open) {
    input.focus();
    input.select();
    return;
  }

  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  input.value = '';
  options = [];
  activeIndex = -1;

  dialog.showModal();
  input.focus();
  render('');

  ensureIndex()
    .then(() => {
      if (dialog.open) render(input.value);
    })
    .catch(() => {
      if (dialog.open) render(input.value);
    });
}

function close(): void {
  dialog?.close();
}

document.addEventListener('keydown', (event) => {
  const isShortcut =
    (event.ctrlKey || event.metaKey) &&
    (event.code === 'KeyK' || event.key.toLowerCase() === 'k');
  if (!isShortcut) return;

  event.preventDefault();
  if (dialog?.open) close();
  else open();
});

document.addEventListener('click', (event) => {
  const trigger = (event.target as HTMLElement).closest('[data-search-open]');
  if (!trigger) return;

  event.preventDefault();
  open();
});

input?.addEventListener('input', () => {
  if (frame) cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => render(input.value));
});

input?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (options.length === 0) return;

    event.preventDefault();
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    const next =
      activeIndex < 0
        ? delta === 1
          ? 0
          : options.length - 1
        : (activeIndex + delta + options.length) % options.length;

    setActive(next);
    return;
  }

  if (event.key === 'Home' || event.key === 'End') {
    if (options.length === 0) return;

    event.preventDefault();
    setActive(event.key === 'Home' ? 0 : options.length - 1);
    return;
  }

  if (event.key !== 'Enter') return;

  event.preventDefault();
  const active = options[activeIndex];

  if (active) {
    rememberTool(active.dataset.path ?? active.pathname);
    window.location.href = active.href;
    return;
  }

  const query = input?.value.trim() ?? '';
  window.location.href = query ? `/search/?q=${encodeURIComponent(query)}` : '/search/';
});

results?.addEventListener('click', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-search-result]');
  if (link) rememberTool(link.dataset.path ?? link.pathname);
});

results?.addEventListener('mouseover', (event) => {
  const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-search-result]');
  if (!link) return;

  const index = options.indexOf(link);
  if (index >= 0 && index !== activeIndex) setActive(index, false);
});

dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) close();
});

dialog?.addEventListener('close', () => {
  document.body.style.overflow = previousOverflow;
  options = [];
  activeIndex = -1;
});

const isMac = /mac|iphone|ipad/i.test(navigator.userAgent);
document.querySelectorAll<HTMLElement>('[data-search-kbd]').forEach((element) => {
  element.textContent = isMac ? '⌘K' : 'Ctrl K';
});
