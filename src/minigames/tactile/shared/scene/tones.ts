/**
 * ONE LIGHT, ONE SET OF TONES.
 *
 * Every drawn thing in the tactile games is built from three values: a flat
 * base fill, one navy shade and one white highlight — exactly the recipe in
 * `docs/ART_DIRECTION.md` ("flat fills + one darker shade tone + one
 * highlight; no black outlines"). Keeping the numbers in one file is what
 * stops seven games drifting into seven different lighting models.
 *
 * The light falls from the upper LEFT, the same direction `src/world/Stage.tsx`
 * and the town map use. So: left faces are lit, right faces are shaded, and
 * every contact shadow sits slightly to the right of the object's foot.
 */
import { palette } from '@/theme';

/** navy at 14 % — the one shade tone */
export const SHADE = 'rgba(31,42,90,0.14)';
/** navy at 8 % — soffits, soft creases */
export const SHADE_SOFT = 'rgba(31,42,90,0.08)';
/** navy at 22 % — a recess a child should read as *inside* something */
export const SHADE_DEEP = 'rgba(31,42,90,0.22)';
/** white at 32 % — the one highlight tone */
export const HILITE = 'rgba(255,255,255,0.32)';
/** white at 18 % — a lit plane, not an edge */
export const HILITE_SOFT = 'rgba(255,255,255,0.18)';
/** white at 55 % — a sheen on glass or chrome */
export const SHEEN = 'rgba(255,255,255,0.55)';

/** how dark the navy ellipse under a grounded object is */
export const CONTACT = 0.12;
/** ...and under something that is being held up, so it reads as lifted */
export const CONTACT_SOFT = 0.07;

/** Greens for anything that grows, darkest (in shadow) to lightest (in sun). */
export const leaf = {
  deep: '#28703C',
  mid: palette.leafGreen,
  lit: '#71C96F',
  rim: palette.grass,
} as const;

/** Bark, from the shaded right side of a trunk to the lit left side. */
export const bark = {
  deep: '#7C5228',
  mid: palette.woodDark,
  lit: palette.wood,
  rim: '#D9A05F',
} as const;
