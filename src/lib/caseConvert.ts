export type CaseMode =
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'title'
  | 'sentence'
  | 'lower'
  | 'upper';

export const CASE_MODES: CaseMode[] = [
  'camel',
  'pascal',
  'snake',
  'kebab',
  'constant',
  'title',
  'sentence',
  'lower',
  'upper',
];

export function splitWords(input: string): string[] {
  return input
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function capitalize(word: string): string {
  const lower = word.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function convertCase(input: string, mode: CaseMode): string {
  const words = splitWords(input);
  if (words.length === 0) return '';
  const lower = words.map((word) => word.toLowerCase());

  switch (mode) {
    case 'camel':
      return lower[0] + lower.slice(1).map(capitalize).join('');
    case 'pascal':
      return lower.map(capitalize).join('');
    case 'snake':
      return lower.join('_');
    case 'kebab':
      return lower.join('-');
    case 'constant':
      return lower.join('_').toUpperCase();
    case 'title':
      return lower.map(capitalize).join(' ');
    case 'sentence':
      return capitalize(lower.join(' '));
    case 'lower':
      return lower.join(' ');
    case 'upper':
      return lower.join(' ').toUpperCase();
  }
}
