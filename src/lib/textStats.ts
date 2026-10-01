export interface TextStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  lines: number;
  paragraphs: number;
  readingMinutes: number;
}

const WORDS_PER_MINUTE = 200;

export function textStats(text: string): TextStats {
  const characters = [...text].length;
  const charactersNoSpaces = [...text.replace(/\s/gu, '')].length;
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const sentences = text.split(/[.!?…]+/u).filter((part) => part.trim()).length;
  const lines = text === '' ? 0 : text.split(/\n/u).length;
  const paragraphs = text.split(/\n\s*\n/u).filter((part) => part.trim()).length;
  const readingMinutes =
    words === 0 ? 0 : Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    lines,
    paragraphs,
    readingMinutes,
  };
}
