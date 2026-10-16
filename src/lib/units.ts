export type DimensionId =
  | 'length'
  | 'mass'
  | 'temperature'
  | 'area'
  | 'volume'
  | 'speed'
  | 'time'
  | 'data'
  | 'bandwidth';

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export interface Dimension {
  id: DimensionId;
  name: string;
  units: Unit[];
}

function linear(id: string, name: string, symbol: string, factor: number): Unit {
  return {
    id,
    name,
    symbol,
    toBase: (value) => value * factor,
    fromBase: (value) => value / factor,
  };
}

export const DIMENSIONS: Dimension[] = [
  {
    id: 'length',
    name: 'Length',
    units: [
      linear('mm', 'Millimeter', 'mm', 0.001),
      linear('cm', 'Centimeter', 'cm', 0.01),
      linear('m', 'Meter', 'm', 1),
      linear('km', 'Kilometer', 'km', 1000),
      linear('in', 'Inch', 'in', 0.0254),
      linear('ft', 'Foot', 'ft', 0.3048),
      linear('yd', 'Yard', 'yd', 0.9144),
      linear('mi', 'Mile', 'mi', 1609.344),
      linear('nmi', 'Nautical mile', 'nmi', 1852),
    ],
  },
  {
    id: 'mass',
    name: 'Mass',
    units: [
      linear('mg', 'Milligram', 'mg', 0.000001),
      linear('g', 'Gram', 'g', 0.001),
      linear('kg', 'Kilogram', 'kg', 1),
      linear('t', 'Metric ton', 't', 1000),
      linear('oz', 'Ounce', 'oz', 0.028349523125),
      linear('lb', 'Pound', 'lb', 0.45359237),
      linear('st', 'Stone', 'st', 6.35029318),
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    units: [
      {
        id: 'c',
        name: 'Celsius',
        symbol: '°C',
        toBase: (value) => value,
        fromBase: (value) => value,
      },
      {
        id: 'f',
        name: 'Fahrenheit',
        symbol: '°F',
        toBase: (value) => ((value - 32) * 5) / 9,
        fromBase: (value) => (value * 9) / 5 + 32,
      },
      {
        id: 'k',
        name: 'Kelvin',
        symbol: 'K',
        toBase: (value) => value - 273.15,
        fromBase: (value) => value + 273.15,
      },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    units: [
      linear('mm2', 'Square millimeter', 'mm²', 0.000001),
      linear('cm2', 'Square centimeter', 'cm²', 0.0001),
      linear('m2', 'Square meter', 'm²', 1),
      linear('ha', 'Hectare', 'ha', 10000),
      linear('km2', 'Square kilometer', 'km²', 1000000),
      linear('in2', 'Square inch', 'in²', 0.00064516),
      linear('ft2', 'Square foot', 'ft²', 0.09290304),
      linear('yd2', 'Square yard', 'yd²', 0.83612736),
      linear('ac', 'Acre', 'ac', 4046.8564224),
      linear('mi2', 'Square mile', 'mi²', 2589988.110336),
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    units: [
      linear('ml', 'Milliliter', 'mL', 0.001),
      linear('l', 'Liter', 'L', 1),
      linear('m3', 'Cubic meter', 'm³', 1000),
      linear('tsp', 'Teaspoon (US)', 'tsp', 0.00492892159375),
      linear('tbsp', 'Tablespoon (US)', 'tbsp', 0.01478676478125),
      linear('floz', 'Fluid ounce (US)', 'fl oz', 0.0295735295625),
      linear('cup', 'Cup (US)', 'cup', 0.2365882365),
      linear('pt', 'Pint (US)', 'pt', 0.473176473),
      linear('qt', 'Quart (US)', 'qt', 0.946352946),
      linear('gal', 'Gallon (US)', 'gal', 3.785411784),
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    units: [
      linear('ms', 'Meter per second', 'm/s', 1),
      linear('kmh', 'Kilometer per hour', 'km/h', 1 / 3.6),
      linear('mph', 'Mile per hour', 'mph', 0.44704),
      linear('fts', 'Foot per second', 'ft/s', 0.3048),
      linear('kn', 'Knot', 'kn', 0.5144444444444445),
    ],
  },
  {
    id: 'time',
    name: 'Time',
    units: [
      linear('ms', 'Millisecond', 'ms', 0.001),
      linear('s', 'Second', 's', 1),
      linear('min', 'Minute', 'min', 60),
      linear('h', 'Hour', 'h', 3600),
      linear('d', 'Day', 'd', 86400),
      linear('wk', 'Week', 'wk', 604800),
    ],
  },
  {
    id: 'data',
    name: 'Data',
    units: [
      linear('bit', 'Bit', 'bit', 0.125),
      linear('b', 'Byte', 'B', 1),
      linear('kb', 'Kilobyte', 'kB', 1000),
      linear('kib', 'Kibibyte', 'KiB', 1024),
      linear('mb', 'Megabyte', 'MB', 1000000),
      linear('mib', 'Mebibyte', 'MiB', 1048576),
      linear('gb', 'Gigabyte', 'GB', 1000000000),
      linear('gib', 'Gibibyte', 'GiB', 1073741824),
      linear('tb', 'Terabyte', 'TB', 1000000000000),
      linear('tib', 'Tebibyte', 'TiB', 1099511627776),
    ],
  },
  {
    id: 'bandwidth',
    name: 'Data transfer',
    units: [
      linear('bps', 'Bit per second', 'bit/s', 1),
      linear('kbps', 'Kilobit per second', 'kbit/s', 1000),
      linear('mbps', 'Megabit per second', 'Mbit/s', 1000000),
      linear('gbps', 'Gigabit per second', 'Gbit/s', 1000000000),
      linear('Bps', 'Byte per second', 'B/s', 8),
      linear('kBps', 'Kilobyte per second', 'kB/s', 8000),
      linear('MBps', 'Megabyte per second', 'MB/s', 8000000),
      linear('GBps', 'Gigabyte per second', 'GB/s', 8000000000),
      linear('KiBps', 'Kibibyte per second', 'KiB/s', 8192),
      linear('MiBps', 'Mebibyte per second', 'MiB/s', 8388608),
    ],
  },
];

export const DIMENSION_DEFAULTS: Record<DimensionId, { from: string; to: string }> = {
  length: { from: 'm', to: 'ft' },
  mass: { from: 'kg', to: 'lb' },
  temperature: { from: 'c', to: 'f' },
  area: { from: 'm2', to: 'ft2' },
  volume: { from: 'l', to: 'gal' },
  speed: { from: 'kmh', to: 'mph' },
  time: { from: 'h', to: 'min' },
  data: { from: 'mb', to: 'mib' },
  bandwidth: { from: 'mbps', to: 'MBps' },
};

export function isDimension(value: string): value is DimensionId {
  return DIMENSIONS.some((dimension) => dimension.id === value);
}

export function getDimension(id: string): Dimension | undefined {
  return DIMENSIONS.find((dimension) => dimension.id === id);
}

export function unitsFor(id: DimensionId): Unit[] {
  return getDimension(id)?.units ?? [];
}

export function findUnit(dimension: DimensionId, unitId: string): Unit | undefined {
  return unitsFor(dimension).find((unit) => unit.id === unitId);
}

export function convert(
  dimension: DimensionId,
  value: number,
  from: string,
  to: string,
): number | null {
  if (!Number.isFinite(value)) return null;
  const fromUnit = findUnit(dimension, from);
  const toUnit = findUnit(dimension, to);
  if (!fromUnit || !toUnit) return null;
  return toUnit.fromBase(fromUnit.toBase(value));
}

export interface Conversion {
  unit: Unit;
  value: number;
}

export function convertAll(
  dimension: DimensionId,
  value: number,
  from: string,
): Conversion[] | null {
  if (!Number.isFinite(value)) return null;
  const fromUnit = findUnit(dimension, from);
  if (!fromUnit) return null;
  const base = fromUnit.toBase(value);
  return unitsFor(dimension).map((unit) => ({
    unit,
    value: unit.fromBase(base),
  }));
}

export function formatUnitValue(value: number, maxFractionDigits = 6): string {
  if (!Number.isFinite(value)) return '–';
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e15 || abs < 1e-6)) {
    return value.toExponential(4);
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFractionDigits }).format(
    value,
  );
}
