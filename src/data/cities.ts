export interface City {
  slug: string;
  name: string;
  lat: number;
  lon: number;
  tz: string;
}

export const CITIES: City[] = [
  { slug: 'london', name: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { slug: 'paris', name: 'Paris', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  { slug: 'berlin', name: 'Berlin', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin' },
  { slug: 'madrid', name: 'Madrid', lat: 40.4168, lon: -3.7038, tz: 'Europe/Madrid' },
  { slug: 'rome', name: 'Rome', lat: 41.9028, lon: 12.4964, tz: 'Europe/Rome' },
  { slug: 'amsterdam', name: 'Amsterdam', lat: 52.3676, lon: 4.9041, tz: 'Europe/Amsterdam' },
  { slug: 'istanbul', name: 'Istanbul', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  { slug: 'moscow', name: 'Moscow', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { slug: 'reykjavik', name: 'Reykjavík', lat: 64.1466, lon: -21.9426, tz: 'Atlantic/Reykjavik' },
  { slug: 'new-york', name: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  { slug: 'los-angeles', name: 'Los Angeles', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
  { slug: 'chicago', name: 'Chicago', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
  { slug: 'toronto', name: 'Toronto', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  { slug: 'mexico-city', name: 'Mexico City', lat: 19.4326, lon: -99.1332, tz: 'America/Mexico_City' },
  { slug: 'bogota', name: 'Bogotá', lat: 4.711, lon: -74.0721, tz: 'America/Bogota' },
  { slug: 'lima', name: 'Lima', lat: -12.0464, lon: -77.0428, tz: 'America/Lima' },
  { slug: 'sao-paulo', name: 'São Paulo', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo' },
  { slug: 'buenos-aires', name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires' },
  { slug: 'santiago', name: 'Santiago', lat: -33.4489, lon: -70.6693, tz: 'America/Santiago' },
  { slug: 'anchorage', name: 'Anchorage', lat: 61.2181, lon: -149.9003, tz: 'America/Anchorage' },
  { slug: 'honolulu', name: 'Honolulu', lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu' },
  { slug: 'cairo', name: 'Cairo', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  { slug: 'lagos', name: 'Lagos', lat: 6.5244, lon: 3.3792, tz: 'Africa/Lagos' },
  { slug: 'nairobi', name: 'Nairobi', lat: -1.2921, lon: 36.8219, tz: 'Africa/Nairobi' },
  { slug: 'johannesburg', name: 'Johannesburg', lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg' },
  { slug: 'cape-town', name: 'Cape Town', lat: -33.9249, lon: 18.4241, tz: 'Africa/Johannesburg' },
  { slug: 'dubai', name: 'Dubai', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { slug: 'mumbai', name: 'Mumbai', lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' },
  { slug: 'delhi', name: 'Delhi', lat: 28.7041, lon: 77.1025, tz: 'Asia/Kolkata' },
  { slug: 'bangkok', name: 'Bangkok', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  { slug: 'jakarta', name: 'Jakarta', lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' },
  { slug: 'singapore', name: 'Singapore', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
  { slug: 'hong-kong', name: 'Hong Kong', lat: 22.3193, lon: 114.1694, tz: 'Asia/Hong_Kong' },
  { slug: 'shanghai', name: 'Shanghai', lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai' },
  { slug: 'beijing', name: 'Beijing', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
  { slug: 'seoul', name: 'Seoul', lat: 37.5665, lon: 126.978, tz: 'Asia/Seoul' },
  { slug: 'tokyo', name: 'Tokyo', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
  { slug: 'sydney', name: 'Sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { slug: 'melbourne', name: 'Melbourne', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
  { slug: 'auckland', name: 'Auckland', lat: -36.8485, lon: 174.7633, tz: 'Pacific/Auckland' },
];

export const DEFAULT_CITY: City = CITIES[0];

export function findCity(slug: string): City | undefined {
  return CITIES.find((city) => city.slug === slug);
}

export function nearestCity(lat: number, lon: number): City | undefined {
  let best: City | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const city of CITIES) {
    const distance = (city.lat - lat) ** 2 + (city.lon - lon) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = city;
    }
  }
  return bestDistance < 0.01 ? best : undefined;
}
