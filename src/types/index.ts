export interface Coordinates {
  lng: number;
  lat: number;
}

export type LocationStatus =
  | 'idle'
  | 'locating'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported'
  | 'error';

export interface LocationState {
  status: LocationStatus;
  coords: Coordinates | null;
  accuracy: number | null;
  timestamp: number | null;
  message?: string;
}

export type PerformanceProfile = 'low' | 'medium' | 'high';

export interface PerformanceCapabilities {
  hardwareConcurrency: number;
  deviceMemoryGB: number | null;
  devicePixelRatio: number;
  isMobile: boolean;
  webglTier: 0 | 1 | 2;
}

export interface PerformanceSettings {
  profile: PerformanceProfile;
  maxDevicePixelRatio: number;
  buildingsMinZoom: number;
  poiMinZoom: number;
  poiLimit: number;
  antialias: boolean;
  fadeDuration: number;
}

export type ThemeName = 'light' | 'dark';

export interface ThemeDefinition {
  name: ThemeName;
  styleUrl: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
  building: {
    color: string;
    opacity: number;
  };
  poi: {
    default: string;
    categories: Record<string, string>;
    halo: string;
  };
  userMarker: {
    fill: string;
    ring: string;
    accuracy: string;
  };
  mask: {
    color: string;
    opacity: number;
  };
}

export interface PoiProperties {
  id: string;
  name: string;
  category: string;
  maki: string;
}

export type PoiFeature = GeoJSON.Feature<GeoJSON.Point, PoiProperties>;

export type PoiFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, PoiProperties>;

export interface SearchSuggestion {
  id: string;
  name: string;
  placeFormatted: string;
  category?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  placeFormatted: string;
  coordinates: Coordinates;
}

export interface MapServiceEvents {
  onStyleReady?: () => void;
}
