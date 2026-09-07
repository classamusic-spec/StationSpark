/**
 * THE RESCUE OAK.
 *
 * The old tree was three circles on a stick sitting in the top third of the
 * screen. This one is drawn to be the *subject* of Rescue Pets: it fills the
 * play area, it stands on the ground with a contact shadow, and it has the
 * detail the house style asks for — a root flare, bark grooves, a knot, a
 * layered canopy with a lit side and a shaded side, and real limbs.
 *
 * The design box is deliberately taller than it is wide (200 × 250). A phone
 * play area is tall and narrow, so a square tree can only ever be as tall as
 * the screen is wide, which is what left Rescue Pets with half a screen of
 * empty sky. A long trunk lets the same canopy stand much higher.
 *
 * The limbs are not decoration. `TREE_PERCHES` is the single list of places an
 * animal can sit, in tree-box fractions; the art draws a branch under every one
 * of them, so a stranded duckling can never float in the leaves. The game reads
 * the same list, so art and gameplay cannot drift apart. Every fraction is kept
 * inside 0.2 … 0.8 across, so a canopy cropped by the screen edges still keeps
 * all eight perches in reach of a child's thumb.
 */
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { palette } from '@/theme';
import { useIdleBob } from '@/hooks';
import { CONTACT, HILITE, HILITE_SOFT, SHADE, bark, leaf } from './tones';

/** Design box. Everything below is in these units. */
export const TREE_VB = { w: 200, h: 250 } as const;
/** The trunk stands on this line, so the caller can align it to the ground. */
export const TREE_FOOT = 239;
export const TREE_ASPECT = TREE_VB.w / TREE_VB.h;

export interface Perch {
  /** 0..1 across the tree box */
  fx: number;
  /** 0..1 down the tree box — where the animal's feet go */
  fy: number;
  /** which way the branch reaches out of the trunk */
  side: -1 | 1;
}

/**
 * Where a stranded animal sits. Ordered so the first few are the easiest to
 * see: crown, then the two big side limbs, then the inner forks.
 */
export const TREE_PERCHES: readonly Perch[] = [
  { fx: 0.5, fy: 0.082, side: 1 },
  { fx: 0.255, fy: 0.196, side: -1 },
  { fx: 0.75, fy: 0.18, side: 1 },
  { fx: 0.375, fy: 0.332, side: -1 },
  { fx: 0.64, fy: 0.32, side: 1 },
  { fx: 0.23, fy: 0.43, side: -1 },
  { fx: 0.785, fy: 0.4, side: 1 },
  { fx: 0.5, fy: 0.472, side: -1 },
];

/** Canopy lobes: [cx, cy, r]. One list, drawn three times at three insets. */
const LOBES: readonly [number, number, number][] = [
  [100, 46, 46],
  [54, 68, 38],
  [148, 62, 40],
  [74, 106, 36],
  [130, 106, 38],
  [100, 88, 44],
  [32, 94, 26],
  [170, 88, 26],
  /* the canopy hangs low, so the trunk below it is a trunk and not a pole */
  [100, 140, 34],
  [60, 146, 27],
  [142, 144, 28],
];

/** Where one lobe meets another: the creases that stop the canopy reading flat. */
const CREASES: readonly string[] = [
  'M 58 44 q 22 26 6 54',
  'M 142 42 q -20 28 -4 56',
  'M 44 104 q 26 14 52 4',
  'M 108 112 q 26 12 52 -2',
  'M 76 132 q 24 16 50 2',
];

function lobes(inset: number, fill: string, opacity = 1) {
  return (
    <G opacity={opacity}>
      {LOBES.map(([cx, cy, r], i) => (
        <Circle key={i} cx={cx} cy={cy} r={Math.max(4, r - inset)} fill={fill} />
      ))}
    </G>
  );
}

/**
 * The branch one animal sits on: a bough that runs *through* the canopy and out
 * of sight at both ends, with a sprig of leaves at each tip. It is deliberately
 * not a stalk with a cap on top — that reads as a mushroom, not a tree.
 */
function limb(p: Perch, i: number) {
  const x = p.fx * TREE_VB.w;
  const y = p.fy * TREE_VB.h;
  const half = 24;
  const rise = p.side * 7;
  const d = `M ${x - half} ${y + 5 + rise} Q ${x} ${y + 1} ${x + half} ${y + 5 - rise}`;
  return (
    <G key={`limb${i}`}>
      <Path d={d} stroke={bark.deep} strokeWidth={8.5} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={bark.mid} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={HILITE_SOFT} strokeWidth={2} strokeLinecap="round" fill="none" />
      {/* leaf sprigs at both tips, so the branch grows out of the leaves */}
      {[-1, 1].map((dir) => (
        <G key={dir}>
          <Circle cx={x + dir * (half + 4)} cy={y - dir * rise} r={13} fill={leaf.deep} />
          <Circle cx={x + dir * (half + 6)} cy={y - 4 - dir * rise} r={10} fill={dir > 0 ? leaf.mid : leaf.lit} />
          <Path
            d={`M ${x + dir * (half + 2)} ${y + 6 - dir * rise} q ${dir * 9} -8 ${dir * 17} -2 q ${-dir * 9} 8 ${-dir * 17} 2 z`}
            fill={leaf.mid}
          />
        </G>
      ))}
    </G>
  );
}

export interface BigTreeProps {
  width: number;
  height: number;
  /** how many perches the art should grow a branch for */
  perches?: number;
}

/**
 * The tree, drawn to fill `width` × `height`. The canopy breathes; the trunk
 * and the branches never move, so an animal placed on a perch stays on it.
 */
export const BigTree = memo(function BigTree({ width, height, perches = TREE_PERCHES.length }: BigTreeProps) {
  const breathe = useIdleBob(1, 5200);
  const canopy = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.006 }, { rotate: `${breathe.value * 0.3}deg` }],
  }));
  const used = TREE_PERCHES.slice(0, Math.max(0, Math.min(perches, TREE_PERCHES.length)));

  return (
    <View style={{ width, height }} pointerEvents="none">
      {/* trunk, roots and bark — static, because the perches are measured off it */}
      <Svg width={width} height={height} viewBox={`0 0 ${TREE_VB.w} ${TREE_VB.h}`} style={StyleSheet.absoluteFill}>
        <Ellipse cx={106} cy={TREE_FOOT + 5} rx={74} ry={14} fill={palette.navy} opacity={CONTACT} />
        {/* root flare — the tree grips the ground */}
        <Path
          d={`M 50 ${TREE_FOOT + 4} q 20 -8 28 -26 h 44 q 10 18 30 26 q -24 7 -51 7 q -27 0 -51 -7 z`}
          fill={bark.deep}
        />
        <Path d={`M 62 ${TREE_FOOT} q 12 -6 18 -18`} stroke={bark.rim} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
        {/* trunk */}
        <Path d={`M 76 ${TREE_FOOT - 2} q -4 -70 4 -118 h 40 q 10 48 8 118 z`} fill={bark.mid} />
        {/* lit left face */}
        <Path d={`M 80 ${TREE_FOOT - 4} q -3 -68 3 -116 h 14 q -9 46 -8 116 z`} fill={bark.lit} />
        <Path d={`M 82 ${TREE_FOOT - 6} q -3 -66 2 -112 h 5 q -6 44 -5 112 z`} fill={HILITE} />
        {/* bark grooves */}
        <Path d="M 100 224 q 4 -46 1 -84" stroke={bark.deep} strokeWidth={3.4} fill="none" strokeLinecap="round" opacity={0.7} />
        <Path d="M 113 228 q 3 -40 2 -70" stroke={bark.deep} strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.5} />
        <Path d="M 88 206 q 1 -30 3 -52" stroke={bark.deep} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.42} />
        <Path d="M 124 214 q 1 -26 0 -44" stroke={bark.deep} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.34} />
        {/* the knot every oak has */}
        <Ellipse cx={108} cy={186} rx={11} ry={8.4} fill={bark.deep} />
        <Ellipse cx={108} cy={186} rx={6} ry={4.4} fill="#5F3D1D" />
        <Ellipse cx={106} cy={184} rx={2.4} ry={1.6} fill={HILITE} />
        {/* the two structural limbs */}
        <Path d="M 96 150 q -30 -8 -54 -32" stroke={bark.mid} strokeWidth={17} strokeLinecap="round" fill="none" />
        <Path d="M 106 142 q 34 -6 60 -28" stroke={bark.mid} strokeWidth={15} strokeLinecap="round" fill="none" />
        <Path d="M 96 150 q -30 -8 -54 -32" stroke={HILITE_SOFT} strokeWidth={5} strokeLinecap="round" fill="none" />
      </Svg>

      {/* the canopy, which breathes */}
      <Animated.View style={[StyleSheet.absoluteFill, canopy]} pointerEvents="none">
        <Svg width={width} height={height} viewBox={`0 0 ${TREE_VB.w} ${TREE_VB.h}`}>
          {lobes(0, leaf.deep)}
          {lobes(7, leaf.mid)}
          {/* the sunlit upper-left shoulder */}
          <G>
            <Circle cx={84} cy={36} r={26} fill={leaf.lit} />
            <Circle cx={46} cy={62} r={19} fill={leaf.lit} />
            <Circle cx={116} cy={44} r={17} fill={leaf.lit} />
            <Circle cx={62} cy={94} r={15} fill={leaf.lit} opacity={0.8} />
          </G>
          {/* rim light on the crown — leaf-coloured, never a white scratch */}
          <Path d="M 62 32 q 26 -26 62 -14 q -32 -2 -56 20 z" fill={leaf.rim} opacity={0.85} />
          <Path d="M 30 84 q 10 -20 30 -26 q -20 12 -24 30 z" fill={leaf.rim} opacity={0.6} />
          <Path d="M 70 24 q 20 -16 46 -10 q -26 2 -42 14 z" fill={HILITE} opacity={0.45} />
          {/* the shaded underside, so the canopy has a bottom */}
          <G opacity={0.55}>
            <Circle cx={150} cy={122} r={19} fill={leaf.deep} />
            <Circle cx={116} cy={140} r={15} fill={leaf.deep} />
            <Circle cx={74} cy={132} r={13} fill={leaf.deep} />
          </G>
          <Path d="M 62 158 q 38 22 78 2" stroke={SHADE} strokeWidth={6} fill="none" strokeLinecap="round" />
          {/* creases where one lobe overlaps the next */}
          {CREASES.map((d, i) => (
            <Path key={`cr${i}`} d={d} stroke={leaf.deep} strokeWidth={5.2} fill="none" strokeLinecap="round" opacity={0.72} />
          ))}
          {/* leaf sparkle: a few lighter blades so the mass is not one flat green */}
          {[
            [58, 50],
            [132, 70],
            [92, 66],
            [156, 96],
            [40, 100],
            [118, 108],
          ].map(([cx, cy], i) => (
            <Path key={i} d={`M ${cx} ${cy} q 9 -7 16 0 q -9 7 -16 0 z`} fill={leaf.rim} opacity={0.7} />
          ))}
        </Svg>
      </Animated.View>

      {/* the branches the animals sit on — static, drawn over the leaves */}
      <Svg width={width} height={height} viewBox={`0 0 ${TREE_VB.w} ${TREE_VB.h}`} style={StyleSheet.absoluteFill}>
        {used.map(limb)}
      </Svg>
    </View>
  );
});
