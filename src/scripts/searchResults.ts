import { accentClasses } from '../data/site';
import {
  highlightSegments,
  type RankedItem,
  type SearchGroup,
  type SearchItem,
  type TextRange,
} from '../lib/search';

export type ResultsVariant = 'palette' | 'page';

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function appendHighlighted(parent: HTMLElement, text: string, ranges: TextRange[]): void {
  for (const segment of highlightSegments(text, ranges)) {
    if (!segment.match) {
      parent.append(document.createTextNode(segment.text));
      continue;
    }

    parent.append(
      element(
        'mark',
        'rounded-sm bg-zinc-900/10 px-0.5 text-inherit dark:bg-zinc-100/20',
        segment.text,
      ),
    );
  }
}

function option(entry: RankedItem, variant: ResultsVariant): HTMLAnchorElement {
  const { item } = entry;
  const link = element(
    'a',
    variant === 'palette'
      ? 'group flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-zinc-100 focus-visible:bg-zinc-100 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900'
      : 'group flex items-start gap-3 rounded-xl border border-zinc-200 px-5 py-4 transition hover:shadow-sm dark:border-zinc-800',
  );

  link.href = item.path;
  link.dataset.searchResult = '';
  link.dataset.path = item.path;

  const body = element('span', 'min-w-0 flex-1');

  const title = element(
    'span',
    variant === 'palette' ? 'block text-sm font-medium' : 'block text-base font-semibold',
  );
  appendHighlighted(title, item.title, entry.titleRanges);

  const description = element(
    'span',
    variant === 'palette'
      ? 'mt-0.5 line-clamp-2 block text-xs text-zinc-500 dark:text-zinc-400'
      : 'mt-1 block text-sm text-zinc-600 dark:text-zinc-400',
  );
  appendHighlighted(description, item.description, entry.descriptionRanges);

  body.append(title, description);
  link.append(body);

  if (variant === 'palette') {
    link.setAttribute('role', 'option');
    link.setAttribute('aria-selected', 'false');
  }

  return link;
}

interface GroupOptions {
  label: string;
  accent: SearchGroup['accent'] | null;
  items: RankedItem[];
  variant: ResultsVariant;
}

function appendGroup(container: HTMLElement, { label, accent, items, variant }: GroupOptions): HTMLAnchorElement[] {
  const section = element('section', variant === 'palette' ? '' : 'mt-8 first:mt-0');

  section.setAttribute('role', 'group');
  section.setAttribute('aria-label', label);

  const header = element(
    'div',
    variant === 'palette'
      ? 'flex items-center justify-between gap-2 px-1 pb-1.5 pt-3'
      : 'flex items-center justify-between gap-2',
  );

  const pill = element(
    'h2',
    variant === 'palette'
      ? 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold'
      : 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
  );

  if (variant === 'palette') pill.setAttribute('role', 'presentation');

  if (accent) {
    const colors = accentClasses(accent);
    pill.classList.add(...colors.bgSoft.split(' '), ...colors.text.split(' '));
    pill.append(element('span', `h-1.5 w-1.5 rounded-full ${colors.bg}`, ''));
  } else {
    pill.classList.add(
      'bg-zinc-100',
      'text-zinc-600',
      'dark:bg-zinc-900',
      'dark:text-zinc-300',
    );
    pill.append(element('span', 'h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500', ''));
  }

  pill.append(document.createTextNode(label));

  const count = element(
    'span',
    variant === 'palette'
      ? 'text-[10px] font-medium text-zinc-400 dark:text-zinc-500'
      : 'text-xs text-zinc-400 dark:text-zinc-500',
    String(items.length),
  );

  header.append(pill, count);

  const list = element(
    'div',
    variant === 'palette' ? 'mt-1 space-y-0.5' : 'mt-3 grid gap-3 sm:grid-cols-2',
  );

  const options = items.map((entry) => option(entry, variant));
  list.append(...options);

  section.append(header, list);
  container.append(section);

  return options;
}

export function renderGroups(
  container: HTMLElement,
  groups: SearchGroup[],
  variant: ResultsVariant,
): HTMLAnchorElement[] {
  container.replaceChildren();
  const options: HTMLAnchorElement[] = [];

  for (const group of groups) {
    options.push(
      ...appendGroup(container, {
        label: group.categoryName,
        accent: group.accent,
        items: group.items,
        variant,
      }),
    );
  }

  return options;
}

export function renderRecents(
  container: HTMLElement,
  items: SearchItem[],
  variant: ResultsVariant,
): HTMLAnchorElement[] {
  container.replaceChildren();

  const ranked: RankedItem[] = items.map((item) => ({
    item,
    score: 0,
    titleRanges: [],
    descriptionRanges: [],
  }));

  return appendGroup(container, {
    label: 'Recent',
    accent: null,
    items: ranked,
    variant,
  });
}

export function renderMessage(container: HTMLElement, title: string, message: string): void {
  container.replaceChildren();

  const wrapper = element('div', 'px-4 py-12 text-center');

  wrapper.append(
    element('p', 'text-sm font-medium text-zinc-700 dark:text-zinc-300', title),
    element('p', 'mx-auto mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400', message),
  );

  container.append(wrapper);
}
