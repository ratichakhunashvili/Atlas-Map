import type { ThemeDefinition } from '@/types';

/** Temporary palette — swap these values once the final brand palette is ready. Nothing outside this file needs to change. */
export const darkTheme: ThemeDefinition = {
  name: 'dark',
  styleUrl: 'mapbox://styles/mapbox/dark-v11',
  background: '#0b0f14',
  surface: '#151a21',
  text: '#e8eaed',
  accent: '#5b9bff',
  building: {
    color: '#3a4555',
    opacity: 0.8,
  },
  poi: {
    default: '#9aa4b2',
    halo: '#0b0f14',
    categories: {
      food: '#ff8a4c',
      hotel: '#b794f6',
      culture: '#e0b84f',
      nature: '#5cc26a',
      health: '#f87171',
      shopping: '#f472b6',
      transport: '#5b9bff',
      religious: '#2dd4bf',
      sports: '#38bdf8',
      services: '#9aa4b2',
      other: '#9aa4b2',
    },
  },
  userMarker: {
    fill: '#5b9bff',
    ring: '#0b0f14',
    accuracy: 'rgba(91, 155, 255, 0.18)',
  },
  mask: {
    color: '#000000',
    opacity: 0.55,
  },
};
