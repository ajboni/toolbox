export const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;

export type DieSides = (typeof DICE_SIDES)[number];
export type Uint32Source = () => number;

export const MIN_COUNT = 1;
export const MAX_COUNT = 20;
export const MAX_MODIFIER = 99;

const UINT32_RANGE = 4_294_967_296;

export interface DiceSpec {
  count: number;
  sides: number;
  modifier: number;
}

export interface RollResult {
  spec: DiceSpec;
  rolls: number[];
  total: number;
}

export function isDieSides(value: number): value is DieSides {
  return (DICE_SIDES as readonly number[]).includes(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSpec(input: Partial<DiceSpec>): DiceSpec {
  const sides = isDieSides(Number(input.sides)) ? Number(input.sides) : 6;
  const count = clamp(Math.trunc(Number(input.count) || 1), MIN_COUNT, MAX_COUNT);
  const modifier = clamp(Math.trunc(Number(input.modifier) || 0), -MAX_MODIFIER, MAX_MODIFIER);
  return { count, sides, modifier };
}

export function parseDiceNotation(input: string): DiceSpec | null {
  const match = /^\s*(?:(\d{1,3})\s*)?d\s*(\d{1,3})\s*(?:([+-])\s*(\d{1,3}))?\s*$/i.exec(
    input,
  );
  if (!match) return null;

  const count = match[1] ? Number(match[1]) : 1;
  const sides = Number(match[2]);
  const modifier = match[4] ? Number(match[4]) * (match[3] === '-' ? -1 : 1) : 0;

  if (!isDieSides(sides)) return null;
  if (count < MIN_COUNT || count > MAX_COUNT) return null;
  if (Math.abs(modifier) > MAX_MODIFIER) return null;

  return { count, sides, modifier };
}

export function formatDiceNotation(spec: DiceSpec): string {
  const count = spec.count === 1 ? '' : String(spec.count);
  const dice = `${count}d${spec.sides}`;
  if (spec.modifier === 0) return dice;
  const sign = spec.modifier > 0 ? '+' : '-';
  return `${dice}${sign}${Math.abs(spec.modifier)}`;
}

export function rollDie(sides: number, next: Uint32Source): number {
  if (!Number.isInteger(sides) || sides < 2) {
    throw new RangeError('A die needs at least two sides.');
  }
  const limit = Math.floor(UINT32_RANGE / sides) * sides;
  let value = next() >>> 0;
  while (value >= limit) value = next() >>> 0;
  return (value % sides) + 1;
}

export function cryptoUint32(): number {
  const values = new Uint32Array(1);
  globalThis.crypto.getRandomValues(values);
  return values[0];
}

export function rollDice(
  spec: DiceSpec,
  next: Uint32Source = cryptoUint32,
): RollResult {
  const normalized = normalizeSpec(spec);
  const rolls = Array.from({ length: normalized.count }, () =>
    rollDie(normalized.sides, next),
  );
  const total =
    rolls.reduce((sum, roll) => sum + roll, 0) + normalized.modifier;
  return { spec: normalized, rolls, total };
}
