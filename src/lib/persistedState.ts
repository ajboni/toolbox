export type StoredState = Record<string, string | number>;

export const BOARD_STORAGE_KEY = 'world-clock:board';

export interface BoardState {
  clock: string;
  face: string;
  seconds: number;
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readStoredState(key: string): StoredState | null {
  const store = storage();
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

export function writeStoredState(key: string, values: StoredState): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(values));
  } catch {
    return;
  }
}

export function clearStoredState(key: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(key);
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
