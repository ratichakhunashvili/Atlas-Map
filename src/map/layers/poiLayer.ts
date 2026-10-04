import type { Map as MapboxMap, GeoJSONSource, ExpressionSpecification } from 'mapbox-gl';
import type { PoiFeatureCollection, ThemeDefinition } from '@/types';

export const POI_SOURCE_ID = 'nearby-pois';
const CIRCLE_LAYER_ID = 'poi-circles';
const LABEL_LAYER_ID = 'poi-labels';

const EMPTY_COLLECTION: PoiFeatureCollection = { type: 'FeatureCollection', features: [] };

function categoryColorExpression(theme: ThemeDefinition): ExpressionSpecification {
  const stops = Object.entries(theme.poi.categories).flatMap(([category, color]) => [category, color]);
  return ['match', ['get', 'category'], ...stops, theme.poi.default] as unknown as ExpressionSpecification;
}

/**
 * Renders the nearby-discovery POI set through a single GeoJSON source and
 * two layers (circles + labels) — never one DOM marker per place. Both
 * layers are gated by zoom so the map stays clean when the user is zoomed
 * out and only earns icon clutter once they're close enough to want it.
 */
export function addPoiLayer(map: MapboxMap, theme: ThemeDefinition, minZoom: number): void {
  if (!map.getSource(POI_SOURCE_ID)) {
    map.addSource(POI_SOURCE_ID, {
      type: 'geojson',
      data: EMPTY_COLLECTION,
    });
  }

  if (!map.getLayer(CIRCLE_LAYER_ID)) {
    map.addLayer({
      id: CIRCLE_LAYER_ID,
      type: 'circle',
      source: POI_SOURCE_ID,
      minzoom: minZoom,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], minZoom, 3.5, minZoom + 4, 6],
        'circle-color': categoryColorExpression(theme),
        'circle-stroke-width': 1,
        'circle-stroke-color': theme.poi.halo,
      },
    });
  }

  if (!map.getLayer(LABEL_LAYER_ID)) {
    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: POI_SOURCE_ID,
      minzoom: minZoom + 2,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-offset': [0, 1.1],
        'text-anchor': 'top',
        'text-optional': true,
      },
      paint: {
        'text-color': theme.text,
        'text-halo-color': theme.poi.halo,
        'text-halo-width': 1,
      },
    });
  }
}

export function setPoiData(map: MapboxMap, collection: PoiFeatureCollection): void {
  const source = map.getSource(POI_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData(collection);
}

export function updatePoiTheme(map: MapboxMap, theme: ThemeDefinition): void {
  if (map.getLayer(CIRCLE_LAYER_ID)) {
    map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-color', categoryColorExpression(theme));
    map.setPaintProperty(CIRCLE_LAYER_ID, 'circle-stroke-color', theme.poi.halo);
  }
  if (map.getLayer(LABEL_LAYER_ID)) {
    map.setPaintProperty(LABEL_LAYER_ID, 'text-color', theme.text);
    map.setPaintProperty(LABEL_LAYER_ID, 'text-halo-color', theme.poi.halo);
  }
}
