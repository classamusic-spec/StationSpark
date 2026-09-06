import type { SceneId } from '@/learning/types';
import { palette } from '@/theme';

export type AwningStyle = 'stripe' | 'solid' | 'none';

export interface SceneTheme {
  /** kid-facing name, used in prompts and dialogue */
  name: string;
  nameEs: string;
  /** the word painted on the sign plate */
  sign: string;
  /** a tiny glyph next to the sign word (bread, pizza slice, book…) */
  signGlyph: 'bread' | 'pizza' | 'book' | 'bell' | 'clock' | 'paw' | 'basket' | 'window' | 'tree' | 'helmet';
  wall: string;
  wallShade: string;
  roof: string;
  roofShade: string;
  trim: string;
  signPlate: string;
  signInk: string;
  awning: AwningStyle;
  awningA: string;
  awningB: string;
  door: string;
  doorShade: string;
  /** glass tint of a calm (unlit) window */
  glass: string;
}

const base = {
  wall: palette.tan,
  wallShade: palette.tanDark,
  roof: palette.engineRed,
  roofShade: palette.engineRedDark,
  trim: palette.creamDeep,
  signPlate: palette.cream,
  signInk: '#7A4A22',
  awning: 'stripe' as AwningStyle,
  awningA: palette.engineRed,
  awningB: palette.white,
  door: '#8C5A2B',
  doorShade: '#6E4420',
  glass: '#2B3B63',
};

export const sceneThemes: Record<SceneId, SceneTheme> = {
  bakery: { ...base, name: 'Bakery', nameEs: 'Panadería', sign: 'BAKERY', signGlyph: 'bread' },
  pizza: {
    ...base,
    name: 'Pizza Shop',
    nameEs: 'Pizzería',
    sign: 'PIZZA',
    signGlyph: 'pizza',
    wall: palette.cream,
    wallShade: palette.creamDeep,
    roof: '#2E9E52',
    roofShade: '#1F7C3C',
    awningA: '#2E9E52',
    awningB: palette.white,
    signInk: '#B9261C',
  },
  school: {
    ...base,
    name: 'School',
    nameEs: 'Escuela',
    sign: 'SCHOOL',
    signGlyph: 'bell',
    wall: '#FBD9A5',
    wallShade: '#E2BB80',
    roof: palette.engineRed,
    roofShade: palette.engineRedDark,
    awning: 'none',
    signInk: palette.navy,
    door: '#5C4632',
    doorShade: '#43331F',
  },
  park: {
    ...base,
    name: 'Park Kiosk',
    nameEs: 'Quiosco',
    sign: 'PARK',
    signGlyph: 'tree',
    wall: '#F4E3C4',
    wallShade: '#DCC79F',
    roof: '#3B8E3F',
    roofShade: '#2C6E30',
    awning: 'solid',
    awningA: '#4CAF50',
    awningB: '#3B8E3F',
    signInk: '#2C6E30',
  },
  'clock-tower': {
    ...base,
    name: 'Clock Tower',
    nameEs: 'Torre del Reloj',
    sign: 'TOWER',
    signGlyph: 'clock',
    wall: '#EFE0BE',
    wallShade: '#D6C29A',
    roof: '#4A5FA8',
    roofShade: '#33478A',
    awning: 'none',
    signInk: palette.navy,
  },
  apartments: {
    ...base,
    name: 'Apartments',
    nameEs: 'Apartamentos',
    sign: 'HOMES',
    signGlyph: 'window',
    wall: '#E9B48F',
    wallShade: '#CE9670',
    roof: '#4A5FA8',
    roofShade: '#33478A',
    awning: 'none',
    signInk: palette.navy,
  },
  'pet-shop': {
    ...base,
    name: 'Pet Shop',
    nameEs: 'Tienda de Mascotas',
    sign: 'PETS',
    signGlyph: 'paw',
    wall: '#FFE7D2',
    wallShade: '#F0CDB0',
    roof: palette.pink,
    roofShade: '#E1568F',
    awningA: palette.pink,
    awningB: palette.white,
    signInk: '#C63C74',
  },
  library: {
    ...base,
    name: 'Library',
    nameEs: 'Biblioteca',
    sign: 'BOOKS',
    signGlyph: 'book',
    wall: '#F3E6CD',
    wallShade: '#DCCBA9',
    roof: '#4A5FA8',
    roofShade: '#33478A',
    awning: 'none',
    signInk: '#33478A',
  },
  market: {
    ...base,
    name: 'Market',
    nameEs: 'Mercado',
    sign: 'MARKET',
    signGlyph: 'basket',
    wall: '#FDECC8',
    wallShade: '#E7D0A2',
    roof: '#3B8E3F',
    roofShade: '#2C6E30',
    awningA: '#4CAF50',
    awningB: palette.white,
    signInk: '#2C6E30',
  },
  'station-yard': {
    ...base,
    name: 'Fire Station',
    nameEs: 'Estación de Bomberos',
    sign: 'STATION',
    signGlyph: 'helmet',
    wall: palette.tan,
    wallShade: palette.tanDark,
    // critique #17 — the station is a shop-front like every other façade:
    // striped awnings and sills, not a bare elevation.
    awning: 'stripe',
    awningA: palette.engineRed,
    awningB: palette.white,
    signInk: palette.navy,
    door: palette.engineRed,
    doorShade: palette.engineRedDark,
  },
};

export const sceneTheme = (scene: SceneId): SceneTheme => sceneThemes[scene];
