import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BOARD_STORAGE_KEY,
  clearStoredState,
  readStoredState,
  resolveBoardState,
  writeStoredState,
  type BoardState,
} from './persistedState';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const original = (globalThis as { localStorage?: Storage }).localStorage;

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = new MemoryStorage();
});

afterEach(() => {
  if (original === undefined) {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  } else {
    (globalThis as { localStorage?: Storage }).localStorage = original;
  }
});

describe('readStoredState', () => {
  it('round-trips string and number values', () => {
    writeStoredState(BOARD_STORAGE_KEY, { clock: 'Asia/Tokyo', seconds: 0 });
    expect(readStoredState(BOARD_STORAGE_KEY)).toEqual({
      clock: 'Asia/Tokyo',
      seconds: 0,
    });
  });

  it('returns null for missing, corrupt or non-object data', () => {
    expect(readStoredState(BOARD_STORAGE_KEY)).toBeNull();
    localStorage.setItem(BOARD_STORAGE_KEY, '{not json');
    expect(readStoredState(BOARD_STORAGE_KEY)).toBeNull();
    localStorage.setItem(BOARD_STORAGE_KEY, '[1,2,3]');
    expect(readStoredState(BOARD_STORAGE_KEY)).toBeNull();
  });

  it('drops unsupported value types', () => {
    localStorage.setItem(
      BOARD_STORAGE_KEY,
      JSON.stringify({ clock: 'Asia/Tokyo', face: true }),
    );
    expect(readStoredState(BOARD_STORAGE_KEY)).toEqual({ clock: 'Asia/Tokyo' });
  });

  it('is a no-op when storage is unavailable', () => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
    expect(readStoredState(BOARD_STORAGE_KEY)).toBeNull();
    expect(() => writeStoredState(BOARD_STORAGE_KEY, { clock: 'UTC' })).not.toThrow();
    expect(() => clearStoredState(BOARD_STORAGE_KEY)).not.toThrow();
  });
});

describe('clearStoredState', () => {
  it('removes the stored key', () => {
    writeStoredState(BOARD_STORAGE_KEY, { clock: 'UTC' });
    clearStoredState(BOARD_STORAGE_KEY);
    expect(readStoredState(BOARD_STORAGE_KEY)).toBeNull();
  });
});

describe('resolveBoardState', () => {
  const defaults: BoardState = {
    clock: 'America/New_York,Europe/London,Asia/Tokyo',
    face: 'digital',
    seconds: 1,
  };

  it('falls back to defaults with no url or stored state', () => {
    expect(resolveBoardState({}, null, defaults)).toEqual(defaults);
  });

  it('prefers stored state over defaults', () => {
    const stored = { clock: 'Europe/Prague', face: 'analog', seconds: 0 };
    expect(resolveBoardState({}, stored, defaults)).toEqual({
      clock: 'Europe/Prague',
      face: 'analog',
      seconds: 0,
    });
  });

  it('prefers url state per key over stored state', () => {
    const stored = { clock: 'Europe/Prague', face: 'analog', seconds: 0 };
    expect(resolveBoardState({ clock: 'Asia/Tokyo' }, stored, defaults)).toEqual({
      clock: 'Asia/Tokyo',
      face: 'analog',
      seconds: 0,
    });
  });

  it('ignores empty url values', () => {
    const stored = { clock: 'Europe/Prague', face: 'minimal', seconds: 1 };
    expect(resolveBoardState({ clock: '', face: '' }, stored, defaults)).toEqual({
      clock: 'Europe/Prague',
      face: 'minimal',
      seconds: 1,
    });
  });
});
