/**
 * TRAINING YARD — the obstacle course behind the firehouse.
 *
 * Far to near: drifting clouds, the hazy town, then the grass field with its
 * chalk lanes. On the left the practice tower with its slide and a waving
 * flag; on the right the climbing net and the hose-target board; the water
 * barrel and a slalom of cones on the grass; bunting strung across the sky;
 * Pepper keeping an eye on the barrel. One ground plane with a soft lip, a
 * navy contact ellipse under everything that stands, no outlines, no emoji.
 */
import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { usePulse } from '@/hooks';
import { Pepper } from '@/characters/Pepper';
import { Birds, Clouds, Flag, SkyHaze, TownSkyline } from '@/world';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '@/world/tone';

const FLAG_COLORS = [palette.engineRed, palette.safetyYellow, palette.waterCyan, palette.leafGreen, palette.pink] as const;
const GRASS = { far: palette.grassDark, field: palette.grass, lip: '#A8DE86', chalk: palette.white } as const;

export interface YardLayout {
  w: number;
  h: number;
  /** the horizon — where the grass starts */
  gy: number;
  buntingY: number;
  tower: { x: number; peakY: number };
  target: { x: number };
  net: { x0: number; x1: number };
  barrel: { x: number };
  pepper: { x: number };
}

/** Where the course furniture stands, for the given screen. */
export function yardLayout(width: number, height: number): YardLayout {
  const w = Math.max(320, width);
  const h = Math.max(560, height);
  const gy = Math.round(Math.max(280, Math.min(h * 0.36, 330)));
  return {
    w,
    h,
    gy,
    buntingY: 148,
    tower: { x: 14, peakY: gy - 224 },
    target: { x: w - 38 },
    net: { x0: w - 122, x1: w - 72 },
    barrel: { x: Math.round(w * 0.55) },
    pepper: { x: w - 74 },
  };
}

const shadow = (cx: number, cy: number, rx: number) => <Ellipse cx={cx} cy={cy} rx={rx} ry={shadowRy(rx)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />;

function Cone({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G>
      {shadow(x, y + 2, 13 * s)}
      <Path d={`M ${x} ${y - 32 * s} q ${6 * s} ${15 * s} ${12 * s} ${30 * s} h ${-24 * s} q ${6 * s} ${-15 * s} ${12 * s} ${-30 * s} z`} fill={palette.orange} />
      <Path d={`M ${x} ${y - 32 * s} q ${6 * s} ${15 * s} ${12 * s} ${30 * s} h ${-12 * s} z`} fill={SHADE} />
      <Rect x={x - 7 * s} y={y - 18 * s} width={14 * s} height={6 * s} fill={palette.white} opacity={0.92} />
      <Rect x={x - 15 * s} y={y - 4 * s} width={30 * s} height={6 * s} rx={3 * s} fill={palette.orangeDark} />
      <Path d={`M ${x - 3 * s} ${y - 29 * s} l ${-4 * s} ${20 * s} h ${3 * s} z`} fill={HIGHLIGHT} />
    </G>
  );
}

const YardArt = memo(function YardArt({ L }: { L: YardLayout }) {
  const { w, h, gy } = L;
  const tx = L.tower.x;
  const hedge: React.ReactElement[] = [];
  for (let x = -20; x < w + 40; x += 46) {
    hedge.push(<Ellipse key={x} cx={x} cy={gy + 4} rx={30} ry={13} fill={GRASS.far} />);
  }
  const netLines: React.ReactElement[] = [];
  for (let x = L.net.x0 + 8; x < L.net.x1; x += 10) netLines.push(<Rect key={`v${x}`} x={x - 1} y={gy - 100} width={2} height={96} fill={palette.creamDeep} />);
  for (let y = gy - 98; y < gy - 2; y += 14) netLines.push(<Rect key={`h${y}`} x={L.net.x0 + 2} y={y - 1} width={L.net.x1 - L.net.x0 - 4} height={2} fill={palette.creamDeep} />);

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} pointerEvents="none">
      {/* ── the field: far hedge, the lip, the grass ─────────────────── */}
      {hedge}
      <Path d={`M 0 ${gy + 12} Q ${w / 2} ${gy - 2} ${w} ${gy + 12} L ${w} ${h} L 0 ${h} Z`} fill={GRASS.field} />
      <Path d={`M 0 ${gy + 12} Q ${w / 2} ${gy - 2} ${w} ${gy + 12} L ${w} ${gy + 22} Q ${w / 2} ${gy + 8} 0 ${gy + 22} Z`} fill={GRASS.lip} />
      {/* chalk lanes */}
      <G opacity={0.55}>
        <Path d={`M ${w * 0.06} ${gy + 44} H ${w * 0.94}`} stroke={GRASS.chalk} strokeWidth={4} strokeLinecap="round" strokeDasharray="24 18" />
        <Path d={`M ${w * 0.1} ${gy + 96} H ${w * 0.9}`} stroke={GRASS.chalk} strokeWidth={4} strokeLinecap="round" strokeDasharray="18 16" />
        <Ellipse cx={w * 0.5} cy={gy + 170} rx={w * 0.26} ry={30} fill="none" stroke={GRASS.chalk} strokeWidth={4} strokeDasharray="14 14" />
        <Path d={`M ${w * 0.5 - 22} ${gy + 250} h 44 M ${w * 0.5} ${gy + 236} v 28`} stroke={GRASS.chalk} strokeWidth={4} strokeLinecap="round" />
      </G>

      {/* ── tower with slide (left) ──────────────────────────────────── */}
      <G>
        {shadow(tx + 32, gy + 4, 46)}
        {/* legs + braces */}
        <Rect x={tx + 6} y={gy - 120} width={9} height={120} rx={3} fill={palette.woodDark} />
        <Rect x={tx + 46} y={gy - 120} width={9} height={120} rx={3} fill={palette.woodDark} />
        <Path d={`M ${tx + 10} ${gy - 100} L ${tx + 51} ${gy - 40} M ${tx + 51} ${gy - 100} L ${tx + 10} ${gy - 40}`} stroke={palette.wood} strokeWidth={5} strokeLinecap="round" />
        {/* deck */}
        <Rect x={tx - 6} y={gy - 128} width={74} height={11} rx={3.5} fill={palette.wood} />
        <Rect x={tx - 6} y={gy - 121} width={74} height={4} fill={SHADE} />
        <Rect x={tx - 6} y={gy - 128} width={74} height={3} rx={1.5} fill={HIGHLIGHT} />
        {/* cabin */}
        <Rect x={tx + 2} y={gy - 190} width={58} height={62} rx={4} fill={palette.tan} />
        <Rect x={tx + 48} y={gy - 190} width={12} height={62} rx={4} fill={SHADE} />
        <Rect x={tx + 4} y={gy - 186} width={4} height={54} rx={2} fill={HIGHLIGHT} />
        <Rect x={tx + 18} y={gy - 176} width={26} height={22} rx={5} fill="#33477A" />
        <Rect x={tx + 21} y={gy - 173} width={8} height={16} rx={3} fill={HIGHLIGHT} />
        <Rect x={tx + 14} y={gy - 178} width={34} height={5} rx={2.5} fill={palette.creamDeep} />
        {/* roof */}
        <Path d={`M ${tx - 12} ${gy - 187} L ${tx + 31} ${L.tower.peakY} L ${tx + 74} ${gy - 187} Z`} fill={palette.engineRed} />
        <Path d={`M ${tx + 31} ${L.tower.peakY} L ${tx + 74} ${gy - 187} L ${tx + 60} ${gy - 187} L ${tx + 31} ${L.tower.peakY + 10} Z`} fill={SHADE} />
        <Rect x={tx - 14} y={gy - 190} width={90} height={7} rx={3.5} fill={palette.engineRedDark} />
        {/* ladder up the left side */}
        <Rect x={tx - 12} y={gy - 124} width={5} height={124} rx={2.5} fill={palette.slateLight} />
        <Rect x={tx - 1} y={gy - 124} width={5} height={124} rx={2.5} fill={palette.slateLight} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Rect key={i} x={tx - 12} y={gy - 110 + i * 16} width={16} height={4} rx={2} fill={palette.slate} />
        ))}
        {/* the slide */}
        <Path d={`M ${tx + 66} ${gy - 118} C ${tx + 100} ${gy - 100} ${tx + 118} ${gy - 60} ${tx + 148} ${gy - 8}`} stroke={palette.goldDark} strokeWidth={18} strokeLinecap="round" fill="none" />
        <Path d={`M ${tx + 66} ${gy - 121} C ${tx + 100} ${gy - 103} ${tx + 118} ${gy - 63} ${tx + 148} ${gy - 11}`} stroke={palette.safetyYellow} strokeWidth={14} strokeLinecap="round" fill="none" />
        <Path d={`M ${tx + 70} ${gy - 124} C ${tx + 100} ${gy - 108} ${tx + 114} ${gy - 78} ${tx + 130} ${gy - 44}`} stroke={HIGHLIGHT} strokeWidth={4} strokeLinecap="round" fill="none" />
        {/* landing mat */}
        {shadow(tx + 152, gy + 4, 26)}
        <Rect x={tx + 128} y={gy - 8} width={48} height={11} rx={5.5} fill={palette.waterCyanDark} />
        <Rect x={tx + 128} y={gy - 9} width={48} height={8} rx={4} fill={palette.waterCyan} />
      </G>

      {/* ── coiled hose and a hydrant by the tower ───────────────────── */}
      <G>
        {shadow(tx + 100, gy + 40, 24)}
        <Circle cx={tx + 100} cy={gy + 30} r={22} fill={palette.safetyYellow} />
        <Circle cx={tx + 100} cy={gy + 30} r={14} fill={palette.gold} />
        <Circle cx={tx + 100} cy={gy + 30} r={6} fill={GRASS.field} />
        <Path d={`M ${tx + 84} ${gy + 20} a 20 20 0 0 1 16 -8`} stroke={HIGHLIGHT} strokeWidth={4} fill="none" strokeLinecap="round" />
        {shadow(tx + 34, gy + 30, 12)}
        <Rect x={tx + 26} y={gy + 2} width={16} height={26} rx={5} fill={palette.engineRed} />
        <Rect x={tx + 22} y={gy + 8} width={24} height={6} rx={3} fill={palette.engineRedDark} />
        <Rect x={tx + 28} y={gy - 4} width={12} height={8} rx={4} fill={palette.engineRedDark} />
        <Rect x={tx + 28} y={gy + 6} width={3} height={14} rx={1.5} fill={HIGHLIGHT} />
      </G>

      {/* ── cone slalom across the field ─────────────────────────────── */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Cone key={i} x={w * (0.28 + i * 0.11)} y={gy + 40 + i * 22 + (i % 2) * 8} s={0.9 + i * 0.06} />
      ))}

      {/* ── water barrel ─────────────────────────────────────────────── */}
      <G>
        {shadow(L.barrel.x, gy + 28, 18)}
        <Rect x={L.barrel.x - 15} y={gy - 12} width={30} height={38} rx={6} fill={palette.waterCyanDark} />
        <Rect x={L.barrel.x - 15} y={gy - 12} width={20} height={38} rx={6} fill={palette.waterCyan} />
        <Rect x={L.barrel.x - 17} y={gy - 4} width={34} height={5} rx={2.5} fill={palette.navySoft} />
        <Rect x={L.barrel.x - 17} y={gy + 14} width={34} height={5} rx={2.5} fill={palette.navySoft} />
        <Ellipse cx={L.barrel.x} cy={gy - 12} rx={15} ry={4.5} fill={palette.waterCyanLight} />
        <Ellipse cx={L.barrel.x} cy={gy - 12} rx={10} ry={2.6} fill={palette.waterCyan} />
        <Rect x={L.barrel.x - 11} y={gy - 2} width={3} height={22} rx={1.5} fill={HIGHLIGHT} />
        {/* a couple of drops on the rim */}
        <Path d={`M ${L.barrel.x + 19} ${gy - 20} c 3 4 3 7 0 9 c -3 -2 -3 -5 0 -9 z`} fill={palette.waterCyan} />
        <Path d={`M ${L.barrel.x - 22} ${gy - 26} c 2.4 3 2.4 5.6 0 7.4 c -2.4 -1.8 -2.4 -4.4 0 -7.4 z`} fill={palette.waterCyan} />
      </G>

      {/* ── climbing net (right) ─────────────────────────────────────── */}
      <G>
        {shadow(L.net.x0, gy + 3, 14)}
        {shadow(L.net.x1, gy + 3, 14)}
        {netLines}
        <Rect x={L.net.x0 - 5} y={gy - 110} width={10} height={110} rx={4} fill={palette.woodDark} />
        <Rect x={L.net.x1 - 5} y={gy - 110} width={10} height={110} rx={4} fill={palette.woodDark} />
        <Rect x={L.net.x0 - 3} y={gy - 106} width={3} height={100} rx={1.5} fill={HIGHLIGHT} />
        <Rect x={L.net.x1 - 3} y={gy - 106} width={3} height={100} rx={1.5} fill={HIGHLIGHT} />
        <Rect x={L.net.x0 - 8} y={gy - 114} width={L.net.x1 - L.net.x0 + 16} height={8} rx={4} fill={palette.wood} />
      </G>

      {/* ── hose-target board (far right) ────────────────────────────── */}
      <G>
        {shadow(L.target.x, gy + 4, 18)}
        <Rect x={L.target.x - 5} y={gy - 150} width={10} height={150} rx={4} fill={palette.navySoft} />
        <Rect x={L.target.x - 3} y={gy - 146} width={3} height={140} rx={1.5} fill={HIGHLIGHT} />
        <Circle cx={L.target.x} cy={gy - 178} r={34} fill={SHADE} transform="translate(2 3)" />
        <Circle cx={L.target.x} cy={gy - 178} r={34} fill={palette.white} />
        <Circle cx={L.target.x} cy={gy - 178} r={25} fill={palette.engineRed} />
        <Circle cx={L.target.x} cy={gy - 178} r={15} fill={palette.white} />
        <Circle cx={L.target.x} cy={gy - 178} r={7} fill={palette.engineRed} />
        <Path d={`M ${L.target.x - 22} ${gy - 196} a 30 30 0 0 1 16 -12`} stroke={HIGHLIGHT} strokeWidth={5} strokeLinecap="round" fill="none" />
        {/* splash marks from the last practice */}
        <Circle cx={L.target.x - 12} cy={gy - 168} r={3.5} fill={palette.waterCyan} />
        <Circle cx={L.target.x + 9} cy={gy - 190} r={2.6} fill={palette.waterCyan} />
        <Path d={`M ${L.target.x + 4} ${gy - 136} c 3 4 3 7 0 9 c -3 -2 -3 -5 0 -9 z`} fill={palette.waterCyan} />
      </G>
    </Svg>
  );
});

/** Pennants across the sky, swaying gently as a whole. */
const BuntingArt = memo(function BuntingArt({ w }: { w: number }) {
  const sag = 22;
  const y = (t: number) => 6 + 4 * sag * t * (1 - t);
  const n = Math.max(7, Math.round(w / 44));
  const flags: React.ReactElement[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = (i + 0.5) / n;
    const x = t * w;
    const top = y(t);
    const c = FLAG_COLORS[i % FLAG_COLORS.length] ?? palette.engineRed;
    flags.push(
      <G key={i}>
        <Path d={`M ${x - 11} ${top} L ${x + 11} ${top} L ${x} ${top + 20} Z`} fill={c} />
        <Path d={`M ${x} ${top} L ${x + 11} ${top} L ${x} ${top + 20} Z`} fill={SHADE} />
        <Path d={`M ${x - 8} ${top + 2} L ${x - 3} ${top + 2} L ${x - 2} ${top + 8} Z`} fill={HIGHLIGHT} />
      </G>,
    );
  }
  return (
    <Svg width={w} height={56} viewBox={`0 0 ${w} 56`} pointerEvents="none">
      <Path d={`M 0 6 Q ${w / 2} ${6 + 2 * sag} ${w} 6`} stroke={palette.woodDark} strokeWidth={2.4} fill="none" />
      {flags}
    </Svg>
  );
});

function Bunting({ w, top }: { w: number; top: number }) {
  const sway = usePulse(3600, 0.5);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -28 }, { rotate: `${(sway.value - 0.5) * 1.4}deg` }, { translateY: 28 }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.bunting, { top }, style]}>
      <BuntingArt w={w} />
    </Animated.View>
  );
}

export function TrainingBackdrop() {
  const { width, height } = useWindowDimensions();
  const L = yardLayout(width, height);
  const flagW = 30;
  const flagH = 26 + flagW * 0.66;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Clouds count={3} top={16} height={140} />
      <SkyHaze bottom={L.h - L.gy + 6} height={84} />
      <TownSkyline bottom={L.h - L.gy - 2} height={104} opacity={0.72} />
      <Birds count={1} top={64} periodMs={22000} />
      <View style={StyleSheet.absoluteFill}>
        <YardArt L={L} />
      </View>
      <Bunting w={L.w} top={L.buntingY} />
      {/* the flag on the tower peak */}
      <View style={[styles.abs, { left: L.tower.x + 29, top: L.tower.peakY - flagH + 4 }]}>
        <Flag width={flagW} poleHeight={26} />
      </View>
      {/* Pepper, minding the yard */}
      <View style={[styles.abs, { left: L.pepper.x, top: L.gy - 62 }]}>
        <Pepper size={66} emotion="happy" wag bobPhase={1.7} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bunting: { position: 'absolute', left: 0, right: 0, height: 56 },
  abs: { position: 'absolute' },
});
