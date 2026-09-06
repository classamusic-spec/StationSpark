import { mix } from '../rig/palettes';
import type { HairTone, HelmetTone, SkinTone } from '../rig/palettes';
import type { ToneMap } from './types';

/**
 * The avatar customiser, expressed as re-tints of the authored art.
 *
 * The default choices return `undefined` on purpose: with no tone map the rig
 * paints the fills exactly as they were authored, so the character a child
 * meets first is the reference art, pixel for pixel. Only a *changed* choice
 * re-tints, and then every shade is derived from the new base by the same
 * offsets the artist used, so the modelling survives the swap.
 */

export const DEFAULT_SKIN: SkinTone = 'peach';
export const DEFAULT_HAIR: HairTone = 'dark';
export const DEFAULT_HELMET: HelmetTone = 'red';

/** Base skin colour per tone; `peach` is the authored fill. */
const SKIN_BASE: Record<SkinTone, string> = {
  peach: '#FCB68A',
  tan: '#EFA971',
  brown: '#C5804A',
  deep: '#8E5733',
};

const HAIR_BASE: Record<HairTone, string> = {
  dark: '#3A292A',
  brown: '#7A4A28',
  blonde: '#D9A54B',
  red: '#C2542F',
  'black-curly': '#241B22',
};

const HELMET_BASE: Record<HelmetTone, string> = {
  red: '#EA292A',
  yellow: '#F2A81B',
  blue: '#2F7FD6',
  pink: '#E85B93',
};

/** Skin modelling, as the offsets the authored art uses off its base. */
function skinMap(base: string): ToneMap {
  return {
    skin: base,
    skinShade: mix(base, '#8A3F1A', 0.09),
    skinShade2: mix(base, '#8A3F1A', 0.17),
    skinDeep: mix(base, '#8A3F1A', 0.26),
    skinLine: mix(base, '#8A3F1A', 0.22),
  };
}

function hairMap(base: string): ToneMap {
  return { hair: base, hairDark: mix(base, '#120A0A', 0.35) };
}

function helmetMap(base: string): ToneMap {
  return {
    helmet: base,
    helmetLight: mix(base, '#FFFFFF', 0.12),
    helmetDark: mix(base, '#5A0A12', 0.32),
  };
}

export interface AvatarChoice {
  skin?: SkinTone;
  hair?: HairTone;
  helmet?: HelmetTone;
}

/** The Rookie's tone map, or undefined when nothing has been customised. */
export function rookieTones(avatar?: AvatarChoice): ToneMap | undefined {
  const skin = avatar?.skin ?? DEFAULT_SKIN;
  const hair = avatar?.hair ?? DEFAULT_HAIR;
  const helmet = avatar?.helmet ?? DEFAULT_HELMET;
  if (skin === DEFAULT_SKIN && hair === DEFAULT_HAIR && helmet === DEFAULT_HELMET) return undefined;
  return {
    ...(skin === DEFAULT_SKIN ? {} : skinMap(SKIN_BASE[skin])),
    ...(hair === DEFAULT_HAIR ? {} : hairMap(HAIR_BASE[hair])),
    ...(helmet === DEFAULT_HELMET ? {} : helmetMap(HELMET_BASE[helmet])),
  };
}

/** Swatches for the Locker's picker rows. */
export const skinSwatch = (t: SkinTone) => SKIN_BASE[t];
export const hairSwatch = (t: HairTone) => HAIR_BASE[t];
export const helmetSwatch = (t: HelmetTone) => HELMET_BASE[t];
