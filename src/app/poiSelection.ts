import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';
import { selectionService } from '@/services/selectionService';
import { POI_CIRCLE_LAYER_ID, setPoiSelection, clearPoiSelection } from '@/map/layers/poiLayer';
import type { PoiProperties, SelectionMode } from '@/types';

/** Pitch is Mapbox's own 2D/3D camera concept — tilted (>0) reads as "3D mode" for the grow-vs-highlight decision; there's no separate app-level 2D/3D toggle to track. */
function currentMode(map: MapboxMap): SelectionMode {
  return map.getPitch() > 0.5 ? '3d' : '2d';
}

/**
 * Wires map clicks/taps to the selection service and keeps the clicked POI's
 * feature-state (and therefore its grow/highlight animation) in sync. Only
 * one `click`, one `pitchend`, and a pair of hover listeners are registered —
 * once, for the lifetime of the map — never per-click or per-feature.
 */
export function attachPoiSelection(map: MapboxMap): () => void {
  let selectedFeatureId: string | null = null;

  const applyToMap = (): void => {
    const { feature } = selectionService.getState();

    if (selectedFeatureId !== null && selectedFeatureId !== feature?.id) {
      clearPoiSelection(map, selectedFeatureId);
    }

    if (feature) {
      setPoiSelection(map, feature.id, currentMode(map));
      selectedFeatureId = feature.id;
    } else {
      selectedFeatureId = null;
    }
  };

  const handleClick = (event: MapMouseEvent): void => {
    const hits = map.queryRenderedFeatures(event.point, { layers: [POI_CIRCLE_LAYER_ID] });
    const hit = hits[0];

    if (hit && hit.id !== undefined) {
      selectionService.select({ id: String(hit.id), properties: hit.properties as PoiProperties });
    } else {
      selectionService.deselect();
    }
  };

  // Re-sync the already-selected feature's mode when the camera tilt changes
  // (e.g. selected in 3D, then the user flattens the view back to 2D).
  const handlePitchEnd = (): void => {
    if (selectionService.getState().feature) applyToMap();
  };

  const handleMouseEnter = (): void => {
    map.getCanvas().style.cursor = 'pointer';
  };
  const handleMouseLeave = (): void => {
    map.getCanvas().style.cursor = '';
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') selectionService.deselect();
  };

  const unsubscribe = selectionService.onChange(applyToMap);
  map.on('click', handleClick);
  map.on('pitchend', handlePitchEnd);
  map.on('mouseenter', POI_CIRCLE_LAYER_ID, handleMouseEnter);
  map.on('mouseleave', POI_CIRCLE_LAYER_ID, handleMouseLeave);
  document.addEventListener('keydown', handleKeyDown);

  return () => {
    unsubscribe();
    map.off('click', handleClick);
    map.off('pitchend', handlePitchEnd);
    map.off('mouseenter', POI_CIRCLE_LAYER_ID, handleMouseEnter);
    map.off('mouseleave', POI_CIRCLE_LAYER_ID, handleMouseLeave);
    document.removeEventListener('keydown', handleKeyDown);
  };
}
