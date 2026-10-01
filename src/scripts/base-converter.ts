import { COMMON_BASES, convertBase } from '../lib/base';
import { readUrlState, writeUrlState } from '../lib/urlState';

const schema = { v: 'string', from: 'number' } as const;
const defaults = { v: '255', from: 10 };
const BASES = [...COMMON_BASES];

function initRoot(root: HTMLElement): void {
  const valueInput = root.querySelector<HTMLInputElement>('[data-value-input]');
  const fromSelect = root.querySelector<HTMLSelectElement>('[data-from-select]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  if (!valueInput || !fromSelect) return;

  const outEls: Record<number, HTMLElement | null> = {};
  for (const base of BASES) {
    outEls[base] = root.querySelector<HTMLElement>(`[data-out="${base}"]`);
  }

  const paint = (): void => {
    const raw = valueInput.value;
    const from = Number(fromSelect.value);
    const valid = raw.trim() !== '';
    for (const base of BASES) {
      const result = valid ? convertBase(raw, from, base) : null;
      const el = outEls[base];
      if (el) el.textContent = result ?? '–';
    }
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    valueInput.value = typeof state.v === 'string' ? state.v : defaults.v;
    const from = typeof state.from === 'number' ? state.from : defaults.from;
    fromSelect.value = BASES.includes(from as (typeof BASES)[number])
      ? String(from)
      : String(defaults.from);
  };

  const update = (): void => {
    paint();
    writeUrlState(
      schema,
      { v: valueInput.value, from: Number(fromSelect.value) },
      { defaults },
    );
  };

  applyState();
  paint();

  valueInput.addEventListener('input', update);
  fromSelect.addEventListener('change', update);

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const original = shareBtn.textContent;
      try {
        await navigator.clipboard.writeText(window.location.href);
        shareBtn.textContent = 'Link copied';
      } catch {
        shareBtn.textContent = 'Copy failed';
      }
      window.setTimeout(() => {
        shareBtn.textContent = original;
      }, 1500);
    });
  }

  window.addEventListener('popstate', () => {
    applyState();
    paint();
  });
}

document.querySelectorAll<HTMLElement>('[data-base-widget]').forEach(initRoot);
