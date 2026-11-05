import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NAMES,
  awardPoint,
  createClock,
  createMatch,
  createScore,
  currentServer,
  displayName,
  elapsedFor,
  formatElapsed,
  matchSummary,
  pauseClock,
  pointLabels,
  replay,
  sanitizeMatch,
  sanitizeName,
  scoreStatus,
  setsToWin,
  setsWon,
  startClock,
  type PadelRules,
  type ScoreState,
  type Team,
} from './padel';

const advantage: PadelRules = { mode: 'full', bestOf: 3, goldenPoint: false };
const golden: PadelRules = { mode: 'full', bestOf: 3, goldenPoint: true };

function gamePoints(team: Team): Team[] {
  return [team, team, team, team];
}

function playGames(state: ScoreState, winners: Team[]): ScoreState {
  let next = state;
  for (const team of winners) {
    for (let point = 0; point < 4; point += 1) next = awardPoint(next, team);
  }
  return next;
}

function setLog(winners: Team[]): Team[] {
  return winners.flatMap(gamePoints);
}

const set64: Team[] = [0, 1, 0, 1, 0, 1, 0, 1, 0, 0];
const set62: Team[] = [0, 1, 0, 1, 0, 0, 0, 0];
const set66: Team[] = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
const tiebreak75: Team[] = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0];

describe('point progression', () => {
  it('moves from 0 to 15, 30 and 40, then wins the game', () => {
    let state = createScore(golden, 0);
    const labels = ['0', '15', '30', '40'];
    for (const label of labels) {
      expect(pointLabels(state)[0]).toBe(label);
      state = awardPoint(state, 0);
    }
    expect(state.games).toEqual([1, 0]);
    expect(state.points).toEqual([0, 0]);
    expect(state.serving).toBe(1);
  });

  it('needs two points in a row after deuce with advantage scoring', () => {
    let state = createScore(advantage, 0);
    for (let point = 0; point < 3; point += 1) {
      state = awardPoint(state, 0);
      state = awardPoint(state, 1);
    }
    expect(pointLabels(state)).toEqual(['40', '40']);
    expect(scoreStatus(state, DEFAULT_NAMES)).toBe('Deuce');

    state = awardPoint(state, 0);
    expect(pointLabels(state)).toEqual(['Ad', '40']);
    expect(scoreStatus(state, DEFAULT_NAMES)).toBe('Advantage Team 1');

    state = awardPoint(state, 1);
    expect(pointLabels(state)).toEqual(['40', '40']);
    expect(scoreStatus(state, DEFAULT_NAMES)).toBe('Deuce');

    state = awardPoint(state, 0);
    state = awardPoint(state, 0);
    expect(state.games).toEqual([1, 0]);
    expect(state.points).toEqual([0, 0]);
  });

  it('wins the game from 40-40 with golden point', () => {
    let state = createScore(golden, 0);
    for (let point = 0; point < 3; point += 1) {
      state = awardPoint(state, 0);
      state = awardPoint(state, 1);
    }
    expect(scoreStatus(state, DEFAULT_NAMES)).toBe('Golden point');
    state = awardPoint(state, 1);
    expect(state.games).toEqual([0, 1]);
    expect(state.points).toEqual([0, 0]);
  });
});

describe('sets', () => {
  it('wins a set 6-4 and starts the next one', () => {
    const state = playGames(createScore(golden, 0), set64);
    expect(state.sets).toEqual([[6, 4]]);
    expect(state.games).toEqual([0, 0]);
    expect(state.finished).toBe(false);
    expect(setsWon(state)).toEqual([1, 0]);
  });

  it('wins a set 7-5 when the lead reaches two games', () => {
    const winners: Team[] = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0];
    const state = playGames(createScore(golden, 0), winners);
    expect(state.sets).toEqual([[7, 5]]);
    expect(state.finished).toBe(false);
  });

  it('starts a tie-break at 6-6 and records the set as 7-6', () => {
    let state = playGames(createScore(golden, 0), set66);
    expect(state.games).toEqual([6, 6]);
    expect(state.tiebreak).toBe(true);
    expect(state.tiebreakServer).toBe(0);

    for (const team of tiebreak75) state = awardPoint(state, team);

    expect(state.tiebreak).toBe(false);
    expect(state.sets).toEqual([[7, 6]]);
    expect(state.games).toEqual([0, 0]);
    expect(state.serving).toBe(1);
    expect(state.finished).toBe(false);
  });
});

describe('serve rotation', () => {
  it('alternates the server after every game', () => {
    let state = createScore(golden, 0);
    expect(currentServer(state)).toBe(0);
    state = playGames(state, [0]);
    expect(currentServer(state)).toBe(1);
    state = playGames(state, [1]);
    expect(currentServer(state)).toBe(0);
  });

  it('rotates 1-2-2 during a tie-break', () => {
    let state = createScore({ mode: 'tiebreak', bestOf: 1, goldenPoint: true }, 0);
    const servers: Team[] = [0];
    for (let point = 0; point < 5; point += 1) {
      state = awardPoint(state, 0);
      servers.push(currentServer(state));
    }
    expect(servers).toEqual([0, 1, 1, 0, 0, 1]);
  });
});

describe('match end', () => {
  it('wins a single-set match 6-4', () => {
    const rules: PadelRules = { mode: 'full', bestOf: 1, goldenPoint: true };
    const score = replay(rules, 0, setLog(set64));
    expect(score.finished).toBe(true);
    expect(score.winner).toBe(0);
    expect(score.sets).toEqual([[6, 4]]);
    expect(setsWon(score)).toEqual([1, 0]);
  });

  it('wins a best-of-three match two sets to love', () => {
    const score = replay(golden, 0, setLog([...set64, ...set62]));
    expect(score.finished).toBe(true);
    expect(score.winner).toBe(0);
    expect(score.sets).toEqual([
      [6, 4],
      [6, 2],
    ]);
    expect(setsWon(score)).toEqual([2, 0]);
  });

  it('needs three sets to win a best-of-five match', () => {
    const rules: PadelRules = { mode: 'full', bestOf: 5, goldenPoint: true };
    const set60: Team[] = [0, 0, 0, 0, 0, 0];
    const log = setLog([...set60, ...set60, ...set60]);
    const score = replay(rules, 0, log);
    expect(score.finished).toBe(true);
    expect(score.winner).toBe(0);
    expect(setsToWin(5)).toBe(3);
  });

  it('plays a single tie-break to 7 in tie-break only mode', () => {
    const rules: PadelRules = { mode: 'tiebreak', bestOf: 1, goldenPoint: true };
    const score = replay(rules, 0, tiebreak75);
    expect(score.finished).toBe(true);
    expect(score.winner).toBe(0);
    expect(score.sets).toEqual([]);
    expect(score.points).toEqual([7, 5]);
  });

  it('ignores points after the match has finished', () => {
    const rules: PadelRules = { mode: 'full', bestOf: 1, goldenPoint: true };
    const log: Team[] = [...setLog(set64), 0, 0, 0, 0];
    const score = replay(rules, 0, log);
    expect(score.finished).toBe(true);
    expect(score.played).toBe(setLog(set64).length);
  });
});

describe('labels and summaries', () => {
  it('shows numeric points during a tie-break', () => {
    let state = playGames(createScore(golden, 0), set66);
    state = awardPoint(state, 0);
    expect(pointLabels(state)).toEqual(['1', '0']);
  });

  it('formats the elapsed time', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(65_000)).toBe('01:05');
    expect(formatElapsed(3_665_000)).toBe('1:01:05');
  });

  it('describes a finished set as plain text', () => {
    const score = replay({ mode: 'full', bestOf: 1, goldenPoint: true }, 0, setLog(set64));
    expect(matchSummary(score, ['Ana', 'Bea'], 65_000)).toBe(
      'Padel\nAna: 6\nBea: 4\nAna wins 1-0 · 01:05',
    );
  });

  it('describes a tie-break only result', () => {
    const score = replay(
      { mode: 'tiebreak', bestOf: 1, goldenPoint: true },
      0,
      tiebreak75,
    );
    expect(matchSummary(score, ['Ana', 'Bea'], 65_000)).toBe(
      'Padel\nAna: 7\nBea: 5\nAna wins 7-5 · 01:05',
    );
  });
});

describe('clock', () => {
  it('accumulates time while running and freezes it on pause', () => {
    const started = startClock(createClock(), 1_000);
    expect(elapsedFor(started, 6_000)).toBe(5_000);
    const paused = pauseClock(started, 6_000);
    expect(paused).toEqual({ startedAt: null, elapsedMs: 5_000, running: false });
    expect(elapsedFor(paused, 20_000)).toBe(5_000);
  });

  it('resumes from the accumulated time', () => {
    const resumed = startClock(
      { startedAt: null, elapsedMs: 5_000, running: false },
      10_000,
    );
    expect(elapsedFor(resumed, 12_000)).toBe(7_000);
  });
});

describe('sanitizeMatch', () => {
  it('round-trips a stored match and normalises names and colours', () => {
    const match = createMatch();
    match.log = setLog(set64);
    match.names = ['  Ana   y Bea  ', ''];
    match.colors = ['rose', 'emerald'];
    match.clock = { startedAt: 1_000, elapsedMs: 5_000, running: true };
    match.wakeLock = true;

    const parsed = sanitizeMatch(JSON.parse(JSON.stringify(match)));
    expect(parsed?.names).toEqual(['Ana y Bea', 'Team 2']);
    expect(parsed?.colors).toEqual(['rose', 'emerald']);
    expect(parsed?.clock).toEqual({ startedAt: 1_000, elapsedMs: 5_000, running: true });
    expect(parsed?.wakeLock).toBe(true);
    expect(parsed?.log).toEqual(setLog(set64));
  });

  it('rejects malformed stored data', () => {
    expect(sanitizeMatch(null)).toBeNull();
    expect(sanitizeMatch({})).toBeNull();
    expect(sanitizeMatch({ version: 2 })).toBeNull();
    const match = createMatch();
    expect(sanitizeMatch({ ...match, log: [0, 3] })).toBeNull();
    expect(sanitizeMatch({ ...match, rules: { ...match.rules, bestOf: 2 } })).toBeNull();
    expect(sanitizeMatch({ ...match, firstServer: 2 })).toBeNull();
  });

  it('trims points recorded after the match ended', () => {
    const match = createMatch({ mode: 'full', bestOf: 1, goldenPoint: true });
    match.log = [...setLog(set64), 0, 0, 0, 0];
    const parsed = sanitizeMatch(JSON.parse(JSON.stringify(match)));
    expect(parsed?.log).toHaveLength(setLog(set64).length);
  });

  it('falls back to safe names, colours and clock values', () => {
    const match = createMatch();
    const parsed = sanitizeMatch({
      ...match,
      names: ['x'.repeat(60), 4],
      colors: ['nope', null],
      clock: { startedAt: null, elapsedMs: -5, running: true },
    });
    expect(parsed?.names[0]).toHaveLength(24);
    expect(parsed?.names[1]).toBe('Team 2');
    expect(parsed?.colors).toEqual(['sky', 'rose']);
    expect(parsed?.clock).toEqual({ startedAt: null, elapsedMs: 0, running: false });
  });
});

describe('names', () => {
  it('collapses whitespace, trims and falls back', () => {
    expect(sanitizeName('  Ana   y  Bea  ', 'Team 1')).toBe('Ana y Bea');
    expect(sanitizeName('', 'Team 1')).toBe('Team 1');
    expect(sanitizeName('   ', 'Team 1')).toBe('Team 1');
    expect(sanitizeName('x'.repeat(40), 'Team 1')).toHaveLength(24);
  });

  it('always displays a usable name', () => {
    expect(displayName('', 0)).toBe('Team 1');
    expect(displayName('  Ana  ', 0)).toBe('Ana');
    expect(displayName(undefined, 1)).toBe('Team 2');
  });
});
