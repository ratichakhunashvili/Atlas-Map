import type { Coordinates, PoiFeature, PoiFeatureCollection } from '@/types';
import { MAPBOX_API_BASE, MAPBOX_TOKEN } from '@/map/mapConfig';
import { categoryForMaki } from '@/data/poiCategories';

interface TilequeryProperties {
  name?: string;
  name_en?: string;
  class?: string;
  maki?: string;
  type?: string;
}

interface TilequeryFeature {
  type: 'Feature';
  properties: TilequeryProperties;
  geometry: { type: 'Point'; coordinates: [number, number] };
}

interface TilequeryResponse {
  type: 'FeatureCollection';
  features: TilequeryFeature[];
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 30;
/** Snap cache keys to a coarse grid so small pans reuse the same cached fetch. */
const CACHE_GRID_DEG = 0.01;

interface CacheEntry {
  collection: PoiFeatureCollection;
  timestamp: number;
}

function cacheKey(center: Coordinates, radius: number): string {
  const lng = Math.round(center.lng / CACHE_GRID_DEG) * CACHE_GRID_DEG;
  const lat = Math.round(center.lat / CACHE_GRID_DEG) * CACHE_GRID_DEG;
  return `${lng.toFixed(3)},${lat.toFixed(3)},${radius}`;
}

function toPoiFeature(feature: TilequeryFeature): PoiFeature {
  const [lng, lat] = feature.geometry.coordinates;
  const name = feature.properties.name_en || feature.properties.name || feature.properties.class || 'Unnamed';
  const maki = feature.properties.maki ?? '';

  return {
    type: 'Feature',
    properties: {
      id: `${name}-${lng.toFixed(5)}-${lat.toFixed(5)}`,
      name,
      category: categoryForMaki(maki),
      maki,
    },
    geometry: { type: 'Point', coordinates: [lng, lat] },
  };
}

class PoiService {
  private cache = new Map<string, CacheEntry>();
  private inFlight: AbortController | null = null;

  /**
   * Fetches POIs within `radiusMeters` of `center` via the Mapbox Tilequery API
   * (reads straight from the existing streets vector tiles — no custom POI
   * database, no huge Georgia-wide payload). Cancels any previous in-flight
   * request so a fast-moving map never produces a request pile-up.
   */
  async fetchNearby(center: Coordinates, radiusMeters: number, limit: number): Promise<PoiFeatureCollection> {
    const key = cacheKey(center, radiusMeters);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.collection;
    }

    this.inFlight?.abort();
    const controller = new AbortController();
    this.inFlight = controller;

    const url =
      `${MAPBOX_API_BASE}/v4/mapbox.mapbox-streets-v8/tilequery/` +
      `${center.lng},${center.lat}.json?radius=${radiusMeters}&limit=${limit}` +
      `&layers=poi_label&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Tilequery request failed: ${response.status}`);
    }

    const data = (await response.json()) as TilequeryResponse;
    const collection: PoiFeatureCollection = {
      type: 'FeatureCollection',
      features: data.features.map(toPoiFeature),
    };

    this.cache.set(key, { collection, timestamp: Date.now() });
    if (this.cache.size > CACHE_MAX_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }

    return collection;
  }
}

export const poiService = new PoiService();
