export const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

export const COMMON_BASES = [2, 8, 10, 16] as const;

export function isValidBase(base: number): boolean {
  return Number.isInteger(base) && base >= 2 && base <= 36;
}

export function parseInBase(value: string, base: number): bigint | null {
  if (!isValidBase(base)) return null;
  const trimmed = value.trim().toLowerCase().replace(/[\s_]/g, '');
  if (!trimmed) return null;

  let negative = false;
  let body = trimmed;
  if (body.startsWith('-')) {
    negative = true;
    body = body.slice(1);
  } else if (body.startsWith('+')) {
    body = body.slice(1);
  }
  if (!body) return null;

  const bigBase = BigInt(base);
  let result = 0n;
  for (const char of body) {
    const digit = DIGITS.indexOf(char);
    if (digit < 0 || digit >= base) return null;
    result = result * bigBase + BigInt(digit);
  }
  return negative ? -result : result;
}

export function toBase(value: bigint, base: number): string | null {
  if (!isValidBase(base)) return null;
  if (value === 0n) return '0';

  const negative = value < 0n;
  let remaining = negative ? -value : value;
  const bigBase = BigInt(base);
  let output = '';
  while (remaining > 0n) {
    output = DIGITS[Number(remaining % bigBase)] + output;
    remaining /= bigBase;
  }
  return negative ? `-${output}` : output;
}

export function convertBase(
  value: string,
  fromBase: number,
  targetBase: number,
): string | null {
  const parsed = parseInBase(value, fromBase);
  if (parsed == null) return null;
  return toBase(parsed, targetBase);
}
