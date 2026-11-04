import { describe, expect, it } from 'vitest';
import { beautifyForDiff, detectFormat, formatXml } from './codeFormat';

describe('beautifyForDiff', () => {
  it('formats minified JSON with two-space indentation', () => {
    const result = beautifyForDiff('{"name":"bajtools","tools":["json","diff"],"open":true}');
    expect(result.format).toBe('json');
    expect(result.text).toBe(
      ['{', '  "name": "bajtools",', '  "tools": [', '    "json",', '    "diff"', '  ],', '  "open": true', '}'].join(
        '\n',
      ),
    );
  });

  it('normalises the indentation of JSON that is already pretty', () => {
    const result = beautifyForDiff('{\n    "a": 1\n}');
    expect(result).toEqual({ format: 'json', text: '{\n  "a": 1\n}' });
  });

  it('normalises number formats through JSON.parse', () => {
    expect(beautifyForDiff('{"n":1.0,"e":1e3}').text).toBe('{\n  "n": 1,\n  "e": 1000\n}');
  });

  it('leaves invalid JSON untouched', () => {
    const input = '{"a": 1,}';
    expect(beautifyForDiff(input)).toEqual({ format: null, text: input });
  });

  it('formats minified XML', () => {
    const result = beautifyForDiff('<root><item id="1">one</item><item id="2">two</item></root>');
    expect(result).toEqual({
      format: 'xml',
      text: [
        '<root>',
        '  <item id="1">one</item>',
        '  <item id="2">two</item>',
        '</root>',
      ].join('\n'),
    });
  });

  it('keeps a declaration and comments on their own lines', () => {
    expect(formatXml('<?xml version="1.0"?><!-- note --><r><a/></r>')).toBe(
      ['<?xml version="1.0"?>', '<!-- note -->', '<r>', '  <a/>', '</r>'].join('\n'),
    );
  });

  it('keeps attributes with a > inside quotes intact', () => {
    expect(formatXml('<r><a title="x>y">z</a></r>')).toBe(
      ['<r>', '  <a title="x>y">z</a>', '</r>'].join('\n'),
    );
  });

  it('keeps mixed content inline so text does not gain whitespace', () => {
    expect(formatXml('<p>Hello <b>world</b>!</p>')).toBe('<p>Hello <b>world</b>!</p>');
  });

  it('keeps CDATA inline', () => {
    expect(formatXml('<r><![CDATA[a < b]]></r>')).toBe('<r><![CDATA[a < b]]></r>');
  });

  it('leaves unbalanced XML untouched', () => {
    const input = '<a><b></a>';
    expect(beautifyForDiff(input)).toEqual({ format: null, text: input });
  });

  it('leaves plain text untouched', () => {
    const input = 'just some text\nwith lines';
    expect(beautifyForDiff(input)).toEqual({ format: null, text: input });
  });

  it('keeps a doctype and normalises attribute whitespace', () => {
    expect(formatXml('<!DOCTYPE note SYSTEM "note.dtd"><note\n  id = "1"\n  lang=\'en\'/>')).toBe(
      ['<!DOCTYPE note SYSTEM "note.dtd">', '<note id = "1" lang=\'en\'/>'].join('\n'),
    );
  });

  it('formats a self-closing root', () => {
    expect(formatXml('<svg/>')).toBe('<svg/>');
  });

  it('leaves markup-like plain text untouched', () => {
    const input = '<3 and <not a tag>';
    expect(beautifyForDiff(input)).toEqual({ format: null, text: input });
  });

  it('formats SVG documents through the XML formatter', () => {
    const result = beautifyForDiff('<svg><rect width="10" height="10"/></svg>');
    expect(result).toEqual({
      format: 'xml',
      text: ['<svg>', '  <rect width="10" height="10"/>', '</svg>'].join('\n'),
    });
  });
});

describe('detectFormat', () => {
  it('reports the detected format', () => {
    expect(detectFormat('{"a":1}')).toBe('json');
    expect(detectFormat('<r><a/></r>')).toBe('xml');
    expect(detectFormat('plain')).toBeNull();
  });
});
