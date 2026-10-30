// IP → coarse geography for the traffic log. geoip-lite resolves to country / region code / city and
// a representative coordinate; that coordinate is the city centre, not the reader's position, which is
// all an IP address can ever tell us.
import geoip from "geoip-lite";

export interface GeoInfo {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

const EMPTY: GeoInfo = { country: null, region: null, city: null, latitude: null, longitude: null };

// Loopback, private ranges and link-local never resolve; leaving them empty keeps the admin tables
// honest about how much traffic came from inside the network.
const NON_PUBLIC = /^(?:::ffff:)?(?:10\.|127\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.|0\.|::1$|f[cd][0-9a-f]{2}:|fe80:)/i;

export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim();
  if (!first) return null;
  return first.startsWith("::ffff:") ? first.slice(7) : first;
}

export function locate(ip: string | null | undefined): GeoInfo {
  if (!ip || NON_PUBLIC.test(ip)) return EMPTY;
  let hit: geoip.Lookup | null = null;
  try {
    hit = geoip.lookup(ip);
  } catch {
    return EMPTY;
  }
  if (!hit) return EMPTY;
  return {
    country: hit.country || null,
    region: hit.region || null,
    city: hit.city || null,
    latitude: hit.ll?.[0] ?? null,
    longitude: hit.ll?.[1] ?? null,
  };
}
