import { SPEED_PRESETS, formatDuration, transferSeconds } from '../lib/downloadTime';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

interface UnitOption {
  id: string;
  name: string;
  symbol: string;
}

const schema = {
  size: 'number',
  sunit: 'string',
  rate: 'number',
  runit: 'string',
} as const;
const defaults = { size: 1000, sunit: 'mb', rate: 10, runit: 'MBps' };

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function symbolFor(units: UnitOption[], id: string): string {
  return units.find((unit) => unit.id === id)?.symbol ?? id;
}

function initRoot(root: HTMLElement): void {
  const sizeInput = root.querySelector<HTMLInputElement>('[data-size]');
  const sizeUnitSelect = root.querySelector<HTMLSelectElement>('[data-size-unit]');
  const rateInput = root.querySelector<HTMLInputElement>('[data-rate]');
  const rateUnitSelect = root.querySelector<HTMLSelectElement>('[data-rate-unit]');
  const valueEl = root.querySelector<HTMLElement>('[data-result-value]');
  const detailEl = root.querySelector<HTMLElement>('[data-result-detail]');
  const tableEl = root.querySelector<HTMLElement>('[data-table]');
  if (!sizeInput || !sizeUnitSelect || !rateInput || !rateUnitSelect || !valueEl) return;

  let sizeUnits: UnitOption[] = [];
  let rateUnits: UnitOption[] = [];
  try {
    sizeUnits = JSON.parse(root.dataset.sizeUnits ?? '[]') as UnitOption[];
    rateUnits = JSON.parse(root.dataset.rateUnits ?? '[]') as UnitOption[];
  } catch {
    sizeUnits = [];
    rateUnits = [];
  }
  const hasUnit = (units: UnitOption[], id: string): boolean =>
    units.some((unit) => unit.id === id);

  const paintTable = (size: number | null, sizeUnit: string): void => {
    if (!tableEl) return;
    tableEl.replaceChildren();
    if (size == null) return;
    for (const preset of SPEED_PRESETS) {
      const seconds = transferSeconds(size, sizeUnit, preset.value, preset.unit);
      const row = document.createElement('tr');
      row.className =
        'flex items-center justify-between gap-4 px-4 py-2 odd:bg-white dark:odd:bg-zinc-900/60';
      const speedCell = document.createElement('th');
      speedCell.scope = 'row';
      speedCell.className = 'text-left font-normal text-zinc-500 dark:text-zinc-400';
      speedCell.textContent = preset.label;
      const timeCell = document.createElement('td');
      timeCell.className = 'tabular-nums text-zinc-900 dark:text-zinc-100';
      timeCell.textContent = seconds == null ? '–' : formatDuration(seconds);
      row.append(speedCell, timeCell);
      tableEl.append(row);
    }
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    sizeInput.value = typeof state.size === 'number' ? String(state.size) : String(defaults.size);
    sizeUnitSelect.value =
      typeof state.sunit === 'string' && hasUnit(sizeUnits, state.sunit)
        ? state.sunit
        : defaults.sunit;
    rateInput.value = typeof state.rate === 'number' ? String(state.rate) : String(defaults.rate);
    rateUnitSelect.value =
      typeof state.runit === 'string' && hasUnit(rateUnits, state.runit)
        ? state.runit
        : defaults.runit;
  };

  const paint = (): void => {
    const size = parseNumber(sizeInput.value);
    const rate = parseNumber(rateInput.value);
    const sizeUnit = sizeUnitSelect.value;
    const rateUnit = rateUnitSelect.value;

    const seconds = size != null && rate != null ? transferSeconds(size, sizeUnit, rate, rateUnit) : null;
    valueEl.textContent = seconds == null ? '–' : formatDuration(seconds);
    if (detailEl) {
      detailEl.textContent =
        size == null || rate == null
          ? 'Enter a size and a speed.'
          : `${size} ${symbolFor(sizeUnits, sizeUnit)} at ${rate} ${symbolFor(rateUnits, rateUnit)}`;
    }
    paintTable(size, sizeUnit);

    writeUrlState(
      schema,
      {
        size: size != null ? size : null,
        sunit: sizeUnit,
        rate: rate != null ? rate : null,
        runit: rateUnit,
      },
      { defaults },
    );
  };

  applyState();
  paint();

  sizeInput.addEventListener('input', paint);
  sizeUnitSelect.addEventListener('change', paint);
  rateInput.addEventListener('input', paint);
  rateUnitSelect.addEventListener('change', paint);

  wireShare(root);

  window.addEventListener('popstate', () => {
    applyState();
    paint();
  });
}

document.querySelectorAll<HTMLElement>('[data-download-widget]').forEach(initRoot);
