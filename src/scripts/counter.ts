import { textStats } from '../lib/textStats';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

const schema = { in: 'string' } as const;
const DEFAULT_INPUT = 'The quick brown fox jumps over the lazy dog.';

function initRoot(root: HTMLElement): void {
  const input = root.querySelector<HTMLTextAreaElement>('[data-text-input]');
  if (!input) return;

  const render = (): void => {
    const stats = textStats(input.value);
    for (const [key, value] of Object.entries(stats)) {
      const el = root.querySelector<HTMLElement>(`[data-stat="${key}"]`);
      if (el) el.textContent = String(value);
    }
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    input.value = typeof state.in === 'string' ? state.in : DEFAULT_INPUT;
  };

  const update = (): void => {
    render();
    writeUrlState(schema, { in: input.value }, { defaults: { in: DEFAULT_INPUT } });
  };

  applyState();
  render();

  input.addEventListener('input', update);
  window.addEventListener('popstate', () => {
    applyState();
    render();
  });

  wireShare(root);
}

document.querySelectorAll<HTMLElement>('[data-counter-widget]').forEach(initRoot);
