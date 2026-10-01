import { CASE_MODES, convertCase } from '../lib/caseConvert';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireCopy, wireShare } from './ui';

const schema = { in: 'string' } as const;
const DEFAULT_INPUT = 'hello world again';

function initRoot(root: HTMLElement): void {
  const input = root.querySelector<HTMLTextAreaElement>('[data-text-input]');
  if (!input) return;

  const render = (): void => {
    for (const mode of CASE_MODES) {
      const el = root.querySelector<HTMLElement>(`[data-case="${mode}"]`);
      if (el) el.textContent = convertCase(input.value, mode);
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
  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-case-widget]').forEach(initRoot);
