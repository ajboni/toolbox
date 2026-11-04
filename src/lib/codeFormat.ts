import { formatJson } from './json';

export type CodeFormat = 'json' | 'xml';

export interface FormattedText {
  format: CodeFormat | null;
  text: string;
}

type XmlTokenKind = 'open' | 'close' | 'self' | 'text' | 'comment' | 'cdata' | 'pi' | 'doctype';

interface XmlToken {
  kind: XmlTokenKind;
  raw: string;
  name?: string;
  attributes?: string;
}

interface XmlElement {
  type: 'element';
  name: string;
  attributes: string;
  selfClosing: boolean;
  children: XmlNode[];
}

type XmlNode =
  | XmlElement
  | { type: 'text' | 'comment' | 'cdata' | 'pi' | 'doctype'; raw: string };

const NAME_PATTERN = /^[^\s<>/"'=]+$/;
const TAG_START_PATTERN = /[A-Za-z_:!?/]/;

function findTagEnd(input: string, start: number): number {
  let quote: string | null = null;
  for (let index = start + 1; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '>') return index;
  }
  return -1;
}

function findDoctypeEnd(input: string, start: number): number {
  let quote: string | null = null;
  let depth = 0;
  for (let index = start + 2; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '[') {
      depth += 1;
      continue;
    }
    if (char === ']') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (char === '>' && depth === 0) return index;
  }
  return -1;
}

function scanXml(input: string): XmlToken[] | null {
  const tokens: XmlToken[] = [];
  let index = 0;

  while (index < input.length) {
    if (input[index] !== '<') {
      const next = input.indexOf('<', index);
      const end = next === -1 ? input.length : next;
      tokens.push({ kind: 'text', raw: input.slice(index, end) });
      index = end;
      continue;
    }

    if (!TAG_START_PATTERN.test(input[index + 1] ?? '')) return null;

    if (input.startsWith('<!--', index)) {
      const end = input.indexOf('-->', index + 4);
      if (end === -1) return null;
      tokens.push({ kind: 'comment', raw: input.slice(index, end + 3) });
      index = end + 3;
      continue;
    }

    if (input.startsWith('<![CDATA[', index)) {
      const end = input.indexOf(']]>', index + 9);
      if (end === -1) return null;
      tokens.push({ kind: 'cdata', raw: input.slice(index, end + 3) });
      index = end + 3;
      continue;
    }

    if (input.startsWith('<?', index)) {
      const end = input.indexOf('?>', index + 2);
      if (end === -1) return null;
      tokens.push({ kind: 'pi', raw: input.slice(index, end + 2) });
      index = end + 2;
      continue;
    }

    if (input.slice(index, index + 9).toUpperCase() === '<!DOCTYPE') {
      const end = findDoctypeEnd(input, index);
      if (end === -1) return null;
      tokens.push({ kind: 'doctype', raw: input.slice(index, end + 1) });
      index = end + 1;
      continue;
    }

    if (input.startsWith('<!', index)) return null;

    const end = findTagEnd(input, index);
    if (end === -1) return null;
    const raw = input.slice(index, end + 1);
    const inner = raw.slice(1, -1).trim();
    if (!inner) return null;

    if (inner.startsWith('/')) {
      const name = inner.slice(1).trim();
      if (!NAME_PATTERN.test(name)) return null;
      tokens.push({ kind: 'close', raw, name });
    } else {
      const selfClosing = inner.endsWith('/');
      const body = selfClosing ? inner.slice(0, -1).trimEnd() : inner;
      const nameMatch = body.match(/^[^\s/>]+/);
      if (!nameMatch) return null;
      const name = nameMatch[0];
      if (!NAME_PATTERN.test(name)) return null;
      const attributes = collapseWhitespaceOutsideQuotes(body.slice(name.length).trim());
      tokens.push({ kind: selfClosing ? 'self' : 'open', raw, name, attributes });
    }

    index = end + 1;
  }

  return tokens;
}

function collapseWhitespaceOutsideQuotes(input: string): string {
  let result = '';
  let quote: string | null = null;
  let pendingSpace = false;

  for (const char of input) {
    if (quote) {
      result += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      if (pendingSpace && result) result += ' ';
      pendingSpace = false;
      quote = char;
      result += char;
      continue;
    }
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      pendingSpace = true;
      continue;
    }
    if (pendingSpace && result) result += ' ';
    pendingSpace = false;
    result += char;
  }

  return result;
}

function buildXmlTree(tokens: XmlToken[]): XmlNode[] | null {
  const top: XmlNode[] = [];
  const stack: XmlElement[] = [];
  const current = (): XmlNode[] => (stack.length ? stack[stack.length - 1].children : top);

  for (const token of tokens) {
    if (token.kind === 'text') {
      if (stack.length) current().push({ type: 'text', raw: token.raw });
      else if (token.raw.trim()) return null;
      continue;
    }

    if (token.kind === 'comment' || token.kind === 'cdata' || token.kind === 'pi' || token.kind === 'doctype') {
      current().push({ type: token.kind, raw: token.raw });
      continue;
    }

    if (token.kind === 'open') {
      const element: XmlElement = {
        type: 'element',
        name: token.name ?? '',
        attributes: token.attributes ?? '',
        selfClosing: false,
        children: [],
      };
      current().push(element);
      stack.push(element);
      continue;
    }

    if (token.kind === 'self') {
      current().push({
        type: 'element',
        name: token.name ?? '',
        attributes: token.attributes ?? '',
        selfClosing: true,
        children: [],
      });
      continue;
    }

    const element = stack.pop();
    if (!element || element.name !== token.name) return null;
  }

  return stack.length ? null : top;
}

function openTag(element: XmlElement): string {
  return `<${element.name}${element.attributes ? ` ${element.attributes}` : ''}`;
}

function inlineXml(node: XmlNode): string {
  if (node.type !== 'element') return node.raw;
  const tag = openTag(node);
  if (node.selfClosing) return `${tag}/>`;
  return `${tag}>${node.children.map(inlineXml).join('')}</${node.name}>`;
}

function formatElement(element: XmlElement, depth: number): string {
  const pad = '  '.repeat(depth);
  const tag = openTag(element);
  if (element.selfClosing) return `${pad}${tag}/>`;

  const hasElementChild = element.children.some((child) => child.type === 'element');
  const hasText = element.children.some(
    (child) => child.type === 'text' && child.raw.trim() !== '',
  );

  if (hasElementChild && hasText) return `${pad}${inlineXml(element).trim()}`;

  if (!hasElementChild) {
    const inner = element.children.map(inlineXml).join('').trim();
    return `${pad}${tag}>${inner}</${element.name}>`;
  }

  const innerLines: string[] = [];
  for (const child of element.children) {
    if (child.type === 'element') {
      innerLines.push(formatElement(child, depth + 1));
      continue;
    }
    const raw = child.raw.trim();
    if (raw) innerLines.push(`${'  '.repeat(depth + 1)}${raw}`);
  }

  return `${pad}${tag}>\n${innerLines.join('\n')}\n${pad}</${element.name}>`;
}

export function formatXml(input: string): string | null {
  const tokens = scanXml(input.trim());
  if (!tokens) return null;

  const tree = buildXmlTree(tokens);
  if (!tree) return null;
  if (!tree.some((node) => node.type === 'element')) return null;

  const lines: string[] = [];
  for (const node of tree) {
    if (node.type === 'element') {
      lines.push(formatElement(node, 0));
      continue;
    }
    const raw = node.raw.trim();
    if (raw) lines.push(raw);
  }

  return lines.join('\n') || null;
}

export function beautifyForDiff(input: string): FormattedText {
  const text = input.trim();

  if (text.startsWith('{') || text.startsWith('[')) {
    const result = formatJson(text, { indent: 2 });
    if (result.ok) return { format: 'json', text: result.output };
  } else if (text.startsWith('<')) {
    const formatted = formatXml(text);
    if (formatted !== null) return { format: 'xml', text: formatted };
  }

  return { format: null, text: input };
}

export function detectFormat(input: string): CodeFormat | null {
  return beautifyForDiff(input).format;
}
