import { generateUuids } from '../lib/id';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireCopy, wireShare } from './ui';

const schema = { n: 'number', upper: 'number' } as const;
const defaults = { n: 5, upper: 0 };

function initRoot(root: HTMLElement): void {
  const countInput = root.querySelector<HTMLInputElement>('[data-count-input]');
  const upperBox = root.querySelector<HTMLInputElement>('[data-upper-checkbox]');
  const output = root.querySelector<HTMLElement>('[data-output]');
  const generateBtn = root.querySelector<HTMLButtonElement>('[data-generate]');
  if (!countInput || !upperBox || !output) return;

  const readCount = (): number => {
    const parsed = Number.parseInt(countInput.value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaults.n;
  };

  const render = (): void => {
    output.textContent = generateUuids(readCount(), upperBox.checked).join('\n');
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    countInput.value = String(typeof state.n === 'number' ? state.n : defaults.n);
    upperBox.checked = state.upper === 1;
  };

  const update = (): void => {
    render();
    writeUrlState(
      schema,
      { n: readCount(), upper: upperBox.checked ? 1 : 0 },
      { defaults },
    );
  };

  applyState();
  render();

  countInput.addEventListener('change', update);
  upperBox.addEventListener('change', update);
  generateBtn?.addEventListener('click', render);

  window.addEventListener('popstate', () => {
    applyState();
    render();
  });

  wireShare(root);
  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-uuid-widget]').forEach(initRoot);
