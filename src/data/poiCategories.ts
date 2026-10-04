/**
 * Buckets Mapbox's `maki` icon ids (from the poi_label tileset) into the broad
 * categories the spec asks for. Shared by the POI service (classification) and
 * the theme definitions (coloring), so both stay in sync automatically.
 */
export type PoiCategory =
  | 'food'
  | 'hotel'
  | 'culture'
  | 'nature'
  | 'health'
  | 'shopping'
  | 'transport'
  | 'religious'
  | 'sports'
  | 'services'
  | 'other';

const MAKI_TO_CATEGORY: Record<string, PoiCategory> = {
  restaurant: 'food',
  cafe: 'food',
  bar: 'food',
  'fast-food': 'food',
  'ice-cream': 'food',
  bakery: 'food',
  lodging: 'hotel',
  campsite: 'hotel',
  museum: 'culture',
  'art-gallery': 'culture',
  monument: 'culture',
  castle: 'culture',
  theatre: 'culture',
  attraction: 'culture',
  'viewpoint': 'nature',
  park: 'nature',
  garden: 'nature',
  mountain: 'nature',
  water: 'nature',
  beach: 'nature',
  hospital: 'health',
  pharmacy: 'health',
  doctor: 'health',
  dentist: 'health',
  veterinary: 'health',
  shop: 'shopping',
  clothing_store: 'shopping',
  grocery: 'shopping',
  supermarket: 'shopping',
  'shopping-mall': 'shopping',
  bus: 'transport',
  rail: 'transport',
  'rail-metro': 'transport',
  airport: 'transport',
  fuel: 'transport',
  'car-rental': 'transport',
  parking: 'transport',
  'place-of-worship': 'religious',
  religious_christian: 'religious',
  religious_muslim: 'religious',
  religious_jewish: 'religious',
  pitch: 'sports',
  stadium: 'sports',
  swimming: 'sports',
  'fitness-centre': 'sports',
  bank: 'services',
  post: 'services',
  police: 'services',
  'fire-station': 'services',
  toilet: 'services',
  laundry: 'services',
  library: 'services',
  school: 'services',
};

export function categoryForMaki(maki: string | undefined): PoiCategory {
  if (!maki) return 'other';
  return MAKI_TO_CATEGORY[maki] ?? 'other';
}

export const POI_CATEGORIES: PoiCategory[] = [
  'food',
  'hotel',
  'culture',
  'nature',
  'health',
  'shopping',
  'transport',
  'religious',
  'sports',
  'services',
  'other',
];
