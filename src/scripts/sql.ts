import { readStoredState, writeStoredState } from '../lib/persistedState';
import {
  SQL_DIALECTS,
  SQL_INDENTS,
  SQL_KEYWORD_CASES,
  formatSql,
  minifySql,
  type SqlDialect,
  type SqlIndent,
  type SqlKeywordCase,
} from '../lib/sqlFormat';
import { readUrlState, writeUrlState } from '../lib/urlState';
import { wireCopy } from './ui';

const CONTENT_KEY = 'sql:content';

const schema = {
  mode: 'string',
  lang: 'string',
  case: 'string',
  indent: 'string',
} as const;

const STATUS_BASE = 'mt-2 text-xs text-zinc-500 dark:text-zinc-500';
const STATUS_ERROR = 'mt-2 text-xs text-rose-600 dark:text-rose-400';

type Mode = 'format' | 'min';

function isMode(value: unknown): value is Mode {
  return value === 'format' || value === 'min';
}

function isDialect(value: unknown): value is SqlDialect {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(SQL_DIALECTS, value)
  );
}

function isIndent(value: unknown): value is SqlIndent {
  return typeof value === 'string' && (SQL_INDENTS as readonly string[]).includes(value);
}

function isKeywordCase(value: unknown): value is SqlKeywordCase {
  return (
    typeof value === 'string' && (SQL_KEYWORD_CASES as readonly string[]).includes(value)
  );
}

function initRoot(root: HTMLElement): void {
  const input = root.querySelector<HTMLTextAreaElement>('[data-sql-input]');
  const output = root.querySelector<HTMLTextAreaElement>('[data-sql-output]');
  const modeSelect = root.querySelector<HTMLSelectElement>('[data-mode-select]');
  const dialectSelect = root.querySelector<HTMLSelectElement>('[data-dialect-select]');
  const caseSelect = root.querySelector<HTMLSelectElement>('[data-case-select]');
  const indentSelect = root.querySelector<HTMLSelectElement>('[data-indent-select]');
  const indentField = root.querySelector<HTMLElement>('[data-indent-field]');
  const statusEl = root.querySelector<HTMLElement>('[data-status]');

  if (
    !input ||
    !output ||
    !modeSelect ||
    !dialectSelect ||
    !caseSelect ||
    !indentSelect
  ) {
    return;
  }

  const defaultInput = input.value;
  const defaultMode: Mode = isMode(modeSelect.value) ? modeSelect.value : 'format';
  const defaultDialect: SqlDialect = isDialect(dialectSelect.value)
    ? dialectSelect.value
    : 'sql';
  const defaultCase: SqlKeywordCase = isKeywordCase(caseSelect.value)
    ? caseSelect.value
    : 'upper';
  const defaultIndent: SqlIndent = isIndent(indentSelect.value)
    ? indentSelect.value
    : '2';
  const defaults = {
    mode: defaultMode,
    lang: defaultDialect,
    case: defaultCase,
    indent: defaultIndent,
  };

  let timer: number | undefined;

  const readControls = () => ({
    mode: isMode(modeSelect.value) ? modeSelect.value : defaultMode,
    dialect: isDialect(dialectSelect.value) ? dialectSelect.value : defaultDialect,
    keywordCase: isKeywordCase(caseSelect.value) ? caseSelect.value : defaultCase,
    indent: isIndent(indentSelect.value) ? indentSelect.value : defaultIndent,
  });

  const render = (): void => {
    const { mode, dialect, keywordCase, indent } = readControls();
    if (indentField) indentField.hidden = mode === 'min';

    const options = { dialect, keywordCase, indent };
    const result =
      mode === 'min' ? minifySql(input.value, options) : formatSql(input.value, options);

    output.value = result.output;

    if (statusEl) {
      statusEl.textContent = result.ok ? '' : `Could not parse SQL: ${result.error}`;
      statusEl.className = result.ok ? STATUS_BASE : STATUS_ERROR;
    }
  };

  const persist = (): void => {
    const { mode, dialect, keywordCase, indent } = readControls();
    writeUrlState(
      schema,
      { mode, lang: dialect, case: keywordCase, indent },
      { defaults },
    );
    writeStoredState(CONTENT_KEY, { in: input.value }, 'session');
  };

  const schedulePersist = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(persist, 300);
  };

  const applyState = (): void => {
    const state = readUrlState(schema);
    const stored = readStoredState(CONTENT_KEY, 'session');
    const saved = typeof stored?.in === 'string' ? stored.in : null;

    input.value = saved ?? defaultInput;
    modeSelect.value = isMode(state.mode) ? state.mode : defaultMode;
    dialectSelect.value = isDialect(state.lang) ? state.lang : defaultDialect;
    caseSelect.value = isKeywordCase(state.case) ? state.case : defaultCase;
    indentSelect.value = isIndent(state.indent) ? state.indent : defaultIndent;
  };

  const update = (): void => {
    render();
    schedulePersist();
  };

  applyState();
  render();
  persist();

  input.addEventListener('input', update);
  modeSelect.addEventListener('change', update);
  dialectSelect.addEventListener('change', update);
  caseSelect.addEventListener('change', update);
  indentSelect.addEventListener('change', update);

  window.addEventListener('popstate', () => {
    window.clearTimeout(timer);
    applyState();
    render();
  });

  wireCopy(root);
}

document.querySelectorAll<HTMLElement>('[data-sql-widget]').forEach(initRoot);
