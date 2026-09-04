import type { EquipmentId, RouteCommand, SceneId } from '@/learning/types';

/** Spanish gear names (the UI kit's `equipmentLabel` covers English). */
export const equipmentEs: Record<EquipmentId, string> = {
  hose: 'Manguera',
  cone: 'Cono',
  'first-aid': 'Botiquín',
  flashlight: 'Linterna',
  ladder: 'Escalera',
  axe: 'Hacha',
  bucket: 'Cubeta',
  helmet: 'Casco',
  radio: 'Radio',
  boots: 'Botas',
  extinguisher: 'Extintor',
  rope: 'Cuerda',
};

/** Kid-facing place names for the town scenes. */
export const sceneLabel: Record<SceneId, { en: string; es: string }> = {
  bakery: { en: 'Bakery', es: 'Panadería' },
  pizza: { en: 'Pizza Shop', es: 'Pizzería' },
  school: { en: 'School', es: 'Escuela' },
  park: { en: 'Park', es: 'Parque' },
  'clock-tower': { en: 'Clock Tower', es: 'Torre del reloj' },
  apartments: { en: 'Apartments', es: 'Apartamentos' },
  'pet-shop': { en: 'Pet Shop', es: 'Tienda de mascotas' },
  library: { en: 'Library', es: 'Biblioteca' },
  market: { en: 'Market', es: 'Mercado' },
  'station-yard': { en: 'Station Yard', es: 'Patio de la estación' },
};

export const routeCommandEs: Record<RouteCommand, string> = {
  forward: 'Adelante',
  left: 'Izquierda',
  right: 'Derecha',
  'turn-around': 'Media vuelta',
};

/** Number words 0–12 in both languages (used by Listen & Count and hints). */
export const numberWord: { en: string; es: string }[] = [
  { en: 'zero', es: 'cero' },
  { en: 'one', es: 'uno' },
  { en: 'two', es: 'dos' },
  { en: 'three', es: 'tres' },
  { en: 'four', es: 'cuatro' },
  { en: 'five', es: 'cinco' },
  { en: 'six', es: 'seis' },
  { en: 'seven', es: 'siete' },
  { en: 'eight', es: 'ocho' },
  { en: 'nine', es: 'nueve' },
  { en: 'ten', es: 'diez' },
  { en: 'once', es: 'once' },
  { en: 'twelve', es: 'doce' },
];

export const numberWordFor = (n: number): { en: string; es: string } =>
  numberWord[n] ?? { en: String(n), es: String(n) };
