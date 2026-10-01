import { decodeUrl, encodeUrl } from '../lib/urlEncode';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireCopy, wireShare } from './ui';

const schema = { in: 'string', dir: 'string' } as const;
const defaults = { in: 'a b&c=d?e', dir: 'encode' };

function initRoot(root: HTMLElement): void {
  const input = root.querySelector<HTMLTextAreaElement>('[data-text-input]');
  const output = root.querySelector<HTMLTextAreaElement>('[data-output]');
  const dirSelect = root.querySelector<HTMLSelectElement>('[data-dir-select]');
  const statusEl = root.querySelector<HTMLElement>('[data-status]');
  if (!input || !output || !dirSelect) return;

  const render = (): void => {
    if (dirSelect.value === 'decode') {
      const decoded = decodeUrl(input.value);
      output.value = decoded ?? '';
      if (statusEl) statusEl.textContent = decoded == null ? 'That is not a valid encoded string.' : '';
      return;
    }
    output.value = encodeUrl(input.value);
    if (statusEl) statusEl.textContent = '';
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    input.value = typeof state.in === 'string' ? state.in : defaults.in;
    dirSelect.value = state.dir === 'decode' ? 'decode' : 'encode';
  };

  const update = (): void => {
    render();
    writeUrlState(schema, { in: input.value, dir: dirSelect.value }, { defaults });
  };

  applyState();
  render();

  input.addEventListener('input', update);
  dirSelect.addEventListener('change', update);

  window.addEventListener('popstate', () => {
    applyState();
    render();
  });

  wireShare(root);
  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-url-widget]').forEach(initRoot);
