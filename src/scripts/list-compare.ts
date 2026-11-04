import {
  compareLists,
  comparisonText,
  describeComparison,
  formatGroup,
  type SeparatorMode,
} from '../lib/listCompare';
import { readStoredState, writeStoredState } from '../lib/persistedState';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { downloadText } from './download';
import { wireCopy } from './ui';

const CONTENT_KEY = 'list-compare:content';

const schema = {
  a: 'string',
  b: 'string',
  ci: 'number',
  trim: 'number',
  dup: 'number',
  sep: 'string',
  sort: 'number',
} as const;

function separatorFrom(value: string): SeparatorMode {
  return value === 'commas' || value === 'wide' ? value : 'lines';
}

function initRoot(root: HTMLElement): void {
  const inputA = root.querySelector<HTMLTextAreaElement>('[data-list-a]');
  const inputB = root.querySelector<HTMLTextAreaElement>('[data-list-b]');
  const ignoreCaseBox = root.querySelector<HTMLInputElement>('[data-ignore-case]');
  const trimBox = root.querySelector<HTMLInputElement>('[data-trim]');
  const countsBox = root.querySelector<HTMLInputElement>('[data-show-counts]');
  const sortBox = root.querySelector<HTMLInputElement>('[data-sort]');
  const sepSelect = root.querySelector<HTMLSelectElement>('[data-separators]');
  const summary = root.querySelector<HTMLElement>('[data-summary]');
  const resultOnlyA = root.querySelector<HTMLElement>('[data-result-only-a]');
  const resultBoth = root.querySelector<HTMLElement>('[data-result-both]');
  const resultOnlyB = root.querySelector<HTMLElement>('[data-result-only-b]');
  const countOnlyA = root.querySelector<HTMLElement>('[data-count-only-a]');
  const countBoth = root.querySelector<HTMLElement>('[data-count-both]');
  const countOnlyB = root.querySelector<HTMLElement>('[data-count-only-b]');
  const vennOnlyA = root.querySelector<HTMLElement>('[data-venn-only-a]');
  const vennBoth = root.querySelector<HTMLElement>('[data-venn-both]');
  const vennOnlyB = root.querySelector<HTMLElement>('[data-venn-only-b]');
  const vennDesc = root.querySelector<HTMLElement>('[data-venn-desc]');
  const downloadButton = root.querySelector<HTMLButtonElement>('[data-download]');
  if (
    !inputA ||
    !inputB ||
    !ignoreCaseBox ||
    !trimBox ||
    !countsBox ||
    !sortBox ||
    !sepSelect
  ) {
    return;
  }

  const defaultA = inputA.value;
  const defaultB = inputB.value;
  const defaults = { a: defaultA, b: defaultB, ci: 0, trim: 1, dup: 0, sep: 'lines', sort: 0 };

  let latest = compareLists(defaultA, defaultB);
  let timer: number | undefined;

  const render = (): void => {
    const showCounts = countsBox.checked;
    latest = compareLists(inputA.value, inputB.value, {
      trim: trimBox.checked,
      ignoreCase: ignoreCaseBox.checked,
      separators: separatorFrom(sepSelect.value),
      sort: sortBox.checked,
    });

    if (resultOnlyA) resultOnlyA.textContent = formatGroup(latest.onlyA, 'onlyA', showCounts) || '–';
    if (resultBoth) resultBoth.textContent = formatGroup(latest.both, 'both', showCounts) || '–';
    if (resultOnlyB) resultOnlyB.textContent = formatGroup(latest.onlyB, 'onlyB', showCounts) || '–';

    if (countOnlyA) countOnlyA.textContent = String(latest.onlyA.length);
    if (countBoth) countBoth.textContent = String(latest.both.length);
    if (countOnlyB) countOnlyB.textContent = String(latest.onlyB.length);

    if (summary) summary.textContent = describeComparison(latest);

    if (vennOnlyA) vennOnlyA.textContent = String(latest.onlyA.length);
    if (vennBoth) vennBoth.textContent = String(latest.both.length);
    if (vennOnlyB) vennOnlyB.textContent = String(latest.onlyB.length);
    if (vennDesc) {
      vennDesc.textContent = `${latest.onlyA.length} only in A, ${latest.both.length} in both, ${latest.onlyB.length} only in B`;
    }
  };

  const persist = (): void => {
    writeUrlState(
      schema,
      {
        ci: ignoreCaseBox.checked ? 1 : 0,
        trim: trimBox.checked ? 1 : 0,
        dup: countsBox.checked ? 1 : 0,
        sep: sepSelect.value,
        sort: sortBox.checked ? 1 : 0,
      },
      { defaults },
    );
    writeStoredState(
      CONTENT_KEY,
      { a: inputA.value, b: inputB.value },
      'session',
    );
  };

  const schedulePersist = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(persist, 300);
  };

  const update = (): void => {
    render();
    schedulePersist();
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    const stored = readStoredState(CONTENT_KEY, 'session');
    const legacyA = typeof state.a === 'string' ? state.a : null;
    const legacyB = typeof state.b === 'string' ? state.b : null;
    const storedA = typeof stored?.a === 'string' ? stored.a : null;
    const storedB = typeof stored?.b === 'string' ? stored.b : null;

    inputA.value = legacyA ?? storedA ?? defaultA;
    inputB.value = legacyB ?? storedB ?? defaultB;
    ignoreCaseBox.checked = state.ci === 1;
    trimBox.checked = state.trim !== 0;
    countsBox.checked = state.dup === 1;
    sortBox.checked = state.sort === 1;
    sepSelect.value = separatorFrom(typeof state.sep === 'string' ? state.sep : 'lines');
  };

  applyState();
  render();
  persist();

  inputA.addEventListener('input', update);
  inputB.addEventListener('input', update);

  for (const box of [ignoreCaseBox, trimBox, countsBox, sortBox]) {
    box.addEventListener('change', update);
  }
  sepSelect.addEventListener('change', update);

  downloadButton?.addEventListener('click', () => {
    downloadText('list-compare.txt', comparisonText(latest, countsBox.checked));
  });

  window.addEventListener('popstate', () => {
    window.clearTimeout(timer);
    applyState();
    render();
  });

  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-list-compare-widget]').forEach(initRoot);
