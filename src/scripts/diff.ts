import { beautifyForDiff } from '../lib/codeFormat';
import {
  DIFF_TOO_LARGE,
  DIFF_ROW_BASE,
  DIFF_ROW_TINT,
  DIFF_SIGN,
  DIFF_SIGN_CELL,
  DIFF_SIGN_COLOR,
  DIFF_SPLIT_CELL,
  DIFF_SPLIT_EMPTY,
  DIFF_SPLIT_GUTTER,
  DIFF_SPLIT_LEFT,
  DIFF_SPLIT_ROW,
  DIFF_SPLIT_TEXT,
  DIFF_TEXT,
  DIFF_GUTTER,
  VIEW_BUTTON_ACTIVE,
  VIEW_BUTTON_BASE,
  VIEW_BUTTON_INACTIVE,
  describeDetectedFormat,
  describeDiff,
} from '../lib/diffView';
import {
  diffIsTooLarge,
  diffLines,
  diffSummary,
  numberDiffLines,
  splitDiffLines,
  type NumberedDiffLine,
  type SplitCell,
} from '../lib/diff';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

const schema = {
  a: 'string',
  b: 'string',
  view: 'string',
  fa: 'number',
  fb: 'number',
  ws: 'number',
} as const;

type ViewMode = 'split' | 'unified';

function rowElement(row: NumberedDiffLine): HTMLElement {
  const el = document.createElement('div');
  el.className = `${DIFF_ROW_BASE} ${DIFF_ROW_TINT[row.type]}`.trim();

  const oldEl = document.createElement('span');
  oldEl.className = DIFF_GUTTER;
  oldEl.textContent = row.oldLine == null ? '' : String(row.oldLine);

  const newEl = document.createElement('span');
  newEl.className = DIFF_GUTTER;
  newEl.textContent = row.newLine == null ? '' : String(row.newLine);

  const signEl = document.createElement('span');
  signEl.className = `${DIFF_SIGN_CELL} ${DIFF_SIGN_COLOR[row.type]}`.trim();
  signEl.textContent = DIFF_SIGN[row.type];

  const textEl = document.createElement('span');
  textEl.className = DIFF_TEXT;
  textEl.textContent = row.text;

  el.append(oldEl, newEl, signEl, textEl);
  return el;
}

function splitCellElement(cell: SplitCell | null, isLeft: boolean): HTMLElement {
  const el = document.createElement('div');
  const classes = [DIFF_SPLIT_CELL];
  if (isLeft) classes.push(DIFF_SPLIT_LEFT);
  if (cell) classes.push(DIFF_ROW_TINT[cell.type]);
  else classes.push(DIFF_SPLIT_EMPTY);
  el.className = classes.filter(Boolean).join(' ');
  if (!cell) return el;

  const gutter = document.createElement('span');
  gutter.className = DIFF_SPLIT_GUTTER;
  gutter.textContent = String(cell.line);

  const text = document.createElement('span');
  text.className = DIFF_SPLIT_TEXT;
  text.textContent = cell.text;

  el.append(gutter, text);
  return el;
}

function splitRowElement(row: { left: SplitCell | null; right: SplitCell | null }): HTMLElement {
  const el = document.createElement('div');
  el.className = DIFF_SPLIT_ROW;
  el.append(splitCellElement(row.left, true), splitCellElement(row.right, false));
  return el;
}

function initRoot(root: HTMLElement): void {
  const inputA = root.querySelector<HTMLTextAreaElement>('[data-diff-a]');
  const inputB = root.querySelector<HTMLTextAreaElement>('[data-diff-b]');
  const outputSplit = root.querySelector<HTMLElement>('[data-diff-split]');
  const outputUnified = root.querySelector<HTMLElement>('[data-diff-unified]');
  const summaryEl = root.querySelector<HTMLElement>('[data-diff-summary]');
  const swapButton = root.querySelector<HTMLButtonElement>('[data-swap]');
  const formatABox = root.querySelector<HTMLInputElement>('[data-format-a]');
  const formatBBox = root.querySelector<HTMLInputElement>('[data-format-b]');
  const whitespaceBox = root.querySelector<HTMLInputElement>('[data-ignore-whitespace]');
  const hintA = root.querySelector<HTMLElement>('[data-hint-a]');
  const hintB = root.querySelector<HTMLElement>('[data-hint-b]');
  const splitButton = root.querySelector<HTMLButtonElement>('[data-view-split]');
  const unifiedButton = root.querySelector<HTMLButtonElement>('[data-view-unified]');
  if (!inputA || !inputB || !outputSplit || !outputUnified) return;

  const defaultA = inputA.value;
  const defaultB = inputB.value;
  const defaults = {
    a: defaultA,
    b: defaultB,
    view: 'split',
    fa: 1,
    fb: 1,
    ws: 1,
  };

  let view: ViewMode = 'split';
  let timer: number | undefined;

  const syncViewButtons = (): void => {
    const active = view === 'split' ? splitButton : unifiedButton;
    const inactive = view === 'split' ? unifiedButton : splitButton;
    if (active) {
      active.setAttribute('aria-pressed', 'true');
      active.className = `${VIEW_BUTTON_BASE} ${VIEW_BUTTON_ACTIVE}`;
    }
    if (inactive) {
      inactive.setAttribute('aria-pressed', 'false');
      inactive.className = `${VIEW_BUTTON_BASE} ${VIEW_BUTTON_INACTIVE}`;
    }
  };

  const render = (): void => {
    const formattedA = beautifyForDiff(inputA.value);
    const formattedB = beautifyForDiff(inputB.value);
    const formatA = formatABox?.checked ?? true;
    const formatB = formatBBox?.checked ?? true;

    if (formatABox) formatABox.disabled = formattedA.format === null;
    if (formatBBox) formatBBox.disabled = formattedB.format === null;
    if (hintA) hintA.textContent = describeDetectedFormat(formattedA.format, formatA);
    if (hintB) hintB.textContent = describeDetectedFormat(formattedB.format, formatB);

    const textA = formatA ? formattedA.text : inputA.value;
    const textB = formatB ? formattedB.text : inputB.value;

    const showSplit = view === 'split';
    outputSplit.hidden = !showSplit;
    outputUnified.hidden = showSplit;

    if (diffIsTooLarge(textA, textB)) {
      outputSplit.replaceChildren();
      outputUnified.replaceChildren();
      if (summaryEl) summaryEl.textContent = DIFF_TOO_LARGE;
      return;
    }

    const lines = diffLines(textA, textB, {
      ignoreTrailingWhitespace: whitespaceBox?.checked ?? true,
    });
    if (summaryEl) summaryEl.textContent = describeDiff(diffSummary(lines));

    if (showSplit) {
      outputSplit.replaceChildren(...splitDiffLines(lines).map(splitRowElement));
    } else {
      outputUnified.replaceChildren(...numberDiffLines(lines).map(rowElement));
    }
  };

  const persist = (): void => {
    writeUrlState(
      schema,
      {
        a: inputA.value,
        b: inputB.value,
        view,
        fa: (formatABox?.checked ?? true) ? 1 : 0,
        fb: (formatBBox?.checked ?? true) ? 1 : 0,
        ws: (whitespaceBox?.checked ?? true) ? 1 : 0,
      },
      { defaults },
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
    inputA.value = typeof state.a === 'string' ? state.a : defaultA;
    inputB.value = typeof state.b === 'string' ? state.b : defaultB;
    view = state.view === 'unified' ? 'unified' : 'split';
    if (formatABox) formatABox.checked = state.fa !== 0;
    if (formatBBox) formatBBox.checked = state.fb !== 0;
    if (whitespaceBox) whitespaceBox.checked = state.ws !== 0;
    syncViewButtons();
  };

  applyState();
  render();

  inputA.addEventListener('input', update);
  inputB.addEventListener('input', update);

  formatABox?.addEventListener('change', update);
  formatBBox?.addEventListener('change', update);
  whitespaceBox?.addEventListener('change', update);

  splitButton?.addEventListener('click', () => {
    view = 'split';
    syncViewButtons();
    update();
  });

  unifiedButton?.addEventListener('click', () => {
    view = 'unified';
    syncViewButtons();
    update();
  });

  swapButton?.addEventListener('click', () => {
    const a = inputA.value;
    inputA.value = inputB.value;
    inputB.value = a;
    update();
  });

  window.addEventListener('popstate', () => {
    window.clearTimeout(timer);
    applyState();
    render();
  });

  root.querySelector('[data-share]')?.addEventListener('click', persist);
  wireShare(root);
}

document.querySelectorAll<HTMLElement>('[data-diff-widget]').forEach(initRoot);
