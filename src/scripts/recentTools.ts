import { RECENT_TOOLS_KEY, pushRecent, sanitizeRecents } from '../lib/recentTools';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadRecents(): string[] {
  const store = storage();
  if (!store) return [];

  try {
    const raw = store.getItem(RECENT_TOOLS_KEY);
    return raw ? sanitizeRecents(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function rememberTool(path: string): void {
  const store = storage();
  if (!store) return;

  try {
    store.setItem(RECENT_TOOLS_KEY, JSON.stringify(pushRecent(loadRecents(), path)));
  } catch {
    return;
  }
}
