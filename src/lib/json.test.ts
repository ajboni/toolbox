import { describe, expect, it } from 'vitest';
import { formatJson, minifyJson } from './json';

describe('formatJson', () => {
  it('pretty-prints with two spaces by default', () => {
    const result = formatJson('{"a":1,"b":[true,null]}');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('{\n  "a": 1,\n  "b": [\n    true,\n    null\n  ]\n}');
  });

  it('honours a custom indent', () => {
    const result = formatJson('{"a":1}', { indent: 4 });
    expect(result.output).toBe('{\n    "a": 1\n}');
  });

  it('reports a readable error with line and column', () => {
    const result = formatJson('{\n  "a": 1,\n}');
    expect(result.ok).toBe(false);
    expect(result.output).toBe('');
    expect(result.error).toMatch(/line 3/);
  });

  it('handles empty input without throwing', () => {
    const result = formatJson('');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('minifyJson', () => {
  it('removes all insignificant whitespace', () => {
    const result = minifyJson('{\n  "a": 1,\n  "b": [1, 2]\n}');
    expect(result.ok).toBe(true);
    expect(result.output).toBe('{"a":1,"b":[1,2]}');
  });

  it('keeps primitives intact', () => {
    expect(minifyJson('42').output).toBe('42');
    expect(minifyJson('"hi"').output).toBe('"hi"');
  });

  it('fails cleanly on invalid JSON', () => {
    const result = minifyJson('{a:1}');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
