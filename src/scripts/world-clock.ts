import { DEFAULT_CLOCKS, MAX_CLOCKS, TIMEZONES } from '../data/timezones';
import {
  formatZoneTime,
  normalizeZone,
  parseClocks,
  serializeClocks,
  zoneLabel,
  zoneOffsetLabel,
} from '../lib/timezoneClocks';
import {
  BOARD_STORAGE_KEY,
  clearStoredState,
  readStoredState,
  resolveBoardState,
  writeStoredState,
  type BoardState,
} from '../lib/persistedState';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireShare } from './ui';

const schema = { clock: 'string', face: 'string', seconds: 'number' } as const;
const FACES = ['digital', 'analog', 'minimal'] as const;
type Face = (typeof FACES)[number];

const DEFAULT_PARAMS: BoardState = {
  clock: DEFAULT_CLOCKS.join(','),
  face: 'digital',
  seconds: 1,
};

interface ClockState {
  zones: string[];
  face: Face;
  seconds: boolean;
}

function isFace(value: unknown): value is Face {
  return typeof value === 'string' && (FACES as readonly string[]).includes(value);
}

function localZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function currentState(): ClockState {
  const state = resolveBoardState(
    readUrlState(schema),
    readStoredState(BOARD_STORAGE_KEY),
    DEFAULT_PARAMS,
  );
  const local = localZone();
  const expanded = state.clock
    .split(',')
    .map((token) => (token.trim().toLowerCase() === 'local' ? local : token))
    .join(',');
  const zones = parseClocks(expanded);
  return {
    zones: zones.length > 0 ? zones : [...DEFAULT_CLOCKS],
    face: isFace(state.face) ? state.face : 'digital',
    seconds: state.seconds !== 0,
  };
}

function setHand(card: HTMLElement, name: string, degrees: number): void {
  const hand = card.querySelector<SVGLineElement>(`[data-hand="${name}"]`);
  if (hand) hand.setAttribute('transform', `rotate(${degrees} 50 50)`);
}

function initRoot(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>('[data-clock-grid]');
  const template = root.querySelector<HTMLTemplateElement>('[data-clock-card-template]');
  const form = root.querySelector<HTMLFormElement>('[data-add-form]');
  const zoneInput = root.querySelector<HTMLInputElement>('[data-zone-input]');
  const datalist = root.querySelector<HTMLDataListElement>('datalist');
  const faceSelect = root.querySelector<HTMLSelectElement>('[data-face]');
  const secondsInput = root.querySelector<HTMLInputElement>('[data-seconds]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-reset]');
  const message = root.querySelector<HTMLElement>('[data-message]');
  if (!grid || !template) return;

  const state = currentState();
  if (faceSelect) faceSelect.value = state.face;
  if (secondsInput) secondsInput.checked = state.seconds;

  let messageTimer: number | undefined;
  const showMessage = (text: string): void => {
    if (!message) return;
    message.textContent = text;
    message.classList.remove('hidden');
    window.clearTimeout(messageTimer);
    messageTimer = window.setTimeout(() => message.classList.add('hidden'), 2500);
  };

  const persist = (): void => {
    const values = {
      clock: serializeClocks(state.zones),
      face: state.face,
      seconds: state.seconds ? 1 : 0,
    };
    writeUrlState(schema, values, {
      defaults: { ...DEFAULT_PARAMS },
      pretty: true,
    });
    writeStoredState(BOARD_STORAGE_KEY, values);
  };

  const resetBoard = (): void => {
    clearStoredState(BOARD_STORAGE_KEY);
    state.zones = [...DEFAULT_CLOCKS];
    state.face = 'digital';
    state.seconds = true;
    if (faceSelect) faceSelect.value = state.face;
    if (secondsInput) secondsInput.checked = state.seconds;
    writeUrlState(schema, {});
    render();
  };

  const update = (): void => {
    const now = new Date();
    for (const card of Array.from(grid.children) as HTMLElement[]) {
      const zone = card.dataset.zone;
      if (!zone) continue;
      const time = formatZoneTime(now, zone);
      const showSeconds = state.seconds && state.face !== 'minimal';
      card.dataset.face = state.face;
      card.dataset.phase = time.isDay ? 'day' : 'night';
      card.dataset.seconds = state.seconds ? 'on' : 'off';

      const timeEl = card.querySelector<HTMLElement>('[data-clock-time]');
      if (timeEl) {
        timeEl.textContent = showSeconds ? time.time : time.time.slice(0, 5);
      }
      const dateEl = card.querySelector<HTMLElement>('[data-clock-date]');
      if (dateEl) dateEl.textContent = `${time.weekday}, ${time.dateShort}`;
      const offsetEl = card.querySelector<HTMLElement>('[data-clock-offset]');
      if (offsetEl) offsetEl.textContent = zoneOffsetLabel(now, zone);

      setHand(card, 'hour', (time.hour % 12) * 30 + time.minute * 0.5);
      setHand(card, 'minute', time.minute * 6 + time.second * 0.1);
      setHand(card, 'second', time.second * 6);
    }
  };

  const fillCard = (card: HTMLElement, zone: string): void => {
    card.dataset.zone = zone;
    const label = card.querySelector<HTMLElement>('[data-clock-label]');
    const zoneEl = card.querySelector<HTMLElement>('[data-clock-zone]');
    if (label) label.textContent = zoneLabel(zone);
    if (zoneEl) zoneEl.textContent = zone;
    card
      .querySelector<HTMLButtonElement>('[data-remove]')
      ?.addEventListener('click', () => removeZone(zone));
  };

  const render = (): void => {
    const cards: HTMLElement[] = [];
    for (const zone of state.zones) {
      const node = template.content.firstElementChild?.cloneNode(true) as
        | HTMLElement
        | undefined;
      if (!node) continue;
      node.dataset.face = state.face;
      fillCard(node, zone);
      cards.push(node);
    }
    grid.replaceChildren(...cards);
    update();
  };

  const addZone = (token: string): void => {
    const resolved = token.trim().toLowerCase() === 'local' ? localZone() : token;
    const zone = normalizeZone(resolved);
    if (!zone) {
      showMessage('Unknown time zone. Try a city, a country code or an IANA zone.');
      return;
    }
    if (state.zones.includes(zone)) {
      showMessage('That time zone is already on the board.');
      return;
    }
    if (state.zones.length >= MAX_CLOCKS) {
      showMessage(`You can show up to ${MAX_CLOCKS} clocks.`);
      return;
    }
    state.zones = [...state.zones, zone];
    persist();
    render();
  };

  const removeZone = (zone: string): void => {
    if (state.zones.length <= 1) {
      showMessage('Keep at least one clock on the board.');
      return;
    }
    state.zones = state.zones.filter((item) => item !== zone);
    persist();
    render();
  };

  const populateZones = (): void => {
    if (!datalist) return;
    const zones = new Map<string, string>(
      TIMEZONES.map((entry) => [entry.zone, entry.label]),
    );
    const intl = Intl as unknown as {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof intl.supportedValuesOf === 'function') {
      for (const zone of intl.supportedValuesOf('timeZone')) {
        if (!zones.has(zone)) zones.set(zone, zoneLabel(zone));
      }
    }
    const options = Array.from(zones)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([zone, label]) => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = label;
        return option;
      });
    datalist.replaceChildren(...options);
  };

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = zoneInput?.value.trim() ?? '';
    if (!value) return;
    for (const token of value.split(',')) {
      if (token.trim()) addZone(token);
    }
    if (zoneInput) zoneInput.value = '';
  });

  faceSelect?.addEventListener('change', () => {
    state.face = isFace(faceSelect.value) ? faceSelect.value : 'digital';
    persist();
    update();
  });

  secondsInput?.addEventListener('change', () => {
    state.seconds = secondsInput.checked;
    persist();
    update();
  });

  resetButton?.addEventListener('click', resetBoard);

  window.addEventListener('popstate', () => {
    const next = currentState();
    state.zones = next.zones;
    state.face = next.face;
    state.seconds = next.seconds;
    if (faceSelect) faceSelect.value = state.face;
    if (secondsInput) secondsInput.checked = state.seconds;
    render();
  });

  populateZones();
  render();
  window.setInterval(update, 1000);
  wireShare(root);
}

document.querySelectorAll<HTMLElement>('[data-world-clock]').forEach(initRoot);
