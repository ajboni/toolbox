const DEFAULT_LIMIT = 120;

export function shortDescription(text: string, limit = DEFAULT_LIMIT): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';

  const firstSentence = normalized.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? normalized;
  if (firstSentence.length <= limit) return firstSentence;

  const cut = firstSentence.slice(0, limit);
  const boundary = /[\s,;:.]/.test(firstSentence[limit] ?? '');
  const trimmed = boundary ? cut : cut.slice(0, Math.max(cut.lastIndexOf(' '), 0));

  return `${trimmed.replace(/[\s,;:.]+$/, '')}…`;
}
