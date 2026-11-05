import { describe, expect, it } from 'vitest';
import { highlightSql } from './highlightSql';

function textOf(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

describe('highlightSql', () => {
  it('highlights keywords, strings, comments and numbers', () => {
    const html = highlightSql("-- note\nselect 'a < b', 42 from t where id = 1");

    expect(html).toContain('token comment');
    expect(html).toContain('token keyword');
    expect(html).toContain('token string');
    expect(html).toContain('token number');
    expect(html).toContain('&lt;');
  });

  it('highlights functions and operators', () => {
    const html = highlightSql('select count(*) from t where a >= 1');

    expect(html).toContain('token function');
    expect(html).toContain('token operator');
  });

  it('highlights backtick identifiers', () => {
    expect(highlightSql('select `a` from `t`')).toContain('token identifier');
  });

  it('preserves the exact text', () => {
    const input = "SELECT\n  a,\n  b\nFROM t\nWHERE a = 'x'";

    expect(textOf(highlightSql(input))).toBe(input);
  });

  it('escapes HTML', () => {
    const html = highlightSql("select '<script>' as x");

    expect(html).toContain('&lt;script');
    expect(html).not.toContain('<script>');
  });

  it('returns an empty string for empty input', () => {
    expect(highlightSql('')).toBe('');
  });
});
