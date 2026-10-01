import { decodeBase64, encodeBase64 } from '../lib/base64';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireCopy, wireShare } from './ui';

const schema = { in: 'string', dir: 'string', urlSafe: 'number' } as const;
const defaults = { in: 'hello world', dir: 'encode', urlSafe: 0 };

function initRoot(root: HTMLElement): void {
  const input = root.querySelector<HTMLTextAreaElement>('[data-text-input]');
  const output = root.querySelector<HTMLTextAreaElement>('[data-output]');
  const dirSelect = root.querySelector<HTMLSelectElement>('[data-dir-select]');
  const urlSafeBox = root.querySelector<HTMLInputElement>('[data-urlsafe-checkbox]');
  const statusEl = root.querySelector<HTMLElement>('[data-status]');
  if (!input || !output || !dirSelect || !urlSafeBox) return;

  const render = (): void => {
    const urlSafe = urlSafeBox.checked;
    if (dirSelect.value === 'decode') {
      const decoded = decodeBase64(input.value);
      output.value = decoded ?? '';
      if (statusEl) statusEl.textContent = decoded == null ? 'That is not valid Base64.' : '';
      return;
    }
    output.value = encodeBase64(input.value, urlSafe);
    if (statusEl) statusEl.textContent = '';
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    input.value = typeof state.in === 'string' ? state.in : defaults.in;
    dirSelect.value = state.dir === 'decode' ? 'decode' : 'encode';
    urlSafeBox.checked = state.urlSafe === 1;
  };

  const update = (): void => {
    render();
    writeUrlState(
      schema,
      { in: input.value, dir: dirSelect.value, urlSafe: urlSafeBox.checked ? 1 : 0 },
      { defaults },
    );
  };

  applyState();
  render();

  input.addEventListener('input', update);
  dirSelect.addEventListener('change', update);
  urlSafeBox.addEventListener('change', update);

  window.addEventListener('popstate', () => {
    applyState();
    render();
  });

  wireShare(root);
  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-base64-widget]').forEach(initRoot);
