import { BIP39_WORDS } from '../data/bip39';
import {
  generatePassphrases,
  generatePasswords,
  passphraseEntropyBits,
  passwordEntropyBits,
  strength,
  type PasswordOptions,
  type Strength,
} from '../lib/password';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireCopy, wireShare } from './ui';

const schema = {
  mode: 'string',
  len: 'number',
  lower: 'number',
  upper: 'number',
  num: 'number',
  sym: 'number',
  amb: 'number',
  n: 'number',
  words: 'number',
  sep: 'string',
  cap: 'number',
  appnum: 'number',
} as const;

const defaults = {
  mode: 'pass',
  len: 20,
  lower: 1,
  upper: 1,
  num: 1,
  sym: 1,
  amb: 0,
  n: 1,
  words: 8,
  sep: '-',
  cap: 1,
  appnum: 0,
};

const MODE_ACTIVE =
  'rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition dark:bg-zinc-100 dark:text-zinc-900';
const MODE_IDLE =
  'rounded-full px-4 py-1.5 text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100';

const STRENGTH_COLOR: Record<Strength, string> = {
  Weak: '#ef4444',
  Fair: '#f59e0b',
  Strong: '#10b981',
};

function num(input: HTMLInputElement | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(input?.value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}

function initRoot(root: HTMLElement): void {
  const q = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector);
  const lengthInput = q<HTMLInputElement>('[data-length-input]');
  const lowerInput = q<HTMLInputElement>('[data-lower-input]');
  const upperInput = q<HTMLInputElement>('[data-upper-input]');
  const digitsInput = q<HTMLInputElement>('[data-digits-input]');
  const symbolsInput = q<HTMLInputElement>('[data-symbols-input]');
  const ambiguousInput = q<HTMLInputElement>('[data-ambiguous-input]');
  const wordsInput = q<HTMLInputElement>('[data-words-input]');
  const separatorInput = q<HTMLInputElement>('[data-separator-input]');
  const capitalizeInput = q<HTMLInputElement>('[data-capitalize-input]');
  const appendNumberInput = q<HTMLInputElement>('[data-append-number-input]');
  const countInput = q<HTMLInputElement>('[data-count-input]');
  const output = q<HTMLElement>('[data-output]');
  const generateBtn = q<HTMLButtonElement>('[data-generate]');
  const passPanel = q<HTMLElement>('[data-panel="pass"]');
  const phrasePanel = q<HTMLElement>('[data-panel="phrase"]');
  const modeButtons = root.querySelectorAll<HTMLButtonElement>('[data-mode-btn]');
  const strengthBar = q<HTMLElement>('[data-strength-bar]');
  const strengthLabel = q<HTMLElement>('[data-strength-label]');
  const strengthBits = q<HTMLElement>('[data-strength-bits]');

  if (!output) return;

  let mode = 'pass';

  const readPasswordOptions = (): PasswordOptions => ({
    length: num(lengthInput, defaults.len, 4, 128),
    lower: Boolean(lowerInput?.checked),
    upper: Boolean(upperInput?.checked),
    digits: Boolean(digitsInput?.checked),
    symbols: Boolean(symbolsInput?.checked),
    excludeAmbiguous: Boolean(ambiguousInput?.checked),
  });

  const readPassphraseOptions = () => ({
    words: num(wordsInput, defaults.words, 3, 12),
    separator: separatorInput?.value ?? '-',
    capitalize: Boolean(capitalizeInput?.checked),
    appendNumber: Boolean(appendNumberInput?.checked),
    wordlist: BIP39_WORDS,
  });

  const paintStrength = (bits: number): void => {
    const label = strength(bits);
    if (strengthBar) {
      strengthBar.style.width = `${Math.max(4, Math.min(100, (bits / 128) * 100))}%`;
      strengthBar.style.background = STRENGTH_COLOR[label];
    }
    if (strengthLabel) strengthLabel.textContent = label;
    if (strengthBits) strengthBits.textContent = String(Math.round(bits));
  };

  const syncMode = (): void => {
    modeButtons.forEach((button) => {
      const active = button.dataset.modeBtn === mode;
      button.setAttribute('aria-selected', active ? 'true' : 'false');
      button.className = active ? MODE_ACTIVE : MODE_IDLE;
    });
    passPanel?.classList.toggle('hidden', mode !== 'pass');
    phrasePanel?.classList.toggle('hidden', mode !== 'phrase');
  };

  const render = (): void => {
    const count = num(countInput, defaults.n, 1, 100);
    if (mode === 'phrase') {
      const options = readPassphraseOptions();
      output.textContent = generatePassphrases(options, count).join('\n');
      paintStrength(passphraseEntropyBits(options));
    } else {
      const options = readPasswordOptions();
      output.textContent = generatePasswords(options, count).join('\n');
      paintStrength(passwordEntropyBits(options));
    }
  };

  const collectValues = () => ({
    mode,
    len: num(lengthInput, defaults.len, 4, 128),
    lower: lowerInput?.checked ? 1 : 0,
    upper: upperInput?.checked ? 1 : 0,
    num: digitsInput?.checked ? 1 : 0,
    sym: symbolsInput?.checked ? 1 : 0,
    amb: ambiguousInput?.checked ? 1 : 0,
    n: num(countInput, defaults.n, 1, 100),
    words: num(wordsInput, defaults.words, 3, 12),
    sep: separatorInput?.value ?? '-',
    cap: capitalizeInput?.checked ? 1 : 0,
    appnum: appendNumberInput?.checked ? 1 : 0,
  });

  const update = (): void => {
    render();
    writeUrlState(schema, collectValues(), { defaults });
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    mode = state.mode === 'phrase' ? 'phrase' : 'pass';
    if (lengthInput) lengthInput.value = String(typeof state.len === 'number' ? state.len : defaults.len);
    if (lowerInput) lowerInput.checked = state.lower !== 0;
    if (upperInput) upperInput.checked = state.upper !== 0;
    if (digitsInput) digitsInput.checked = state.num !== 0;
    if (symbolsInput) symbolsInput.checked = state.sym !== 0;
    if (ambiguousInput) ambiguousInput.checked = state.amb === 1;
    if (countInput) countInput.value = String(typeof state.n === 'number' ? state.n : defaults.n);
    if (wordsInput) wordsInput.value = String(typeof state.words === 'number' ? state.words : defaults.words);
    if (separatorInput && typeof state.sep === 'string') separatorInput.value = state.sep;
    if (capitalizeInput) capitalizeInput.checked = state.cap !== 0;
    if (appendNumberInput) appendNumberInput.checked = state.appnum === 1;
    syncMode();
  };

  const controls = root.querySelectorAll('input');
  controls.forEach((control) => control.addEventListener('change', update));

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      mode = button.dataset.modeBtn === 'phrase' ? 'phrase' : 'pass';
      syncMode();
      update();
    });
  });

  generateBtn?.addEventListener('click', render);

  window.addEventListener('popstate', () => {
    applyState();
    render();
  });

  applyState();
  render();

  wireShare(root);
  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-password-widget]').forEach(initRoot);
