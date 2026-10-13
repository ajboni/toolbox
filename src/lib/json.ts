export interface JsonResult {
  ok: boolean;
  output: string;
  error?: string;
}

export interface FormatOptions {
  indent?: number;
}

type ParseResult = { ok: true; value: unknown } | { ok: false; error: string };

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

function readableError(error: unknown, input: string): string {
  const message = error instanceof Error ? error.message : String(error);
  const stripped = message.replace(/\s*in JSON at position \d+.*$/, '').trim();
  const lineColumnMatch = message.match(/\(line (\d+) column (\d+)\)/);
  if (lineColumnMatch) {
    return `${stripped} (line ${lineColumnMatch[1]}, column ${lineColumnMatch[2]})`;
  }
  const positionMatch = message.match(/position (\d+)/);
  if (positionMatch) {
    const position = Number(positionMatch[1]);
    if (Number.isFinite(position)) {
      const { line, column } = lineColumn(input, position);
      return `${stripped} (line ${line}, column ${column})`;
    }
  }
  return stripped || message;
}

function parse(input: string): ParseResult {
  try {
    return { ok: true, value: JSON.parse(input) as unknown };
  } catch (error) {
    return { ok: false, error: readableError(error, input) };
  }
}

export function formatJson(input: string, options: FormatOptions = {}): JsonResult {
  const indent = options.indent ?? 2;
  const parsed = parse(input);
  if (!parsed.ok) return { ok: false, output: '', error: parsed.error };
  return { ok: true, output: JSON.stringify(parsed.value, null, indent) };
}

export function minifyJson(input: string): JsonResult {
  const parsed = parse(input);
  if (!parsed.ok) return { ok: false, output: '', error: parsed.error };
  return { ok: true, output: JSON.stringify(parsed.value) };
}
