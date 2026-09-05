import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { BadgeId } from '@/content/types';
import { palette } from '@/theme';
import { mix } from '@/characters/rig/palettes';

const VB = { w: 100, h: 112 } as const;

/** The shield outline every badge shares. */
const SHIELD =
  'M 50 4 C 58 4 78 10 87 13.5 C 89.5 14.5 90.5 16 90.5 18.5 L 90.5 58 C 90.5 84 68 101 51 108 C 50.4 108.3 49.6 108.3 49 108 C 32 101 9.5 84 9.5 58 L 9.5 18.5 C 9.5 16 10.5 14.5 13 13.5 C 22 10 42 4 50 4 Z';
const SHIELD_INNER =
  'M 50 12 C 57 12 74 17 81.5 20 C 83.5 20.8 84.5 22 84.5 24 L 84.5 57 C 84.5 78 66 92 50.5 98.5 C 50.2 98.6 49.8 98.6 49.5 98.5 C 34 92 15.5 78 15.5 57 L 15.5 24 C 15.5 22 16.5 20.8 18.5 20 C 26 17 43 12 50 12 Z';

export type BadgeIconId =
  | 'flame' | 'star' | 'chef-hat' | 'ladder' | 'hose' | 'book' | 'speech-bubble' | 'map' | 'pattern'
  | 'hands' | 'heart' | 'cat' | 'bread' | 'pizza' | 'picnic' | 'school' | 'broom' | 'clock' | 'numbers';

export const badgeIconIds: readonly BadgeIconId[] = [
  'flame', 'star', 'chef-hat', 'ladder', 'hose', 'book', 'speech-bubble', 'map', 'pattern',
  'hands', 'heart', 'cat', 'bread', 'pizza', 'picnic', 'school', 'broom', 'clock', 'numbers',
];

const isBadgeIcon = (v: string): v is BadgeIconId => (badgeIconIds as readonly string[]).includes(v);

/**
 * Rim colour + icon for every badge id, so a screen can draw a badge from an id
 * alone. `@/content/badges` is the source of truth — pass its `color`/`icon`
 * straight through when you have the `BadgeDef` to hand.
 */
export const badgeLook: Record<BadgeId, { color: string; icon: BadgeIconId }> = {
  'first-shift': { color: palette.engineRed, icon: 'flame' },
  'number-navigator': { color: palette.safetyYellow, icon: 'numbers' },
  'fraction-firefighter': { color: palette.orange, icon: 'pizza' },
  'hose-hero': { color: palette.waterCyan, icon: 'hose' },
  'word-watcher': { color: palette.pink, icon: 'book' },
  'spanish-speaker': { color: palette.purple, icon: 'speech-bubble' },
  'recipe-rescuer': { color: palette.orangeDark, icon: 'chef-hat' },
  'map-master': { color: palette.leafGreen, icon: 'map' },
  'pattern-pro': { color: palette.grass, icon: 'pattern' },
  'team-player': { color: palette.waterCyanDark, icon: 'hands' },
  'community-helper': { color: palette.engineRedDark, icon: 'heart' },
  'clock-tower-cat': { color: palette.gold, icon: 'cat' },
  'bakery-bell': { color: palette.wood, icon: 'bread' },
  'pizza-rescue': { color: palette.engineRed, icon: 'pizza' },
  'park-picnic': { color: palette.grassDark, icon: 'picnic' },
  'school-fair': { color: palette.waterCyanDark, icon: 'school' },
  'clean-up-crew': { color: palette.leafGreenDark, icon: 'broom' },
  'kitchen-pro': { color: palette.gold, icon: 'chef-hat' },
  'ladder-legend': { color: palette.goldDark, icon: 'ladder' },
  'time-keeper': { color: palette.skyTop, icon: 'clock' },
  'library-lights': { color: palette.skyTop, icon: 'book' },
  'pet-parade': { color: palette.grass, icon: 'cat' },
  'market-helper': { color: palette.orange, icon: 'picnic' },
  'museum-detective': { color: palette.purple, icon: 'pattern' },
  'timetable-pro': { color: palette.navySoft, icon: 'clock' },
  'rescue-exchange': { color: palette.engineRedLight, icon: 'hands' },
  'time-traveler': { color: palette.skyMid, icon: 'clock' },
  'shape-shaper': { color: palette.mint, icon: 'pattern' },
  'chef-de-station': { color: palette.woodDark, icon: 'chef-hat' },
  'bilingual-buddy': { color: palette.pink, icon: 'speech-bubble' },
};

/**
 * The signature second colour each badge icon carries. Monochrome white icons
 * never match the reference badge art (art critique: "give badge icons a second
 * colour"), so every icon gets exactly one accent — no more, so the sheet stays
 * one hand.
 */
const ICON_ACCENT: Record<BadgeIconId, string> = {
  flame: palette.safetyYellow,
  star: palette.safetyYellow,
  'chef-hat': palette.creamDeep,
  ladder: palette.safetyYellow,
  hose: palette.safetyYellow,
  book: palette.waterCyanLight,
  'speech-bubble': palette.waterCyanLight,
  map: palette.engineRed,
  pattern: palette.safetyYellow,
  hands: palette.safetyYellow,
  heart: palette.pinkSoft,
  cat: palette.safetyYellow,
  bread: palette.gold,
  pizza: palette.engineRed,
  picnic: palette.engineRedLight,
  school: palette.safetyYellow,
  broom: palette.gold,
  clock: palette.engineRed,
  numbers: palette.safetyYellow,
};

/* Icons live in a 100×112 box, centred on (50, 52) and ~46 units across. */
function Icon({ id, fill, shade, accent }: { id: BadgeIconId; fill: string; shade: string; accent: string }) {
  switch (id) {
    case 'flame':
      return (
        <G>
          <Path d="M 50 26 C 66 42 70 54 50 76 C 30 54 34 42 50 26 Z" fill={fill} />
          <Path d="M 50 40 C 61 50 63 58 50 72 C 37 58 39 50 50 40 Z" fill={accent} />
          <Path d="M 50 52 C 55 57 55.6 60 50 66 C 44.4 60 45 57 50 52 Z" fill={shade} />
        </G>
      );
    case 'star':
      return (
        <G>
          <Path d="M 50 24 L 58.4 42.4 L 78 45 L 63.5 58.6 L 67.4 78 L 50 68.4 L 32.6 78 L 36.5 58.6 L 22 45 L 41.6 42.4 Z" fill={mix(accent, palette.navy, 0.16)} transform="translate(0 1.4)" />
          <Path d="M 50 24 L 58.4 42.4 L 78 45 L 63.5 58.6 L 67.4 78 L 50 68.4 L 32.6 78 L 36.5 58.6 L 22 45 L 41.6 42.4 Z" fill={accent} />
          <Path d="M 50 31 L 56 45 L 70 46.8 L 60 55.4 L 62.6 69 L 50 62.4 Z" fill={fill} opacity={0.42} />
        </G>
      );
    case 'chef-hat':
      return (
        <G>
          <Circle cx={34} cy={40} r={13} fill={fill} />
          <Circle cx={66} cy={40} r={13} fill={fill} />
          <Circle cx={50} cy={32} r={16} fill={fill} />
          <Rect x={33} y={50} width={34} height={24} rx={6} fill={fill} />
          <Rect x={33} y={56} width={34} height={9} rx={4} fill={accent} />
          <Path d="M 36 61 h 28" stroke={shade} strokeWidth={2.6} strokeLinecap="round" opacity={0.5} />
        </G>
      );
    case 'ladder':
      return (
        <G>
          <Rect x={28} y={22} width={9} height={60} rx={4.5} fill={fill} />
          <Rect x={63} y={22} width={9} height={60} rx={4.5} fill={fill} />
          <Rect x={32} y={32} width={36} height={7} rx={3.5} fill={accent} />
          <Rect x={32} y={48} width={36} height={7} rx={3.5} fill={accent} />
          <Rect x={32} y={64} width={36} height={7} rx={3.5} fill={accent} />
        </G>
      );
    case 'hose':
      return (
        <G>
          <Circle cx={52} cy={50} r={25} fill={mix(accent, palette.navy, 0.2)} />
          <Circle cx={52} cy={49} r={24} fill={accent} />
          <Circle cx={52} cy={49} r={15} fill={mix(accent, palette.navy, 0.18)} />
          <Circle cx={52} cy={49} r={13.4} fill={mix(accent, '#FFFFFF', 0.34)} />
          <Circle cx={52} cy={49} r={6} fill={mix(accent, palette.navy, 0.3)} />
          <Path d="M 36 30 A 20 20 0 0 1 48 26" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.5} />
          <Path d="M 35 67 L 24 79" stroke={fill} strokeWidth={10} strokeLinecap="round" />
          <Circle cx={23} cy={80} r={6.4} fill={mix(accent, palette.navy, 0.24)} />
        </G>
      );
    case 'book':
      return (
        <G>
          <Path d="M 50 34 C 43 28 32 26 22 27 L 22 74 C 32 73 43 75 50 80 C 57 75 68 73 78 74 L 78 27 C 68 26 57 28 50 34 Z" fill={fill} />
          <Path d="M 50 34 L 50 80" stroke={shade} strokeWidth={3.4} />
          <Path d="M 30 38 h 13 M 30 47 h 13 M 57 38 h 13 M 57 47 h 13" stroke={accent} strokeWidth={3} strokeLinecap="round" />
          <Path d="M 30 56 h 13 M 57 56 h 13" stroke={accent} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
        </G>
      );
    case 'speech-bubble':
      return (
        <G>
          <Path d="M 24 28 h 52 a 10 10 0 0 1 10 10 v 24 a 10 10 0 0 1 -10 10 h -24 l -14 12 l 2 -12 h -16 a 10 10 0 0 1 -10 -10 v -24 a 10 10 0 0 1 10 -10 z" fill={fill} />
          <Circle cx={38} cy={50} r={4.4} fill={accent} />
          <Circle cx={50} cy={50} r={4.4} fill={accent} />
          <Circle cx={62} cy={50} r={4.4} fill={accent} />
        </G>
      );
    case 'map':
      return (
        <G>
          <Path d="M 20 30 L 40 24 L 60 32 L 80 24 L 80 74 L 60 82 L 40 74 L 20 80 Z" fill={fill} />
          <Path d="M 40 24 L 40 74 M 60 32 L 60 82" stroke={shade} strokeWidth={3} opacity={0.55} />
          <Path d="M 62 38 a 9 9 0 0 1 18 0 c 0 7 -9 16 -9 16 s -9 -9 -9 -16 z" fill={accent} />
          <Circle cx={71} cy={38} r={3.4} fill={fill} />
        </G>
      );
    case 'pattern':
      return (
        <G>
          <Circle cx={36} cy={38} r={10} fill={fill} />
          <Rect x={54} y={28} width={20} height={20} rx={5} fill={fill} />
          <Path d="M 36 54 L 47 74 L 25 74 Z" fill={fill} />
          <Circle cx={64} cy={64} r={10} fill={accent} />
        </G>
      );
    case 'hands':
      return (
        <G>
          <Path d="M 18 52 C 18 44 26 40 34 44 L 50 52 L 50 74 L 30 74 C 22 74 18 68 18 60 Z" fill={fill} />
          <Path d="M 82 52 C 82 44 74 40 66 44 L 50 52 L 50 74 L 70 74 C 78 74 82 68 82 60 Z" fill={accent} />
          <Path d="M 34 30 a 6 6 0 1 1 12 0 v 18 h -12 z" fill={fill} />
          <Path d="M 54 30 a 6 6 0 1 1 12 0 v 18 h -12 z" fill={accent} />
        </G>
      );
    case 'heart':
      return (
        <G>
          <Path d="M 50 80 C 26 64 20 52 20 42 C 20 32 28 26 36 26 C 42 26 47 29 50 34 C 53 29 58 26 64 26 C 72 26 80 32 80 42 C 80 52 74 64 50 80 Z" fill={fill} />
          <Path d="M 50 72 C 33 60 28 51 28 44 C 28 38 32 34.6 37 34.6 C 41 34.6 45 37 47 40.6 L 50 46 Z" fill={accent} opacity={0.55} />
          <Path d="M 32 36 C 35 33 39 33 42 35" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.75} />
        </G>
      );
    case 'cat':
      return (
        <G>
          <Path d="M 28 40 L 26 22 L 42 32 Z" fill={fill} />
          <Path d="M 72 40 L 74 22 L 58 32 Z" fill={fill} />
          <Path d="M 30.6 37.4 L 29.4 27 L 38.6 32.6 Z" fill={accent} />
          <Path d="M 69.4 37.4 L 70.6 27 L 61.4 32.6 Z" fill={accent} />
          <Circle cx={50} cy={52} r={24} fill={fill} />
          <Ellipse cx={50} cy={60} rx={14} ry={10} fill={accent} opacity={0.55} />
          <Circle cx={41} cy={47} r={4.4} fill={shade} />
          <Circle cx={59} cy={47} r={4.4} fill={shade} />
          <Path d="M 46 58 h 8 a 4 4 0 0 1 -4 3.6 a 4 4 0 0 1 -4 -3.6 z" fill={shade} />
          <Path d="M 26 56 h -10 M 26 62 h -10 M 74 56 h 10 M 74 62 h 10" stroke={shade} strokeWidth={3} strokeLinecap="round" />
        </G>
      );
    case 'bread':
      return (
        <G>
          <Path d="M 18 58 C 18 38 30 28 50 28 C 70 28 82 38 82 58 C 82 68 76 74 66 74 L 34 74 C 24 74 18 68 18 58 Z" fill={fill} />
          <Path d="M 34 42 l 8 -7 M 47 40 l 8 -7 M 60 42 l 8 -7" stroke={accent} strokeWidth={4.4} strokeLinecap="round" />
          <Path d="M 22 58 C 22 44 32 36 50 36 C 68 36 78 44 78 58 C 78 60 78 62 77.4 63.6 C 74 52 64 46 50 46 C 36 46 26 52 22.6 63.6 C 22 62 22 60 22 58 Z" fill="#FFFFFF" opacity={0.28} />
        </G>
      );
    case 'pizza':
      return (
        <G>
          <Path d="M 50 22 L 82 76 A 6 6 0 0 1 77 84 L 23 84 A 6 6 0 0 1 18 76 Z" fill={fill} />
          <Path d="M 50 34 L 72 76 L 28 76 Z" fill={shade} opacity={0.45} />
          <Circle cx={50} cy={52} r={5} fill={accent} />
          <Circle cx={39} cy={68} r={4.4} fill={accent} />
          <Circle cx={61} cy={68} r={4} fill={accent} />
        </G>
      );
    case 'picnic':
      return (
        <G>
          <Path d="M 26 46 h 48 l -5 30 a 6 6 0 0 1 -6 5 h -26 a 6 6 0 0 1 -6 -5 z" fill={fill} />
          <Path d="M 34 46 C 34 30 66 30 66 46" stroke={fill} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path d="M 26 56 h 48" stroke={accent} strokeWidth={4} />
          <Path d="M 40 46 v 35 M 52 46 v 35 M 64 46 v 33" stroke={accent} strokeWidth={3} opacity={0.75} />
        </G>
      );
    case 'school':
      return (
        <G>
          <Rect x={22} y={48} width={56} height={34} rx={5} fill={fill} />
          <Path d="M 18 48 L 50 26 L 82 48 Z" fill={fill} />
          <Rect x={44} y={16} width={12} height={12} rx={3} fill={accent} />
          <Rect x={42} y={62} width={16} height={20} rx={4} fill={accent} />
          <Rect x={29} y={56} width={10} height={10} rx={3} fill={shade} opacity={0.7} />
          <Rect x={61} y={56} width={10} height={10} rx={3} fill={shade} opacity={0.7} />
        </G>
      );
    case 'broom':
      return (
        <G>
          <Rect x={54} y={18} width={8} height={38} rx={4} fill={accent} transform="rotate(18 58 37)" />
          <Path d="M 30 60 L 56 50 L 66 74 L 34 84 Z" fill={fill} />
          <Path d="M 32 68 L 62 57 M 34 76 L 64 65" stroke={shade} strokeWidth={3.4} strokeLinecap="round" opacity={0.6} />
        </G>
      );
    case 'clock':
      return (
        <G>
          <Circle cx={50} cy={52} r={28} fill={fill} />
          <Circle cx={50} cy={52} r={22} fill={shade} opacity={0.35} />
          <Path d="M 50 34 v 18 h 14" stroke={accent} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Circle cx={50} cy={52} r={4} fill={accent} />
        </G>
      );
    case 'numbers':
    default:
      return (
        <G>
          <Path d="M 26 30 h 7 v 7 h 7 v 7 h -7 v 7 h -7 v -7 h -7 v -7 h 7 z" fill={fill} />
          <Rect x={58} y={37} width={22} height={7} rx={3.5} fill={accent} />
          <Path d="M 24 62 l 5 -5 l 6 6 l 6 -6 l 5 5 l -6 6 l 6 6 l -5 5 l -6 -6 l -6 6 l -5 -5 l 6 -6 z" fill={accent} />
          <Rect x={58} y={62} width={22} height={7} rx={3.5} fill={fill} />
          <Rect x={58} y={74} width={22} height={7} rx={3.5} fill={fill} />
        </G>
      );
  }
}

export interface BadgeArtProps {
  /** rim colour — pass `BadgeDef.color` */
  color?: string;
  /** `BadgeDef.icon`; unknown ids fall back to a star */
  icon?: BadgeIconId | string;
  size?: number;
  /** grey with a padlock — "keep going!" */
  locked?: boolean;
}

/**
 * THE Station Spark badge — one shield silhouette and one rim treatment for
 * every badge in the app (consistency rule 10). A darker rim edge, the rim, a
 * lighter inner face, a two-colour icon and one glossy highlight.
 *
 * Locked badges keep the badge's *own* hue at low saturation rather than going
 * uniform grey, so a wall of not-yet-earned badges reads as "coming soon"
 * instead of "you have failed twenty times" — never crossed out, never failed.
 */
export function BadgeArt({ color = palette.engineRed, icon = 'star', size = 92, locked = false }: BadgeArtProps) {
  const rim = locked ? mix(color, palette.lockedGrey, 0.78) : color;
  const rimDark = locked ? mix(color, palette.slate, 0.74) : mix(color, palette.navy, 0.28);
  const face = locked ? mix(color, '#E4E8F2', 0.84) : mix(color, '#FFFFFF', 0.2);
  const iconFill = locked ? mix(color, palette.slate, 0.66) : '#FFFFFF';
  const iconShade = locked ? mix(color, '#C4CADA', 0.7) : mix(color, '#FFFFFF', 0.62);
  const height = size * (VB.h / VB.w);
  const iconId = isBadgeIcon(String(icon)) ? (icon as BadgeIconId) : 'star';
  const accent = locked ? mix(ICON_ACCENT[iconId], palette.lockedGrey, 0.72) : ICON_ACCENT[iconId];

  return (
    <Svg width={size} height={height} viewBox={`0 0 ${VB.w} ${VB.h}`} accessibilityLabel={locked ? 'Locked badge' : `${iconId} badge`}>
      <Path d={SHIELD} fill={rimDark} transform="translate(0 2)" />
      <Path d={SHIELD} fill={rim} />
      <Path d={SHIELD_INNER} fill={face} />
      {locked ? (
        <G>
          <Rect x={38} y={50} width={24} height={20} rx={6} fill={mix(color, palette.slate, 0.6)} />
          <Path d="M 43 50 v -6 a 7 7 0 0 1 14 0 v 6" stroke={mix(color, palette.slate, 0.6)} strokeWidth={5} fill="none" strokeLinecap="round" />
          <Circle cx={50} cy={59} r={3.2} fill={face} />
        </G>
      ) : (
        <Icon id={iconId} fill={iconFill} shade={iconShade} accent={accent} />
      )}
      {/* glossy highlight */}
      <Path d="M 22 20 C 30 16 42 13 50 13 L 50 46 C 38 44 28 36 22 26 Z" fill="#FFFFFF" opacity={0.2} />
      <Ellipse cx={34} cy={26} rx={12} ry={7} fill="#FFFFFF" opacity={0.22} transform="rotate(-24 34 26)" />
    </Svg>
  );
}

/** Convenience: draw a badge straight from its id. */
export function BadgeById({ id, size, locked }: { id: BadgeId; size?: number; locked?: boolean }) {
  const look = badgeLook[id];
  return <BadgeArt color={look.color} icon={look.icon} size={size} locked={locked} />;
}
