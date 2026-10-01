import { formatYmd, parseISODate, toISODate } from '../lib/dates';
import { durationBetween } from '../lib/duration';
import { readUrlState, writeUrlState } from '../lib/urlState';

const schema = { from: 'date', to: 'date' } as const;

function initRoot(root: HTMLElement): void {
  const fromInput = root.querySelector<HTMLInputElement>('[data-from-input]');
  const toInput = root.querySelector<HTMLInputElement>('[data-to-input]');
  const valueEl = root.querySelector<HTMLElement>('[data-result-value]');
  const detailEl = root.querySelector<HTMLElement>('[data-result-detail]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  if (!fromInput || !toInput || !valueEl) return;

  const defaults = {
    from: root.dataset.defaultFrom ?? toISODate(new Date()),
    to: root.dataset.defaultTo ?? toISODate(new Date()),
  };

  const render = (): void => {
    const from = parseISODate(fromInput.value);
    const to = parseISODate(toInput.value);
    if (!from || !to) {
      valueEl.textContent = '–';
      if (detailEl) detailEl.textContent = 'Pick two valid dates.';
      return;
    }

    const result = durationBetween(from, to);
    valueEl.textContent = formatYmd(result);
    if (detailEl) {
      const prefix = result.backwards ? 'Backwards: ' : '';
      detailEl.textContent = `${prefix}${result.totalDays.toLocaleString('en-US')} days, ${result.totalWeeks.toLocaleString('en-US')} weeks or ${result.totalHours.toLocaleString('en-US')} hours in total.`;
    }
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    fromInput.value = typeof state.from === 'string' ? state.from : defaults.from;
    toInput.value = typeof state.to === 'string' ? state.to : defaults.to;
  };

  const update = (): void => {
    render();
    writeUrlState(schema, { from: fromInput.value, to: toInput.value }, { defaults });
  };

  applyState();
  render();

  for (const input of [fromInput, toInput]) {
    input.addEventListener('input', update);
    input.addEventListener('change', update);
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
    applyState();
    render();
  });
}

document.querySelectorAll<HTMLElement>('[data-duration-widget]').forEach(initRoot);
