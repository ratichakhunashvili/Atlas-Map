# Georgia Map

A performance-first, Georgia-only interactive Mapbox GL JS map. The map *is*
the app — there's no landing page, no dashboard, just a fast, restricted 3D
map of Georgia with GPS, nearby places, and search.

## Stack

Vite + TypeScript + Mapbox GL JS. No UI framework, no state-management
library, no unnecessary dependencies.

## Getting started

```bash
npm install
cp .env.example .env        # then edit .env and set VITE_MAPBOX_TOKEN
npm run dev
```

Open the printed `localhost` URL. Allow location access to see your GPS
marker; deny it and the map still works fine.

```bash
npm run build       # production build (type-checks, then builds)
npm run preview      # serve the production build locally
```

## Deploying to Vercel

1. Push this repo to GitHub (or any git host) and import it in Vercel, or run
   `vercel` from this folder.
2. Framework preset: **Vite** (already declared in `vercel.json`).
3. Add an environment variable in the Vercel project settings:
   - `VITE_MAPBOX_TOKEN` = your Mapbox public token
4. Deploy. No server/backend is required — it's a static Vite build.

## Project structure

```
src/
  main.ts              composition root: wires services + map + controls together
  app/                  app-level orchestration (not meant to be portable)
    poiDiscovery.ts     ties camera movement to nearby-POI fetching
  map/                  the portable map engine — copy this folder + services/ into another project
    mapService.ts       owns the Mapbox GL Map instance; the public API other code should use
    mapConfig.ts         token + all tuning constants in one place
    georgiaBoundary.ts   Georgia polygon, bounds, and the "outside" mask geometry
    layers/              buildings, POIs, the outside-Georgia mask, the user-location marker
    themes/               light.ts / dark.ts — the only two files to touch for a new palette
  services/             framework-agnostic logic, independent of the map instance
    locationService.ts   Geolocation wrapper (watch + one-shot), graceful error states
    poiService.ts        Mapbox Tilequery-based nearby-POI fetching, cached & cancellable
    searchService.ts     Mapbox Search Box suggest/retrieve, debounced & cancellable
    performanceService.ts device capability detection -> low/medium/high profile
    themeService.ts       current theme + persistence + subscribers
  components/controls/  small DOM UI controls (search box, locate button, theme toggle, status text)
  data/                  static data: Georgia boundary GeoJSON, POI category map
  types/                 shared TypeScript types
  utils/                 debounce, geo math (distance, circle polygon, bbox)
```

### Moving this into another project later

Copy `src/map/`, `src/services/`, `src/data/`, `src/types/`, and `src/utils/`
into the target project, keep the same import structure (or update the `@/`
alias), and call the same entry points `main.ts` uses:
`new MapService(container, theme, performanceSettings).initialize()`, then
`setUserLocation`, `centerOnUser`, `updateNearbyPOIs`, `setMapTheme`,
`applyPerformanceSettings`, `flyTo`. `src/main.ts` and `src/app/` are the only
genuinely app-specific pieces.

## Key design decisions

- **Buildings**: rendered via a single `fill-extrusion` layer reading
  Mapbox's own `composite` source (`building` source-layer from the streets
  vector tiles) — not a custom GeoJSON of every building, and not Mapbox
  Standard's photorealistic style fragment (which also brings atmosphere,
  terrain-like fog, and 3D landmarks the spec explicitly didn't want). This
  keeps the "simple city-of-blocks" look and gives exact `minzoom` control
  per performance profile.
- **Georgia lock-in**: `maxBounds` constrains the camera, and a single fill
  layer (a world-ish rectangle with Georgia punched out as a hole, ~30
  vertices total) dims everything outside the country. No per-country data
  is loaded or styled specially — the dimming layer is geometry-only.
- **Nearby POIs**: fetched from the Mapbox **Tilequery API** against a ~5km
  radius around the current map center, refetched only after the view
  settles and has moved far enough to matter. Rendered through one GeoJSON
  source + two layers (circles, labels) — never DOM markers per place.
- **Search**: Mapbox **Search Box API** (`suggest` + `retrieve`), restricted
  to Georgia's bounding box, debounced, with stale requests aborted.
- **Performance profile**: a lightweight heuristic (CPU cores, device
  memory, WebGL tier, mobile UA, pixel ratio) picks `low` / `medium` / `high`,
  which tunes building `minzoom`, POI fetch limits, antialiasing, and style
  fade duration. On capped profiles, `window.devicePixelRatio` is briefly
  overridden before the map is constructed so low-end GPUs don't pay for a
  3x-retina canvas.
- **Theme switching**: swaps the Mapbox style URL (`light-v11` / `dark-v11`)
  and re-adds the custom layers on `style.load` — the `Map` instance itself
  is never destroyed and recreated.

### Known limitation

Mapbox's `maxBounds` keeps the Georgia bounds from ever leaving the
viewport, but at very low zoom (viewport wider than the bounds box) the
camera can still slide far enough to reveal neighboring regions —
dimmed by the mask layer, never styled as "available". Tightening this
further would mean raising `minZoom` enough to always fill the viewport
with the bounds box, which felt overly restrictive on wide desktop
screens; the current balance favored a country that still reads clearly
as "locked" without feeling claustrophobic.
