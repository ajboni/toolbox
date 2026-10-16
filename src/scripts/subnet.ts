import { subnetInfo } from '../lib/subnet';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

const schema = { cidr: 'string' } as const;
const defaults = { cidr: '192.168.1.0/24' };
const OUT_KEYS = [
  'broadcast',
  'firstHost',
  'lastHost',
  'netmask',
  'wildcard',
  'totalAddresses',
  'usableHosts',
] as const;

function noteFor(info: { type: string; usableHosts: number }): string {
  const hosts = info.usableHosts.toLocaleString('en-US');
  if (info.type === 'host') return 'Single host (/32): one usable address.';
  if (info.type === 'point-to-point') {
    return 'Point-to-point link (/31): both addresses are usable.';
  }
  return `${hosts} usable hosts in this block.`;
}

function initRoot(root: HTMLElement): void {
  const input = root.querySelector<HTMLInputElement>('[data-cidr]');
  const errorEl = root.querySelector<HTMLElement>('[data-error]');
  const valueEl = root.querySelector<HTMLElement>('[data-result-value]');
  const noteEl = root.querySelector<HTMLElement>('[data-note]');
  if (!input || !valueEl) return;

  const outs: Partial<Record<(typeof OUT_KEYS)[number], HTMLElement | null>> = {};
  for (const key of OUT_KEYS) {
    outs[key] = root.querySelector<HTMLElement>(`[data-out="${key}"]`);
  }

  const setOut = (key: (typeof OUT_KEYS)[number], value: string): void => {
    const el = outs[key];
    if (el) el.textContent = value;
  };

  const paint = (): void => {
    const cidr = input.value;
    const result = subnetInfo(cidr);

    if (result.ok) {
      const { info } = result;
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
      valueEl.textContent = `${info.network}/${info.prefix}`;
      setOut('broadcast', info.broadcast);
      setOut('firstHost', info.firstHost ?? '–');
      setOut('lastHost', info.lastHost ?? '–');
      setOut('netmask', info.netmask);
      setOut('wildcard', info.wildcard);
      setOut('totalAddresses', info.totalAddresses.toLocaleString('en-US'));
      setOut('usableHosts', info.usableHosts.toLocaleString('en-US'));
      if (noteEl) noteEl.textContent = noteFor(info);
    } else {
      if (errorEl) {
        errorEl.textContent = result.error;
        errorEl.classList.remove('hidden');
      }
      valueEl.textContent = '–';
      for (const key of OUT_KEYS) setOut(key, '–');
      if (noteEl) noteEl.textContent = '';
    }

    writeUrlState(schema, { cidr }, { defaults });
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    input.value = typeof state.cidr === 'string' ? state.cidr : defaults.cidr;
  };

  applyState();
  paint();

  input.addEventListener('input', paint);

  wireShare(root);

  window.addEventListener('popstate', () => {
    applyState();
    paint();
  });
}

document.querySelectorAll<HTMLElement>('[data-subnet-widget]').forEach(initRoot);
