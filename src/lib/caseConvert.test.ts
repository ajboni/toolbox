import { describe, expect, it } from 'vitest';
import { convertCase, splitWords } from './caseConvert';

describe('splitWords', () => {
  it('splits on separators and camel humps', () => {
    expect(splitWords('hello world')).toEqual(['hello', 'world']);
    expect(splitWords('hello-world_again')).toEqual(['hello', 'world', 'again']);
    expect(splitWords('helloWorld')).toEqual(['hello', 'World']);
    expect(splitWords('HTTPServer')).toEqual(['HTTP', 'Server']);
  });

  it('keeps accents', () => {
    expect(splitWords('año nuevo')).toEqual(['año', 'nuevo']);
  });
});

describe('convertCase', () => {
  const input = 'hello world again';

  it('converts to each case', () => {
    expect(convertCase(input, 'camel')).toBe('helloWorldAgain');
    expect(convertCase(input, 'pascal')).toBe('HelloWorldAgain');
    expect(convertCase(input, 'snake')).toBe('hello_world_again');
    expect(convertCase(input, 'kebab')).toBe('hello-world-again');
    expect(convertCase(input, 'constant')).toBe('HELLO_WORLD_AGAIN');
    expect(convertCase(input, 'title')).toBe('Hello World Again');
    expect(convertCase(input, 'sentence')).toBe('Hello world again');
    expect(convertCase(input, 'lower')).toBe('hello world again');
    expect(convertCase(input, 'upper')).toBe('HELLO WORLD AGAIN');
  });

  it('normalizes mixed input', () => {
    expect(convertCase('  Foo__barBaz  ', 'camel')).toBe('fooBarBaz');
  });

  it('returns an empty string for empty input', () => {
    expect(convertCase('   ', 'camel')).toBe('');
  });
});
