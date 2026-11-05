export type StoredState = Record<string, string | number>;

export type StorageArea = 'local' | 'session';

export const BOARD_STORAGE_KEY = 'world-clock:board';

export interface BoardState {
  clock: string;
  face: string;
  seconds: number;
}

function storage(area: StorageArea): Storage | null {
  try {
    if (area === 'session') {
      return typeof sessionStorage === 'undefined' ? null : sessionStorage;
    }
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readStoredState(key: string, area: StorageArea = 'local'): StoredState | null {
  const store = storage(area);
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return null;
    const state: StoredState = {};
    for (const [name, value] of Object.entries(parsed)) {
      if (typeof value === 'string' || typeof value === 'number') state[name] = value;
    }
    return state;
  } catch {
    return null;
  }
}

export function writeStoredState(
  key: string,
  values: StoredState,
  area: StorageArea = 'local',
): void {
  const store = storage(area);
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(values));
  } catch {
    return;
  }
}

export function clearStoredState(key: string, area: StorageArea = 'local'): void {
  const store = storage(area);
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    return;
  }
}

export function readStoredJson<T>(
  key: string,
  parse: (value: unknown) => T | null,
  area: StorageArea = 'local',
): T | null {
  const store = storage(area);
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    return parse(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function writeStoredJson(
  key: string,
  value: unknown,
  area: StorageArea = 'local',
): void {
  const store = storage(area);
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function resolveBoardState(
  url: Record<string, string | number>,
  stored: StoredState | null,
  defaults: BoardState,
): BoardState {
  const pick = (key: keyof BoardState): string | number => {
    const fromUrl = url[key];
    if (fromUrl !== undefined && fromUrl !== '') return fromUrl;
    const fromStored = stored?.[key];
    if (fromStored !== undefined && fromStored !== '') return fromStored;
    return defaults[key];
  };
  return {
    clock: String(pick('clock')),
    face: String(pick('face')),
    seconds: Number(pick('seconds')),
  };
}
