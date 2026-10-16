export interface SubnetInfo {
  prefix: number;
  input: string;
  network: string;
  broadcast: string;
  firstHost: string | null;
  lastHost: string | null;
  netmask: string;
  wildcard: string;
  totalAddresses: number;
  usableHosts: number;
  type: 'network' | 'point-to-point' | 'host';
}

export type SubnetResult =
  | { ok: true; info: SubnetInfo }
  | { ok: false; error: string };

export interface ParsedCidr {
  address: number;
  prefix: number;
}

function ipToInt(ip: string): number | null {
  const octets = ip.split('.');
  if (octets.length !== 4) return null;
  let value = 0;
  for (const octet of octets) {
    if (!/^\d{1,3}$/.test(octet)) return null;
    const byte = Number(octet);
    if (byte > 255) return null;
    value = (value << 8) | byte;
  }
  return value >>> 0;
}

function intToIp(value: number): string {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join('.');
}

function maskForPrefix(prefix: number): number {
  if (prefix <= 0) return 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

function popcount(value: number): number {
  let count = 0;
  let remaining = value >>> 0;
  while (remaining) {
    count += remaining & 1;
    remaining >>>= 1;
  }
  return count;
}

function parsePrefix(raw: string): { prefix: number } | { error: string } {
  if (raw.includes('.')) {
    const mask = ipToInt(raw);
    if (mask === null) return { error: 'The netmask must look like 255.255.255.0.' };
    const prefix = popcount(mask);
    if (maskForPrefix(prefix) !== mask) {
      return { error: 'The netmask must be a contiguous block of ones.' };
    }
    return { prefix };
  }
  if (!/^\d{1,2}$/.test(raw)) return { error: 'The prefix must be a number from 0 to 32.' };
  const prefix = Number(raw);
  if (prefix < 0 || prefix > 32) return { error: 'The prefix must be between 0 and 32.' };
  return { prefix };
}

export function parseCidr(input: string): ParsedCidr | { error: string } {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  if (trimmed === '') return { error: 'Enter an address such as 192.168.1.0/24.' };

  const [ipPart, prefixPart] = trimmed.split('/');
  if (ipPart === undefined || ipPart === '') {
    return { error: 'Enter an IPv4 address before the slash.' };
  }
  const address = ipToInt(ipPart);
  if (address === null) {
    return { error: `${ipPart} is not a valid IPv4 address.` };
  }

  if (prefixPart === undefined) {
    return { address, prefix: 32 };
  }
  const parsed = parsePrefix(prefixPart);
  if ('error' in parsed) return parsed;
  return { address, prefix: parsed.prefix };
}

export function subnetInfo(input: string): SubnetResult {
  const parsed = parseCidr(input);
  if ('error' in parsed) return { ok: false, error: parsed.error };

  const { address, prefix } = parsed;
  const mask = maskForPrefix(prefix);
  const network = (address & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const totalAddresses = prefix === 0 ? 4294967296 : 2 ** (32 - prefix);

  let usableHosts: number;
  let firstHost: string | null;
  let lastHost: string | null;
  let type: SubnetInfo['type'];

  if (prefix === 32) {
    usableHosts = 1;
    firstHost = intToIp(address);
    lastHost = firstHost;
    type = 'host';
  } else if (prefix === 31) {
    usableHosts = 2;
    firstHost = intToIp(network);
    lastHost = intToIp(broadcast);
    type = 'point-to-point';
  } else {
    usableHosts = totalAddresses - 2;
    firstHost = intToIp(network + 1);
    lastHost = intToIp(broadcast - 1);
    type = 'network';
  }

  return {
    ok: true,
    info: {
      prefix,
      input: `${intToIp(address)}/${prefix}`,
      network: intToIp(network),
      broadcast: intToIp(broadcast),
      firstHost,
      lastHost,
      netmask: intToIp(mask),
      wildcard: intToIp(~mask >>> 0),
      totalAddresses,
      usableHosts,
      type,
    },
  };
}
