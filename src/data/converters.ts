import type { DimensionId } from '../lib/units';

export interface ReferenceTable {
  title: string;
  note?: string;
  headers: string[];
  rows: string[][];
}

export interface ConverterPage {
  dimension: DimensionId;
  slug: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  about: string;
  reference?: ReferenceTable;
}

export const BINARY_PREFIXES: ReferenceTable = {
  title: 'Decimal and binary prefixes',
  note: 'RAM and the IEC units (KiB, MiB, GiB) step by powers of 1024, while disk drives and network speeds are sold in powers of 1000. That is why a drive labelled 1 TB shows about 931 GiB.',
  headers: ['Decimal (SI)', 'Value', 'Binary (IEC)', 'Value'],
  rows: [
    ['KB kilobyte', '1000 B', 'KiB kibibyte', '1024 B'],
    ['MB megabyte', '1,000,000 B', 'MiB mebibyte', '1,048,576 B'],
    ['GB gigabyte', '1,000,000,000 B', 'GiB gibibyte', '1,073,741,824 B'],
    ['TB terabyte', '1,000,000,000,000 B', 'TiB tebibyte', '1,099,511,627,776 B'],
  ],
};

export const CONVERTER_PAGES: ConverterPage[] = [
  {
    dimension: 'length',
    slug: 'length',
    title: 'Length Converter',
    description:
      'Convert between millimeters, meters, kilometers, inches, feet, miles and more.',
    seoTitle: 'Length Converter · Meters, Feet, Inches, Miles',
    seoDescription:
      'Convert between metric and imperial length units: mm, cm, m, km, inches, feet, yards, miles and nautical miles. Instant and shareable.',
    intro:
      'Convert between metric and imperial length units, from millimeters to nautical miles.',
    about:
      'Length units relate through a single factor against the meter, so converting is one multiplication and one division. Metric units step by powers of ten, while imperial units use exact definitions, such as 0.3048 meters per foot.',
  },
  {
    dimension: 'mass',
    slug: 'mass',
    title: 'Weight Converter',
    description: 'Convert between milligrams, grams, kilograms, ounces, pounds and stones.',
    seoTitle: 'Weight Converter · kg, lb, oz, g, Stones',
    seoDescription:
      'Convert between metric and imperial mass units: milligrams, grams, kilograms, tonnes, ounces, pounds and stones. Instant and shareable.',
    intro: 'Convert between metric and imperial mass units, from milligrams to metric tonnes.',
    about:
      'Mass units convert through a factor against the kilogram, the SI base unit. Imperial units such as the pound are defined exactly in terms of it (1 lb = 0.45359237 kg), so results stay precise.',
  },
  {
    dimension: 'temperature',
    slug: 'temperature',
    title: 'Temperature Converter',
    description: 'Convert between Celsius, Fahrenheit and Kelvin.',
    seoTitle: 'Temperature Converter · Celsius, Fahrenheit, Kelvin',
    seoDescription:
      'Convert between Celsius, Fahrenheit and Kelvin instantly, including negative temperatures. Shareable and computed in your browser.',
    intro: 'Convert between Celsius, Fahrenheit and Kelvin, including negative temperatures.',
    about:
      'Unlike other units, temperature scales differ by offsets as well as by scale, so each conversion uses its own formula: °F = °C × 9/5 + 32 and K = °C + 273.15.',
  },
  {
    dimension: 'area',
    slug: 'area',
    title: 'Area Converter',
    description: 'Convert between square meters, square feet, acres, hectares and more.',
    seoTitle: 'Area Converter · m², ft², Acres, Hectares',
    seoDescription:
      'Convert between area units: square millimeters, centimeters, meters, kilometers, square feet, yards, acres and hectares. Instant and shareable.',
    intro: 'Convert between metric and imperial area units, from square millimeters to square miles.',
    about:
      'Area units are the square of their length counterparts, so the factors are squared too (1 ft² = 0.3048² m²). The acre and the hectare round out land measurements.',
  },
  {
    dimension: 'volume',
    slug: 'volume',
    title: 'Volume Converter',
    description: 'Convert between liters, milliliters, gallons, cups and more.',
    seoTitle: 'Volume Converter · Liters, Gallons, Cups, mL',
    seoDescription:
      'Convert between volume units: milliliters, liters, cubic meters, US teaspoons, tablespoons, cups, pints, quarts and gallons. Instant and shareable.',
    intro: 'Convert between metric and US volume units, from milliliters to gallons.',
    about:
      'Volume units convert through a factor against the liter. US customary cooking units (teaspoon, tablespoon, cup, pint, quart and gallon) are defined as exact fractions of the US gallon.',
  },
  {
    dimension: 'speed',
    slug: 'speed',
    title: 'Speed Converter',
    description: 'Convert between km/h, mph, m/s, ft/s and knots.',
    seoTitle: 'Speed Converter · km/h, mph, m/s, Knots',
    seoDescription:
      'Convert between speed units: meters per second, kilometers per hour, miles per hour, feet per second and knots. Instant and shareable.',
    intro: 'Convert between metric and imperial speed units, from meters per second to knots.',
    about:
      'Speed units convert through a factor against meters per second. Useful anchors: 1 m/s = 3.6 km/h, 1 mph = 1.609344 km/h and 1 knot = 1.852 km/h.',
  },
  {
    dimension: 'time',
    slug: 'time',
    title: 'Time Converter',
    description: 'Convert between milliseconds, seconds, minutes, hours, days and weeks.',
    seoTitle: 'Time Converter · Seconds, Minutes, Hours, Days',
    seoDescription:
      'Convert between time units: milliseconds, seconds, minutes, hours, days and weeks. Instant, shareable and computed in your browser.',
    intro: 'Convert between time units, from milliseconds to weeks.',
    about:
      'Time units relate through exact factors against the second: 60 seconds in a minute, 60 minutes in an hour, 24 hours in a day and 7 days in a week.',
  },
  {
    dimension: 'data',
    slug: 'data',
    title: 'Data Size Converter',
    description:
      'Convert between bytes, kilobytes, megabytes, gigabytes and their binary counterparts.',
    seoTitle: 'Data Size Converter · KB, MB, GB, KiB, MiB',
    seoDescription:
      'Convert between data sizes: bits, bytes, kilobytes, megabytes, gigabytes, terabytes and their binary KiB, MiB, GiB and TiB counterparts. Instant and shareable.',
    intro: 'Convert between decimal (kB, MB, GB) and binary (KiB, MiB, GiB) data sizes.',
    about:
      'Decimal data units step by powers of 1000, while binary units step by powers of 1024. That is why a drive sold as 1 TB does not hold 1 TiB: 1 TiB is about 1.1 TB.',
    reference: BINARY_PREFIXES,
  },
  {
    dimension: 'bandwidth',
    slug: 'bandwidth',
    title: 'Bandwidth Converter',
    description: 'Convert between Mbps, MB/s, Gbps and other data transfer rates.',
    seoTitle: 'Bandwidth Converter · Mbps, MB/s, Gbps',
    seoDescription:
      'Convert between data transfer rates: bit/s, kbit/s, Mbit/s, Gbit/s, bytes per second, kB/s, MB/s, GB/s and their binary counterparts. Instant and shareable.',
    intro: 'Convert between network and storage transfer rates, from bit/s to Gbit/s and B/s to GB/s.',
    about:
      'Transfer rates mix two bases: network speeds are usually bits per second (Mbps) while file transfers are bytes per second (MB/s). One byte is eight bits, so 1 MB/s equals 8 Mbps. Binary units such as MiB/s use 1024-based steps.',
    reference: BINARY_PREFIXES,
  },
];

export function findConverterPage(slug: string): ConverterPage | undefined {
  return CONVERTER_PAGES.find((page) => page.slug === slug);
}
