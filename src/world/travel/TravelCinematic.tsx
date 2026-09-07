/**
 * TRAVEL CINEMATIC — the truck rolls out.
 *
 * Three parallax layers (far hills, mid trees + buildings, near road) scroll
 * past a bouncing fire truck while a mini-map card draws the route. Engine loop
 * + one siren blip. Ends on a "We're here!" sticker, then `onDone()`.
 *
 * Duration is ~3 s, or 800 ms when the child has asked for reduced motion.
 * Tapping anywhere skips straight to the arrival sticker — never trap a kid in
 * a cutscene.
 */
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { LocationId } from '@/content/types';
import { palette, radii, shadows, spacing, springs } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePulse } from '@/hooks/usePulse';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useGame } from '@/state/store';
import { Text } from '@/ui/Text';
import { FireTruck } from '@/world/FireTruck';
import { HIGHLIGHT, SHADE } from '../tone';

const FULL_MS = 3000;
const REDUCED_MS = 800;
const STRIP = 400; // viewBox width of one scrolling tile
/** How far each layer travels over the whole drive, in strip widths. */
const LAYER_SPEED = { sky: 70, far: 190, mid: 520, props: 880, road: 1180 } as const;

const LOCATION_NAMES: Record<LocationId, string> = {
  station: 'Station Spark',
  bakery: 'the Bakery',
  school: 'the School',
  library: 'the Library',
  park: 'the Park',
  'pet-shop': 'the Pet Shop',
  market: 'the Market',
  pizza: 'the Pizza Shop',
  apartments: 'the Apartments',
  garden: 'the Garden',
  museum: 'the Museum',
  beach: 'the Beach',
  festival: 'the Festival',
  construction: 'the Building Site',
  'train-station': 'the Train Station',
  'clock-tower': 'the Clock Tower',
};

export const locationName = (id: LocationId): string => LOCATION_NAMES[id] ?? 'the next stop';

/* ------------------------------------------------------------------ */
/* Scrolling layers                                                     */
/*                                                                      */
/* Distance is carried by VALUE, not detail: the far ridge is pale and  */
/* flat, the town one step down from the kerbside, the kerbside crisp   */
/* and saturated. Every layer is lit from the top-left, like the rest   */
/* of the world.                                                        */
/* ------------------------------------------------------------------ */

/**
 * One layer, tiled across the viewport and translated so it wraps seamlessly.
 * Two tiles only cover 800 px — on a tablet that left a bald strip down the
 * right-hand side, so the tile count follows the screen.
 */
function ScrollLayer({
  progress,
  speed,
  height,
  bottom,
  fieldW,
  children,
}: {
  progress: SharedValue<number>;
  speed: number;
  height: number;
  bottom: number;
  fieldW: number;
  children: React.ReactNode;
}) {
  const tiles = Math.ceil(fieldW / STRIP) + 1;
  const a = useAnimatedStyle(() => ({ transform: [{ translateX: -((progress.value * speed) % STRIP) }] }));
  return (
    <Animated.View style={[styles.layer, { height, bottom, width: STRIP * tiles }, a]} pointerEvents="none">
      {Array.from({ length: tiles }, (_, i) => (
        <View key={i} style={{ width: STRIP, height }}>
          {children}
        </View>
      ))}
    </Animated.View>
  );
}

/* ── the sky ──────────────────────────────────────────────────────── */

/** The gradient the whole drive happens under. */
const SkyWash = (
  <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="tcSky" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={palette.skyTop} />
        <Stop offset="0.58" stopColor={palette.skyMid} />
        <Stop offset="1" stopColor={palette.skyBottom} />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={100} height={100} fill="url(#tcSky)" />
  </Svg>
);

/** The sun. Its own square node — stretched with the sky it became an egg. */
const SunDisc = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
    <Defs>
      <RadialGradient id="tcSun" cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0.24" stopColor="#FFE9A8" stopOpacity={0.6} />
        <Stop offset="0.5" stopColor={palette.safetyYellow} stopOpacity={0.2} />
        <Stop offset="1" stopColor={palette.safetyYellow} stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Circle cx={50} cy={50} r={50} fill="url(#tcSun)" />
    <Circle cx={50} cy={50} r={17} fill="#FFF3C4" />
    <Circle cx={45} cy={44} r={9} fill={palette.white} opacity={0.5} />
  </Svg>
);

/** Clouds and two far gulls — the slowest thing in the frame. */
const SkyDrift = (
  <Svg width="100%" height="100%" viewBox="0 0 400 150">
    <G opacity={0.9}>
      <Path
        d="M46 92c-14 0-24-8-24-18s10-18 22-17c4-12 16-19 29-16 8-12 25-14 36-4 6-4 15-3 20 3 12-1 22 8 22 19 0 10-9 18-21 18z"
        fill={palette.white}
      />
      <Path d="M28 84c14 6 34 9 58 9s44-3 58-9c-6 10-20 15-58 15S34 94 28 84z" fill="#DCEEFF" opacity={0.85} />
    </G>
    <G opacity={0.7}>
      <Path d="M232 54c-11 0-19-6-19-14s8-14 17-13c4-10 14-15 24-12 7-9 20-11 28-3 5-3 12-2 16 3 9 0 17 6 17 15 0 8-7 14-16 14z" fill={palette.white} />
      <Path d="M218 48c11 5 27 7 46 7s35-2 46-7c-5 8-16 12-46 12s-41-4-46-12z" fill="#DCEEFF" opacity={0.8} />
    </G>
    <G opacity={0.55}>
      <Path d="M330 112c-9 0-16-5-16-11s7-12 15-11c3-8 12-12 20-10 6-8 17-9 24-2 4-3 10-2 13 2 8 0 14 5 14 12 0 7-6 12-13 12z" fill={palette.white} />
    </G>
    {/* two gulls, one flat tone — distance is value, not detail */}
    <Path
      d="M150 34q7-7 13 0q6-7 13 0q-7-3-13 2q-6-5-13-2zM196 22q5-5 9 0q4-5 9 0q-5-2-9 1.5q-4-3.5-9-1.5z"
      fill="#8FA6D0"
      opacity={0.65}
    />
  </Svg>
);

/* ── the far ridge ────────────────────────────────────────────────── */

/**
 * Three ridges that get paler and cooler with distance and carry no detail at
 * all — the old pair of ellipses read as two green balloons.
 */
const FarHills = (
  <Svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
    <Path
      d="M0 74Q34 40 72 58Q106 74 136 44Q170 10 206 42Q234 66 262 52Q296 34 324 58Q352 82 400 54L400 160L0 160Z"
      fill="#ADCCC8"
    />
    <Path
      d="M0 106Q44 80 88 96Q130 112 166 88Q204 62 244 88Q280 112 316 92Q354 70 400 92L400 160L0 160Z"
      fill="#9CCB98"
    />
    {/* the only "detail" the far ridge gets: a soft line of tree tops */}
    <Path
      d="M0 134q12-11 24 0q10-9 20 0q14-12 28 0q12-9 24 0q14-12 28 0q10-9 20 0q14-12 28 0q12-9 24 0q14-12 28 0q10-9 20 0q14-12 28 0q12-9 24 0q14-12 28 0q10-9 20 0q14-12 28 0q12-9 24 0L400 160L0 160Z"
      fill="#84C078"
    />
    <Path d="M0 146Q60 134 128 142Q196 150 262 140Q330 130 400 140L400 160L0 160Z" fill={palette.grass} />
  </Svg>
);

/* ── the town ─────────────────────────────────────────────────────── */

type RoofKind = 'gable' | 'hip' | 'flat' | 'mansard';

interface TownSpec {
  x: number;
  w: number;
  h: number;
  wall: string;
  roof: RoofKind;
  roofFill: string;
  roofShade: string;
  awning?: [string, string];
  cols: number;
  rows: number;
  chimney?: boolean;
}

const GROUND = 282;

/** Window grid, sill band and glass sheen — three paths for a whole elevation. */
function windows(x: number, w: number, top: number, cols: number, rows: number) {
  const gw = w / (cols + 0.6);
  const ww = gw * 0.62;
  const wh = ww * 1.12;
  const gapY = wh * 1.75;
  let glass = '';
  let sill = '';
  let sheen = '';
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const wx = x + gw * 0.5 + c * gw * 1.06;
      const wy = top + r * gapY;
      glass += `M${wx} ${wy}h${ww}v${wh}h${-ww}z`;
      sill += `M${wx - 2} ${wy + wh}h${ww + 4}v3h${-ww - 4}z`;
      sheen += `M${wx} ${wy + wh * 0.72}L${wx + ww * 0.62} ${wy}h${ww * 0.34}L${wx + ww * 0.34} ${wy + wh}h${-ww * 0.34}z`;
    }
  }
  return { glass, sill, sheen };
}

const TownHouse = memo(function TownHouse({ s }: { s: TownSpec }) {
  const top = GROUND - s.h;
  const grid = windows(s.x + s.w * 0.1, s.w * 0.8, top + s.h * 0.16, s.cols, s.rows);
  const shopTop = GROUND - s.h * 0.3;
  return (
    <G>
      {/* the wall, its lit left return and its shaded right return */}
      <Path d={`M${s.x} ${top}h${s.w}v${s.h}h${-s.w}z`} fill={s.wall} />
      <Path d={`M${s.x} ${top}h${s.w * 0.14}v${s.h}h${-s.w * 0.14}z`} fill={HIGHLIGHT} opacity={0.55} />
      <Path d={`M${s.x + s.w * 0.86} ${top}h${s.w * 0.14}v${s.h}h${-s.w * 0.14}z`} fill={SHADE} />
      {/* roof */}
      {s.roof === 'gable' ? (
        <G>
          <Path d={`M${s.x - 9} ${top + 5}L${s.x + s.w / 2} ${top - s.h * 0.3}L${s.x + s.w + 9} ${top + 5}z`} fill={s.roofFill} />
          <Path d={`M${s.x + s.w / 2} ${top - s.h * 0.3}L${s.x + s.w + 9} ${top + 5}L${s.x + s.w / 2} ${top + 5}z`} fill={SHADE} />
        </G>
      ) : s.roof === 'hip' ? (
        <G>
          <Path d={`M${s.x - 7} ${top + 4}L${s.x + s.w * 0.3} ${top - s.h * 0.24}L${s.x + s.w * 0.7} ${top - s.h * 0.24}L${s.x + s.w + 7} ${top + 4}z`} fill={s.roofFill} />
          <Path d={`M${s.x + s.w * 0.5} ${top - s.h * 0.24}L${s.x + s.w * 0.7} ${top - s.h * 0.24}L${s.x + s.w + 7} ${top + 4}L${s.x + s.w * 0.5} ${top + 4}z`} fill={SHADE} />
        </G>
      ) : s.roof === 'mansard' ? (
        <G>
          <Path d={`M${s.x - 5} ${top + 4}L${s.x + s.w * 0.14} ${top - s.h * 0.17}L${s.x + s.w * 0.86} ${top - s.h * 0.17}L${s.x + s.w + 5} ${top + 4}z`} fill={s.roofFill} />
          <Path d={`M${s.x + s.w * 0.5} ${top - s.h * 0.17}L${s.x + s.w * 0.86} ${top - s.h * 0.17}L${s.x + s.w + 5} ${top + 4}L${s.x + s.w * 0.5} ${top + 4}z`} fill={SHADE} />
          <Path d={`M${s.x + s.w * 0.4} ${top - s.h * 0.17}h${s.w * 0.2}v${s.h * 0.1}h${-s.w * 0.2}z`} fill={s.roofShade} />
        </G>
      ) : (
        <G>
          <Path d={`M${s.x - 5} ${top - s.h * 0.09}h${s.w + 10}v${s.h * 0.09}h${-s.w - 10}z`} fill={s.roofFill} />
          <Path d={`M${s.x - 5} ${top - s.h * 0.09}h${s.w + 10}v${s.h * 0.03}h${-s.w - 10}z`} fill={HIGHLIGHT} />
          <Path d={`M${s.x + s.w * 0.18} ${top - s.h * 0.16}h${s.w * 0.16}v${s.h * 0.07}h${-s.w * 0.16}z`} fill={s.roofShade} />
        </G>
      )}
      <Path d={`M${s.x - 6} ${top}h${s.w + 12}v6h${-s.w - 12}z`} fill={s.roofShade} />
      {s.chimney ? (
        <G>
          <Path d={`M${s.x + s.w * 0.68} ${top - s.h * 0.34}h${s.w * 0.1}v${s.h * 0.2}h${-s.w * 0.1}z`} fill={s.roofShade} />
          <Path d={`M${s.x + s.w * 0.66} ${top - s.h * 0.38}h${s.w * 0.14}v${s.h * 0.05}h${-s.w * 0.14}z`} fill={palette.charcoal} />
        </G>
      ) : null}
      {/* the elevation */}
      <Path d={grid.glass} fill="#3E5688" />
      <Path d={grid.sheen} fill={HIGHLIGHT} />
      <Path d={grid.sill} fill={palette.cream} />
      {/* the shopfront: a sign band, a plate window, a door */}
      <Path d={`M${s.x + 4} ${shopTop - 13}h${s.w - 8}v11h${-s.w + 8}z`} fill={palette.cream} />
      <Path d={`M${s.x + 10} ${shopTop - 9}h${s.w - 20}v4h${-s.w + 20}z`} fill={palette.navyMuted} opacity={0.5} />
      {s.awning ? (
        <G>
          <Path d={`M${s.x + 2} ${shopTop}h${s.w - 4}l-4 13h${-s.w + 12}z`} fill={s.awning[0]} />
          <Path
            d={`M${s.x + 2 + (s.w - 4) * 0.22} ${shopTop}h${(s.w - 4) * 0.18}l-3.4 13h${-(s.w - 4) * 0.18}zM${s.x + 2 + (s.w - 4) * 0.58} ${shopTop}h${(s.w - 4) * 0.18}l-3.4 13h${-(s.w - 4) * 0.18}z`}
            fill={s.awning[1]}
          />
          <Path d={`M${s.x + 2} ${shopTop}h${s.w - 4}v3.4h${-s.w + 4}z`} fill={HIGHLIGHT} />
        </G>
      ) : null}
      <Path d={`M${s.x + s.w * 0.1} ${shopTop + 17}h${s.w * 0.46}v${GROUND - shopTop - 17}h${-s.w * 0.46}z`} fill="#3E5688" />
      <Path d={`M${s.x + s.w * 0.1} ${GROUND}L${s.x + s.w * 0.4} ${shopTop + 17}h${s.w * 0.14}L${s.x + s.w * 0.24} ${GROUND}z`} fill={HIGHLIGHT} />
      <Path d={`M${s.x + s.w * 0.64} ${GROUND}v${-(GROUND - shopTop - 15)}a${s.w * 0.11} ${s.w * 0.11} 0 0 1 ${s.w * 0.22} 0v${GROUND - shopTop - 15}z`} fill={palette.wood} />
      <Path d={`M${s.x + s.w * 0.76} ${GROUND}v${-(GROUND - shopTop - 15)}a${s.w * 0.11} ${s.w * 0.11} 0 0 1 ${s.w * 0.1} ${-s.w * 0.05}v${GROUND - shopTop - 10}z`} fill={SHADE} />
      <Circle cx={s.x + s.w * 0.7} cy={GROUND - 16} r={1.8} fill={palette.gold} />
    </G>
  );
});

const TOWN: TownSpec[] = [
  { x: 6, w: 78, h: 150, wall: '#F3D8B4', roof: 'gable', roofFill: palette.engineRed, roofShade: palette.engineRedDark, awning: [palette.engineRed, palette.white], cols: 2, rows: 2, chimney: true },
  { x: 96, w: 68, h: 190, wall: '#FFF1DA', roof: 'flat', roofFill: '#4A5FA8', roofShade: '#33478A', awning: ['#3B8E3F', palette.white], cols: 2, rows: 3 },
  { x: 176, w: 56, h: 132, wall: '#FBE3C0', roof: 'hip', roofFill: '#3B8E3F', roofShade: '#2C6E30', cols: 2, rows: 1, chimney: true },
  { x: 244, w: 74, h: 174, wall: '#F6DFB4', roof: 'mansard', roofFill: '#4A5FA8', roofShade: '#33478A', awning: [palette.engineRed, palette.white], cols: 3, rows: 2 },
  { x: 330, w: 64, h: 146, wall: '#FFE7D2', roof: 'gable', roofFill: '#C96A5A', roofShade: '#A9503F', awning: ['#E8A33C', palette.white], cols: 2, rows: 2 },
];

/** One street tree, drawn flat — the town is a value step behind the kerb. */
const townTree = (x: number) =>
  `M${x - 4.4} ${GROUND}q2-26 0-50h8.8q-2 24 0 50zM${x} ${GROUND - 104}c15 0 26 11 26 24s-11 22-26 22-26-9-26-22 11-24 26-24z`;

const MidTown = (
  <Svg width="100%" height="100%" viewBox="0 0 400 300">
    {TOWN.map((b) => (
      <TownHouse key={b.x} s={b} />
    ))}
    <Path d={`${townTree(90)}${townTree(238)}${townTree(324)}`} fill="#4E9E5C" />
    <Path d="M78 172c8-8 20-11 30-8-11 0-22 3-30 8zM226 172c8-8 20-11 30-8-11 0-22 3-30 8zM312 172c8-8 20-11 30-8-11 0-22 3-30 8z" fill={HIGHLIGHT} />
    <Path d="M104 186c8 6 12 16 10 26-1-11-5-20-10-26zM252 186c8 6 12 16 10 26-1-11-5-20-10-26zM338 186c8 6 12 16 10 26-1-11-5-20-10-26z" fill={SHADE} />
    {/* the pavement the whole block stands on */}
    <Path d="M0 282h400v18H0z" fill="#DDE3F0" />
    <Path d="M0 282h400v4H0z" fill={palette.white} opacity={0.5} />
    <Path d="M24 286v14M72 286v14M120 286v14M168 286v14M216 286v14M264 286v14M312 286v14M360 286v14" stroke={SHADE} strokeWidth={1.4} fill="none" />
  </Svg>
);

/* ── the kerbside ─────────────────────────────────────────────────── */

/** Kerbside furniture sweeping past: lamps, a hydrant, a bench, a stop, a box. */
const Roadside = (
  <Svg width="100%" height="100%" viewBox="0 0 400 130">
    {/* planter */}
    <G>
      <Ellipse cx={22} cy={126} rx={16} ry={3.6} fill={palette.navy} opacity={0.12} />
      <Path d="M10 104h24l-3 22H13z" fill="#C97F52" />
      <Path d="M10 104h6l-2 22h-1z" fill={HIGHLIGHT} />
      <Path d="M8 100h28v6H8z" fill="#A8663E" />
      <Path d="M22 86c9 0 15 6 15 11s-6 7-15 7-15-2-15-7 6-11 15-11z" fill="#4E9E5C" />
      <Path d="M14 92c4-4 10-5 15-3-6 0-11 2-15 3z" fill={HIGHLIGHT} />
      <Circle cx={14} cy={90} r={2.4} fill={palette.pink} />
      <Circle cx={29} cy={92} r={2.4} fill={palette.safetyYellow} />
    </G>
    {/* lamp posts */}
    {[62, 286].map((x) => (
      <G key={`lamp${x}`}>
        <Ellipse cx={x} cy={126} rx={11} ry={3} fill={palette.navy} opacity={0.12} />
        <Path d={`M${x - 6} 116h12v10h-12z`} fill={palette.charcoal} />
        <Path d={`M${x - 3.4} 22h6.8v96h-6.8z`} fill={palette.charcoalDark} />
        <Path d={`M${x - 3.4} 22h2.4v96h-2.4z`} fill={HIGHLIGHT} />
        <Path d={`M${x} 26q0-16 18-16`} stroke={palette.charcoalDark} strokeWidth={5.4} fill="none" strokeLinecap="round" />
        <Path d={`M${x + 9} 10h18l-4 15h-10z`} fill={palette.charcoal} />
        <Path d={`M${x + 12} 13h12l-2.6 10h-6.8z`} fill="#FFE9A8" />
        <Ellipse cx={x + 18} cy={19} rx={19} ry={14} fill={palette.safetyYellow} opacity={0.15} />
      </G>
    ))}
    {/* hydrant */}
    <G>
      <Ellipse cx={116} cy={126} rx={12} ry={3} fill={palette.navy} opacity={0.12} />
      <Path d="M109 92h14v34h-14z" fill={palette.engineRed} />
      <Path d="M109 92h5v34h-5z" fill={HIGHLIGHT} />
      <Path d="M118 92h5v34h-5z" fill={SHADE} />
      <Path d="M103 99h26v7h-26z" fill={palette.engineRedDark} />
      <Path d="M109 92a7 7 0 0 1 14 0z" fill={palette.engineRedDark} />
      <Circle cx={116} cy={86} r={5} fill={palette.engineRed} />
      <Circle cx={114.4} cy={84.4} r={1.8} fill={HIGHLIGHT} />
      <Path d="M105 122h22v4h-22z" fill={palette.engineRedDark} />
    </G>
    {/* bench */}
    <G>
      <Ellipse cx={176} cy={126} rx={30} ry={3.4} fill={palette.navy} opacity={0.12} />
      <Path d="M152 110h6v16h-6zM194 110h6v16h-6z" fill={palette.charcoalDark} />
      <Path d="M150 104h52v5h-52zM150 96h52v5h-52zM150 88h52v5h-52z" fill={palette.wood} />
      <Path d="M150 104h52v1.6h-52zM150 96h52v1.6h-52zM150 88h52v1.6h-52z" fill={HIGHLIGHT} />
      <Path d="M150 82h6v22h-6zM196 82h6v22h-6z" fill={palette.woodDark} />
    </G>
    {/* post box */}
    <G>
      <Ellipse cx={238} cy={126} rx={13} ry={3} fill={palette.navy} opacity={0.12} />
      <Path d="M227 126V96a11 11 0 0 1 22 0v30z" fill={palette.engineRed} />
      <Path d="M227 126V96a11 11 0 0 1 6-9.6V126z" fill={HIGHLIGHT} />
      <Path d="M243 126V90a11 11 0 0 1 6 6v30z" fill={SHADE} />
      <Path d="M232 100h12v4h-12z" fill={palette.charcoalDark} />
      <Path d="M225 84h26v5h-26z" fill={palette.engineRedDark} />
    </G>
    {/* bus stop */}
    <G>
      <Ellipse cx={330} cy={126} rx={44} ry={3.6} fill={palette.navy} opacity={0.12} />
      <Path d="M296 44h68v6h-68z" fill="#4A5FA8" />
      <Path d="M296 44h68v2.4h-68z" fill={HIGHLIGHT} />
      <Path d="M298 50h64v56h-64z" fill={palette.waterCyanLight} opacity={0.5} />
      <Path d="M300 106L330 52h10l-30 54z" fill={palette.white} opacity={0.42} />
      <Path d="M296 50h5v76h-5zM359 50h5v76h-5z" fill="#33478A" />
      <Path d="M304 108h48v6h-48zM306 114h6v12h-6zM344 114h6v12h-6z" fill={palette.wood} />
      <Path d="M366 50h5v70h-5z" fill={palette.charcoalDark} />
      <Path d="M362 34h14v14h-14z" fill={palette.engineRed} />
      <Path d="M365 38h8v6h-8z" fill={palette.white} opacity={0.85} />
    </G>
    {/* litter bin */}
    <G>
      <Ellipse cx={386} cy={126} rx={13} ry={3} fill={palette.navy} opacity={0.12} />
      <Path d="M375 126l3-28h16l3 28z" fill="#5DBB63" />
      <Path d="M375 126l3-28h5l-2 28z" fill={HIGHLIGHT} />
      <Path d="M372 94h28v6h-28z" fill="#3B8E3F" />
    </G>
  </Svg>
);

/* ── the road ─────────────────────────────────────────────────────── */

const RoadStrip = (
  <Svg width="100%" height="100%" viewBox="0 0 400 90" preserveAspectRatio="none">
    {/* pavement, then the kerb with a lit top lip and a gutter shadow */}
    <Rect x={0} y={0} width={400} height={13} fill="#DDE3F0" />
    <Rect x={0} y={0} width={400} height={3} fill={palette.white} opacity={0.55} />
    <Rect x={0} y={13} width={400} height={7} fill="#C3CADD" />
    <Rect x={0} y={13} width={400} height={2.4} fill={palette.white} opacity={0.5} />
    <Rect x={0} y={20} width={400} height={70} fill="#9EA7C0" />
    <Rect x={0} y={20} width={400} height={5} fill={SHADE} />
    {/* lane markings: an edge line, then the centre dashes */}
    <Rect x={0} y={33} width={400} height={2.6} fill={palette.white} opacity={0.4} />
    {[6, 86, 166, 246, 326].map((x) => (
      <Rect key={x} x={x} y={54} width={48} height={7} fill={palette.white} opacity={0.88} />
    ))}
    <Rect x={0} y={84} width={400} height={6} fill="#8C95AF" />
    {/* a drain and a manhole, so the tarmac is not a blank grey band */}
    <Rect x={40} y={22} width={26} height={6} rx={3} fill="#8C95AF" />
    <Rect x={44} y={23.4} width={18} height={1.4} fill={SHADE} />
    <Ellipse cx={286} cy={72} rx={17} ry={6} fill="#949DB8" />
    <Ellipse cx={286} cy={71} rx={12} ry={3.6} fill="#8C95AF" />
  </Svg>
);

/**
 * A soft red/blue light wash pulsing out of phase, like a bar on the roof.
 * It fades to nothing towards the middle — as two flat rectangles it drew a
 * hard seam straight down the centre of the sky.
 */
function SirenWash() {
  const p = usePulse(900, 0.5);
  const red = useAnimatedStyle(() => ({ opacity: 0.1 + p.value * 0.26 }));
  const blue = useAnimatedStyle(() => ({ opacity: 0.36 - p.value * 0.26 }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, red]}>
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="tcRed" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={palette.engineRed} stopOpacity={0.75} />
              <Stop offset="1" stopColor={palette.engineRed} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={62} height={100} fill="url(#tcRed)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, blue]}>
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="tcBlue" x1="1" y1="0" x2="0" y2="0">
              <Stop offset="0" stopColor="#3E6BE0" stopOpacity={0.75} />
              <Stop offset="1" stopColor="#3E6BE0" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={38} y={0} width={62} height={100} fill="url(#tcBlue)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Mini-map                                                             */
/* ------------------------------------------------------------------ */

const MAP_W = 244;
const MAP_H = 84;
const ROUTE_X0 = 30;
const ROUTE_X1 = 210;

function MiniMap({ progress, from, to }: { progress: SharedValue<number>; from: LocationId; to: LocationId }) {
  const fill = useAnimatedStyle(() => ({ width: (ROUTE_X1 - ROUTE_X0) * Math.min(1, progress.value) }));
  const pin = useAnimatedStyle(() => ({
    transform: [{ translateX: (ROUTE_X1 - ROUTE_X0) * Math.min(1, progress.value) }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(240)} style={[styles.map, shadows.card]}>
      <Svg width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={MAP_W} height={MAP_H} rx={18} fill="#DCEFCB" />
        <Rect x={0} y={30} width={MAP_W} height={22} fill="#CBD2E4" />
        <Rect x={92} y={0} width={18} height={MAP_H} fill="#CBD2E4" />
        <Rect x={170} y={0} width={14} height={MAP_H} fill="#CBD2E4" />
        <Circle cx={54} cy={16} r={8} fill="#6FC470" />
        <Circle cx={140} cy={70} r={9} fill="#6FC470" />
        <Circle cx={214} cy={20} r={7} fill="#6FC470" />
        {/* dotted route */}
        <Path
          d={`M ${ROUTE_X0} 42 H ${ROUTE_X1}`}
          stroke={palette.slateLight}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray="2 12"
        />
      </Svg>
      <View style={styles.routeTrack} />
      <Animated.View style={[styles.routeFill, fill]} />
      <View style={[styles.mapPin, { left: ROUTE_X0 - 9, backgroundColor: palette.engineRed }]} />
      <View style={[styles.mapPin, { left: ROUTE_X1 - 9, backgroundColor: palette.leafGreen }]} />
      <Animated.View style={[styles.mapTruck, pin]}>
        {/* rule #5: no emoji in the world layer — this is the drawn engine */}
        <Svg width={18} height={12} viewBox="0 0 30 20">
          <Rect x={1} y={5} width={28} height={10} rx={4} fill={palette.engineRed} />
          <Rect x={1} y={5} width={28} height={3.4} rx={1.7} fill="rgba(255,255,255,0.32)" />
          <Rect x={17} y={2} width={9} height={5} rx={2} fill={palette.engineRedDark} />
          <Rect x={3} y={11} width={24} height={2.6} fill={palette.safetyYellow} />
          <Circle cx={8} cy={16} r={2.6} fill={palette.charcoalDark} />
          <Circle cx={22} cy={16} r={2.6} fill={palette.charcoalDark} />
        </Svg>
      </Animated.View>
      <View style={styles.mapLabels}>
        <Text variant="tiny" color={palette.navyMuted} numberOfLines={1}>
          {locationName(from)}
        </Text>
        <Text variant="tiny" color={palette.navy} numberOfLines={1}>
          {locationName(to)}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* The cinematic                                                        */
/* ------------------------------------------------------------------ */

export interface TravelCinematicProps {
  from: LocationId;
  to: LocationId;
  onDone: () => void;
  /** override the duration (ms) — mostly for tests */
  durationMs?: number;
}

export function TravelCinematic({ from, to, onDone, durationMs }: TravelCinematicProps) {
  const { height, width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const truck = useGame((s) => s.station.truck);
  const total = durationMs ?? (reduced ? REDUCED_MS : FULL_MS);

  const [arrived, setArrived] = useState(false);
  const finished = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const progress = useSharedValue(0);
  const scroll = useSharedValue(0);
  const bounce = useSharedValue(0);
  const truckIn = useSharedValue(-0.55);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    sfx.stopLoop('engine');
    onDone();
  }, [onDone]);

  /** Skip to the arrival sticker. */
  const arriveNow = useCallback(() => {
    if (arrived || finished.current) return;
    setArrived(true);
    haptics.success();
    sfx.play('success');
    progress.value = withTiming(1, { duration: 200 });
    const t = setTimeout(finish, 900);
    timers.current.push(t);
  }, [arrived, finish, progress]);

  useEffect(() => {
    sfx.startLoop('engine', 0.55);
    const siren = setTimeout(() => sfx.play('siren', { volume: 0.85 }), 220);
    timers.current.push(siren);

    progress.value = withTiming(1, { duration: total, easing: Easing.inOut(Easing.quad) });
    truckIn.value = withSpring(0, springs.gentle);

    if (!reduced) {
      scroll.value = withTiming(1, { duration: total, easing: Easing.inOut(Easing.quad) });
      bounce.value = withRepeat(withSequence(withTiming(-4, { duration: 190 }), withTiming(2, { duration: 190 })), -1, true);
    } else {
      scroll.value = withTiming(0.35, { duration: total, easing: Easing.linear });
    }

    const arrive = setTimeout(arriveNow, total);
    timers.current.push(arrive);

    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      cancelAnimation(progress);
      cancelAnimation(scroll);
      cancelAnimation(bounce);
      sfx.stopLoop('engine');
    };
    // one-shot on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const truckStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: truckIn.value * width }, { translateY: bounce.value }],
  }));

  const truckWidth = Math.min(240, Math.max(160, width * 0.5));
  /* the town is sized to the screen so the sky never opens up as a bald blue
     slab: on a tall phone the block grows, on a short one it stays clear of
     the mini-map */
  const townH = Math.max(210, Math.min(360, height * 0.42));
  const horizon = 96 + townH * 0.52;
  const skyBand = Math.max(120, Math.min(230, height * 0.26));

  return (
    <Pressable style={styles.root} onPress={arriveNow} accessibilityRole="button" accessibilityLabel="Skip the drive">
      <View style={styles.sky}>{SkyWash}</View>
      {/* The sun sits still while everything else scrolls past it — it is
          90-odd million miles away, so parallaxing it would be the one thing in
          the frame that reads as wrong. Its own square node, because stretched
          along with the sky band it came out an egg. */}
      <View style={[styles.sun, { top: skyBand * 0.12 }]} pointerEvents="none">
        <SunDisc size={Math.round(Math.min(width, height) * 0.34)} />
      </View>
      <ScrollLayer progress={scroll} speed={LAYER_SPEED.sky} height={skyBand} bottom={horizon + 40} fieldW={width}>
        {SkyDrift}
      </ScrollLayer>
      <ScrollLayer progress={scroll} speed={LAYER_SPEED.far} height={150} bottom={horizon} fieldW={width}>
        {FarHills}
      </ScrollLayer>
      <ScrollLayer progress={scroll} speed={LAYER_SPEED.mid} height={townH} bottom={96} fieldW={width}>
        {MidTown}
      </ScrollLayer>
      <ScrollLayer progress={scroll} speed={LAYER_SPEED.props} height={124} bottom={78} fieldW={width}>
        {Roadside}
      </ScrollLayer>
      <ScrollLayer progress={scroll} speed={LAYER_SPEED.road} height={96} bottom={0} fieldW={width}>
        {RoadStrip}
      </ScrollLayer>

      {/* the siren washes the street red and blue as the engine rolls */}
      <SirenWash />

      <Animated.View style={[styles.truck, truckStyle]} pointerEvents="none">
        <FireTruck truck={truck} width={truckWidth} driving={!reduced} lightsOn />
      </Animated.View>

      <View style={styles.mapWrap} pointerEvents="none">
        <MiniMap progress={progress} from={from} to={to} />
      </View>

      {arrived ? (
        <View style={styles.stickerWrap} pointerEvents="none">
          {/* the zoom-in and the jaunty tilt need separate nodes, or the layout
              animation overwrites the transform (and Reanimated says so) */}
          <Animated.View entering={ZoomIn.springify().damping(9)}>
            <View style={[styles.sticker, shadows.card]}>
              <Text variant="display" color={palette.white} center>
                We&apos;re here!
              </Text>
              <Text variant="bodyStrong" color={palette.white} center>
                {locationName(to)}
              </Text>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  sky: { ...StyleSheet.absoluteFill, backgroundColor: palette.skyMid, overflow: 'hidden' },
  sun: { position: 'absolute', right: '8%' },
  layer: { position: 'absolute', left: 0, flexDirection: 'row' },
  truck: { position: 'absolute', left: '10%', bottom: 46 },
  mapWrap: { position: 'absolute', top: spacing.xxl + spacing.lg, left: 0, right: 0, alignItems: 'center' },
  map: {
    width: MAP_W,
    height: MAP_H,
    borderRadius: 18,
    backgroundColor: '#DCEFCB',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: palette.white,
  },
  routeTrack: {
    position: 'absolute',
    left: ROUTE_X0,
    top: 38,
    width: ROUTE_X1 - ROUTE_X0,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(31,42,90,0.10)',
  },
  routeFill: { position: 'absolute', left: ROUTE_X0, top: 38, height: 8, borderRadius: 4, backgroundColor: palette.engineRed },
  mapPin: { position: 'absolute', top: 34, width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: palette.white },
  mapTruck: {
    position: 'absolute',
    left: ROUTE_X0 - 8,
    top: 22,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLabels: { position: 'absolute', left: 10, right: 10, bottom: 4, flexDirection: 'row', justifyContent: 'space-between' },
  washRed: { position: 'absolute', left: 0, right: '46%', top: 0, bottom: 0, backgroundColor: palette.engineRed },
  washBlue: { position: 'absolute', left: '46%', right: 0, top: 0, bottom: 0, backgroundColor: '#3E6BE0' },
  stickerWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  sticker: {
    backgroundColor: palette.engineRed,
    borderRadius: radii.panel,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 6,
    borderColor: palette.white,
    transform: [{ rotate: '-6deg' }],
  },
});
