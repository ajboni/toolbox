import Prism from 'prismjs';

export const MAX_HIGHLIGHT_LENGTH = 50_000;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

export function highlightCode(code: string, language: string): string {
  if (!code) return '';
  if (code.length > MAX_HIGHLIGHT_LENGTH) return escapeHtml(code);

  const grammar = Prism.languages[language];
  if (!grammar) return escapeHtml(code);

  return Prism.highlight(code, grammar, language);
}
