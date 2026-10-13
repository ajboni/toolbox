import { formatJson, minifyJson } from '../lib/json';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireCopy, wireShare } from './ui';

const schema = { in: 'string', mode: 'string', indent: 'number' } as const;
const STATUS_BASE = 'mt-2 text-xs text-zinc-500 dark:text-zinc-500';
const STATUS_ERROR = 'mt-2 text-xs text-rose-600 dark:text-rose-400';

function initRoot(root: HTMLElement): void {
  const input = root.querySelector<HTMLTextAreaElement>('[data-json-input]');
  const output = root.querySelector<HTMLTextAreaElement>('[data-json-output]');
  const modeSelect = root.querySelector<HTMLSelectElement>('[data-mode-select]');
  const indentSelect = root.querySelector<HTMLSelectElement>('[data-indent-select]');
  const indentField = root.querySelector<HTMLElement>('[data-indent-field]');
  const statusEl = root.querySelector<HTMLElement>('[data-status]');
  if (!input || !output || !modeSelect || !indentSelect) return;

  const defaultInput = input.value;
  const defaultMode = modeSelect.value;
  const defaultIndent = Number(indentSelect.value);
  const defaults = { in: defaultInput, mode: defaultMode, indent: defaultIndent };

  const render = (): void => {
    const mode = modeSelect.value === 'min' ? 'min' : 'pretty';
    const indent = Number(indentSelect.value);
    if (indentField) indentField.hidden = mode === 'min';

    const result =
      mode === 'min' ? minifyJson(input.value) : formatJson(input.value, { indent });
    output.value = result.output;

    if (statusEl) {
      statusEl.textContent = result.ok ? '' : `Invalid JSON: ${result.error}`;
      statusEl.className = result.ok ? STATUS_BASE : STATUS_ERROR;
    }
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    input.value = typeof state.in === 'string' ? state.in : defaultInput;
    modeSelect.value = state.mode === 'min' ? 'min' : defaultMode;
    indentSelect.value = state.indent === 4 ? '4' : String(defaultIndent);
  };

  const update = (): void => {
    writeUrlState(
      schema,
      { in: input.value, mode: modeSelect.value, indent: Number(indentSelect.value) },
      { defaults },
    );
    render();
  };

  applyState();
  render();

  input.addEventListener('input', update);
  modeSelect.addEventListener('change', update);
  indentSelect.addEventListener('change', update);

  window.addEventListener('popstate', () => {
    applyState();
    render();
  });

  wireShare(root);
  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-json-widget]').forEach(initRoot);
