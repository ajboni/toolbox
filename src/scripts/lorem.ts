import { generateLorem, type LoremUnit } from '../lib/lorem';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireCopy, wireShare } from './ui';

const schema = { units: 'string', count: 'number', seed: 'number', lorem: 'number' } as const;
const defaults = { units: 'paragraphs', count: 3, seed: 12345, lorem: 1 };
const UNITS: LoremUnit[] = ['paragraphs', 'sentences', 'words'];

function asUnit(value: unknown): LoremUnit {
  return UNITS.includes(value as LoremUnit) ? (value as LoremUnit) : 'paragraphs';
}

function initRoot(root: HTMLElement): void {
  const unitsSelect = root.querySelector<HTMLSelectElement>('[data-units-select]');
  const countInput = root.querySelector<HTMLInputElement>('[data-count-input]');
  const seedInput = root.querySelector<HTMLInputElement>('[data-seed-input]');
  const loremBox = root.querySelector<HTMLInputElement>('[data-lorem-checkbox]');
  const output = root.querySelector<HTMLElement>('[data-output]');
  const reseedBtn = root.querySelector<HTMLButtonElement>('[data-reseed]');
  if (!unitsSelect || !countInput || !seedInput || !loremBox || !output) return;

  const readCount = (): number => {
    const parsed = Number.parseInt(countInput.value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaults.count;
  };

  const readSeed = (): number => {
    const parsed = Number.parseInt(seedInput.value, 10);
    return Number.isFinite(parsed) ? parsed : defaults.seed;
  };

  const render = (): void => {
    output.textContent = generateLorem({
      units: asUnit(unitsSelect.value),
      count: readCount(),
      seed: readSeed(),
      startWithLorem: loremBox.checked,
    });
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    unitsSelect.value = asUnit(state.units);
    countInput.value = String(typeof state.count === 'number' ? state.count : defaults.count);
    seedInput.value = String(typeof state.seed === 'number' ? state.seed : defaults.seed);
    loremBox.checked = state.lorem !== 0;
  };

  const update = (): void => {
    render();
    writeUrlState(
      schema,
      {
        units: asUnit(unitsSelect.value),
        count: readCount(),
        seed: readSeed(),
        lorem: loremBox.checked ? 1 : 0,
      },
      { defaults },
    );
  };

  applyState();
  render();

  unitsSelect.addEventListener('change', update);
  countInput.addEventListener('input', update);
  seedInput.addEventListener('input', update);
  loremBox.addEventListener('change', update);
  reseedBtn?.addEventListener('click', () => {
    seedInput.value = String(Math.floor(Math.random() * 1_000_000));
    update();
  });

  window.addEventListener('popstate', () => {
    applyState();
    render();
  });

  wireShare(root);
  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-lorem-widget]').forEach(initRoot);
