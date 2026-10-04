import mapboxgl, { type Map as MapboxMap } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import type {
  Coordinates,
  PerformanceSettings,
  PoiFeatureCollection,
  ThemeDefinition,
  ThemeName,
} from '@/types';
import { assertMapboxToken, INITIAL_ZOOM, MAPBOX_TOKEN, MAX_ZOOM, MIN_ZOOM, POI_MIN_ZOOM } from '@/map/mapConfig';
import { GEORGIA_CENTER, MAX_BOUNDS } from '@/map/georgiaBoundary';
import { getTheme } from '@/map/themes';
import { addMaskLayer } from '@/map/layers/maskLayer';
import { addBuildingsLayer, setBuildingsMinZoom } from '@/map/layers/buildingsLayer';
import { addPoiLayer, setPoiData } from '@/map/layers/poiLayer';
import { UserLocationLayer } from '@/map/layers/userLocationLayer';

/**
 * Owns the Mapbox GL `Map` instance and every map-specific layer/marker.
 * This is the module meant to be portable: copy `map/` into another Vite
 * project, keep the `services/` it depends on, and it should work unmodified.
 */
export class MapService {
  private map: MapboxMap | null = null;
  private userLocationLayer: UserLocationLayer | null = null;
  private currentTheme: ThemeDefinition;
  private buildingsMinZoom: number;
  private hasCenteredOnUserOnce = false;

  constructor(
    private readonly container: HTMLElement,
    themeName: ThemeName,
    private readonly performance: PerformanceSettings,
  ) {
    this.currentTheme = getTheme(themeName);
    this.buildingsMinZoom = performance.buildingsMinZoom;
  }

  initialize(): Promise<MapboxMap> {
    let map: MapboxMap;
    try {
      assertMapboxToken();
      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Deliberately NOT touching window.devicePixelRatio here. Mapbox GL JS
      // reads it natively to size the canvas backing store correctly for the
      // display — overriding it to "save" GPU cost renders a lower-resolution
      // bitmap that the browser then stretches to the CSS size, which is
      // exactly what makes high-DPI phones look blurry. Performance is
      // controlled through scene complexity instead (see performanceService).
      map = new mapboxgl.Map({
        container: this.container,
        style: this.currentTheme.styleUrl,
        center: GEORGIA_CENTER,
        zoom: INITIAL_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        maxBounds: MAX_BOUNDS,
        antialias: this.performance.antialias,
        fadeDuration: this.performance.fadeDuration,
        renderWorldCopies: false,
        pitchWithRotate: true,
        touchPitch: true,
        attributionControl: false,
      });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error('Mapbox failed to initialize'));
    }

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    this.map = map;

    return new Promise((resolve, reject) => {
      let settled = false;

      map.on('error', (event) => {
        const status = (event.error as { status?: number } | undefined)?.status;
        // 401/403 means a bad or restricted token — nothing will ever render, so surface it.
        // Anything else (a missing sprite icon, a single failed tile) is routine and non-fatal.
        if (!settled && (status === 401 || status === 403)) {
          settled = true;
          reject(event.error);
          return;
        }
        console.error('[mapService] map error', event.error ?? event);
      });

      map.once('load', () => {
        if (settled) return;
        settled = true;
        this.addCustomLayers();
        resolve(map);
      });
    });
  }

  private addCustomLayers(): void {
    const map = this.map;
    if (!map) return;
    addMaskLayer(map, this.currentTheme);
    addBuildingsLayer(map, this.currentTheme, this.buildingsMinZoom);
    addPoiLayer(map, this.currentTheme, POI_MIN_ZOOM);
    this.userLocationLayer?.reapplyAfterStyleChange(this.currentTheme);
  }

  getMap(): MapboxMap {
    if (!this.map) throw new Error('MapService.initialize() must resolve before use');
    return this.map;
  }

  setUserLocation(coords: Coordinates, accuracyMeters: number | null): void {
    const map = this.getMap();
    if (!this.userLocationLayer) {
      this.userLocationLayer = new UserLocationLayer(map, this.currentTheme);
    }
    this.userLocationLayer.update(coords, accuracyMeters);
  }

  /** Moves the camera to the user exactly once automatically (first fix); afterwards only via explicit "locate me" clicks. */
  centerOnUser(coords: Coordinates, { force = false }: { force?: boolean } = {}): void {
    if (this.hasCenteredOnUserOnce && !force) return;
    this.hasCenteredOnUserOnce = true;

    const map = this.getMap();
    map.flyTo({
      center: [coords.lng, coords.lat],
      zoom: Math.max(map.getZoom(), 14),
      essential: true,
      speed: 1.2,
    });
  }

  flyTo(coords: Coordinates, zoom = 15.5): void {
    this.getMap().flyTo({ center: [coords.lng, coords.lat], zoom, essential: true });
  }

  updateNearbyPOIs(collection: PoiFeatureCollection): void {
    setPoiData(this.getMap(), collection);
  }

  setMapTheme(themeName: ThemeName): void {
    const theme = getTheme(themeName);
    this.currentTheme = theme;
    const map = this.getMap();

    this.userLocationLayer?.applyTheme(theme);
    map.once('style.load', () => this.addCustomLayers());
    map.setStyle(theme.styleUrl);
  }

  applyPerformanceSettings(settings: PerformanceSettings): void {
    this.buildingsMinZoom = settings.buildingsMinZoom;
    if (this.map) setBuildingsMinZoom(this.map, settings.buildingsMinZoom);
  }

  destroy(): void {
    this.userLocationLayer?.remove();
    this.map?.remove();
    this.map = null;
  }
}
