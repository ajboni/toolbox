import {
  PERCENT_DEFAULTS,
  PERCENT_SCHEMAS,
  renderPercent,
  type PercentMode,
} from '../lib/percentView';
import type { ProportionTerm } from '../lib/proportion';
import { readUrlState, writeUrlState } from '../lib/urlState';

const TERMS: ProportionTerm[] = ['a', 'b', 'c', 'x'];

type Control = HTMLInputElement | HTMLSelectElement;

function initRoot(root: HTMLElement): void {
  const mode = root.dataset.mode as PercentMode | undefined;
  if (!mode || !PERCENT_SCHEMAS[mode]) return;

  const schema = PERCENT_SCHEMAS[mode];
  const defaults = PERCENT_DEFAULTS[mode];
  const keys = Object.keys(schema);
  const valueEl = root.querySelector<HTMLElement>('[data-result-value]');
  const unitEl = root.querySelector<HTMLElement>('[data-result-unit]');
  const detailEl = root.querySelector<HTMLElement>('[data-result-detail]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  if (!valueEl) return;

  const controls: Record<string, Control> = {};
  for (const key of keys) {
    const el = root.querySelector<Control>(`[data-field="${key}"]`);
    if (el) controls[key] = el;
  }

  const applyState = (state: Record<string, string | number>): void => {
    for (const key of keys) {
      const el = controls[key];
      if (!el) continue;
      const fromUrl = state[key];
      el.value = fromUrl != null ? String(fromUrl) : String(defaults[key]);
      if (el instanceof HTMLSelectElement && el.value === '') {
        el.value = String(defaults[key]);
      }
    }
    syncUnknown();
  };

  const readValues = (): Record<string, string | number | null> => {
    const values: Record<string, string | number | null> = {};
    for (const key of keys) {
      const el = controls[key];
      if (!el) {
        values[key] = null;
        continue;
      }
      const raw = el.value.trim();
      if (raw === '') {
        values[key] = null;
      } else if (schema[key] === 'number') {
        const parsed = Number(raw);
        values[key] = Number.isFinite(parsed) ? parsed : null;
      } else {
        values[key] = raw;
      }
    }
    return values;
  };

  function syncUnknown(): void {
    if (mode !== 'rule-of-three') return;
    const unknownEl = controls.unknown;
    const unknown =
      unknownEl && unknownEl.value !== '' ? unknownEl.value : String(defaults.unknown);
    for (const term of TERMS) {
      const el = controls[term];
      if (el instanceof HTMLInputElement) el.disabled = term === unknown;
    }
  }

  const paintResult = (values: Record<string, string | number | null>): void => {
    const result = renderPercent(mode, values);
    valueEl.textContent = result.value;
    if (unitEl) unitEl.textContent = result.unit;
    if (detailEl) detailEl.textContent = result.detail;
  };

  const paint = (): void => {
    const values = readValues();
    paintResult(values);
    writeUrlState(schema, values, { defaults });
  };

  applyState(readUrlState(schema));
  paint();

  for (const key of keys) {
    const el = controls[key];
    if (!el) continue;
    const handler = (): void => {
      if (key === 'unknown') syncUnknown();
      paint();
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  }

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
    applyState(readUrlState(schema));
    paintResult(readValues());
  });
}

const roots = document.querySelectorAll<HTMLElement>('[data-percent-widget]');
roots.forEach(initRoot);
