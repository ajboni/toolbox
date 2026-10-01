import { HASH_ALGORITHMS, hashText, type HashAlgorithm } from '../lib/hash';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireCopy, wireShare } from './ui';

const schema = { in: 'string', alg: 'string' } as const;
const defaults = { in: 'hello world', alg: 'SHA-256' };

function asAlgorithm(value: unknown): HashAlgorithm {
  return HASH_ALGORITHMS.includes(value as HashAlgorithm)
    ? (value as HashAlgorithm)
    : 'SHA-256';
}

function initRoot(root: HTMLElement): void {
  const input = root.querySelector<HTMLTextAreaElement>('[data-text-input]');
  const algSelect = root.querySelector<HTMLSelectElement>('[data-alg-select]');
  const output = root.querySelector<HTMLElement>('[data-output]');
  if (!input || !algSelect || !output) return;

  let token = 0;

  const render = async (): Promise<void> => {
    const current = ++token;
    const digest = await hashText(input.value, asAlgorithm(algSelect.value));
    if (current === token) output.textContent = digest;
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    input.value = typeof state.in === 'string' ? state.in : defaults.in;
    algSelect.value = asAlgorithm(state.alg);
  };

  const update = (): void => {
    void render();
    writeUrlState(schema, { in: input.value, alg: algSelect.value }, { defaults });
  };

  applyState();
  void render();

  input.addEventListener('input', update);
  algSelect.addEventListener('change', update);

  window.addEventListener('popstate', () => {
    applyState();
    void render();
  });

  wireShare(root);
  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-hash-widget]').forEach(initRoot);
