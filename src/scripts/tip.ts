import { formatMoney, splitTip } from '../lib/tip';
import { readUrlState, writeUrlState } from '../lib/urlState';

const schema = { bill: 'number', tip: 'number', people: 'number' } as const;
const defaults = { bill: 100, tip: 15, people: 2 };

function initRoot(root: HTMLElement): void {
  const billInput = root.querySelector<HTMLInputElement>('[data-bill-input]');
  const tipInput = root.querySelector<HTMLInputElement>('[data-tip-input]');
  const peopleInput = root.querySelector<HTMLInputElement>('[data-people-input]');
  const valueEl = root.querySelector<HTMLElement>('[data-result-value]');
  const detailEl = root.querySelector<HTMLElement>('[data-result-detail]');
  const extraEl = root.querySelector<HTMLElement>('[data-result-extra]');
  const shareBtn = root.querySelector<HTMLButtonElement>('[data-share]');
  if (!billInput || !tipInput || !peopleInput || !valueEl) return;

  const readNumber = (input: HTMLInputElement, fallback: number): number => {
    const parsed = Number(input.value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const paint = (): void => {
    const bill = readNumber(billInput, defaults.bill);
    const tip = readNumber(tipInput, defaults.tip);
    const people = readNumber(peopleInput, defaults.people);
    const result = splitTip(bill, tip, people);

    if (!result) {
      valueEl.textContent = '–';
      if (detailEl) detailEl.textContent = 'Enter a bill, a tip and at least one person.';
      if (extraEl) extraEl.textContent = '';
      return;
    }

    valueEl.textContent = formatMoney(result.perPerson);
    if (detailEl) {
      detailEl.textContent = `Tip ${formatMoney(result.tipAmount)} • Total ${formatMoney(result.total)}`;
    }
    if (extraEl) extraEl.textContent = `Tip per person ${formatMoney(result.tipPerPerson)}`;
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    billInput.value = String(typeof state.bill === 'number' ? state.bill : defaults.bill);
    tipInput.value = String(typeof state.tip === 'number' ? state.tip : defaults.tip);
    peopleInput.value = String(typeof state.people === 'number' ? state.people : defaults.people);
  };

  const update = (): void => {
    paint();
    writeUrlState(
      schema,
      {
        bill: readNumber(billInput, defaults.bill),
        tip: readNumber(tipInput, defaults.tip),
        people: readNumber(peopleInput, defaults.people),
      },
      { defaults },
    );
  };

  applyState();
  paint();

  for (const input of [billInput, tipInput, peopleInput]) {
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
    paint();
  });
}

document.querySelectorAll<HTMLElement>('[data-tip-widget]').forEach(initRoot);
