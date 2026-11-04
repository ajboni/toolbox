import { describe, expect, it } from 'vitest';
import {
  MAX_SQL_LENGTH,
  SQL_DIALECTS,
  formatSql,
  minifySql,
} from './sqlFormat';

describe('formatSql', () => {
  it('formats with upper-case keywords and two-space indentation', () => {
    const result = formatSql('select a,b from t where a=1 and b=2');

    expect(result.ok).toBe(true);
    expect(result.output).toBe(
      ['SELECT', '  a,', '  b', 'FROM', '  t', 'WHERE', '  a = 1', '  AND b = 2'].join(
        '\n',
      ),
    );
  });

  it('applies lower-case keywords', () => {
    const result = formatSql('SELECT A FROM T', { keywordCase: 'lower' });

    expect(result.output).toContain('select');
    expect(result.output).toContain('from');
  });

  it('preserves keyword case', () => {
    const result = formatSql('SeLeCt A FROM T', { keywordCase: 'preserve' });

    expect(result.output).toContain('SeLeCt');
  });

  it('uses four spaces and tabs', () => {
    expect(formatSql('select a from t', { indent: '4' }).output).toContain('\n    a');
    expect(formatSql('select a from t', { indent: 'tab' }).output).toContain('\n\ta');
  });

  it('keeps strings, quoted identifiers and comments intact', () => {
    const input = "select 'a  b; -- c' as `x  y` from t -- keep  this";
    const result = formatSql(input);

    expect(result.ok).toBe(true);
    expect(result.output).toContain("'a  b; -- c'");
    expect(result.output).toContain('`x  y`');
    expect(result.output).toContain('-- keep  this');
  });

  it('supports dialect-specific syntax', () => {
    expect(
      formatSql('select top 10 a from t', { dialect: 'transactsql' }).output,
    ).toContain('TOP 10');
    expect(
      formatSql('select a::int from t', { dialect: 'postgresql' }).output,
    ).toContain('a::int');
    expect(
      formatSql('select `a` from `t`', { dialect: 'mysql' }).output,
    ).toContain('`a`');
  });

  it('returns an error for invalid input', () => {
    const result = formatSql("select 'unterminated");

    expect(result.ok).toBe(false);
    expect(result.output).toBe('');
    expect(result.error).toContain('Parse error');
    expect(result.error).toContain('line 1');
  });

  it('rejects an unterminated block comment', () => {
    expect(formatSql('select 1 /* open')).toEqual({
      ok: false,
      output: '',
      error: 'Unterminated block comment at line 1, column 10',
    });
  });

  it('does not flag comment markers inside strings or dollar quotes', () => {
    expect(formatSql("select '/* not a comment' as x").ok).toBe(true);
    expect(
      formatSql('select $$ /* not a comment $$ as x', { dialect: 'postgresql' }).ok,
    ).toBe(true);
  });

  it('handles empty input', () => {
    expect(formatSql('')).toEqual({ ok: true, output: '' });
    expect(formatSql('   ')).toEqual({ ok: true, output: '' });
  });

  it('separates statements with a blank line', () => {
    expect(formatSql('select 1; select 2;').output).toBe(
      'SELECT\n  1;\n\nSELECT\n  2;',
    );
  });

  it('rejects input over the size limit', () => {
    const result = formatSql('x'.repeat(MAX_SQL_LENGTH + 1));

    expect(result.ok).toBe(false);
    expect(result.error).toContain('too long');
  });

  it('is idempotent', () => {
    const once = formatSql('select a,b from t where a=1 and b=2').output;

    expect(formatSql(once).output).toBe(once);
  });

  it('exposes the curated dialect list', () => {
    expect(Object.keys(SQL_DIALECTS)).toEqual([
      'sql',
      'postgresql',
      'mysql',
      'sqlite',
      'transactsql',
      'bigquery',
      'snowflake',
    ]);
  });
});

describe('minifySql', () => {
  it('collapses a query to one line', () => {
    const result = minifySql('select a, b from t where a = 1 and b <> 2');

    expect(result.ok).toBe(true);
    expect(result.output).toBe('SELECT a,b FROM t WHERE a=1 AND b<>2');
    expect(result.output).not.toContain('\n');
  });

  it('removes ordinary comments and keeps optimizer hints', () => {
    expect(minifySql('select a /* note */ from t -- tail').output).toBe(
      'SELECT a FROM t',
    );
    expect(minifySql('select /*+ INDEX(t) */ a from t').output).toBe(
      'SELECT /*+ INDEX(t) */ a FROM t',
    );
  });

  it('preserves strings and quoted identifiers', () => {
    const result = minifySql("select 'a--b; c, d' as `x  y` from t");

    expect(result.output).toContain("'a--b; c, d'");
    expect(result.output).toContain('`x  y`');
  });

  it('compacts comparison and JSON operators but keeps arithmetic spaced', () => {
    expect(
      minifySql("select a->>'b', c + d from t where a >= 1", {
        dialect: 'postgresql',
      }).output,
    ).toBe("SELECT a->>'b',c + d FROM t WHERE a>=1");
  });

  it('keeps numeric literals together', () => {
    expect(minifySql('select .5, 1., 1e-3 from t').output).toBe(
      'SELECT .5,1.,1e-3 FROM t',
    );
  });

  it('drops MySQL hash comments', () => {
    expect(minifySql('select a # note\nfrom t', { dialect: 'mysql' }).output).toBe(
      'SELECT a FROM t',
    );
  });

  it('applies keyword case before minifying', () => {
    expect(minifySql('SELECT A FROM T', { keywordCase: 'lower' }).output).toBe(
      'select A from T',
    );
  });

  it('is idempotent', () => {
    const once = minifySql('select a, b from t where a = 1').output;

    expect(minifySql(once).output).toBe(once);
  });

  it('propagates parse errors', () => {
    const result = minifySql("select 'unterminated");

    expect(result.ok).toBe(false);
    expect(result.output).toBe('');
  });
});
