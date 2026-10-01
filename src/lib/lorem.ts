export type LoremUnit = 'paragraphs' | 'sentences' | 'words';

export interface LoremOptions {
  units: LoremUnit;
  count: number;
  seed: number;
  startWithLorem?: boolean;
}

const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur',
  'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui',
  'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'curabitur',
  'pretium', 'tincidunt', 'lacus', 'nulla', 'gravida', 'orci', 'a', 'odio',
  'facilisi', 'cras', 'fermentum', 'odio', 'eu', 'feugiat', 'pretium', 'nibh',
];

const PREFIX = ['lorem', 'ipsum', 'dolor', 'sit', 'amet'];

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWord(rng: () => number): string {
  return WORDS[Math.floor(rng() * WORDS.length)];
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildSentence(rng: () => number, prefix: boolean): string {
  const length = 6 + Math.floor(rng() * 8);
  const words: string[] = prefix ? [...PREFIX] : [];
  while (words.length < length) words.push(pickWord(rng));
  return `${capitalize(words.join(' '))}.`;
}

function buildParagraph(rng: () => number, prefix: boolean): string {
  const count = 3 + Math.floor(rng() * 3);
  const sentences: string[] = [];
  for (let index = 0; index < count; index += 1) {
    sentences.push(buildSentence(rng, prefix && index === 0));
  }
  return sentences.join(' ');
}

export function generateLorem({
  units,
  count,
  seed,
  startWithLorem = false,
}: LoremOptions): string {
  const rng = mulberry32(seed);
  const total = Math.max(1, Math.min(Math.floor(count) || 1, 100));
  let output: string;

  if (units === 'words') {
    const words: string[] = startWithLorem ? [...PREFIX] : [];
    while (words.length < total) words.push(pickWord(rng));
    output = words.join(' ');
  } else if (units === 'sentences') {
    output = Array.from({ length: total }, (_value, index) =>
      buildSentence(rng, startWithLorem && index === 0),
    ).join(' ');
  } else {
    output = Array.from({ length: total }, (_value, index) =>
      buildParagraph(rng, startWithLorem && index === 0),
    ).join('\n\n');
  }

  return output;
}
