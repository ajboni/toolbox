import { convert } from './units';

export interface SpeedPreset {
  label: string;
  value: number;
  unit: string;
}

export const SPEED_PRESETS: SpeedPreset[] = [
  { label: '5 Mbit/s', value: 5, unit: 'mbps' },
  { label: '10 Mbit/s', value: 10, unit: 'mbps' },
  { label: '25 Mbit/s', value: 25, unit: 'mbps' },
  { label: '50 Mbit/s', value: 50, unit: 'mbps' },
  { label: '100 Mbit/s', value: 100, unit: 'mbps' },
  { label: '250 Mbit/s', value: 250, unit: 'mbps' },
  { label: '500 Mbit/s', value: 500, unit: 'mbps' },
  { label: '1 Gbit/s', value: 1, unit: 'gbps' },
  { label: '10 MB/s', value: 10, unit: 'MBps' },
  { label: '100 MB/s', value: 100, unit: 'MBps' },
];

export function transferSeconds(
  sizeValue: number,
  sizeUnit: string,
  rateValue: number,
  rateUnit: string,
): number | null {
  if (!Number.isFinite(sizeValue) || !Number.isFinite(rateValue)) return null;
  if (sizeValue < 0 || rateValue <= 0) return null;

  const bits = convert('data', sizeValue, sizeUnit, 'bit');
  const bitsPerSecond = convert('bandwidth', rateValue, rateUnit, 'bps');
  if (bits == null || bitsPerSecond == null || bitsPerSecond <= 0) return null;

  return bits / bitsPerSecond;
}

const UNITS: { label: string; seconds: number }[] = [
  { label: 'd', seconds: 86400 },
  { label: 'h', seconds: 3600 },
  { label: 'min', seconds: 60 },
  { label: 's', seconds: 1 },
];

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '–';
  if (seconds === 0) return '0 s';
  if (seconds < 0.5) return 'under a second';

  let remaining = Math.round(seconds);
  const parts: string[] = [];
  for (const unit of UNITS) {
    const value = Math.floor(remaining / unit.seconds);
    if (value > 0 || (unit.label === 's' && parts.length === 0)) {
      parts.push(`${value} ${unit.label}`);
    }
    remaining -= value * unit.seconds;
  }
  return parts.join(' ');
}
