export type ParamType = 'string' | 'number' | 'date';

export interface ParamSchema {
  [key: string]: ParamType;
}

export type ParsedState = Record<string, string | number>;
export type StateValues = Record<string, string | number | null | undefined>;

export interface WriteOptions {
  replace?: boolean;
  defaults?: StateValues;
}

function coerce(type: ParamType, raw: string): string | number | null {
  if (type === 'number') {
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }
  return raw;
}

export function readUrlState(
  schema: ParamSchema,
  search: string = typeof location !== 'undefined' ? location.search : '',
): ParsedState {
  const params = new URLSearchParams(search);
  const state: ParsedState = {};
  for (const [key, type] of Object.entries(schema)) {
    const raw = params.get(key);
    if (raw == null || raw === '') continue;
    const value = coerce(type, raw);
    if (value !== null) state[key] = value;
  }
  return state;
}

export function buildSearch(
  schema: ParamSchema,
  values: StateValues,
  defaults: StateValues = {},
): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(schema)) {
    const value = values[key];
    if (value == null || value === '') continue;
    if (defaults[key] != null && String(value) === String(defaults[key])) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export function writeUrlState(
  schema: ParamSchema,
  values: StateValues,
  options: WriteOptions = {},
): void {
  if (typeof location === 'undefined' || typeof history === 'undefined') return;
  const { replace = true, defaults = {} } = options;
  const query = buildSearch(schema, values, defaults);
  const url = location.pathname + (query ? `?${query}` : '') + location.hash;
  const method = replace ? 'replaceState' : 'pushState';
  history[method]({}, '', url);
}
