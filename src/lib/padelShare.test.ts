import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NAMES,
  createMatch,
  replay,
  type PadelMatch,
  type Team,
} from './padel';
import { decodeMatch, encodeMatch } from './padelShare';

const set64Winners: Team[] = [0, 1, 0, 1, 0, 1, 0, 1, 0, 0];
const set64: Team[] = set64Winners.flatMap((team) => [team, team, team, team]);
const tiebreakWinners: Team[] = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1];

function finishedMatch(): PadelMatch {
  const match = createMatch({ mode: 'full', bestOf: 1, goldenPoint: true }, 0);
  match.log = set64;
  match.clock = { startedAt: null, elapsedMs: 125_000, running: false };
  return match;
}

describe('match links', () => {
  it('round-trips the score without names', () => {
    const match = finishedMatch();
    match.names = ['Ana', 'Bea'];
    match.colors = ['rose', 'emerald'];

    const seed = encodeMatch(match, { includeNames: false });
    const decoded = decodeMatch(seed);

    expect(decoded).not.toBeNull();
    expect(decoded?.rules).toEqual(match.rules);
    expect(decoded?.firstServer).toBe(0);
    expect(decoded?.log).toEqual(match.log);
    expect(decoded?.names).toEqual(DEFAULT_NAMES);
    expect(decoded?.colors).toEqual(['rose', 'emerald']);
    expect(decoded?.clock).toEqual({
      startedAt: null,
      elapsedMs: 125_000,
      running: false,
    });
    expect(decoded?.wakeLock).toBe(false);
  });

  it('round-trips names when they are included', () => {
    const match = finishedMatch();
    match.names = ['José y Lucía', 'Team 🎾'];

    const decoded = decodeMatch(encodeMatch(match, { includeNames: true }));

    expect(decoded?.names).toEqual(['José y Lucía', 'Team 🎾']);
  });

  it('trims very long names to fit the link', () => {
    const match = finishedMatch();
    match.names = ['x'.repeat(80), '🎾'.repeat(24)];

    const decoded = decodeMatch(encodeMatch(match, { includeNames: true }));

    expect(decoded?.names[0]).toHaveLength(24);
    expect(new TextEncoder().encode(decoded?.names[1]).length).toBeLessThanOrEqual(48);
  });

  it('round-trips a tie-break only match with the second team serving first', () => {
    const match = createMatch({ mode: 'tiebreak', bestOf: 1, goldenPoint: true }, 1);
    match.log = tiebreakWinners;

    const decoded = decodeMatch(encodeMatch(match, { includeNames: false }));

    expect(decoded?.rules).toEqual({
      mode: 'tiebreak',
      bestOf: 1,
      goldenPoint: true,
    });
    expect(decoded?.firstServer).toBe(1);
    expect(decoded?.log).toEqual(tiebreakWinners);
    expect(replay(decoded!.rules, 1, decoded!.log).winner).toBe(1);
  });

  it('round-trips best of five with advantage scoring', () => {
    const match = createMatch({ mode: 'full', bestOf: 5, goldenPoint: false }, 1);

    const decoded = decodeMatch(encodeMatch(match, { includeNames: false }));

    expect(decoded?.rules).toEqual({
      mode: 'full',
      bestOf: 5,
      goldenPoint: false,
    });
    expect(decoded?.firstServer).toBe(1);
    expect(decoded?.log).toEqual([]);
  });

  it('stores a running clock as elapsed seconds at share time', () => {
    const match = finishedMatch();
    match.clock = { startedAt: 1_000, elapsedMs: 5_000, running: true };

    const decoded = decodeMatch(encodeMatch(match, { includeNames: false, now: 11_000 }));

    expect(decoded?.clock).toEqual({
      startedAt: null,
      elapsedMs: 15_000,
      running: false,
    });
  });

  it('keeps the generated link short', () => {
    const match = finishedMatch();
    match.names = ['Ana y Bea', 'Carlos y Dani'];

    const seed = encodeMatch(match, { includeNames: true });
    expect(seed.length).toBeLessThan(160);
  });
});

describe('validation', () => {
  it('rejects empty, malformed and truncated links', () => {
    expect(decodeMatch('')).toBeNull();
    expect(decodeMatch('not a match!')).toBeNull();
    expect(decodeMatch('AAAA')).toBeNull();

    const seed = encodeMatch(finishedMatch(), { includeNames: false });
    expect(decodeMatch(seed.slice(0, -4))).toBeNull();
    const corrupted = `${seed[0] === 'A' ? 'B' : 'A'}${seed.slice(1)}`;
    expect(decodeMatch(corrupted)).toBeNull();
  });

  it('rejects links with points after the match ended', () => {
    const match = finishedMatch();
    match.log = [...match.log, 0, 0, 0, 0];

    expect(decodeMatch(encodeMatch(match, { includeNames: false }))).toBeNull();
  });
});
