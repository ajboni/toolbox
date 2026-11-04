import {
  bigquery,
  formatDialect,
  mysql,
  postgresql,
  snowflake,
  sql,
  sqlite,
  transactsql,
} from 'sql-formatter';
import type { DialectOptions, KeywordCase } from 'sql-formatter';

export type SqlIndent = '2' | '4' | 'tab';

export const SQL_DIALECTS = {
  sql: { label: 'Standard SQL', dialect: sql },
  postgresql: { label: 'PostgreSQL', dialect: postgresql },
  mysql: { label: 'MySQL', dialect: mysql },
  sqlite: { label: 'SQLite', dialect: sqlite },
  transactsql: { label: 'SQL Server', dialect: transactsql },
  bigquery: { label: 'BigQuery', dialect: bigquery },
  snowflake: { label: 'Snowflake', dialect: snowflake },
} as const satisfies Record<string, { label: string; dialect: DialectOptions }>;

export type SqlDialect = keyof typeof SQL_DIALECTS;
export type SqlKeywordCase = KeywordCase;

export const SQL_INDENTS: SqlIndent[] = ['2', '4', 'tab'];
export const SQL_KEYWORD_CASES: SqlKeywordCase[] = ['upper', 'lower', 'preserve'];

export const MAX_SQL_LENGTH = 100_000;

export interface SqlResult {
  ok: boolean;
  output: string;
  error?: string;
}

export interface SqlOptions {
  dialect?: SqlDialect;
  keywordCase?: SqlKeywordCase;
  indent?: SqlIndent;
}

interface MinToken {
  kind: 'word' | 'number' | 'string' | 'quoted' | 'placeholder' | 'punct' | 'comment';
  text: string;
  spaceBefore: boolean;
}

const ATOMIC_KINDS = new Set<MinToken['kind']>([
  'word',
  'number',
  'string',
  'quoted',
  'placeholder',
  'comment',
]);

const NO_SPACE_BEFORE = new Set([',', ';', ')', ']', '}', '.', '::', '(']);
const NO_SPACE_AFTER = new Set(['(', '[', '{', '.', '::', ',', ';']);
const COMPACT_OPERATORS = new Set([
  '=',
  '<>',
  '!=',
  '<=',
  '>=',
  '<',
  '>',
  '||',
  '::',
  '->',
  '->>',
  '#>',
  '#>>',
  ':=',
  '=>',
]);

const MULTI_CHAR_OPERATORS = [
  '->>',
  '#>>',
  '!~*',
  '->',
  '#>',
  '::',
  ':=',
  '=>',
  '<=',
  '>=',
  '<>',
  '!=',
  '||',
  '&&',
  '<<',
  '>>',
  '@>',
  '<@',
  '?|',
  '?&',
  '#-',
  '!~',
  '~*',
  '..',
];

const DOLLAR_TAG = /^\$[A-Za-z_0-9]*\$/;
const NUMBER = /^(?:0[xX][0-9A-Fa-f]+|0[bB][01]+|\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/;
const LEADING_DOT_NUMBER = /^\.\d+(?:[eE][+-]?\d+)?/;
const DOLLAR_PARAM = /^\$\d+/;
const NAMED_PARAM = /^[:@][A-Za-z_][A-Za-z0-9_]*/;
const WORD_START = /[A-Za-z_\u00A0-\uFFFF]/;
const WORD_PART = /[A-Za-z0-9_$\u00A0-\uFFFF]/;

function lineColumn(input: string, position: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const limit = Math.min(position, input.length);
  for (let index = 0; index < limit; index += 1) {
    if (input[index] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function skipLine(input: string, start: number): number {
  const end = input.indexOf('\n', start);
  return end === -1 ? input.length : end;
}

function skipDollarTag(input: string, start: number): number {
  const match = DOLLAR_TAG.exec(input.slice(start));
  if (!match) return -1;
  const tag = match[0];
  const end = input.indexOf(tag, start + tag.length);
  return end === -1 ? input.length : end + tag.length;
}

function skipQuoted(
  input: string,
  start: number,
  quote: string,
  backslash: boolean,
): number {
  let index = start + 1;
  while (index < input.length) {
    if (backslash && input[index] === '\\') {
      index += 2;
      continue;
    }
    if (input[index] === quote) {
      if (input[index + 1] === quote) {
        index += 2;
        continue;
      }
      return index + 1;
    }
    index += 1;
  }
  return input.length;
}

function skipBracket(input: string, start: number): number {
  let index = start + 1;
  while (index < input.length) {
    if (input[index] === ']') {
      if (input[index + 1] === ']') {
        index += 2;
        continue;
      }
      return index + 1;
    }
    index += 1;
  }
  return input.length;
}

function hasBackslashEscapes(input: string, quoteIndex: number, dialect: SqlDialect): boolean {
  if (dialect === 'mysql') return true;
  if (dialect !== 'postgresql') return false;
  return input[quoteIndex - 1] === 'E' || input[quoteIndex - 1] === 'e';
}

function findUnterminatedBlockComment(
  input: string,
  dialect: SqlDialect,
): { line: number; column: number } | null {
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    if (char === '-' && input[index + 1] === '-') {
      index = skipLine(input, index);
      continue;
    }

    if (dialect === 'mysql' && char === '#') {
      index = skipLine(input, index);
      continue;
    }

    if (char === '/' && input[index + 1] === '*') {
      const start = index;
      index += 2;
      while (index < input.length && !(input[index] === '*' && input[index + 1] === '/')) {
        index += 1;
      }
      if (index >= input.length) return lineColumn(input, start);
      index += 2;
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      index = skipQuoted(
        input,
        index,
        char,
        hasBackslashEscapes(input, index, dialect),
      );
      continue;
    }

    if (char === '[') {
      index = skipBracket(input, index);
      continue;
    }

    if (char === '$') {
      const next = skipDollarTag(input, index);
      if (next !== -1) {
        index = next;
        continue;
      }
    }

    index += 1;
  }

  return null;
}

function readableError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const first = message.split('\n')[0]?.trim() ?? '';
  return first.replace(/\.$/, '') || 'Could not parse the query';
}

function indentWidth(indent: SqlIndent): number {
  return indent === '4' ? 4 : 2;
}

export function formatSql(input: string, options: SqlOptions = {}): SqlResult {
  const dialect = options.dialect ?? 'sql';
  const indent = options.indent ?? '2';

  if (input.length > MAX_SQL_LENGTH) {
    return {
      ok: false,
      output: '',
      error: 'Query is too long to format here (limit 100,000 characters)',
    };
  }

  const comment = findUnterminatedBlockComment(input, dialect);
  if (comment) {
    return {
      ok: false,
      output: '',
      error: `Unterminated block comment at line ${comment.line}, column ${comment.column}`,
    };
  }

  try {
    const output = formatDialect(input, {
      dialect: SQL_DIALECTS[dialect].dialect,
      keywordCase: options.keywordCase ?? 'upper',
      tabWidth: indentWidth(indent),
      useTabs: indent === 'tab',
      identifierCase: 'preserve',
      dataTypeCase: 'preserve',
      functionCase: 'preserve',
      linesBetweenQueries: 1,
      expressionWidth: 50,
      logicalOperatorNewline: 'before',
      denseOperators: false,
      newlineBeforeSemicolon: false,
    });
    return { ok: true, output };
  } catch (error) {
    return { ok: false, output: '', error: readableError(error) };
  }
}

function matchOperator(input: string, start: number): string {
  for (const operator of MULTI_CHAR_OPERATORS) {
    if (input.startsWith(operator, start)) return operator;
  }
  return input[start] ?? '';
}

function tokenizeMin(input: string, dialect: SqlDialect): MinToken[] {
  const tokens: MinToken[] = [];
  let index = 0;
  let space = false;

  const push = (kind: MinToken['kind'], text: string): void => {
    tokens.push({ kind, text, spaceBefore: space });
    space = false;
  };

  while (index < input.length) {
    const char = input[index];

    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      space = true;
      index += 1;
      continue;
    }

    if (char === '-' && input[index + 1] === '-') {
      index = skipLine(input, index);
      space = true;
      continue;
    }

    if (dialect === 'mysql' && char === '#') {
      index = skipLine(input, index);
      space = true;
      continue;
    }

    if (char === '/' && input[index + 1] === '*') {
      const end = input.indexOf('*/', index + 2);
      const next = end === -1 ? input.length : end + 2;
      const text = input.slice(index, next);
      if (text.startsWith('/*!') || text.startsWith('/*+')) {
        push('comment', text);
      } else {
        space = true;
      }
      index = next;
      continue;
    }

    if (char === "'") {
      const next = skipQuoted(input, index, "'", dialect === 'mysql');
      push('string', input.slice(index, next));
      index = next;
      continue;
    }

    if (char === '"') {
      const next = skipQuoted(input, index, '"', dialect === 'mysql');
      push('quoted', input.slice(index, next));
      index = next;
      continue;
    }

    if (char === '`') {
      const next = skipQuoted(input, index, '`', dialect === 'mysql');
      push('quoted', input.slice(index, next));
      index = next;
      continue;
    }

    if (char === '[') {
      const next = skipBracket(input, index);
      push('quoted', input.slice(index, next));
      index = next;
      continue;
    }

    if (char === '$') {
      const next = skipDollarTag(input, index);
      if (next !== -1) {
        push('string', input.slice(index, next));
        index = next;
        continue;
      }
      const param = DOLLAR_PARAM.exec(input.slice(index));
      if (param) {
        push('placeholder', param[0]);
        index += param[0].length;
        continue;
      }
    }

    if (char === '?') {
      push('placeholder', '?');
      index += 1;
      continue;
    }

    if ((char === ':' || char === '@') && WORD_START.test(input[index + 1] ?? '')) {
      const param = NAMED_PARAM.exec(input.slice(index));
      if (param) {
        push('placeholder', param[0]);
        index += param[0].length;
        continue;
      }
    }

    if (char === '%' && input[index + 1] === 's') {
      push('placeholder', '%s');
      index += 2;
      continue;
    }

    if (/[0-9]/.test(char ?? '')) {
      const number = NUMBER.exec(input.slice(index));
      if (number) {
        push('number', number[0]);
        index += number[0].length;
        continue;
      }
    }

    if (char === '.') {
      const number = LEADING_DOT_NUMBER.exec(input.slice(index));
      if (number) {
        push('number', number[0]);
        index += number[0].length;
        continue;
      }
    }

    if (WORD_START.test(char ?? '')) {
      let end = index + 1;
      while (end < input.length && WORD_PART.test(input[end] ?? '')) end += 1;
      push('word', input.slice(index, end));
      index = end;
      continue;
    }

    const operator = matchOperator(input, index);
    push('punct', operator);
    index += operator.length;
  }

  return tokens;
}

function isAtomic(token: MinToken): boolean {
  return ATOMIC_KINDS.has(token.kind);
}

function needsSpace(previous: MinToken, next: MinToken): boolean {
  if (next.kind === 'punct' && NO_SPACE_BEFORE.has(next.text)) return false;
  if (previous.kind === 'punct' && NO_SPACE_AFTER.has(previous.text)) return false;
  if (next.kind === 'punct' && COMPACT_OPERATORS.has(next.text)) return false;
  if (previous.kind === 'punct' && COMPACT_OPERATORS.has(previous.text)) return false;
  if (isAtomic(previous) && isAtomic(next)) return next.spaceBefore;
  return true;
}

function minifyFormatted(input: string, dialect: SqlDialect): string {
  const tokens = tokenizeMin(input, dialect);
  if (tokens.length === 0) return '';

  let output = tokens[0].text;
  for (let index = 1; index < tokens.length; index += 1) {
    const previous = tokens[index - 1];
    const token = tokens[index];
    if (needsSpace(previous, token)) output += ' ';
    output += token.text;
  }

  return output;
}

export function minifySql(input: string, options: SqlOptions = {}): SqlResult {
  const formatted = formatSql(input, options);
  if (!formatted.ok) return formatted;
  return {
    ok: true,
    output: minifyFormatted(formatted.output, options.dialect ?? 'sql'),
  };
}
