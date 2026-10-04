import type { PerformanceCapabilities, PerformanceProfile, PerformanceSettings } from '@/types';
import { BUILDINGS_BASE_MIN_ZOOM, POI_MIN_ZOOM } from '@/map/mapConfig';

/** Navigator fields that aren't in all lib.dom.d.ts versions yet. */
interface NavigatorExtras {
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

function detectWebglTier(): 0 | 1 | 2 {
  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    if (gl2) return 2;
    const gl1 = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
    return gl1 ? 1 : 0;
  } catch {
    return 0;
  }
}

export function detectCapabilities(): PerformanceCapabilities {
  const nav = navigator as Navigator & NavigatorExtras;
  return {
    hardwareConcurrency: nav.hardwareConcurrency ?? 4,
    deviceMemoryGB: nav.deviceMemory ?? null,
    devicePixelRatio: window.devicePixelRatio || 1,
    isMobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),
    webglTier: detectWebglTier(),
  };
}

/**
 * Scores actual processing capability (CPU cores, memory, WebGL tier) only.
 *
 * Deliberately NOT a factor here: `isMobile` and `devicePixelRatio`. Being a
 * phone or having a high-density screen says nothing about GPU/CPU power —
 * a flagship phone with a 3x display is often faster than an old laptop —
 * and an earlier version of this function used both to justify rendering
 * the map canvas at a reduced backing resolution on phones. That made every
 * high-DPI phone blurry (CSS size unchanged, backing bitmap 2-3x smaller,
 * browser upscales it) for no reliable performance signal in return. Scene
 * complexity (buildings, POIs, effects) is where the real GPU cost is, so
 * that's what this profile controls — screen resolution is left alone.
 */
export function resolveProfile(caps: PerformanceCapabilities): PerformanceProfile {
  if (caps.webglTier === 0) return 'low';

  let score = 0;
  if (caps.hardwareConcurrency >= 8) score += 2;
  else if (caps.hardwareConcurrency >= 4) score += 1;

  if (caps.deviceMemoryGB === null) score += 1; // unknown (often desktop Safari/iOS) — assume capable
  else if (caps.deviceMemoryGB >= 8) score += 2;
  else if (caps.deviceMemoryGB >= 4) score += 1;

  if (caps.webglTier === 2) score += 1;

  if (score <= 1) return 'low';
  if (score <= 3) return 'medium';
  return 'high';
}

const PROFILE_SETTINGS: Record<PerformanceProfile, PerformanceSettings> = {
  low: {
    profile: 'low',
    buildingsMinZoom: BUILDINGS_BASE_MIN_ZOOM + 1.5,
    poiMinZoom: POI_MIN_ZOOM + 1,
    poiLimit: 20,
    antialias: false,
    fadeDuration: 0,
  },
  medium: {
    profile: 'medium',
    buildingsMinZoom: BUILDINGS_BASE_MIN_ZOOM,
    poiMinZoom: POI_MIN_ZOOM,
    poiLimit: 50,
    antialias: false,
    fadeDuration: 150,
  },
  high: {
    profile: 'high',
    buildingsMinZoom: BUILDINGS_BASE_MIN_ZOOM - 0.5,
    poiMinZoom: POI_MIN_ZOOM,
    poiLimit: 50,
    antialias: true,
    fadeDuration: 300,
  },
};

export function getPerformanceSettings(): PerformanceSettings {
  const caps = detectCapabilities();
  const profile = resolveProfile(caps);
  return PROFILE_SETTINGS[profile];
}
