import { ACCENTS, accentClasses } from '../data/site';
import {
  DEFAULT_COLORS,
  DEFAULT_NAMES,
  PADEL_STORAGE_KEY,
  createMatch,
  currentServer,
  displayName,
  elapsedFor,
  formatElapsed,
  matchSummary,
  pauseClock,
  pointLabels,
  replay,
  resetClock,
  sanitizeMatch,
  sanitizeName,
  scoreStatus,
  setsWon,
  startClock,
  type PadelMatch,
  type ScoreState,
  type Team,
} from '../lib/padel';
import { encodeMatch, decodeMatch } from '../lib/padelShare';
import { readStoredJson, writeStoredJson } from '../lib/persistedState';
import { flash } from './ui';

const KEY = PADEL_STORAGE_KEY;

function initRoot(root: HTMLElement): void {
  const must = <T extends HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing ${selector}`);
    return element;
  };

  const clockEl = must<HTMLElement>('[data-clock]');
  const clockToggle = must<HTMLButtonElement>('[data-clock-toggle]');
  const modeLabel = must<HTMLElement>('[data-mode-label]');
  const noticeEl = must<HTMLElement>('[data-notice]');
  const statusEl = must<HTMLElement>('[data-status]');
  const liveEl = must<HTMLElement>('[data-live]');
  const resultEl = must<HTMLElement>('[data-result]');
  const resultTitle = must<HTMLElement>('[data-result-title]');
  const resultDetail = must<HTMLElement>('[data-result-detail]');
  const undoButton = must<HTMLButtonElement>('[data-undo]');
  const newButton = must<HTMLButtonElement>('[data-new]');
  const copyResultButton = must<HTMLButtonElement>('[data-copy-result]');
  const copyLinkButton = must<HTMLButtonElement>('[data-copy-link]');
  const includeNamesInput = must<HTMLInputElement>('[data-include-names]');
  const settingsLock = must<HTMLElement>('[data-settings-lock]');
  const modeSelect = must<HTMLSelectElement>('[data-mode]');
  const bestOfSelect = must<HTMLSelectElement>('[data-best-of]');
  const scoringSelect = must<HTMLSelectElement>('[data-scoring]');
  const firstServerSelect = must<HTMLSelectElement>('[data-first-server]');
  const tiebreakNote = must<HTMLElement>('[data-tiebreak-note]');
  const wakeInput = must<HTMLInputElement>('[data-wake]');
  const wakeNote = must<HTMLElement>('[data-wake-note]');
  const pointsHead = must<HTMLElement>('[data-points-head]');
  const setsHead = must<HTMLElement>('[data-sets-head]');

  const fullSettings = Array.from(
    root.querySelectorAll<HTMLElement>('[data-full-setting]'),
  );
  const nameInputs: [HTMLInputElement, HTMLInputElement] = [
    must<HTMLInputElement>('[data-name="0"]'),
    must<HTMLInputElement>('[data-name="1"]'),
  ];
  const colorButtons: [HTMLButtonElement, HTMLButtonElement] = [
    must<HTMLButtonElement>('[data-color="0"]'),
    must<HTMLButtonElement>('[data-color="1"]'),
  ];
  const serveDots: [HTMLElement, HTMLElement] = [
    must<HTMLElement>('[data-serve="0"]'),
    must<HTMLElement>('[data-serve="1"]'),
  ];
  const pointButtons: [HTMLButtonElement, HTMLButtonElement] = [
    must<HTMLButtonElement>('[data-point="0"]'),
    must<HTMLButtonElement>('[data-point="1"]'),
  ];
  const pointNames: [HTMLElement, HTMLElement] = [
    must<HTMLElement>('[data-point-name="0"]'),
    must<HTMLElement>('[data-point-name="1"]'),
  ];
  const pointsCells: [HTMLElement, HTMLElement] = [
    must<HTMLElement>('[data-points="0"]'),
    must<HTMLElement>('[data-points="1"]'),
  ];
  const setsWonCells: [HTMLElement, HTMLElement] = [
    must<HTMLElement>('[data-sets-won="0"]'),
    must<HTMLElement>('[data-sets-won="1"]'),
  ];
  const setHeads = Array.from({ length: 5 }, (_, index) =>
    must<HTMLElement>(`[data-set-head="${index}"]`),
  );
  const setCells: [HTMLElement[], HTMLElement[]] = [
    Array.from({ length: 5 }, (_, index) =>
      must<HTMLElement>(`[data-set-cell="0-${index}"]`),
    ),
    Array.from({ length: 5 }, (_, index) =>
      must<HTMLElement>(`[data-set-cell="1-${index}"]`),
    ),
  ];
  const setCols = Array.from({ length: 5 }, (_, index) =>
    must<HTMLTableColElement>(`[data-set-col="${index}"]`),
  );
  const setsCol = must<HTMLTableColElement>('[data-sets-col]');
  const pointsCol = must<HTMLTableColElement>('[data-points-col]');

  interface WakeSentinel {
    release: () => Promise<void>;
    addEventListener?: (type: 'release', listener: () => void) => void;
  }

  interface WakeLockApi {
    request: (type: 'screen') => Promise<WakeSentinel>;
  }

  const wakeApi = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock;
  const wakeSupported = Boolean(wakeApi);

  let match: PadelMatch = createMatch();
  let noticeTimer: number | null = null;
  let resetTimer: number | null = null;
  let sentinel: WakeSentinel | null = null;
  let lastScoreSignature = '';

  const scoreNow = (): ScoreState =>
    replay(match.rules, match.firstServer, match.log);

  const persist = (): void => {
    writeStoredJson(KEY, match, 'session');
  };

  function showNotice(message: string): void {
    noticeEl.textContent = message;
    noticeEl.classList.remove('hidden');
    if (noticeTimer !== null) window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => {
      noticeEl.classList.add('hidden');
      noticeTimer = null;
    }, 8000);
  }

  function readHashMatch(): PadelMatch | null {
    const hash = location.hash;
    if (!hash.startsWith('#m=')) return null;

    const seed = hash.slice(3);
    const decoded = decodeMatch(seed);
    history.replaceState(null, '', location.pathname + location.search);

    if (!decoded) {
      showNotice('That match link could not be read. Using the saved match or a new one.');
      return null;
    }

    return decoded;
  }

  function migrateStoredColors(stored: PadelMatch): void {
    // The old sky/amber pair was the default before the blue/red change.
    if (stored.colors[0] === 'sky' && stored.colors[1] === 'amber') {
      stored.colors = [DEFAULT_COLORS[0], DEFAULT_COLORS[1]];
      writeStoredJson(KEY, stored, 'session');
    }
  }

  function loadInitial(): PadelMatch {
    const stored = readStoredJson(KEY, sanitizeMatch, 'session');
    const shared = readHashMatch();

    if (shared) {
      shared.wakeLock = stored?.wakeLock ?? false;
      writeStoredJson(KEY, shared, 'session');
      showNotice('Shared match loaded. You can keep scoring or start a new match.');
      return shared;
    }

    if (stored) migrateStoredColors(stored);
    return stored ?? createMatch();
  }

  function paintClock(): void {
    const elapsed = elapsedFor(match.clock, Date.now());
    clockEl.textContent = formatElapsed(elapsed);

    if (scoreNow().finished) {
      clockToggle.textContent = 'Final';
      clockToggle.disabled = true;
      return;
    }

    clockToggle.disabled = false;
    clockToggle.textContent = match.clock.running
      ? 'Pause'
      : elapsed > 0
        ? 'Resume'
        : 'Start';
  }

  function paintWake(): void {
    wakeInput.disabled = !wakeSupported;
    wakeInput.checked = match.wakeLock;
    wakeNote.textContent = wakeSupported
      ? ''
      : 'Screen wake lock is not supported in this browser.';
    wakeNote.classList.toggle('hidden', wakeSupported);
  }

  function announcement(score: ScoreState, names: [string, string]): string {
    const setText =
      score.rules.mode === 'tiebreak'
        ? `${score.points[0]}-${score.points[1]}`
        : [
            ...score.sets.map(([a, b]) => `${a}-${b}`),
            ...(!score.finished ? [`${score.games[0]}-${score.games[1]}`] : []),
          ].join(', ');
    const labels = pointLabels(score);
    const points =
      score.finished || score.rules.mode === 'tiebreak'
        ? ''
        : `, ${labels[0]}-${labels[1]} in the ${
            score.tiebreak ? 'tie-break' : 'current game'
          }`;
    return `${names[0]} versus ${names[1]}: ${setText}${points}. ${scoreStatus(
      score,
      names,
    )}.`;
  }

  function render(): void {
    const score = scoreNow();
    const names: [string, string] = [
      displayName(match.names[0], 0),
      displayName(match.names[1], 1),
    ];
    const won = setsWon(score);
    const labels = pointLabels(score);
    const server = currentServer(score);
    const full = match.rules.mode === 'full';
    const visibleSets = full ? score.sets.length + (score.finished ? 0 : 1) : 0;

    const format = match.rules.bestOf === 1 ? 'Single set' : `Best of ${match.rules.bestOf}`;
    modeLabel.textContent = full
      ? `${format} · ${match.rules.goldenPoint ? 'Golden point' : 'Advantage'}`
      : 'Tie-break to 7';

    const firstOption = firstServerSelect.options.item(0);
    const secondOption = firstServerSelect.options.item(1);
    if (firstOption) firstOption.textContent = names[0];
    if (secondOption) secondOption.textContent = names[1];
    firstServerSelect.value = String(match.firstServer);

    setHeads.forEach((head, index) => {
      const visible = full && index < visibleSets;
      const current = full && !score.finished && index === score.sets.length;
      head.classList.toggle('hidden', !visible);
      head.classList.toggle('bg-zinc-50', current);
      head.classList.toggle('dark:bg-zinc-800/40', current);
      head.classList.toggle('text-zinc-900', current);
      head.classList.toggle('dark:text-zinc-100', current);
    });

    for (const index of [0, 1] as const) {
      const color = accentClasses(match.colors[index]);
      const name = names[index];

      colorButtons[index].className = `h-3 w-3 shrink-0 rounded-full ring-1 ring-zinc-300 ring-offset-1 transition hover:ring-zinc-500 dark:ring-zinc-700 dark:ring-offset-zinc-900 ${color.bg}`;
      colorButtons[index].setAttribute('aria-label', `Change ${name} color`);

      nameInputs[index].className = `min-w-0 w-full border-b border-transparent bg-transparent px-0 py-0.5 text-sm font-semibold focus:border-zinc-400 focus:outline-none dark:focus:border-zinc-500 ${color.text}`;
      if (document.activeElement !== nameInputs[index]) {
        nameInputs[index].value = match.names[index];
      }

      pointButtons[index].className = `flex flex-col items-center justify-center rounded-xl border-2 border-current px-3 py-3 text-sm font-semibold shadow-sm transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 ${color.bgSoft} ${color.text}`;
      pointButtons[index].disabled = score.finished;
      pointButtons[index].setAttribute('aria-label', `Add a point for ${name}`);
      pointNames[index].textContent = name;

      pointsCells[index].className = `px-1 py-3 text-3xl font-bold tabular-nums sm:text-4xl ${color.text}`;
      pointsCells[index].textContent = labels[index];
      setsWonCells[index].textContent = String(won[index]);

      serveDots[index].classList.toggle(
        'hidden',
        score.finished || server !== index,
      );

      setCells[index].forEach((cell, setIndex) => {
        const visible = full && setIndex < visibleSets;
        const current = full && !score.finished && setIndex === score.sets.length;
        cell.classList.toggle('hidden', !visible);
        cell.classList.toggle('bg-zinc-50', current);
        cell.classList.toggle('dark:bg-zinc-800/40', current);
        cell.classList.toggle('font-semibold', current);
        if (!visible) {
          cell.textContent = '–';
          return;
        }
        cell.textContent = String(
          current ? score.games[index] : (score.sets[setIndex]?.[index] ?? 0),
        );
      });
    }

    const showPoints = !(full && score.finished);
    pointsHead.classList.toggle('hidden', !showPoints);
    setsHead.classList.toggle('hidden', !full);
    pointsCol.classList.toggle('hidden', !showPoints);
    setsCol.classList.toggle('hidden', !full);
    setCols.forEach((col, index) => {
      col.classList.toggle('hidden', !(full && index < visibleSets));
    });
    for (const index of [0, 1] as const) {
      pointsCells[index].classList.toggle('hidden', !showPoints);
      setsWonCells[index].classList.toggle('hidden', !full);
    }

    statusEl.textContent = scoreStatus(score, names);
    statusEl.classList.toggle('hidden', score.finished);

    const signature = JSON.stringify(score);
    if (signature !== lastScoreSignature) {
      liveEl.textContent = announcement(score, names);
      lastScoreSignature = signature;
    }

    if (score.finished && score.winner !== null) {
      const winner = score.winner;
      const winnerColor = accentClasses(match.colors[winner]);
      const elapsed = formatElapsed(elapsedFor(match.clock, Date.now()));
      resultEl.classList.remove('hidden');
      resultTitle.className = `text-lg font-semibold ${winnerColor.text}`;
      resultTitle.textContent = `${names[winner]} wins`;
      resultDetail.textContent = full
        ? `${score.sets.map(([a, b]) => `${a}-${b}`).join(', ')} · ${elapsed}`
        : `${score.points[0]}-${score.points[1]} · ${elapsed}`;
    } else {
      resultEl.classList.add('hidden');
      resultTitle.textContent = '';
      resultDetail.textContent = '';
    }

    undoButton.disabled = match.log.length === 0;

    const locked = match.log.length > 0;
    modeSelect.disabled = locked;
    bestOfSelect.disabled = locked;
    scoringSelect.disabled = locked;
    firstServerSelect.disabled = locked;
    settingsLock.classList.toggle('hidden', !locked);
    for (const field of fullSettings) field.classList.toggle('hidden', !full);
    tiebreakNote.classList.toggle('hidden', full);
    modeSelect.value = match.rules.mode;
    bestOfSelect.value = String(match.rules.bestOf);
    scoringSelect.value = match.rules.goldenPoint ? 'golden' : 'advantage';

    paintWake();
    paintClock();
  }

  function addPoint(team: Team): void {
    if (scoreNow().finished) return;

    const now = Date.now();
    const clockIdle =
      match.clock.startedAt === null &&
      match.clock.elapsedMs === 0 &&
      !match.clock.running;

    match.log = [...match.log, team];
    const next = scoreNow();

    if (clockIdle && !next.finished) {
      match.clock = startClock(match.clock, now);
    }
    if (next.finished) {
      match.clock = pauseClock(match.clock, now);
    }

    persist();
    render();
  }

  function undoPoint(): void {
    if (match.log.length === 0) return;
    match.log = match.log.slice(0, -1);
    persist();
    render();
  }

  async function requestWakeLock(): Promise<void> {
    if (!wakeApi || sentinel || document.visibilityState !== 'visible') return;
    try {
      sentinel = await wakeApi.request('screen');
      sentinel.addEventListener?.('release', () => {
        sentinel = null;
      });
    } catch {
      sentinel = null;
    }
  }

  async function releaseWakeLock(): Promise<void> {
    if (!sentinel) return;
    const current = sentinel;
    sentinel = null;
    try {
      await current.release();
    } catch {
      return;
    }
  }

  function setupWake(): void {
    wakeInput.addEventListener('change', () => {
      match.wakeLock = wakeInput.checked;
      if (match.wakeLock) void requestWakeLock();
      else void releaseWakeLock();
      persist();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      paintClock();
      if (match.wakeLock) void requestWakeLock();
    });

    if (match.wakeLock) void requestWakeLock();
  }

  function setupEvents(): void {
    for (const index of [0, 1] as const) {
      const input = nameInputs[index];

      input.addEventListener('input', () => {
        match.names[index] = input.value;
        persist();
        render();
      });

      input.addEventListener('blur', () => {
        const name = sanitizeName(input.value, DEFAULT_NAMES[index]);
        match.names[index] = name;
        input.value = name;
        persist();
        render();
      });

      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        input.blur();
      });

      colorButtons[index].addEventListener('click', () => {
        const current = ACCENTS.indexOf(match.colors[index]);
        match.colors[index] = ACCENTS[(current + 1) % ACCENTS.length];
        persist();
        render();
      });

      pointButtons[index].addEventListener('click', () => addPoint(index));
    }

    undoButton.addEventListener('click', undoPoint);

    clockToggle.addEventListener('click', () => {
      if (scoreNow().finished) return;
      const now = Date.now();
      match.clock = match.clock.running
        ? pauseClock(match.clock, now)
        : startClock(match.clock, now);
      persist();
      render();
    });

    newButton.addEventListener('click', () => {
      if (resetTimer === null) {
        newButton.textContent = 'Confirm reset?';
        resetTimer = window.setTimeout(() => {
          newButton.textContent = 'New match';
          resetTimer = null;
        }, 3000);
        return;
      }

      window.clearTimeout(resetTimer);
      resetTimer = null;
      newButton.textContent = 'New match';
      match.log = [];
      match.clock = resetClock();
      persist();
      render();
    });

    copyResultButton.addEventListener('click', async () => {
      const score = scoreNow();
      const names: [string, string] = [
        displayName(match.names[0], 0),
        displayName(match.names[1], 1),
      ];
      const text = matchSummary(
        score,
        names,
        elapsedFor(match.clock, Date.now()),
      );
      try {
        await navigator.clipboard.writeText(text);
        await flash(copyResultButton, 'Copied');
      } catch {
        await flash(copyResultButton, 'Copy failed');
      }
    });

    copyLinkButton.addEventListener('click', async () => {
      try {
        const seed = encodeMatch(match, {
          includeNames: includeNamesInput.checked,
        });
        const url = `${location.origin}${location.pathname}#m=${seed}`;
        await navigator.clipboard.writeText(url);
        await flash(copyLinkButton, 'Link copied');
      } catch {
        await flash(copyLinkButton, 'Copy failed');
      }
    });

    modeSelect.addEventListener('change', () => {
      if (match.log.length > 0) return;
      match.rules = {
        ...match.rules,
        mode: modeSelect.value === 'tiebreak' ? 'tiebreak' : 'full',
      };
      match.clock = resetClock();
      persist();
      render();
    });

    bestOfSelect.addEventListener('change', () => {
      if (match.log.length > 0) return;
      const value = Number(bestOfSelect.value);
      match.rules = {
        ...match.rules,
        bestOf: value === 1 ? 1 : value === 5 ? 5 : 3,
      };
      match.clock = resetClock();
      persist();
      render();
    });

    scoringSelect.addEventListener('change', () => {
      if (match.log.length > 0) return;
      match.rules = {
        ...match.rules,
        goldenPoint: scoringSelect.value === 'golden',
      };
      match.clock = resetClock();
      persist();
      render();
    });

    firstServerSelect.addEventListener('change', () => {
      if (match.log.length > 0) return;
      match.firstServer = firstServerSelect.value === '1' ? 1 : 0;
      persist();
      render();
    });

    window.addEventListener('keydown', (event) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === '1' || event.key === '2') {
        addPoint(event.key === '1' ? 0 : 1);
        return;
      }

      const undoShortcut =
        event.key === 'u' ||
        event.key === 'U' ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z');

      if (undoShortcut) {
        event.preventDefault();
        undoPoint();
      }
    });
  }

  match = loadInitial();
  render();
  setupWake();
  setupEvents();
  window.setInterval(paintClock, 1000);
}

document.querySelectorAll<HTMLElement>('[data-padel]').forEach(initRoot);
