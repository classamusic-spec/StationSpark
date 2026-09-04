/**
 * Sticker-style colour recipes for the character rigs.
 *
 * Every solid gets three tones (see docs/ART_DIRECTION.md):
 *   base   — the flat fill
 *   shade  — the base with ~14 % navy over it (soft form shadow, never black)
 *   light  — the base with ~30 % white over it (the toy highlight)
 * No black outlines anywhere.
 */
import { palette } from '@/theme';

export type SkinTone = 'peach' | 'tan' | 'brown' | 'deep';
export type HairTone = 'dark' | 'brown' | 'blonde' | 'red' | 'black-curly';
export type HelmetTone = 'red' | 'yellow' | 'blue' | 'pink';

export interface Tones {
  base: string;
  shade: string;
  light: string;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ];
};

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

/** Blend `hex` toward `onto` by `amount` (0..1). */
export function mix(hex: string, onto: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(onto);
  return `#${toHex(r1 + (r2 - r1) * amount)}${toHex(g1 + (g2 - g1) * amount)}${toHex(b1 + (b2 - b1) * amount)}`;
}

/** The standard three-tone sticker ramp for any flat colour. */
export function tones(base: string, shadeAmount = 0.16, lightAmount = 0.32): Tones {
  return {
    base,
    shade: mix(base, palette.navy, shadeAmount),
    light: mix(base, '#FFFFFF', lightAmount),
  };
}

export const skinTones: Record<SkinTone, Tones & { blush: string }> = {
  peach: { ...tones('#FFD3B0', 0.13), blush: '#FF9EA8' },
  tan: { ...tones('#F0B98A', 0.13), blush: '#EE8E8E' },
  brown: { ...tones('#C68450', 0.14), blush: '#C4696B' },
  deep: { ...tones('#8A5433', 0.16), blush: '#A85A55' },
};

export const hairTones: Record<HairTone, Tones> = {
  dark: tones('#2B2A3E', 0.1, 0.24),
  brown: tones('#7A4A28', 0.12, 0.26),
  blonde: tones('#F2C766', 0.12, 0.3),
  red: tones('#D2603A', 0.12, 0.28),
  'black-curly': tones('#1E1D2C', 0.1, 0.22),
};

export const helmetTones: Record<HelmetTone, Tones> = {
  red: tones(palette.engineRed),
  yellow: tones(palette.safetyYellow),
  blue: tones('#3D8BE8'),
  pink: tones('#FF7EB3'),
};

/** Shared ink colours for eyes, mouths and soft shadows. */
export const ink = {
  eye: palette.navy,
  eyeSoft: '#2E3B72',
  mouth: '#8E3346',
  tongue: '#F2748B',
  tooth: '#FFFFFF',
  shadow: 'rgba(31,42,90,0.13)',
  sheen: 'rgba(255,255,255,0.45)',
} as const;

/** Curly hair reads as a run of bumps rather than a smooth silhouette. */
export const isCurly = (hair: HairTone) => hair === 'black-curly';
