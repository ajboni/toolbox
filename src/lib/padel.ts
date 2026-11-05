import { ACCENTS, type AccentName } from '../data/site';

export type Team = 0 | 1;
export type MatchMode = 'full' | 'tiebreak';
export type BestOf = 1 | 3 | 5;

export interface PadelRules {
  mode: MatchMode;
  bestOf: BestOf;
  goldenPoint: boolean;
}

export interface PadelClock {
  startedAt: number | null;
  elapsedMs: number;
  running: boolean;
}

export interface PadelMatch {
  version: 1;
  rules: PadelRules;
  firstServer: Team;
  log: Team[];
  names: [string, string];
  colors: [AccentName, AccentName];
  clock: PadelClock;
  wakeLock: boolean;
}

export interface ScoreState {
  rules: PadelRules;
  firstServer: Team;
  sets: Array<[number, number]>;
  games: [number, number];
  points: [number, number];
  serving: Team;
  tiebreak: boolean;
  tiebreakServer: Team | null;
  tiebreakPlayed: number;
  finished: boolean;
  winner: Team | null;
  played: number;
}

export const MAX_POINTS = 1024;
export const MAX_NAME_LENGTH = 24;
export const PADEL_STORAGE_KEY = 'padel:match';
export const DEFAULT_NAMES: [string, string] = ['Team 1', 'Team 2'];
export const DEFAULT_COLORS: [AccentName, AccentName] = ['sky', 'rose'];
export const DEFAULT_RULES: PadelRules = {
  mode: 'full',
  bestOf: 3,
  goldenPoint: true,
};

export function flipTeam(team: Team): Team {
  return team === 0 ? 1 : 0;
}

export function setsToWin(bestOf: BestOf): number {
  return Math.ceil(bestOf / 2);
}

export function createScore(
  rules: PadelRules = DEFAULT_RULES,
  firstServer: Team = 0,
): ScoreState {
  const tiebreak = rules.mode === 'tiebreak';
  return {
    rules: { ...rules },
    firstServer,
    sets: [],
    games: [0, 0],
    points: [0, 0],
    serving: firstServer,
    tiebreak,
    tiebreakServer: tiebreak ? firstServer : null,
    tiebreakPlayed: 0,
    finished: false,
    winner: null,
    played: 0,
  };
}

function copyScore(state: ScoreState): ScoreState {
  return {
    ...state,
    rules: { ...state.rules },
    sets: state.sets.map(([a, b]) => [a, b]),
    games: [state.games[0], state.games[1]],
    points: [state.points[0], state.points[1]],
  };
}

function wonGame(points: [number, number], goldenPoint: boolean): boolean {
  if (Math.max(points[0], points[1]) < 4) return false;
  const diff = Math.abs(points[0] - points[1]);
  return goldenPoint ? diff >= 1 : diff >= 2;
}

function wonTiebreak(points: [number, number]): boolean {
  return Math.max(points[0], points[1]) >= 7 && Math.abs(points[0] - points[1]) >= 2;
}

function wonSet(games: [number, number]): boolean {
  return Math.max(games[0], games[1]) >= 6 && Math.abs(games[0] - games[1]) >= 2;
}

export function setsWon(state: ScoreState): [number, number] {
  let first = 0;
  let second = 0;
  for (const [a, b] of state.sets) {
    if (a > b) first += 1;
    else if (b > a) second += 1;
  }
  return [first, second];
}

export function currentServer(state: ScoreState): Team {
  if (!state.tiebreak) return state.serving;
  const first = state.tiebreakServer ?? state.firstServer;
  if (state.tiebreakPlayed <= 0) return first;
  const block = Math.floor((state.tiebreakPlayed - 1) / 2);
  return block % 2 === 0 ? flipTeam(first) : first;
}

export function awardPoint(state: ScoreState, team: Team): ScoreState {
  if (state.finished) return state;

  const next = copyScore(state);
  next.played += 1;
  next.points[team] += 1;

  if (next.tiebreak) {
    next.tiebreakPlayed += 1;
    if (!wonTiebreak(next.points)) return next;

    if (next.rules.mode === 'tiebreak') {
      next.finished = true;
      next.winner = team;
      return next;
    }

    const firstTiebreakServer = next.tiebreakServer ?? next.serving;
    next.sets.push(team === 0 ? [7, 6] : [6, 7]);
    const matchWon = setsWon(next)[team] >= setsToWin(next.rules.bestOf);
    if (matchWon) {
      next.finished = true;
      next.winner = team;
      return next;
    }

    next.games = [0, 0];
    next.points = [0, 0];
    next.tiebreak = false;
    next.tiebreakServer = null;
    next.tiebreakPlayed = 0;
    next.serving = flipTeam(firstTiebreakServer);
    return next;
  }

  if (!wonGame(next.points, next.rules.goldenPoint)) return next;

  next.games[team] += 1;
  next.points = [0, 0];
  next.serving = flipTeam(next.serving);

  if (wonSet(next.games)) {
    next.sets.push([next.games[0], next.games[1]]);
    if (setsWon(next)[team] >= setsToWin(next.rules.bestOf)) {
      next.finished = true;
      next.winner = team;
    } else {
      next.games = [0, 0];
    }
    return next;
  }

  if (next.games[0] === 6 && next.games[1] === 6) {
    next.tiebreak = true;
    next.tiebreakServer = next.serving;
    next.tiebreakPlayed = 0;
  }

  return next;
}

export function replay(
  rules: PadelRules,
  firstServer: Team,
  log: readonly Team[],
): ScoreState {
  let score = createScore(rules, firstServer);
  for (const team of log) {
    if (score.finished) break;
    score = awardPoint(score, team);
  }
  return score;
}

export function pointLabels(state: ScoreState): [string, string] {
  if (state.tiebreak) return [String(state.points[0]), String(state.points[1])];

  const [a, b] = state.points;
  if (!state.rules.goldenPoint && a >= 3 && b >= 3) {
    if (a === b) return ['40', '40'];
    return a > b ? ['Ad', '40'] : ['40', 'Ad'];
  }

  const label = (value: number): string => {
    if (value <= 0) return '0';
    if (value === 1) return '15';
    if (value === 2) return '30';
    return '40';
  };

  return [label(a), label(b)];
}

export function scoreStatus(state: ScoreState, names: [string, string]): string {
  if (state.finished && state.winner !== null) {
    return `${displayName(names[state.winner], state.winner)} wins`;
  }

  const server = currentServer(state);
  if (state.tiebreak) {
    return `Tie-break · ${displayName(names[server], server)} to serve`;
  }

  if (!state.rules.goldenPoint && state.points[0] >= 3 && state.points[1] >= 3) {
    if (state.points[0] === state.points[1]) return 'Deuce';
    const leader: Team = state.points[0] > state.points[1] ? 0 : 1;
    return `Advantage ${displayName(names[leader], leader)}`;
  }

  if (state.rules.goldenPoint && state.points[0] === 3 && state.points[1] === 3) {
    return 'Golden point';
  }

  return `${displayName(names[server], server)} to serve`;
}

export function displayName(name: string | undefined, index: number): string {
  const text = typeof name === 'string' ? name.trim() : '';
  return text || DEFAULT_NAMES[index] || `Team ${index + 1}`;
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number): string => String(value).padStart(2, '0');
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export function matchSummary(
  state: ScoreState,
  names: [string, string],
  elapsedMs: number,
): string {
  const first = displayName(names[0], 0);
  const second = displayName(names[1], 1);
  const lines = ['Padel'];

  if (state.rules.mode === 'tiebreak') {
    lines.push(`${first}: ${state.points[0]}`);
    lines.push(`${second}: ${state.points[1]}`);
  } else {
    const firstSets = state.sets.map(([a]) => a);
    const secondSets = state.sets.map(([, b]) => b);
    if (!state.finished) {
      firstSets.push(state.games[0]);
      secondSets.push(state.games[1]);
    }
    lines.push(`${first}: ${firstSets.join(' ')}`);
    lines.push(`${second}: ${secondSets.join(' ')}`);
    if (!state.finished && state.tiebreak) {
      lines.push(`Tie-break: ${state.points[0]}-${state.points[1]}`);
    }
  }

  if (state.finished && state.winner !== null) {
    const won = setsWon(state);
    const detail =
      state.rules.mode === 'tiebreak'
        ? `${state.points[0]}-${state.points[1]}`
        : `${won[state.winner]}-${won[flipTeam(state.winner)]}`;
    const time = elapsedMs > 0 ? ` · ${formatElapsed(elapsedMs)}` : '';
    lines.push(`${state.winner === 0 ? first : second} wins ${detail}${time}`);
  } else if (elapsedMs > 0) {
    lines.push(`Match time ${formatElapsed(elapsedMs)}`);
  }

  return lines.join('\n');
}

export function createClock(): PadelClock {
  return { startedAt: null, elapsedMs: 0, running: false };
}

export function elapsedFor(clock: PadelClock, now: number): number {
  const runningMs =
    clock.running && clock.startedAt !== null ? Math.max(0, now - clock.startedAt) : 0;
  return Math.max(0, clock.elapsedMs + runningMs);
}

export function startClock(clock: PadelClock, now: number): PadelClock {
  if (clock.running) return clock;
  return {
    startedAt: now,
    elapsedMs: Math.max(0, clock.elapsedMs),
    running: true,
  };
}

export function pauseClock(clock: PadelClock, now: number): PadelClock {
  if (!clock.running || clock.startedAt === null) return clock;
  return {
    startedAt: null,
    elapsedMs: Math.max(0, clock.elapsedMs + Math.max(0, now - clock.startedAt)),
    running: false,
  };
}

export function resetClock(): PadelClock {
  return createClock();
}

export function createMatch(
  rules: PadelRules = DEFAULT_RULES,
  firstServer: Team = 0,
): PadelMatch {
  return {
    version: 1,
    rules: { ...rules },
    firstServer,
    log: [],
    names: [DEFAULT_NAMES[0], DEFAULT_NAMES[1]],
    colors: [DEFAULT_COLORS[0], DEFAULT_COLORS[1]],
    clock: createClock(),
    wakeLock: false,
  };
}

export function isTeam(value: unknown): value is Team {
  return value === 0 || value === 1;
}

export function isBestOf(value: unknown): value is BestOf {
  return value === 1 || value === 3 || value === 5;
}

export function isAccent(value: unknown): value is AccentName {
  return typeof value === 'string' && (ACCENTS as readonly string[]).includes(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sanitizeName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const collapsed = value.replace(/\s+/g, ' ').trim();
  const trimmed = Array.from(collapsed).slice(0, MAX_NAME_LENGTH).join('');
  return trimmed || fallback;
}

export function sanitizeMatch(value: unknown): PadelMatch | null {
  if (!isPlainObject(value)) return null;
  if (value.version !== 1) return null;
  if (!isPlainObject(value.rules)) return null;

  const mode =
    value.rules.mode === 'tiebreak'
      ? 'tiebreak'
      : value.rules.mode === 'full'
        ? 'full'
        : null;
  if (mode === null) return null;
  if (!isBestOf(value.rules.bestOf)) return null;
  if (typeof value.rules.goldenPoint !== 'boolean') return null;
  if (!isTeam(value.firstServer)) return null;
  if (!Array.isArray(value.log) || value.log.length > MAX_POINTS) return null;

  const log: Team[] = [];
  for (const entry of value.log) {
    if (!isTeam(entry)) return null;
    log.push(entry);
  }

  const rules: PadelRules = {
    mode,
    bestOf: value.rules.bestOf,
    goldenPoint: value.rules.goldenPoint,
  };
  const score = replay(rules, value.firstServer, log);
  const trimmedLog = log.slice(0, score.played);

  const nameValues = Array.isArray(value.names) ? value.names : [];
  const names: [string, string] = [
    sanitizeName(nameValues[0], DEFAULT_NAMES[0]),
    sanitizeName(nameValues[1], DEFAULT_NAMES[1]),
  ];

  const colorValues = Array.isArray(value.colors) ? value.colors : [];
  const colors: [AccentName, AccentName] = [
    isAccent(colorValues[0]) ? colorValues[0] : DEFAULT_COLORS[0],
    isAccent(colorValues[1]) ? colorValues[1] : DEFAULT_COLORS[1],
  ];

  const clockValue: Record<string, unknown> = isPlainObject(value.clock) ? value.clock : {};
  const startedAt =
    typeof clockValue.startedAt === 'number' && Number.isFinite(clockValue.startedAt)
      ? clockValue.startedAt
      : null;
  const elapsedMs =
    typeof clockValue.elapsedMs === 'number' &&
    Number.isFinite(clockValue.elapsedMs) &&
    clockValue.elapsedMs > 0
      ? clockValue.elapsedMs
      : 0;
  const running = clockValue.running === true && startedAt !== null;

  return {
    version: 1,
    rules,
    firstServer: value.firstServer,
    log: trimmedLog,
    names,
    colors,
    clock: {
      startedAt: running ? startedAt : null,
      elapsedMs,
      running,
    },
    wakeLock: value.wakeLock === true,
  };
}
