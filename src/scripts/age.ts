import { ageBetween, daysUntilBirthday, formatAge } from '../lib/age';
import { parseISODate, toISODate } from '../lib/dates';
import { readUrlState, writeUrlState } from '../lib/urlState';

const schema = { birth: 'date', on: 'date' } as const;

function initRoot(root: HTMLElement): void {
  const birthInput = root.querySelector<HTMLInputElement>('[data-birth-input]');
  const onInput = root.querySelector<HTMLInputElement>('[data-on-input]');
  const valueEl = root.querySelector<HTMLElement>('[data-result-value]');
  const unitEl = root.querySelector<HTMLElement>('[data-result-unit]');
  const detailEl = root.querySelector<HTMLElement>('[data-result-detail]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  if (!birthInput || !onInput || !valueEl) return;

  const defaults = {
    birth: root.dataset.defaultBirth ?? '2000-01-01',
    on: root.dataset.defaultOn ?? toISODate(new Date()),
  };

  const render = (): void => {
    const birth = parseISODate(birthInput.value);
    const on = parseISODate(onInput.value) ?? new Date();

    if (!birth) {
      valueEl.textContent = '–';
      if (unitEl) unitEl.textContent = '';
      if (detailEl) detailEl.textContent = 'Pick a birth date in the past.';
      return;
    }

    const age = ageBetween(birth, on);
    if (!age) {
      valueEl.textContent = '–';
      if (unitEl) unitEl.textContent = 'not born yet';
      if (detailEl) detailEl.textContent = 'The birth date is after the selected date.';
      return;
    }

    valueEl.textContent = String(age.years);
    if (unitEl) unitEl.textContent = age.years === 1 ? 'year old' : 'years old';
    if (detailEl) {
      const days = daysUntilBirthday(birth, on);
      detailEl.textContent = `That's ${formatAge(age)}, or ${age.totalDays.toLocaleString('en-US')} days (${age.totalWeeks.toLocaleString('en-US')} weeks). Next birthday in ${days} days.`;
    }
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    birthInput.value = typeof state.birth === 'string' ? state.birth : defaults.birth;
    onInput.value = typeof state.on === 'string' ? state.on : defaults.on;
  };

  const update = (): void => {
    render();
    writeUrlState(schema, { birth: birthInput.value, on: onInput.value }, { defaults });
  };

  applyState();
  render();

  for (const input of [birthInput, onInput]) {
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

document.querySelectorAll<HTMLElement>('[data-age-widget]').forEach(initRoot);
