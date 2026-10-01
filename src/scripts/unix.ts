import {
  epochToMillis,
  formatRelative,
  isValidDate,
  millisToEpoch,
} from '../lib/timestamp';
import { readUrlState, writeUrlState } from '../lib/urlState';

const schema = { t: 'number' } as const;

function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function initRoot(root: HTMLElement): void {
  const epochInput = root.querySelector<HTMLInputElement>('[data-epoch-input]');
  const dateInput = root.querySelector<HTMLInputElement>('[data-datetime-input]');
  const utcEl = root.querySelector<HTMLElement>('[data-result-utc]');
  const detailEl = root.querySelector<HTMLElement>('[data-result-detail]');
  const extraEl = root.querySelector<HTMLElement>('[data-result-extra]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  if (!epochInput || !dateInput || !utcEl) return;

  const defaultSeconds = Math.floor(Date.now() / 1000);

  const paint = (date: Date): void => {
    const epoch = millisToEpoch(date);
    utcEl.textContent = date.toUTCString();
    if (detailEl) {
      detailEl.textContent = `Local time: ${date.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      })}`;
    }
    if (extraEl) {
      extraEl.textContent = `Seconds: ${epoch.seconds.toLocaleString('en-US')} • Milliseconds: ${epoch.milliseconds.toLocaleString('en-US')} • ${formatRelative(epoch.milliseconds)}`;
    }
  };

  const fromEpoch = (): void => {
    const millis = epochToMillis(epochInput.value);
    if (millis == null) {
      utcEl.textContent = '–';
      if (detailEl) detailEl.textContent = 'Enter a numeric Unix timestamp.';
      if (extraEl) extraEl.textContent = '';
      return;
    }
    const date = new Date(millis);
    if (!isValidDate(date)) {
      utcEl.textContent = '–';
      if (detailEl) detailEl.textContent = 'That timestamp is out of range.';
      if (extraEl) extraEl.textContent = '';
      return;
    }
    dateInput.value = toLocalInput(date);
    paint(date);
    writeUrlState(
      schema,
      { t: Math.floor(millis / 1000) },
      { defaults: { t: defaultSeconds } },
    );
  };

  const fromDate = (): void => {
    const date = new Date(dateInput.value);
    if (!isValidDate(date)) return;
    epochInput.value = String(millisToEpoch(date).seconds);
    paint(date);
    writeUrlState(
      schema,
      { t: Math.floor(date.getTime() / 1000) },
      { defaults: { t: defaultSeconds } },
    );
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    const seconds = typeof state.t === 'number' ? state.t : defaultSeconds;
    const date = new Date(seconds * 1000);
    epochInput.value = String(seconds);
    dateInput.value = toLocalInput(date);
    paint(date);
  };

  applyState();

  epochInput.addEventListener('input', fromEpoch);
  dateInput.addEventListener('change', fromDate);

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

  window.addEventListener('popstate', applyState);
}

document.querySelectorAll<HTMLElement>('[data-unix-widget]').forEach(initRoot);
