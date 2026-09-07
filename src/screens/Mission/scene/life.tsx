/**
 * AMBIENT LIFE — one drifting element and one swaying element per scene
 * (consistency rule #9), both reduced-motion aware: `useLoop` and `useIdleBob`
 * park themselves when the child asked for less motion, so the ornament is
 * still *drawn*, it simply stops moving.
 *
 * The swaying ornament is authored once, with its pivot at the top centre of
 * its own little box, and used twice: pinned into the static SVG on a dispatch
 * slip (where ten animated cards would be a waste), and hung from an
 * `Animated.View` in the full-size scene.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { useIdleBob, useLoop } from '@/hooks';
import type { SceneFrame } from './frame';
import type { SceneDef, SwayKind } from './types';
import { HIGHLIGHT, SHADE } from './parts';

/** Each ornament's own box. The pivot is at (w / 2, 0). */
const ORNAMENT: Record<SwayKind, { w: number; h: number }> = {
  sign: { w: 38, h: 42 },
  slice: { w: 38, h: 42 },
  cage: { w: 34, h: 42 },
  banner: { w: 44, h: 48 },
  scale: { w: 42, h: 36 },
  flag: { w: 50, h: 30 },
  laundry: { w: 68, h: 36 },
  bell: { w: 32, h: 38 },
  lantern: { w: 28, h: 36 },
  kite: { w: 40, h: 56 },
};

/** The ornament art, drawn inside its box with the pivot at the top centre. */
function ornamentArt(kind: SwayKind): React.JSX.Element {
  const { w } = ORNAMENT[kind];
  const c = w / 2;
  switch (kind) {
    case 'sign':
      return (
        <G>
          <Path d={`M ${c} 0 v 8`} stroke={palette.charcoal} strokeWidth={2.6} strokeLinecap="round" />
          <Rect x={c - 15} y={8} width={30} height={24} rx={7} fill={palette.creamDeep} />
          <Rect x={c - 15} y={8} width={30} height={3.4} rx={1.7} fill={HIGHLIGHT} />
          <Rect x={c - 15} y={28} width={30} height={4} rx={2} fill={SHADE} />
          <Path d={`M ${c - 9} 21 q 9 -10 18 0 q -9 5 -18 0 z`} fill="#D6A05A" />
        </G>
      );
    case 'slice':
      return (
        <G>
          <Path d={`M ${c} 0 v 8`} stroke={palette.charcoal} strokeWidth={2.6} strokeLinecap="round" />
          <Rect x={c - 16} y={8} width={32} height={26} rx={7} fill={palette.cream} />
          <Rect x={c - 16} y={8} width={32} height={3.4} rx={1.7} fill={HIGHLIGHT} />
          <Path d={`M ${c} 13 L ${c + 9} 30 L ${c - 9} 30 Z`} fill="#F7C86A" />
          <Path d={`M ${c} 17 L ${c + 6} 29 L ${c - 6} 29 Z`} fill="#E9584A" />
          <Circle cx={c - 2} cy={25} r={1.8} fill="#B92B22" />
        </G>
      );
    case 'cage':
      return (
        <G>
          <Path d={`M ${c} 0 q -5 5 0 8 q 5 -3 0 -8 z`} fill={palette.charcoal} />
          <Rect x={c - 11} y={8} width={22} height={26} rx={9} fill={palette.creamDeep} />
          <Path d={`M ${c - 7} 10 v 22 M ${c - 2} 10 v 22 M ${c + 3} 10 v 22 M ${c + 8} 10 v 22`} stroke={palette.charcoal} strokeWidth={1.6} opacity={0.5} />
          <Circle cx={c} cy={22} r={5} fill={palette.safetyYellow} />
          <Circle cx={c + 2} cy={20.4} r={1} fill={palette.navy} />
          <Rect x={c - 13} y={32} width={26} height={5} rx={2.5} fill={palette.charcoal} />
        </G>
      );
    case 'banner':
      return (
        <G>
          <Path d={`M ${c - 16} 2 h 32`} stroke={palette.charcoal} strokeWidth={2.4} strokeLinecap="round" />
          <Path d={`M ${c - 14} 3 h 28 v 32 l -14 -8 l -14 8 z`} fill={palette.engineRed} />
          <Path d={`M ${c - 14} 3 h 28 v 4 h -28 z`} fill={HIGHLIGHT} />
          <Circle cx={c} cy={17} r={6} fill={palette.cream} />
        </G>
      );
    case 'scale':
      return (
        <G>
          <Path d={`M ${c} 0 v 8 M ${c - 12} 8 h 24`} stroke={palette.charcoal} strokeWidth={2.4} strokeLinecap="round" />
          <Circle cx={c} cy={20} r={9} fill={palette.creamDeep} />
          <Path d={`M ${c} 20 v -6 M ${c} 20 l 4 3`} stroke={palette.navy} strokeWidth={2} strokeLinecap="round" />
          <Path d={`M ${c - 12} 8 l -4 8 h 8 z M ${c + 12} 8 l 4 8 h -8 z`} fill={palette.slateLight} />
        </G>
      );
    case 'flag':
      return (
        <G>
          <Path d={`M ${c} 1 q 12 4 24 0 q 0 10 0 16 q -12 4 -24 0 z`} fill={palette.engineRed} />
          <Path d={`M ${c} 1 q 12 4 24 0 q 0 4 0 5 q -12 4 -24 0 z`} fill={HIGHLIGHT} />
          <Path d={`M ${c + 4} 6 q 8 3 16 0 q 0 3 0 4 q -8 3 -16 0 z`} fill={palette.cream} opacity={0.9} />
        </G>
      );
    case 'laundry':
      return (
        <G>
          <Path d={`M 2 2 Q ${c} 14 ${ORNAMENT.laundry.w - 2} 2`} stroke={palette.navySoft} strokeWidth={1.8} fill="none" opacity={0.55} />
          <Path d={`M 14 7 l 10 -2 l 3 5 l -3 2 l 0 12 l -10 0 l 0 -12 l -3 -2 z`} fill={palette.waterCyanLight} />
          <Path d={`M 38 9 l 10 -2 l 3 5 l -3 2 l 0 12 l -10 0 l 0 -12 l -3 -2 z`} fill={palette.pinkSoft} />
          <Rect x={17} y={5} width={3} height={4} rx={1.5} fill={palette.woodDark} />
          <Rect x={41} y={7} width={3} height={4} rx={1.5} fill={palette.woodDark} />
        </G>
      );
    case 'bell':
    case 'lantern':
      return (
        <G>
          <Path d={`M ${c} 0 v 6`} stroke={palette.charcoal} strokeWidth={2.4} strokeLinecap="round" />
          <Path d={`M ${c - 8} 8 h 16 l 2 4 h -20 z`} fill={palette.charcoal} />
          <Path d={`M ${c - 9} 12 h 18 l -2 16 h -14 z`} fill="#FFE9A8" />
          <Path d={`M ${c - 7} 13 h 5 l -1.4 14 h -4 z`} fill={palette.white} opacity={0.5} />
          <Path d={`M ${c - 10} 28 h 20 l -2 4 h -16 z`} fill={palette.charcoal} />
        </G>
      );
    case 'kite':
    default:
      return (
        <G>
          <Path d={`M ${c} 0 L ${c + 12} 16 L ${c} 34 L ${c - 12} 16 Z`} fill={palette.engineRed} />
          <Path d={`M ${c} 0 L ${c + 12} 16 L ${c} 16 Z`} fill={HIGHLIGHT} />
          <Path d={`M ${c} 34 q -6 8 0 14 q 6 -6 0 -14`} stroke={palette.safetyYellow} strokeWidth={2.4} fill="none" />
        </G>
      );
  }
}

/** The ornament pinned into the static SVG — used by the thumbnails. */
export function StaticSway({ f, def }: { f: SceneFrame; def: SceneDef }) {
  const box = ORNAMENT[def.sway.kind];
  return (
    <G x={f.tx(def.sway.x) - (box.w / 2) * f.k} y={f.ty(def.sway.y)} scale={f.k}>
      {ornamentArt(def.sway.kind)}
    </G>
  );
}

/** A cloud drifting the whole width of the frame. */
function DriftCloud({ w, y, size, periodMs }: { w: number; y: number; size: number; periodMs: number }) {
  const t = useLoop(periodMs);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -size + t.value * (w + size * 2) }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.layer, { top: y }, style]}>
      <Svg width={size} height={size * 0.5}>
        <Ellipse cx={size * 0.36} cy={size * 0.3} rx={size * 0.3} ry={size * 0.2} fill={palette.white} opacity={0.85} />
        <Ellipse cx={size * 0.6} cy={size * 0.26} rx={size * 0.24} ry={size * 0.17} fill={palette.white} opacity={0.85} />
        <Ellipse cx={size * 0.48} cy={size * 0.36} rx={size * 0.36} ry={size * 0.15} fill={palette.white} opacity={0.8} />
      </Svg>
    </Animated.View>
  );
}

/** Two gulls crossing the frame, well above the rooflines. */
function DriftBirds({ w, y, s, periodMs }: { w: number; y: number; s: number; periodMs: number }) {
  const t = useLoop(periodMs);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -60 * s + t.value * (w + 120 * s) }, { translateY: Math.sin(t.value * Math.PI * 2) * 10 * s }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.layer, { top: y }, style]}>
      <Svg width={60 * s} height={26 * s}>
        <Path
          d={`M ${5 * s} ${13 * s} q ${7 * s} ${-8 * s} ${13 * s} 0 q ${6 * s} ${-8 * s} ${13 * s} 0`}
          stroke={palette.navySoft}
          strokeWidth={2.6 * s}
          fill="none"
          strokeLinecap="round"
          opacity={0.5}
        />
        <Path
          d={`M ${33 * s} ${20 * s} q ${5 * s} ${-6 * s} ${10 * s} 0 q ${5 * s} ${-6 * s} ${10 * s} 0`}
          stroke={palette.navySoft}
          strokeWidth={2.2 * s}
          fill="none"
          strokeLinecap="round"
          opacity={0.38}
        />
      </Svg>
    </Animated.View>
  );
}

/** The hanging ornament, swaying from its top edge. */
function Sway({ x, y, w, h, kind, deg, periodMs }: { x: number; y: number; w: number; h: number; kind: SwayKind; deg: number; periodMs: number }) {
  const t = useIdleBob(deg, periodMs);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.value}deg` }] }));
  const box = ORNAMENT[kind];
  return (
    <Animated.View pointerEvents="none" style={[styles.layer, { left: x, top: y, width: w, height: h, transformOrigin: 'top center' }, style]}>
      <Svg width={w} height={h} viewBox={`0 0 ${box.w} ${box.h}`}>
        {ornamentArt(kind)}
      </Svg>
    </Animated.View>
  );
}

/** Everything that moves in a scene. Mounted only on the full-size hero. */
export function SceneLife({ f, def }: { f: SceneFrame; def: SceneDef }) {
  const box = ORNAMENT[def.sway.kind];
  const w = box.w * f.k;
  const h = box.h * f.k;
  const skyRoom = Math.max(0, f.oy);
  return (
    <>
      <DriftCloud w={f.w} y={Math.max(2, skyRoom * 0.16)} size={Math.max(70, 130 * f.s)} periodMs={52000} />
      {skyRoom > 70 * f.s ? <DriftBirds w={f.w} y={Math.max(6, skyRoom * 0.52)} s={Math.max(0.6, f.s)} periodMs={27000} /> : null}
      <Sway x={f.tx(def.sway.x) - w / 2} y={f.ty(def.sway.y)} w={w} h={h} kind={def.sway.kind} deg={1.9} periodMs={4200} />
    </>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute' },
});
