import type { Coordinates, SearchResult, SearchSuggestion } from '@/types';
import { MAPBOX_API_BASE, MAPBOX_TOKEN, GEORGIA_COUNTRY_CODE } from '@/map/mapConfig';
import { MAX_BOUNDS } from '@/map/georgiaBoundary';

interface SuggestResponseItem {
  mapbox_id: string;
  name: string;
  place_formatted?: string;
  feature_type?: string;
}

interface SuggestResponse {
  suggestions: SuggestResponseItem[];
}

interface RetrieveResponse {
  features: Array<{
    geometry: { coordinates: [number, number] };
    properties: { name: string; place_formatted?: string; mapbox_id: string };
  }>;
}

const BBOX_PARAM = MAX_BOUNDS.flat().join(',');

function newSessionToken(): string {
  return crypto.randomUUID();
}

class SearchService {
  private sessionToken = newSessionToken();
  private inFlight: AbortController | null = null;
  private cache = new Map<string, SearchSuggestion[]>();

  /** Autocomplete suggestions, biased to Georgia and (optionally) the user's position. */
  async suggest(query: string, proximity: Coordinates | null): Promise<SearchSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const cacheKey = `${trimmed.toLowerCase()}|${proximity ? `${proximity.lng},${proximity.lat}` : ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    this.inFlight?.abort();
    const controller = new AbortController();
    this.inFlight = controller;

    const params = new URLSearchParams({
      q: trimmed,
      access_token: MAPBOX_TOKEN,
      session_token: this.sessionToken,
      language: 'en,ka',
      country: GEORGIA_COUNTRY_CODE,
      bbox: BBOX_PARAM,
      limit: '8',
    });
    if (proximity) params.set('proximity', `${proximity.lng},${proximity.lat}`);

    const response = await fetch(`${MAPBOX_API_BASE}/search/searchbox/v1/suggest?${params}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Search suggest failed: ${response.status}`);

    const data = (await response.json()) as SuggestResponse;
    const suggestions: SearchSuggestion[] = (data.suggestions ?? []).map((item) => ({
      id: item.mapbox_id,
      name: item.name,
      placeFormatted: item.place_formatted ?? '',
      category: item.feature_type,
    }));

    this.cache.set(cacheKey, suggestions);
    if (this.cache.size > 40) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }

    return suggestions;
  }

  async retrieve(suggestionId: string): Promise<SearchResult | null> {
    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      session_token: this.sessionToken,
    });

    const response = await fetch(
      `${MAPBOX_API_BASE}/search/searchbox/v1/retrieve/${suggestionId}?${params}`,
    );
    if (!response.ok) throw new Error(`Search retrieve failed: ${response.status}`);

    const data = (await response.json()) as RetrieveResponse;
    const feature = data.features[0];
    if (!feature) return null;

    // A retrieve ends the billing session — start a fresh one for the next search.
    this.sessionToken = newSessionToken();

    const [lng, lat] = feature.geometry.coordinates;
    return {
      id: feature.properties.mapbox_id,
      name: feature.properties.name,
      placeFormatted: feature.properties.place_formatted ?? '',
      coordinates: { lng, lat },
    };
  }
}

export const searchService = new SearchService();
