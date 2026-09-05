/**
 * Colour recipes for the 3D layer.
 *
 * Deliberately free of `three` so it can be imported from the fallback path,
 * from tests, or from any 2D screen without pulling the GL bundle in.
 *
 * Every solid follows the sticker rule from docs/ART_DIRECTION.md — a flat
 * `face`, one `shade` (navy-ward) and one `light` (white-ward). The 3D truck is
 * dressed from exactly the same table as the SVG one in `@/world/FireTruck`, so
 * the two read as siblings.
 */
import { palette } from '@/theme';
import type { TruckStyle } from '@/state/store';

export interface Tones {
  face: string;
  shade: string;
  light: string;
}

/** Body paint per `TruckStyle['color']` — mirrors `FireTruck`'s `bodyColors`. */
export const truckTones: Record<TruckStyle['color'], Tones> = {
  red: { face: palette.engineRed, shade: palette.engineRedDark, light: palette.engineRedLight },
  yellow: { face: palette.safetyYellow, shade: palette.goldDark, light: '#FFE07A' },
  blue: { face: '#3E8FE0', shade: '#25649F', light: '#7FC0F5' },
  green: { face: palette.leafGreen, shade: palette.leafGreenDark, light: '#8CD98F' },
};

/** Metal, glass and rubber — shared by every truck colour. */
export const trim = {
  chrome: palette.slateLight,
  chromeShade: palette.slate,
  grille: palette.charcoal,
  tyre: palette.charcoalDark,
  hub: palette.slateLight,
  hubCap: palette.slate,
  glass: palette.navy,
  glassHighlight: '#FFFFFF',
  stripe: palette.safetyYellow,
  stripeLight: '#FFE07A',
  headlight: '#FFF1A8',
  headlightGlow: palette.safetyYellow,
  ladder: palette.slate,
  ladderLight: palette.slateLight,
  shadow: palette.navy,
  sparkle: '#FFF6E5',
} as const;

/** Emergency lamp colours per `TruckStyle['lights']`. */
export const lampColors = {
  classic: [palette.engineRed, '#2F6BD8'] as const,
  blue: ['#2F6BD8', '#7FC0F5'] as const,
  rainbow: [palette.engineRed, palette.waterCyan] as const,
};

/** Two-tone recipe for each door decal, in brand colours. */
export const decalTones: Record<Exclude<TruckStyle['decal'], 'none'>, { main: string; accent: string }> = {
  flame: { main: palette.engineRed, accent: palette.safetyYellow },
  star: { main: palette.safetyYellow, accent: palette.goldDark },
  paw: { main: palette.navy, accent: palette.waterCyan },
  lightning: { main: palette.safetyYellow, accent: palette.goldDark },
};

/** Hue-cycling helper for the `rainbow` light bar (h, s, l in 0..1). */
export function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (n: number) =>
    Math.round(Math.max(0, Math.min(1, n)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}
