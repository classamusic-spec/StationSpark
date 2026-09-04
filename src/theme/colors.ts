/**
 * Station Spark palette — distilled from the reference art.
 *
 * Rules (see docs/ART_DIRECTION.md):
 *  - Engine Red is BRAND ENERGY, never "wrong". Never use red for errors.
 *  - Correctness is shown with motion, sound, character response, icons and
 *    occasionally Leaf Green. Softness (desaturation, wobble) shows "try again".
 *  - Text is Navy on cream/white. Never pure black.
 */
export const palette = {
  // Brand
  engineRed: '#E63B2E',
  engineRedDark: '#B9261C',
  engineRedLight: '#FF6B5E',
  safetyYellow: '#FFC72C',
  gold: '#F5A800',
  goldDark: '#D98E00',

  // Sky & water
  skyTop: '#4FB3F6',
  skyMid: '#7CCBFA',
  skyBottom: '#BDE7FF',
  waterCyan: '#4FC3F7',
  waterCyanDark: '#1FA5E8',
  waterCyanLight: '#A6E4FF',

  // Navy text & ink
  navy: '#1F2A5A',
  navySoft: '#3A4780',
  navyMuted: '#6B76A8',
  ink: '#1F2A5A',

  // Cream, tan, station surfaces
  cream: '#FFF6E5',
  creamDeep: '#FDEBCF',
  panel: '#FFF9EF',
  tan: '#F5D9A6',
  tanDark: '#E4BF83',
  wood: '#C58B4E',
  woodDark: '#9E6A36',
  white: '#FFFFFF',

  // Greens
  leafGreen: '#4CAF50',
  leafGreenDark: '#3B8E3F',
  grass: '#8FD16B',
  grassDark: '#5DBB63',
  mint: '#B9EFC1',

  // Accents
  orange: '#FF8A3D',
  orangeDark: '#E0661A',
  pink: '#FF7EB3',
  pinkSoft: '#FFC4DC',
  purple: '#9B7BFF',
  purpleSoft: '#D6CCFF',
  charcoal: '#3B4460',
  charcoalDark: '#2A3149',
  slate: '#8C94B3',
  slateLight: '#D9DDEC',
  lockedGrey: '#C8CCDC',

  // Flames (stylized, friendly)
  flameOuter: '#FF7A1A',
  flameMid: '#FFB324',
  flameCore: '#FFF1A8',
  smoke: '#B8BFD6',
} as const;

/** Subject colours: used for tags/pills, badge rims and recap chips. */
export const subjectColors = {
  math: { bg: '#FFC72C', fg: '#1F2A5A', soft: '#FFE9A8' },
  reading: { bg: '#4FA3F7', fg: '#FFFFFF', soft: '#CDE6FF' },
  english: { bg: '#FF7EB3', fg: '#FFFFFF', soft: '#FFD2E5' },
  spanish: { bg: '#9B7BFF', fg: '#FFFFFF', soft: '#E1D9FF' },
  logic: { bg: '#5DBB63', fg: '#FFFFFF', soft: '#CDEFD0' },
  teamwork: { bg: '#4FC3F7', fg: '#1F2A5A', soft: '#CFEFFF' },
  cooking: { bg: '#FF8A3D', fg: '#FFFFFF', soft: '#FFD9BF' },
} as const;

export type SubjectId = keyof typeof subjectColors;

export const shadows = {
  /** Soft, navy-tinted drop shadow for cards floating on the sky. */
  card: {
    shadowColor: '#1F2A5A',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  soft: {
    shadowColor: '#1F2A5A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  glowGold: {
    shadowColor: '#FFC72C',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
} as const;

export const gradients = {
  sky: [palette.skyTop, palette.skyMid, palette.skyBottom] as const,
  skyEvening: ['#6A7BE8', '#F5A3B0', '#FFD9A3'] as const,
  kitchen: ['#FFE6C7', '#FFF6E5'] as const,
  water: [palette.waterCyanLight, palette.waterCyan] as const,
  gold: ['#FFE07A', palette.safetyYellow, palette.gold] as const,
  red: [palette.engineRedLight, palette.engineRed] as const,
} as const;
