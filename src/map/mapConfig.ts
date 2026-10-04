/**
 * Single place that knows about the Mapbox token and other map-wide constants.
 * Swap the token, styles, or tuning numbers here without touching application logic.
 */

export const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

export const MAPBOX_API_BASE = 'https://api.mapbox.com';

export const INITIAL_ZOOM = 6.4;
export const MIN_ZOOM = 5;
export const MAX_ZOOM = 19.5;

/** Below this zoom we don't bother fetching or drawing nearby POIs — the user is looking at the whole country, not a neighborhood. */
export const POI_MIN_ZOOM = 12;

/** Zoom at which building extrusions start to appear at all. */
export const BUILDINGS_BASE_MIN_ZOOM = 14;

/** Discovery radius around the user/map-center, in meters (spec target: ~5km). */
export const DISCOVERY_RADIUS_M = 5000;

/** Re-fetch POIs only after the view center has moved this far. */
export const POI_REFETCH_THRESHOLD_M = 1200;

/** Re-center the user-location marker only after it moved this far (avoids GPS jitter redraws). */
export const LOCATION_MARKER_THRESHOLD_M = 12;

export const SEARCH_DEBOUNCE_MS = 250;

export const GEORGIA_COUNTRY_CODE = 'ge';

export function assertMapboxToken(): void {
  if (!MAPBOX_TOKEN) {
    throw new Error(
      'Missing VITE_MAPBOX_TOKEN. Copy .env.example to .env and set your Mapbox public token.',
    );
  }
}
