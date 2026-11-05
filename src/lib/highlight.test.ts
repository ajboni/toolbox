import { describe, expect, it } from 'vitest';
import { MAX_HIGHLIGHT_LENGTH, escapeHtml, highlightCode } from './highlight';

describe('escapeHtml', () => {
  it('escapes the HTML-sensitive characters', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    );
  });
});

describe('highlightCode', () => {
  it('returns an empty string for empty input', () => {
    expect(highlightCode('', 'sql')).toBe('');
  });

  it('falls back to escaped text for an unregistered language', () => {
    expect(highlightCode('<a>&"', 'missing')).toBe('&lt;a&gt;&amp;&quot;');
  });

  it('falls back to escaped text above the size limit', () => {
    const input = '<'.repeat(MAX_HIGHLIGHT_LENGTH + 1);
    const output = highlightCode(input, 'sql');

    expect(output).not.toContain('<span');
    expect(output.startsWith('&lt;')).toBe(true);
  });
});
