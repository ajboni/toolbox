import { addDays, humanizeDays, parseISODate, toISODate } from '../lib/dates';
import { readUrlState, writeUrlState } from '../lib/urlState';

const schema = { from: 'date', days: 'number' } as const;
const DEFAULT_DAYS = 30;

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function initRoot(root: HTMLElement): void {
  const mode = root.dataset.mode === 'offset' ? 'offset' : 'picker';
  const fromInput = root.querySelector<HTMLInputElement>('[data-from-input]');
  const daysInput = root.querySelector<HTMLInputElement>('[data-days-input]');
  const dateEl = root.querySelector<HTMLElement>('[data-result-date]');
  const detailEl = root.querySelector<HTMLElement>('[data-result-detail]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  if (!dateEl) return;

  const todayISO = toISODate(new Date());

  const readFrom = (): Date => {
    const state = readUrlState(schema);
    const fromUrl = parseISODate(typeof state.from === 'string' ? state.from : null);
    return fromUrl ?? new Date();
  };

  const readDays = (): number => {
    if (mode === 'offset') {
      const fixed = Number(root.dataset.days);
      return Number.isFinite(fixed) ? fixed : DEFAULT_DAYS;
    }
    const state = readUrlState(schema);
    return typeof state.days === 'number' ? state.days : DEFAULT_DAYS;
  };

  const render = (from: Date, days: number): void => {
    const result = addDays(from, days);
    dateEl.textContent = formatLongDate(result);
    if (!detailEl) return;

    const { weeks, remainderDays, days: absDays } = humanizeDays(days);
    if (days > 0) {
      detailEl.textContent = `${days} days from ${formatLongDate(from)} — about ${weeks} weeks and ${remainderDays} days.`;
    } else if (days < 0) {
      detailEl.textContent = `${absDays} days before ${formatLongDate(from)} — about ${weeks} weeks and ${remainderDays} days.`;
    } else {
      detailEl.textContent = `Same day as ${formatLongDate(from)}.`;
    }
  };

  const currentFrom = mode === 'offset' ? new Date() : readFrom();
  const currentDays = readDays();

  if (fromInput) fromInput.value = toISODate(currentFrom);
  if (daysInput && mode === 'picker') daysInput.value = String(currentDays);
  render(currentFrom, currentDays);

  const update = (): void => {
    if (mode === 'offset') return;
    const from = fromInput ? (parseISODate(fromInput.value) ?? new Date()) : new Date();
    const parsedDays = daysInput ? Number.parseInt(daysInput.value, 10) : DEFAULT_DAYS;
    const days = Number.isFinite(parsedDays) ? parsedDays : DEFAULT_DAYS;
    render(from, days);
    writeUrlState(
      schema,
      { from: toISODate(from), days },
      { defaults: { from: todayISO, days: DEFAULT_DAYS } },
    );
  };

  if (mode === 'picker') {
    fromInput?.addEventListener('input', update);
    fromInput?.addEventListener('change', update);
    daysInput?.addEventListener('input', update);
    daysInput?.addEventListener('change', update);
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

  if (mode === 'picker') {
    window.addEventListener('popstate', () => {
      const from = readFrom();
      const days = readDays();
      if (fromInput) fromInput.value = toISODate(from);
      if (daysInput) daysInput.value = String(days);
      render(from, days);
    });
  }
}

const roots = document.querySelectorAll<HTMLElement>('[data-days-from]');
roots.forEach(initRoot);
