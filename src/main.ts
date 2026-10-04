import mapboxgl from 'mapbox-gl';
import './styles/main.css';

import { MapService } from '@/map/mapService';
import { getPerformanceSettings } from '@/services/performanceService';
import { themeService } from '@/services/themeService';
import { locationService } from '@/services/locationService';
import { searchService } from '@/services/searchService';
import { attachPoiDiscovery } from '@/app/poiDiscovery';
import { createLocateMeControl } from '@/components/controls/locateMeControl';
import { createThemeToggleControl } from '@/components/controls/themeToggleControl';
import { createSearchControl } from '@/components/controls/searchControl';
import { createStatusIndicator } from '@/components/controls/statusIndicator';
import { mountControlsPanel } from '@/components/controls/controlsPanel';

const appEl = document.getElementById('app') as HTMLElement;
const mapEl = document.getElementById('map') as HTMLElement;
const bootLoader = document.getElementById('boot-loader') as HTMLElement;

document.documentElement.dataset.theme = themeService.getTheme();

function showFatalError(message: string): void {
  bootLoader.innerHTML = `<div class="boot-error">${message}</div>`;
  bootLoader.classList.remove('hidden');
}

async function bootstrap(): Promise<void> {
  if (!mapboxgl.supported()) {
    showFatalError('This browser does not support WebGL, so the map cannot run here.');
    return;
  }

  const performanceSettings = getPerformanceSettings();
  const mapService = new MapService(mapEl, themeService.getTheme(), performanceSettings);

  let map;
  try {
    map = await mapService.initialize();
  } catch (error) {
    console.error('[main] map failed to initialize', error);
    const reason = error instanceof Error ? error.message : 'Unknown error';
    showFatalError(`Map failed to load (${reason}). Check your Mapbox token and connection.`);
    return;
  }

  bootLoader.classList.add('hidden');

  // ---- controls ----
  const statusIndicator = createStatusIndicator();
  const locateControl = createLocateMeControl(() => {
    const state = locationService.getState();
    if (state.coords) mapService.centerOnUser(state.coords, { force: true });
    locationService.requestOnce();
  });
  const themeToggle = createThemeToggleControl(themeService.getTheme(), () => themeService.toggle());
  const searchControl = createSearchControl({
    onQuery: (query) => searchService.suggest(query, locationService.getState().coords),
    onSelect: async (suggestion) => {
      try {
        const result = await searchService.retrieve(suggestion.id);
        if (result) mapService.flyTo(result.coordinates);
      } catch (error) {
        console.error('[main] search retrieve failed', error);
      }
    },
  });

  mountControlsPanel(appEl, {
    search: searchControl.element,
    locate: locateControl.element,
    themeToggle: themeToggle.element,
    statusText: statusIndicator.element,
  });

  // ---- theme wiring ----
  themeService.onChange((theme) => {
    document.documentElement.dataset.theme = theme;
    themeToggle.setTheme(theme);
    mapService.setMapTheme(theme);
  });

  // ---- location wiring ----
  locationService.onChange((state) => {
    statusIndicator.update(state);
    locateControl.setStatus(state.status);
    if (state.status === 'active' && state.coords) {
      mapService.setUserLocation(state.coords, state.accuracy);
      mapService.centerOnUser(state.coords);
    }
  });
  locationService.start();

  // ---- nearby POI discovery ----
  attachPoiDiscovery(map, mapService, performanceSettings);
}

bootstrap().catch((error: unknown) => {
  console.error('[main] unexpected bootstrap failure', error);
  showFatalError('Something went wrong starting the map. Please reload the page.');
});
