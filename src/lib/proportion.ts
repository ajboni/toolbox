export type ProportionTerm = 'a' | 'b' | 'c' | 'x';

export type ProportionValues = Partial<Record<ProportionTerm, number>>;

export function solveProportion(
  values: ProportionValues,
  unknown: ProportionTerm,
): number | null {
  const { a, b, c, x } = values;

  switch (unknown) {
    case 'x':
      if (a == null || b == null || c == null || a === 0) return null;
      return (b * c) / a;
    case 'a':
      if (b == null || c == null || x == null || x === 0) return null;
      return (b * c) / x;
    case 'b':
      if (a == null || c == null || x == null || c === 0) return null;
      return (a * x) / c;
    case 'c':
      if (a == null || b == null || x == null || b === 0) return null;
      return (a * x) / b;
  }
}
