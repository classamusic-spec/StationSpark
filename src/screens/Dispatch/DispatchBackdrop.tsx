/**
 * The Dispatch room, in three pieces.
 *
 *  `DispatchBackdrop` — the hero band at the top (haze, a layered treeline and
 *    the station's tan coping) and, below it, the cream board the slips are
 *    pinned to. Everything is laid out in screen units against the measured
 *    width, so nothing is ever sliced by `preserveAspectRatio` (critique #10).
 *  `BellTower` — the little bell house from the reference, sitting *on* the
 *    coping and fully in frame.
 *  `DispatchDesk` — the foreground console strip: window, desk, radio, mic,
 *    mug and the community-message screen, with Captain Bea seated at it.
 *
 * Purely decorative — `pointerEvents` never blocks the slips.
 */
import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { idle, palette, radii, spacing } from '@/theme';
import { useLoop } from '@/hooks/useIdle';
import { usePulse } from '@/hooks/usePulse';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY } from '@/world/tone';
import { Birds } from '@/world/Birds';
import { Text } from '@/ui/Text';
import { CaptainBea } from '@/characters/CaptainBea';

/** how tall the hero band is, and how tall the console strip is */
export const heroHeight = (tablet: boolean) => (tablet ? 254 : 210);
export const deskHeight = (tablet: boolean) => (tablet ? 200 : 172);
/** the tan station wall at the foot of the hero band */
const COPING = 78;

const LEAF = '#4FA858';
const LEAF_BACK = '#2F7A42';
const LEAF_LIT = '#6FC069';

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G x={x} y={y} scale={s} opacity={0.94}>
      <Ellipse cx={0} cy={0} rx={17} ry={15} fill={palette.white} />
      <Ellipse cx={20} cy={5} rx={13} ry={11} fill={palette.white} />
      <Ellipse cx={-20} cy={6} rx={12} ry={10} fill={palette.white} />
      <Rect x={-22} y={0} width={44} height={14} rx={7} fill={palette.white} />
      <Rect x={-20} y={9} width={40} height={6} rx={3} fill="#DCEEFF" />
    </G>
  );
}

/* ── the hero band ────────────────────────────────────────────────── */

/**
 * One memoized drawing of the band, in screen units. `h` is the band height and
 * `w` the screen width, so the treeline, coping and hedge always land where
 * they were drawn to land.
 */
const HeroBand = memo(function HeroBand({ w, h }: { w: number; h: number }) {
  const copingY = h - COPING;
  const base = copingY + 10; // where the canopies sit, tucked behind the wall
  const r = Math.min(w * 0.15, h * 0.3);
  // a layered canopy mass: back row first, then the lit row, then one shade
  const back: [number, number][] = [
    [0.02, 1.0],
    [0.19, 0.86],
    [0.38, 0.96],
    [0.58, 0.82],
    [0.76, 0.94],
    [0.98, 1.02],
  ];
  const front: [number, number][] = [
    [0.1, 0.78],
    [0.29, 0.7],
    [0.5, 0.74],
    [0.7, 0.66],
    [0.9, 0.76],
  ];
  return (
    <Svg width={w} height={h} pointerEvents="none">
      <Defs>
        <LinearGradient id="dHaze" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#CDE7FB" stopOpacity={0} />
          <Stop offset="1" stopColor="#CDE7FB" stopOpacity={0.8} />
        </LinearGradient>
        <LinearGradient id="dCoping" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6E1B8" />
          <Stop offset="1" stopColor={palette.tan} />
        </LinearGradient>
      </Defs>

      {/* far haze so the treeline has air behind it */}
      <Rect x={0} y={base - r * 2.4} width={w} height={r * 2.2} fill="url(#dHaze)" />

      {/* the tree mass — drawn in screen units, so nothing is ever cropped */}
      {back.map(([fx, k], i) => (
        <Ellipse key={`b${i}`} cx={fx * w} cy={base - r * k * 0.62} rx={r * k} ry={r * k * 0.8} fill={LEAF_BACK} />
      ))}
      {front.map(([fx, k], i) => (
        <Ellipse key={`f${i}`} cx={fx * w} cy={base - r * k * 0.5} rx={r * k} ry={r * k * 0.76} fill={LEAF} />
      ))}
      <Ellipse cx={w * 0.24} cy={base - r * 0.92} rx={r * 0.3} ry={r * 0.2} fill={LEAF_LIT} opacity={0.8} />
      <Ellipse cx={w * 0.66} cy={base - r * 0.84} rx={r * 0.28} ry={r * 0.19} fill={LEAF_LIT} opacity={0.75} />
      <Path
        d={`M -4 ${base - r * 0.2} Q ${w * 0.28} ${base - r * 0.62} ${w * 0.56} ${base - r * 0.24} Q ${w * 0.82} ${base + r * 0.1} ${w + 4} ${base - r * 0.4} L ${w + 4} ${base + 6} L -4 ${base + 6} Z`}
        fill={SHADE}
      />

      {/* the station's tan coping, with a lighter lip — never a hard seam */}
      <Rect x={-4} y={copingY} width={w + 8} height={h - copingY + 10} rx={12} fill="url(#dCoping)" />
      <Rect x={-4} y={copingY} width={w + 8} height={7} rx={3.5} fill="#FBEED0" />
      <Rect x={-4} y={copingY + 7} width={w + 8} height={4} fill={SHADE} />
      {/* brick courses, so the wall is a wall */}
      {[0.06, 0.3, 0.54, 0.78].map((t) => (
        <Rect key={t} x={w * t} y={copingY + 17} width={w * 0.16} height={3.4} rx={1.7} fill={palette.tanDark} opacity={0.45} />
      ))}
      {[0.18, 0.42, 0.66].map((t) => (
        <Rect key={t} x={w * t} y={copingY + 30} width={w * 0.16} height={3.4} rx={1.7} fill={palette.tanDark} opacity={0.35} />
      ))}
    </Svg>
  );
});

/* ── the bell house ───────────────────────────────────────────────── */

/** The little bell house from the reference — it sways gently forever. */
export function BellTower({ swing, top = 30 }: { swing: SharedValue<number>; top?: number }) {
  const bell = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.value}deg` }] }));
  return (
    <View style={[styles.tower, { top }]} pointerEvents="none">
      <Svg width={108} height={104} viewBox="0 0 132 126">
        <Ellipse cx={66} cy={120} rx={56} ry={6} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
        {/* plinth, then the house, then the roof with its soffit shadow */}
        <Path d="M 30 106 h 72 a 7 7 0 0 1 7 7 v 7 H 23 v -7 a 7 7 0 0 1 7 -7 z" fill={palette.tanDark} />
        <Rect x={23} y={106} width={86} height={5} rx={2.5} fill="#F3DCAF" />
        <Rect x={24} y={44} width={84} height={64} rx={9} fill="#F6DFB4" />
        <Rect x={90} y={46} width={18} height={62} rx={8} fill={SHADE} />
        <Rect x={24} y={44} width={84} height={9} rx={4.5} fill={SHADE} />
        <Path d="M 10 50 L 66 14 L 122 50 Z" fill={palette.engineRed} />
        <Path d="M 66 14 L 122 50 L 112 50 L 64 18 Z" fill={SHADE} />
        <Rect x={8} y={44} width={116} height={11} rx={5.5} fill={palette.engineRedDark} />
        <Rect x={14} y={45} width={40} height={3.4} rx={1.7} fill={HIGHLIGHT} />
        {/* the niche the bell hangs in */}
        <Path d="M 44 100 L 44 76 A 22 22 0 0 1 88 76 L 88 100 Z" fill="#C88B4A" />
        <Path d="M 48 100 L 48 77 A 18 18 0 0 1 84 77 L 84 100 Z" fill="#9A6432" />
      </Svg>
      <Animated.View style={[styles.bellPivot, bell]}>
        <Svg width={36} height={41} viewBox="0 0 44 50">
          <Rect x={19} y={0} width={6} height={7} rx={3} fill={palette.goldDark} />
          <Path d="M 6 32 q 0 -26 16 -26 q 16 0 16 26 z" fill={palette.safetyYellow} />
          <Path d="M 28 8 q 10 6 10 24 h -8 q 2 -16 -2 -24 z" fill={SHADE} />
          <Path d="M 13 22 q 3 -11 10 -12" stroke={HIGHLIGHT} strokeWidth={4} strokeLinecap="round" fill="none" />
          <Rect x={3} y={31} width={38} height={7} rx={3.5} fill={palette.gold} />
          <Circle cx={22} cy={44} r={4.6} fill={palette.gold} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ── the backdrop ─────────────────────────────────────────────────── */

export interface DispatchBackdropProps {
  /** height of the hero band; the cream board starts just under it */
  hero?: number;
}

/** Hero band + the cream board the dispatch slips are pinned to. */
export function DispatchBackdrop({ hero }: DispatchBackdropProps) {
  const { width, height } = useWindowDimensions();
  const tablet = Math.min(width, height) >= 600;
  const h = hero ?? heroHeight(tablet);
  const drift = useLoop(idle.cloudDriftMs);
  const clouds = useAnimatedStyle(() => ({ transform: [{ translateX: -30 + drift.value * 60 }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.cloudBand, { height: h }, clouds]}>
        <Svg width={width + 60} height={h} pointerEvents="none">
          <Cloud x={width * 0.16} y={h * 0.32} s={1} />
          <Cloud x={width * 0.86} y={h * 0.2} s={0.72} />
          <Cloud x={width * 0.56} y={h * 0.5} s={0.5} />
        </Svg>
      </Animated.View>

      <View style={styles.hero}>
        <HeroBand w={width} h={h} />
      </View>

      {/* a bird crossing the hero band every ~20 s (rule #9, critique #8) */}
      <View style={[styles.hero, { height: h }]}>
        <Birds count={1} top={h * 0.3} periodMs={21000} arc={26} size={30} />
      </View>

      {/* the board: a cream page with a soft top edge, so the slips are pinned
          to something instead of floating on raw sky (rules #7 and #10) */}
      <View style={[styles.board, { top: h - 14 }]} />
    </View>
  );
}

/* ── the console strip ────────────────────────────────────────────── */

const ConsoleArt = memo(function ConsoleArt({ w, h }: { w: number; h: number }) {
  const deskY = h * 0.42;
  return (
    <Svg width={w} height={h} pointerEvents="none">
      <Defs>
        <LinearGradient id="dGlass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#BFE0F7" />
          <Stop offset="1" stopColor="#8FC6EC" />
        </LinearGradient>
        <LinearGradient id="dDesk" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#B9C2DA" />
          <Stop offset="1" stopColor="#98A3C2" />
        </LinearGradient>
      </Defs>

      {/* the window wall behind the desk, with the yard showing through */}
      <Rect x={0} y={0} width={w} height={deskY + 4} fill="url(#dGlass)" />
      <Ellipse cx={w * 0.2} cy={deskY} rx={w * 0.24} ry={deskY * 0.6} fill={LEAF} opacity={0.55} />
      <Ellipse cx={w * 0.62} cy={deskY + 4} rx={w * 0.26} ry={deskY * 0.52} fill={LEAF_BACK} opacity={0.45} />
      <Ellipse cx={w * 0.94} cy={deskY - 4} rx={w * 0.2} ry={deskY * 0.58} fill={LEAF} opacity={0.5} />
      {/* mullions — an actual window, not a blue rectangle */}
      {[0.26, 0.52, 0.78].map((t) => (
        <Rect key={t} x={w * t - 3} y={0} width={6} height={deskY + 4} fill="#DDE6F5" />
      ))}
      <Rect x={0} y={deskY - 10} width={w} height={7} fill="#DDE6F5" />
      <Rect x={0} y={0} width={w} height={9} fill={SHADE} />

      {/* the desk: front face, then the top lip catching the light */}
      <Rect x={-6} y={deskY} width={w + 12} height={h - deskY + 10} rx={12} fill="url(#dDesk)" />
      <Rect x={-6} y={deskY} width={w + 12} height={11} rx={5.5} fill="#D2DAEC" />
      <Rect x={-6} y={deskY + 11} width={w + 12} height={5} fill={SHADE} />
      <Rect x={w * 0.06} y={deskY + 32} width={w * 0.88} height={h - deskY - 44} rx={10} fill={SHADE} opacity={0.5} />
    </Svg>
  );
});

/** A handheld radio standing on the desk, its signal marks blinking. */
function DeskRadio({ size }: { size: number }) {
  const pulse = usePulse(1400, 0.5);
  const style = useAnimatedStyle(() => ({ opacity: 0.3 + pulse.value * 0.7 }));
  return (
    <View style={{ width: size * 1.5, height: size }}>
      <Svg width={size * 1.5} height={size} viewBox="0 0 72 48">
        <Ellipse cx={26} cy={45} rx={17} ry={3.8} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
        <Rect x={22} y={0} width={5} height={11} rx={2.5} fill={palette.charcoal} />
        <Rect x={11} y={9} width={30} height={36} rx={7} fill={palette.engineRed} />
        <Rect x={33} y={11} width={7} height={32} rx={3.5} fill={SHADE} />
        <Rect x={13} y={11} width={4} height={32} rx={2} fill={HIGHLIGHT} />
        <Rect x={15} y={14} width={22} height={9} rx={3} fill={palette.charcoalDark} />
        <Rect x={15} y={27} width={9} height={4} rx={2} fill={palette.slateLight} />
        <Rect x={28} y={27} width={9} height={4} rx={2} fill={palette.slateLight} />
        <Rect x={15} y={34} width={9} height={4} rx={2} fill={palette.slateLight} />
        <Rect x={28} y={34} width={9} height={4} rx={2} fill={palette.safetyYellow} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
        <Svg width={size * 1.5} height={size} viewBox="0 0 72 48">
          <Path d="M 46 4 L 58 1 M 47 12 L 62 11 M 47 20 L 60 24" stroke={palette.safetyYellow} strokeWidth={5} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** The gooseneck mic and the crew's mug — the small stuff that sells a desk. */
const DeskProps = memo(function DeskProps({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" pointerEvents="none">
      <Ellipse cx={20} cy={56} rx={16} ry={3.6} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      <Ellipse cx={20} cy={54} rx={14} ry={4.4} fill={palette.charcoal} />
      <Path d="M 20 52 q -1 -18 8 -24 q 8 -5 12 -3" stroke={palette.charcoal} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Ellipse cx={43} cy={22} rx={9} ry={8} fill={palette.charcoalDark} />
      <Ellipse cx={41} cy={20} rx={5} ry={4.4} fill={HIGHLIGHT} />
      {/* mug */}
      <Ellipse cx={52} cy={56} rx={9} ry={2.4} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      <Path d="M 45 42 h 15 v 9 a 5 5 0 0 1 -5 5 h -5 a 5 5 0 0 1 -5 -5 z" fill={palette.cream} />
      <Path d="M 55 42 h 5 v 9 a 5 5 0 0 1 -5 5 z" fill={SHADE} />
      <Path d="M 60 45 a 4 4 0 0 1 0 7" stroke={palette.cream} strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
});

export interface DispatchDeskProps {
  /** Captain Bea's line, shown on a card above the console */
  line: string;
  /** extra padding under the strip for the home indicator */
  safeBottom?: number;
}

/**
 * The dispatch console the child is standing at: window, desk, radio, mic, mug,
 * the community-message screen and Captain Bea seated behind it.
 */
export function DispatchDesk({ line, safeBottom = 0 }: DispatchDeskProps) {
  const { width, height } = useWindowDimensions();
  const tablet = Math.min(width, height) >= 600;
  const h = deskHeight(tablet) + safeBottom;
  const beaSize = tablet ? 232 : 188;
  /** the right-hand slice of the console Captain Bea occupies */
  const beaLane = Math.max(120, Math.min(190, width * 0.36));

  return (
    <View style={[styles.desk, { height: h }]} pointerEvents="box-none">
      <View style={styles.deskClip} pointerEvents="none">
        <ConsoleArt w={width} h={h} />
        {/* Captain Bea, seated at the console — the rig, not a portrait */}
        <View style={[styles.bea, { right: beaLane * 0.1, bottom: -beaSize * 0.3 + safeBottom * 0.4 }]}>
          <CaptainBea size={beaSize} emotion="happy" pose="stand" />
        </View>
      </View>

      <View style={[styles.deskRow, { paddingBottom: safeBottom + spacing.xs, paddingRight: beaLane }]} pointerEvents="none">
        <DeskRadio size={tablet ? 58 : 48} />
        {/* the community message, exactly as the reference frames it */}
        <View style={styles.screen}>
          <Text variant="tiny" color="#2E5EA8" center style={styles.screenText}>
            {'REAL PEOPLE\nBRIGHTER\nCOMMUNITIES'}
          </Text>
          <Svg width={15} height={13} viewBox="0 0 16 14">
            <Path d="M8 13 C 2 9 0 6 0 4 A 4 4 0 0 1 8 2.6 A 4 4 0 0 1 16 4 C 16 6 14 9 8 13 Z" fill="#5C8FD6" />
          </Svg>
        </View>
        <DeskProps size={tablet ? 60 : 50} />
      </View>

      {/* Bea's line, on the one bubble motif used everywhere else */}
      <View style={[styles.beaBubble, { right: beaLane * 0.86 }]} pointerEvents="none">
        <Text variant="tiny" color={palette.navyMuted}>
          Captain Bea
        </Text>
        <Text variant="bodyStrong" numberOfLines={3}>
          {line}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cloudBand: { position: 'absolute', left: -30, top: 0 },
  hero: { position: 'absolute', left: 0, right: 0, top: 0 },
  board: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.cream,
    borderTopLeftRadius: radii.panel,
    borderTopRightRadius: radii.panel,
  },
  tower: { position: 'absolute', right: 6, width: 108, height: 104 },
  bellPivot: { position: 'absolute', left: 36, top: 48, width: 36, height: 41, transformOrigin: 'top center' },

  desk: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  deskClip: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' },
  bea: { position: 'absolute' },
  deskRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: spacing.sm,
    paddingBottom: spacing.xs,
  },
  screen: {
    flex: 1,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: radii.tile,
    backgroundColor: '#CFE6FA',
    borderWidth: 3,
    borderColor: '#7FA9D8',
  },
  screenText: { letterSpacing: 0.6, lineHeight: 13 },
  beaBubble: {
    position: 'absolute',
    left: spacing.sm,
    top: 6,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderBottomRightRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    shadowColor: SHADOW_FILL,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
});
