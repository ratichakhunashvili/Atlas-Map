import type { ThemeDefinition } from '@/types';

/** Temporary palette — swap these values once the final brand palette is ready. Nothing outside this file needs to change. */
export const lightTheme: ThemeDefinition = {
  name: 'light',
  styleUrl: 'mapbox://styles/mapbox/light-v11',
  background: '#f4f2ec',
  surface: '#ffffff',
  text: '#1b1d1f',
  accent: '#2563eb',
  building: {
    color: '#aab4c0',
    opacity: 0.75,
  },
  poi: {
    default: '#6b7280',
    halo: '#ffffff',
    categories: {
      food: '#e2622a',
      hotel: '#8b5cf6',
      culture: '#c08a2e',
      nature: '#3f9142',
      health: '#dc2626',
      shopping: '#db2777',
      transport: '#2563eb',
      religious: '#0f766e',
      sports: '#0891b2',
      services: '#64748b',
      other: '#6b7280',
    },
  },
  userMarker: {
    fill: '#2563eb',
    ring: '#ffffff',
    accuracy: 'rgba(37, 99, 235, 0.15)',
  },
  mask: {
    color: '#0b0f14',
    opacity: 0.35,
  },
};
