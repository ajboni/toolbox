export type Rng = (max: number) => number;

export const LOWER = 'abcdefghijklmnopqrstuvwxyz';
export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const DIGITS = '0123456789';
export const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?/';

export const AMBIGUOUS = 'il1IoO0';
export const MIN_LENGTH = 4;
export const MAX_LENGTH = 128;
export const MIN_WORDS = 3;
export const MAX_WORDS = 12;
export const MIN_COUNT = 1;
export const MAX_COUNT = 100;

export interface PasswordOptions {
  length: number;
  lower?: boolean;
  upper?: boolean;
  digits?: boolean;
  symbols?: boolean;
  excludeAmbiguous?: boolean;
}

export interface PassphraseOptions {
  words: number;
  separator: string;
  capitalize?: boolean;
  appendNumber?: boolean;
  wordlist: string[];
}

export type Strength = 'Weak' | 'Fair' | 'Strong';

export function defaultRng(max: number): number {
  if (max <= 0) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    globalThis.crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

function clamp(value: number, min: number, max: number): number {
  const parsed = Math.floor(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(parsed, max));
}

function stripAmbiguous(set: string): string {
  return [...set].filter((char) => !AMBIGUOUS.includes(char)).join('');
}

export function activeCharacterSets(options: PasswordOptions): string[] {
  const sets: string[] = [];
  if (options.lower) sets.push(LOWER);
  if (options.upper) sets.push(UPPER);
  if (options.digits) sets.push(DIGITS);
  if (options.symbols) sets.push(SYMBOLS);
  const filtered = options.excludeAmbiguous ? sets.map(stripAmbiguous) : sets;
  return filtered.filter((set) => set.length > 0);
}

export function passwordAlphabet(options: PasswordOptions): string {
  const sets = activeCharacterSets(options);
  if (sets.length === 0) return options.excludeAmbiguous ? stripAmbiguous(LOWER) : LOWER;
  return sets.join('');
}

function pick(source: string, rng: Rng): string {
  return source[rng(source.length)];
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swap = rng(index + 1);
    [items[index], items[swap]] = [items[swap], items[index]];
  }
  return items;
}

export function generatePassword(
  options: PasswordOptions,
  rng: Rng = defaultRng,
): string {
  const length = clamp(options.length, MIN_LENGTH, MAX_LENGTH);
  const sets = activeCharacterSets(options);
  const alphabet = passwordAlphabet(options);
  const chars: string[] = [];

  for (const set of sets) {
    if (chars.length >= length) break;
    chars.push(pick(set, rng));
  }
  while (chars.length < length) chars.push(pick(alphabet, rng));

  return shuffle(chars, rng).join('');
}

export function generatePassphrase(
  options: PassphraseOptions,
  rng: Rng = defaultRng,
): string {
  const wordlist = options.wordlist;
  if (wordlist.length === 0) return '';
  const words = clamp(options.words, MIN_WORDS, MAX_WORDS);
  const separator = options.separator ?? '-';

  const parts: string[] = [];
  for (let index = 0; index < words; index += 1) {
    const word = wordlist[rng(wordlist.length)];
    parts.push(options.capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word);
  }

  if (options.appendNumber) {
    const target = rng(parts.length);
    parts[target] = String(rng(10)) + parts[target];
  }

  return parts.join(separator);
}

export function generatePasswords(
  options: PasswordOptions,
  count = 1,
  rng: Rng = defaultRng,
): string[] {
  const total = clamp(count, MIN_COUNT, MAX_COUNT);
  return Array.from({ length: total }, () => generatePassword(options, rng));
}

export function generatePassphrases(
  options: PassphraseOptions,
  count = 1,
  rng: Rng = defaultRng,
): string[] {
  const total = clamp(count, MIN_COUNT, MAX_COUNT);
  return Array.from({ length: total }, () => generatePassphrase(options, rng));
}

export function passwordEntropyBits(options: PasswordOptions): number {
  const size = passwordAlphabet(options).length;
  if (size <= 1) return 0;
  return clamp(options.length, MIN_LENGTH, MAX_LENGTH) * Math.log2(size);
}

export function passphraseEntropyBits(options: PassphraseOptions): number {
  const size = options.wordlist.length;
  if (size <= 1) return 0;
  const words = clamp(options.words, MIN_WORDS, MAX_WORDS);
  const base = words * Math.log2(size);
  if (!options.appendNumber) return base;
  return base + Math.log2(words) + Math.log2(10);
}

export function strength(bits: number): Strength {
  if (bits >= 80) return 'Strong';
  if (bits >= 50) return 'Fair';
  return 'Weak';
}
