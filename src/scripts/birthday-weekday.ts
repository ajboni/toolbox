import {
  birthdayTableHtml,
  buildBirthdayView,
  weekdayCountsHtml,
} from '../lib/birthdayView';
import { parseISODate } from '../lib/dates';
import { readUrlState, writeUrlState } from '../lib/urlState';

const schema = { birth: 'date' } as const;
const CURRENT_CLASS = 'bg-zinc-100 dark:bg-zinc-800/60';

function initRoot(root: HTMLElement): void {
  const birthInput = root.querySelector<HTMLInputElement>('[data-birth-input]');
  const summaryEl = root.querySelector<HTMLElement>('[data-summary]');
  const countsEl = root.querySelector<HTMLElement>('[data-counts]');
  const bodyEl = root.querySelector<HTMLElement>('[data-table-body]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  if (!birthInput || !bodyEl) return;

  const defaults = { birth: root.dataset.defaultBirth ?? '2000-01-01' };
  const countsHighlight = root.dataset.countsHighlight ?? '';
  const rowHighlight = root.dataset.rowHighlight ?? '';

  const render = (): void => {
    const birth = parseISODate(birthInput.value);
    if (!birth) {
      if (summaryEl) summaryEl.textContent = 'Pick a valid date of birth.';
      if (countsEl) countsEl.innerHTML = '';
      bodyEl.innerHTML = '';
      return;
    }

    const view = buildBirthdayView(birth);
    if (summaryEl) summaryEl.textContent = view.summary;
    if (countsEl) countsEl.innerHTML = weekdayCountsHtml(view, countsHighlight);
    bodyEl.innerHTML = birthdayTableHtml(view, {
      currentClass: CURRENT_CLASS,
      nextClass: rowHighlight,
    });
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    birthInput.value =
      typeof state.birth === 'string' ? state.birth : defaults.birth;
  };

  const update = (): void => {
    render();
    writeUrlState(schema, { birth: birthInput.value }, { defaults });
  };

  applyState();
  render();

  birthInput.addEventListener('input', update);
  birthInput.addEventListener('change', update);

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

document
  .querySelectorAll<HTMLElement>('[data-birthday-widget]')
  .forEach(initRoot);
