import {
  cryptoUint32,
  formatDiceNotation,
  normalizeSpec,
  parseDiceNotation,
  rollDice,
  type DiceSpec,
} from '../lib/dice';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

const schema = { dice: 'string' } as const;
const defaults = { dice: 'd6' };
const DEFAULT_SPEC: DiceSpec = { count: 1, sides: 6, modifier: 0 };
const MAX_HISTORY = 10;

interface HistoryEntry {
  notation: string;
  formula: string;
  total: number;
}

function initRoot(root: HTMLElement): void {
  const q = <T extends HTMLElement>(selector: string) =>
    root.querySelector<T>(selector);

  const totalEl = q<HTMLElement>('[data-total]');
  const formulaEl = q<HTMLElement>('[data-formula]');
  const countInput = q<HTMLInputElement>('[data-count]');
  const modifierInput = q<HTMLInputElement>('[data-modifier]');
  const notationInput = q<HTMLInputElement>('[data-notation]');
  const errorEl = q<HTMLElement>('[data-error]');
  const rollButton = q<HTMLButtonElement>('[data-roll]');
  const historySection = q<HTMLElement>('[data-history]');
  const historyList = q<HTMLOListElement>('[data-history-list]');
  const sideButtons = root.querySelectorAll<HTMLButtonElement>('[data-sides]');

  if (!totalEl || !formulaEl) return;

  let spec = DEFAULT_SPEC;
  const history: HistoryEntry[] = [];

  const paintSides = (): void => {
    sideButtons.forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        Number(button.dataset.sides) === spec.sides ? 'true' : 'false',
      );
    });
  };

  const paintSpec = (): void => {
    if (countInput) countInput.value = String(spec.count);
    if (modifierInput) modifierInput.value = String(spec.modifier);
    if (notationInput) notationInput.value = formatDiceNotation(spec);
    paintSides();
  };

  const saveSpec = (): void => {
    writeUrlState(schema, { dice: formatDiceNotation(spec) }, { defaults });
  };

  const showError = (message: string): void => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.toggle('hidden', !message);
  };

  const applyUrl = (): void => {
    const state = readUrlState(schema);
    const parsed =
      typeof state.dice === 'string' ? parseDiceNotation(state.dice) : null;
    spec = normalizeSpec(parsed ?? DEFAULT_SPEC);
    paintSpec();
    showError('');
  };

  const applyControls = (): void => {
    const count = countInput ? Number(countInput.value) : spec.count;
    const modifier = modifierInput ? Number(modifierInput.value) : spec.modifier;
    const sides = spec.sides;
    spec = normalizeSpec({ count, sides, modifier });
    paintSpec();
    saveSpec();
  };

  const formulaFor = (rolls: number[], modifier: number, total: number): string => {
    const dice = rolls.join(' + ');
    if (modifier === 0) return `${dice} = ${total}`;
    const sign = modifier > 0 ? '+' : '-';
    return `${dice} ${sign} ${Math.abs(modifier)} = ${total}`;
  };

  const renderHistory = (): void => {
    if (!historySection || !historyList) return;
    historySection.classList.toggle('hidden', history.length === 0);
    historyList.replaceChildren(
      ...history.map((entry) => {
        const item = document.createElement('li');
        item.className =
          'flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-200 py-2 last:border-0 dark:border-zinc-800';
        const label = document.createElement('span');
        label.className = 'font-mono text-sm text-zinc-500 dark:text-zinc-400';
        label.textContent = entry.notation;
        const detail = document.createElement('span');
        detail.className = 'text-sm text-zinc-700 dark:text-zinc-300';
        detail.textContent = entry.formula;
        const total = document.createElement('span');
        total.className = 'font-mono font-semibold tabular-nums';
        total.textContent = String(entry.total);
        item.append(label, detail, total);
        return item;
      }),
    );
  };

  const roll = (): void => {
    const result = rollDice(spec, cryptoUint32);
    const notation = formatDiceNotation(result.spec);
    totalEl.textContent = String(result.total);
    formulaEl.textContent = `${notation}: ${formulaFor(
      result.rolls,
      result.spec.modifier,
      result.total,
    )}`;

    history.unshift({
      notation: formatDiceNotation(result.spec),
      formula: formulaFor(result.rolls, result.spec.modifier, result.total),
      total: result.total,
    });
    history.splice(MAX_HISTORY);
    renderHistory();
  };

  sideButtons.forEach((button) => {
    button.addEventListener('click', () => {
      spec = normalizeSpec({ ...spec, sides: Number(button.dataset.sides) });
      paintSpec();
      saveSpec();
    });
  });

  countInput?.addEventListener('change', applyControls);
  modifierInput?.addEventListener('change', applyControls);

  notationInput?.addEventListener('change', () => {
    const parsed = parseDiceNotation(notationInput.value);
    if (!parsed) {
      showError('Use notation like d20 or 2d6+3.');
      paintSpec();
      return;
    }
    showError('');
    spec = normalizeSpec(parsed);
    paintSpec();
    saveSpec();
  });

  notationInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    notationInput.blur();
  });

  rollButton?.addEventListener('click', roll);

  window.addEventListener('popstate', applyUrl);

  applyUrl();
  wireShare(root);
}

document.querySelectorAll<HTMLElement>('[data-dice-widget]').forEach(initRoot);
