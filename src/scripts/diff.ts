import { diffLines, diffSummary, numberDiffLines, type NumberedDiffLine } from '../lib/diff';
import {
  DIFF_GUTTER,
  DIFF_ROW_BASE,
  DIFF_ROW_TINT,
  DIFF_SIGN,
  DIFF_SIGN_CELL,
  DIFF_SIGN_COLOR,
  DIFF_TEXT,
  describeDiff,
} from '../lib/diffView';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

const schema = { a: 'string', b: 'string' } as const;

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

function initRoot(root: HTMLElement): void {
  const inputA = root.querySelector<HTMLTextAreaElement>('[data-diff-a]');
  const inputB = root.querySelector<HTMLTextAreaElement>('[data-diff-b]');
  const output = root.querySelector<HTMLElement>('[data-diff-output]');
  const summaryEl = root.querySelector<HTMLElement>('[data-diff-summary]');
  const swapButton = root.querySelector<HTMLButtonElement>('[data-swap]');
  if (!inputA || !inputB || !output) return;

  const defaultA = inputA.value;
  const defaultB = inputB.value;
  const defaults = { a: defaultA, b: defaultB };

  const render = (): void => {
    const lines = diffLines(inputA.value, inputB.value);
    output.replaceChildren(...numberDiffLines(lines).map(rowElement));
    if (summaryEl) summaryEl.textContent = describeDiff(diffSummary(lines));
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    inputA.value = typeof state.a === 'string' ? state.a : defaultA;
    inputB.value = typeof state.b === 'string' ? state.b : defaultB;
  };

  const update = (): void => {
    writeUrlState(schema, { a: inputA.value, b: inputB.value }, { defaults });
    render();
  };

  applyState();
  render();

  inputA.addEventListener('input', update);
  inputB.addEventListener('input', update);

  swapButton?.addEventListener('click', () => {
    const a = inputA.value;
    inputA.value = inputB.value;
    inputB.value = a;
    update();
  });

  window.addEventListener('popstate', () => {
    applyState();
    render();
  });

  wireShare(root);
}

document.querySelectorAll<HTMLElement>('[data-diff-widget]').forEach(initRoot);
