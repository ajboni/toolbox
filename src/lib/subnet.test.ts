import { describe, expect, it } from 'vitest';
import { parseCidr, subnetInfo } from './subnet';

function info(input: string) {
  const result = subnetInfo(input);
  if (!result.ok) throw new Error(`expected ${input} to parse: ${result.error}`);
  return result.info;
}

describe('subnetInfo', () => {
  it('computes a /24', () => {
    const result = info('192.168.1.10/24');
    expect(result).toMatchObject({
      prefix: 24,
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      firstHost: '192.168.1.1',
      lastHost: '192.168.1.254',
      netmask: '255.255.255.0',
      wildcard: '0.0.0.255',
      totalAddresses: 256,
      usableHosts: 254,
      type: 'network',
    });
  });

  it('computes a /25', () => {
    const result = info('192.168.1.128/25');
    expect(result.network).toBe('192.168.1.128');
    expect(result.broadcast).toBe('192.168.1.255');
    expect(result.usableHosts).toBe(126);
  });

  it('computes a /30', () => {
    const result = info('10.0.0.0/30');
    expect(result.firstHost).toBe('10.0.0.1');
    expect(result.lastHost).toBe('10.0.0.2');
    expect(result.usableHosts).toBe(2);
  });

  it('handles /31 as a point-to-point link', () => {
    const result = info('10.0.0.0/31');
    expect(result).toMatchObject({
      firstHost: '10.0.0.0',
      lastHost: '10.0.0.1',
      usableHosts: 2,
      type: 'point-to-point',
    });
  });

  it('handles /32 as a single host', () => {
    const result = info('10.0.0.5/32');
    expect(result).toMatchObject({
      network: '10.0.0.5',
      broadcast: '10.0.0.5',
      firstHost: '10.0.0.5',
      lastHost: '10.0.0.5',
      usableHosts: 1,
      type: 'host',
    });
  });

  it('handles /0', () => {
    const result = info('0.0.0.0/0');
    expect(result).toMatchObject({
      netmask: '0.0.0.0',
      wildcard: '255.255.255.255',
      totalAddresses: 4294967296,
      usableHosts: 4294967294,
    });
  });

  it('accepts a dotted netmask', () => {
    expect(info('192.168.1.0/255.255.255.0').prefix).toBe(24);
    expect(info('192.168.1.0/255.255.255.128').prefix).toBe(25);
  });

  it('defaults to /32 without a prefix', () => {
    expect(info('10.0.0.1').prefix).toBe(32);
  });
});

describe('parseCidr errors', () => {
  it('rejects empty and malformed input', () => {
    for (const input of ['', '   ', 'foo', '192.168.1', '300.1.1.1/24', '1.2.3.4/33']) {
      expect(parseCidr(input)).toHaveProperty('error');
    }
  });

  it('rejects a non-contiguous netmask', () => {
    expect(parseCidr('192.168.1.0/255.0.255.0')).toHaveProperty('error');
  });

  it('reports errors through subnetInfo', () => {
    const result = subnetInfo('999.1.1.1/24');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('valid IPv4');
  });
});
