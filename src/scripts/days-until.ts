import {
  daysUntil,
  humanizeDays,
  nextAnnualOccurrence,
  nextNewYear,
  parseISODate,
  toISODate,
} from '../lib/dates';
import { readUrlState, writeUrlState } from '../lib/urlState';

const schema = { date: 'date' } as const;

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function initRoot(root: HTMLElement): void {
  const mode = root.dataset.mode === 'annual' ? 'annual' : 'picker';
  const input = root.querySelector<HTMLInputElement>('[data-date-input]');
  const numberEl = root.querySelector<HTMLElement>('[data-result-days]');
  const labelEl = root.querySelector<HTMLElement>('[data-result-label]');
  const detailEl = root.querySelector<HTMLElement>('[data-result-detail]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  if (!numberEl) return;

  const defaultDate = nextNewYear();
  const defaultISO = toISODate(defaultDate);

  const readPickerTarget = (): Date => {
    const state = readUrlState(schema);
    const fromUrl = parseISODate(typeof state.date === 'string' ? state.date : null);
    return fromUrl ?? defaultDate;
  };

  const resolveTarget = (): Date => {
    if (mode === 'annual') {
      const month = Number(root.dataset.annualMonth);
      const day = Number(root.dataset.annualDay);
      if (Number.isFinite(month) && Number.isFinite(day)) {
        return nextAnnualOccurrence(month, day);
      }
      return defaultDate;
    }
    return readPickerTarget();
  };

  const render = (target: Date): void => {
    const days = daysUntil(target);
    if (days > 0) {
      const { weeks, remainderDays, months } = humanizeDays(days);
      numberEl.textContent = String(days);
      if (labelEl) labelEl.textContent = days === 1 ? 'day' : 'days';
      if (detailEl) {
        detailEl.textContent = `That's about ${weeks} weeks and ${remainderDays} days, or roughly ${months} months. Target: ${formatLongDate(target)}.`;
      }
    } else if (days === 0) {
      numberEl.textContent = '0';
      if (labelEl) labelEl.textContent = 'days';
      if (detailEl) detailEl.textContent = `It's today — ${formatLongDate(target)}.`;
    } else {
      const { days: abs } = humanizeDays(days);
      numberEl.textContent = String(abs);
      if (labelEl) labelEl.textContent = 'days ago';
      if (detailEl) detailEl.textContent = `That date was ${formatLongDate(target)}.`;
    }
  };

  const currentTarget = resolveTarget();
  if (input) input.value = toISODate(currentTarget);
  render(currentTarget);

  if (input && mode === 'picker') {
    const onInput = (): void => {
      const parsed = parseISODate(input.value);
      if (!parsed) return;
      render(parsed);
      writeUrlState(schema, { date: input.value }, { defaults: { date: defaultISO } });
    };
    input.addEventListener('input', onInput);
    input.addEventListener('change', onInput);
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
      const target = readPickerTarget();
      if (input) input.value = toISODate(target);
      render(target);
    });
  }
}

const roots = document.querySelectorAll<HTMLElement>('[data-days-until]');
roots.forEach(initRoot);
