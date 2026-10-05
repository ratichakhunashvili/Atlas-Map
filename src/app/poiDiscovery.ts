import type { Map as MapboxMap } from 'mapbox-gl';
import type { MapService } from '@/map/mapService';
import { poiService } from '@/services/poiService';
import { selectionService } from '@/services/selectionService';
import { DISCOVERY_RADIUS_M, POI_REFETCH_THRESHOLD_M } from '@/map/mapConfig';
import { distanceMeters } from '@/utils/geo';
import { debounce } from '@/utils/debounce';
import type { Coordinates, PerformanceSettings, PoiFeatureCollection } from '@/types';

/** A refresh can drop the currently-selected POI from the visible set (panned away) — don't leave its info panel open for a marker that's no longer there. */
function deselectIfGone(collection: PoiFeatureCollection): void {
  const { feature } = selectionService.getState();
  if (!feature) return;
  const stillPresent = collection.features.some((f) => f.properties.id === feature.id);
  if (!stillPresent) selectionService.deselect();
}

/**
 * Ties the map's camera to nearby-POI loading: refetches only after the
 * view settles (`moveend`) AND has drifted far enough to matter, so panning
 * a few meters or zooming in and out never produces a request storm.
 */
export function attachPoiDiscovery(
  map: MapboxMap,
  mapService: MapService,
  settings: PerformanceSettings,
): () => void {
  let lastFetchCenter: Coordinates | null = null;

  const refresh = debounce(() => {
    if (map.getZoom() < settings.poiMinZoom) return;

    const centerLngLat = map.getCenter();
    const center: Coordinates = { lng: centerLngLat.lng, lat: centerLngLat.lat };

    if (lastFetchCenter && distanceMeters(lastFetchCenter, center) < POI_REFETCH_THRESHOLD_M) {
      return;
    }
    lastFetchCenter = center;

    poiService
      .fetchNearby(center, DISCOVERY_RADIUS_M, settings.poiLimit)
      .then((collection) => {
        mapService.updateNearbyPOIs(collection);
        deselectIfGone(collection);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('[poiDiscovery] fetch failed', error);
      });
  }, 400);

  map.on('moveend', refresh);
  refresh();

  return () => {
    refresh.cancel();
    map.off('moveend', refresh);
  };
}
