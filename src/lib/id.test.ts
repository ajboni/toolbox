import { describe, expect, it } from 'vitest';
import { generateUuids, uuidv4 } from './id';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuidv4', () => {
  it('produces a valid v4 UUID', () => {
    expect(uuidv4()).toMatch(UUID_V4);
  });

  it('is unique per call', () => {
    expect(uuidv4()).not.toBe(uuidv4());
  });
});

describe('generateUuids', () => {
  it('generates the requested amount', () => {
    expect(generateUuids(5)).toHaveLength(5);
  });

  it('can upper-case the output', () => {
    const [id] = generateUuids(1, true);
    expect(id).toBe(id.toUpperCase());
    expect(id.toLowerCase()).toMatch(UUID_V4);
  });

  it('clamps the count', () => {
    expect(generateUuids(0)).toHaveLength(1);
    expect(generateUuids(5000)).toHaveLength(1000);
  });
});
