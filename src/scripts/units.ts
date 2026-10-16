import {
  DIMENSION_DEFAULTS,
  convert,
  convertAll,
  formatUnitValue,
  isDimension,
  type DimensionId,
} from '../lib/units';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

interface UnitOption {
  id: string;
  name: string;
  symbol: string;
}

const schema = { from: 'string', to: 'string', v: 'number' } as const;

function initRoot(root: HTMLElement): void {
  const dimension = root.dataset.dimension;
  if (!dimension || !isDimension(dimension)) return;
  const dim: DimensionId = dimension;
  const dimDefaults = DIMENSION_DEFAULTS[dim];
  const defaults = { from: dimDefaults.from, to: dimDefaults.to, v: 1 };

  const fromSelect = root.querySelector<HTMLSelectElement>('[data-from]');
  const toSelect = root.querySelector<HTMLSelectElement>('[data-to]');
  const valueInput = root.querySelector<HTMLInputElement>('[data-value]');
  const swapBtn = root.querySelector<HTMLButtonElement>('[data-swap]');
  const valueEl = root.querySelector<HTMLElement>('[data-result-value]');
  const unitEl = root.querySelector<HTMLElement>('[data-result-unit]');
  const detailEl = root.querySelector<HTMLElement>('[data-result-detail]');
  const tableEl = root.querySelector<HTMLElement>('[data-table]');
  if (!fromSelect || !toSelect || !valueInput || !valueEl) return;

  let units: UnitOption[] = [];
  try {
    units = JSON.parse(root.dataset.units ?? '[]') as UnitOption[];
  } catch {
    units = [];
  }
  const hasUnit = (id: string): boolean => units.some((unit) => unit.id === id);
  const symbolFor = (id: string): string =>
    units.find((unit) => unit.id === id)?.symbol ?? id;

  const paintTable = (value: number, from: string): void => {
    if (!tableEl) return;
    const conversions = convertAll(dim, value, from);
    tableEl.replaceChildren();
    if (!conversions) return;
    for (const conversion of conversions) {
      const row = document.createElement('tr');
      row.className =
        'flex items-baseline justify-between gap-4 px-4 py-2 odd:bg-white dark:odd:bg-zinc-900/60';
      const nameCell = document.createElement('th');
      nameCell.scope = 'row';
      nameCell.className = 'text-left font-normal text-zinc-500 dark:text-zinc-400';
      nameCell.textContent = `${conversion.unit.name} (${conversion.unit.symbol})`;
      const valueCell = document.createElement('td');
      valueCell.className = 'tabular-nums text-zinc-900 dark:text-zinc-100';
      valueCell.textContent = formatUnitValue(conversion.value);
      row.append(nameCell, valueCell);
      tableEl.append(row);
    }
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    fromSelect.value =
      typeof state.from === 'string' && hasUnit(state.from) ? state.from : defaults.from;
    toSelect.value = typeof state.to === 'string' && hasUnit(state.to) ? state.to : defaults.to;
    valueInput.value = typeof state.v === 'number' ? String(state.v) : String(defaults.v);
  };

  const paint = (): void => {
    const raw = valueInput.value.trim();
    const value = raw === '' ? null : Number(raw);
    const from = fromSelect.value;
    const to = toSelect.value;

    if (value == null || !Number.isFinite(value)) {
      valueEl.textContent = '–';
      if (unitEl) unitEl.textContent = '';
      if (detailEl) detailEl.textContent = 'Enter an amount to convert.';
      if (tableEl) tableEl.replaceChildren();
    } else {
      const result = convert(dim, value, from, to);
      valueEl.textContent = result == null ? '–' : formatUnitValue(result);
      if (unitEl) unitEl.textContent = symbolFor(to);
      if (detailEl) {
        detailEl.textContent = `${formatUnitValue(value)} ${symbolFor(from)} equals ${result == null ? '–' : formatUnitValue(result)} ${symbolFor(to)}.`;
      }
      paintTable(value, from);
    }

    writeUrlState(
      schema,
      {
        from,
        to,
        v: value != null && Number.isFinite(value) ? value : null,
      },
      { defaults },
    );
  };

  applyState();
  paint();

  fromSelect.addEventListener('change', paint);
  toSelect.addEventListener('change', paint);
  valueInput.addEventListener('input', paint);

  swapBtn?.addEventListener('click', () => {
    const from = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = from;
    paint();
  });

  wireShare(root);

  window.addEventListener('popstate', () => {
    applyState();
    paint();
  });
}

document.querySelectorAll<HTMLElement>('[data-units-widget]').forEach(initRoot);
