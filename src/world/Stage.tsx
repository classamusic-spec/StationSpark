/**
 * STAGE — the shared backdrop every scene and mini-game stands on
 * (art critique items #1 and #11): far haze band → mid silhouette band → a
 * dressed near ground plane with a soft top edge.
 *
 * The composition rule for every variant: **dress the perimeter, keep the
 * centre calm.** Signage, bunting and skyline live in the top band; kerbs,
 * props, plants and characters live in the bottom band; the middle stays quiet
 * so the play area reads cleanly on top of it.
 *
 * House rules obeyed here: no outlines, three tones per object (base → navy
 * 14 % shade → white 32 % highlight), a navy contact ellipse under everything
 * that touches the ground, radii from `@/theme`, no emoji, ≤ 5 hues plus
 * neutrals per composition, one ground plane with a soft lip, 2.5D buildings,
 * and at least one drifting + one swaying element per scene (reduced-motion
 * aware). Everything static is memoized; only two or three nodes animate.
 */
import React, { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { useIdleBob, useLoop, usePulse } from '@/hooks';

/** Scene dressing sets. Pick the one the game's fiction lives in. */
export type StageVariant =
  | 'street'
  | 'yard'
  | 'park'
  | 'counter'
  | 'radio-room'
  | 'classroom'
  | 'pantry'
  | 'stall'
  | 'store-room'
  | 'tower'
  | 'sky';

export interface StageProps {
  variant?: StageVariant;
  /** height of the near ground plane in px (defaults per variant) */
  groundHeight?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** drop the ambient loops (used behind very dense reading UI) */
  still?: boolean;
}

/* ------------------------------------------------------------------ */
/* Tones                                                               */
/* ------------------------------------------------------------------ */

const SHADE = 'rgba(31,42,90,0.14)';
const SHADE_SOFT = 'rgba(31,42,90,0.08)';
const HILITE = 'rgba(255,255,255,0.32)';
const HILITE_SOFT = 'rgba(255,255,255,0.18)';
const CONTACT = 0.12;

/** Ground palette + default plane height for each variant. */
const grounds: Record<StageVariant, { near: string; lip: string; haze: string; ground: number }> = {
  street: { near: '#C4CCDE', lip: '#DDE3F0', haze: '#D9EEFF', ground: 148 },
  yard: { near: '#C7CFE1', lip: '#DEE4F1', haze: '#D9EEFF', ground: 146 },
  park: { near: palette.grassDark, lip: palette.grass, haze: '#DCEFFF', ground: 152 },
  counter: { near: '#E8C89B', lip: '#F7E3BC', haze: '#FFF1DC', ground: 176 },
  'radio-room': { near: '#4E5776', lip: '#67718F', haze: '#B9C2DA', ground: 160 },
  classroom: { near: '#D8C39A', lip: '#EBD9B4', haze: '#EFE6D2', ground: 152 },
  pantry: { near: '#D3D9E8', lip: '#E7ECF6', haze: '#F3EFE3', ground: 156 },
  stall: { near: '#C0C7D9', lip: '#D8DEEB', haze: '#DDEEFF', ground: 148 },
  'store-room': { near: '#BFC7DA', lip: '#D9DFEC', haze: '#E5E9F4', ground: 156 },
  tower: { near: '#C4CCDE', lip: '#DDE3F0', haze: '#D9EEFF', ground: 148 },
  sky: { near: 'transparent', lip: 'transparent', haze: '#D9EEFF', ground: 0 },
};

/* ------------------------------------------------------------------ */
/* Shared shapes                                                       */
/* ------------------------------------------------------------------ */

/** The soft-topped ground plane with its lighter lip (consistency rule #7). */
function groundPlane(w: number, h: number, gy: number, near: string, lip: string) {
  const edge = `M 0 ${gy + 9} Q ${w / 2} ${gy - 5} ${w} ${gy + 9}`;
  return (
    <G>
      <Path d={`${edge} L ${w} ${h} L 0 ${h} Z`} fill={near} />
      <Path d={`${edge} L ${w} ${gy + 18} Q ${w / 2} ${gy + 4} 0 ${gy + 18} Z`} fill={lip} />
    </G>
  );
}

/** Navy contact ellipse — every grounded object gets one (rule #3). */
function contact(cx: number, cy: number, rx: number, o = CONTACT) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={Math.max(2.4, rx * 0.22)} fill={palette.navy} opacity={o} />;
}

/** A pale rooftop silhouette band that turns raw sky into a horizon. */
function skylineBand(w: number, y: number, tint: string, seed: number) {
  const n = Math.max(5, Math.round(w / 78));
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < n; i += 1) {
    const bw = 46 + ((i * 29 + seed * 13) % 46);
    const x = (i / n) * (w + 60) - 30;
    const bh = 44 + ((i * 37 + seed * 7) % 62);
    parts.push(
      <G key={`sk${i}`}>
        <Rect x={x} y={y - bh} width={bw} height={bh + 24} rx={7} fill={tint} />
        {i % 3 === 0 ? <Path d={`M ${x - 6} ${y - bh} L ${x + bw / 2} ${y - bh - 20} L ${x + bw + 6} ${y - bh} Z`} fill={tint} /> : null}
        {i % 4 === 1 ? <Rect x={x + bw * 0.3} y={y - bh - 26} width={bw * 0.36} height={28} rx={5} fill={tint} /> : null}
      </G>,
    );
  }
  return <G opacity={0.55}>{parts}</G>;
}

interface BuildingSpec {
  x: number;
  w: number;
  top: number;
  wall: string;
  roof: string;
  awning?: 'stripe' | 'solid' | 'none';
  awningA?: string;
  rows?: number;
  cols?: number;
}

/**
 * A 2.5D neighbour building (rule #8): front plane, shaded side plane, cornice,
 * roof slab, recessed windows with sills, an optional awning, a signage plate
 * and a cast shadow on the ground.
 */
function building(b: BuildingSpec, gy: number, key: string) {
  const { x, w, top, wall, roof } = b;
  const h = gy - top;
  const side = Math.max(10, w * 0.13);
  const rows = b.rows ?? 3;
  const cols = b.cols ?? 2;
  const winW = (w - side) / (cols + 1);
  const winH = Math.min(30, (h - 46) / (rows + 1));
  const wins: React.ReactElement[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const wx = x + winW * 0.5 + c * winW * 1.35;
      const wy = top + 34 + r * (winH + 20);
      if (wy + winH > gy - 16) continue;
      wins.push(
        <G key={`w${r}-${c}`}>
          <Rect x={wx - 3} y={wy - 3} width={winW * 0.78 + 6} height={winH + 6} rx={7} fill={HILITE_SOFT} />
          <Rect x={wx} y={wy} width={winW * 0.78} height={winH} rx={5} fill="#33477A" />
          <Path d={`M ${wx + 2} ${wy + winH - 2} L ${wx + winW * 0.45} ${wy + 2} L ${wx + winW * 0.62} ${wy + 2} L ${wx + winW * 0.2} ${wy + winH - 2} Z`} fill={palette.white} opacity={0.18} />
          <Rect x={wx - 5} y={wy + winH + 1} width={winW * 0.78 + 10} height={5} rx={2.5} fill={SHADE} />
          {b.awning === 'stripe' ? (
            <G>
              <Path d={`M ${wx - 6} ${wy - 4} h ${winW * 0.78 + 12} l -3 12 h ${-(winW * 0.78 + 6)} z`} fill={b.awningA ?? palette.engineRed} />
              <Rect x={wx + winW * 0.2} y={wy - 4} width={winW * 0.2} height={12} fill={palette.white} opacity={0.85} />
            </G>
          ) : null}
        </G>,
      );
    }
  }
  return (
    <G key={key}>
      {contact(x + w / 2, gy + 8, w * 0.56)}
      {/* shaded side plane */}
      <Path d={`M ${x + w - side} ${top + 8} L ${x + w} ${top + 18} L ${x + w} ${gy} L ${x + w - side} ${gy} Z`} fill={wall} />
      <Path d={`M ${x + w - side} ${top + 8} L ${x + w} ${top + 18} L ${x + w} ${gy} L ${x + w - side} ${gy} Z`} fill={SHADE} />
      {/* front plane */}
      <Rect x={x} y={top + 8} width={w - side} height={h - 8} rx={6} fill={wall} />
      <Rect x={x} y={top + 8} width={(w - side) * 0.16} height={h - 8} fill={HILITE_SOFT} />
      {/* roof slab + cornice */}
      <Rect x={x - 6} y={top} width={w + 10} height={14} rx={6} fill={roof} />
      <Rect x={x - 6} y={top + 10} width={w + 10} height={6} rx={3} fill={SHADE} />
      <Rect x={x - 2} y={top + 1} width={w * 0.5} height={4} rx={2} fill={HILITE} />
      {wins}
      {/* signage plate */}
      <Rect x={x + (w - side) * 0.18} y={gy - 34} width={(w - side) * 0.64} height={15} rx={7} fill={palette.cream} />
      <Rect x={x + (w - side) * 0.22} y={gy - 31} width={(w - side) * 0.36} height={5} rx={2.5} fill={HILITE} />
      {/* soffit shadow onto the wall */}
      <Rect x={x} y={top + 16} width={w - side} height={5} rx={2.5} fill={SHADE_SOFT} />
    </G>
  );
}

/** Warm street lamp: post, arm, lantern and a soft pool of light. */
function lampPost(x: number, gy: number, hgt: number) {
  const top = gy - hgt;
  return (
    <G>
      {contact(x, gy + 4, 15)}
      <Rect x={x - 8} y={gy - 12} width={16} height={14} rx={5} fill={palette.charcoal} />
      <Rect x={x - 4.5} y={top + 16} width={9} height={hgt - 24} rx={4.5} fill={palette.charcoalDark} />
      <Rect x={x - 4.5} y={top + 16} width={3.4} height={hgt - 24} fill={HILITE_SOFT} />
      <Path d={`M ${x} ${top + 22} q 0 -20 22 -20`} stroke={palette.charcoalDark} strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d={`M ${x + 12} ${top + 2} h 22 l -5 20 h -12 z`} fill={palette.charcoal} />
      <Path d={`M ${x + 15} ${top + 5} h 16 l -3.6 14 h -8.8 z`} fill="#FFE9A8" />
      <Ellipse cx={x + 23} cy={top + 12} rx={26} ry={20} fill={palette.safetyYellow} opacity={0.16} />
      <Rect x={x + 17} y={top - 6} width={12} height={8} rx={3} fill={palette.charcoalDark} />
    </G>
  );
}

/** A parked engine, drawn flat and low-contrast so it stays background. */
function parkedTruck(x: number, gy: number, s: number, tone: string = '#C9382C') {
  const w = 118 * s;
  const h = 46 * s;
  const y = gy - h - 6 * s;
  return (
    <G>
      {contact(x + w / 2, gy + 3, w * 0.5, 0.14)}
      <Rect x={x} y={y} width={w} height={h} rx={9 * s} fill={tone} />
      <Rect x={x} y={y} width={w} height={h * 0.3} rx={8 * s} fill={HILITE_SOFT} />
      <Rect x={x + w * 0.05} y={y + h * 0.22} width={w * 0.26} height={h * 0.34} rx={5 * s} fill="#8FC7EC" />
      <Rect x={x + w * 0.38} y={y + h * 0.22} width={w * 0.3} height={h * 0.34} rx={5 * s} fill="#8FC7EC" />
      <Rect x={x} y={y + h * 0.66} width={w} height={h * 0.16} fill={palette.safetyYellow} />
      <Rect x={x + w * 0.3} y={y - 7 * s} width={w * 0.18} height={7 * s} rx={3 * s} fill="#8FC7EC" />
      <Rect x={x + w * 0.1} y={y - 5 * s} width={w * 0.14} height={5 * s} rx={2.5 * s} fill={palette.slateLight} />
      <Circle cx={x + w * 0.22} cy={gy - 2 * s} r={9 * s} fill={palette.charcoalDark} />
      <Circle cx={x + w * 0.22} cy={gy - 2 * s} r={4 * s} fill={palette.slateLight} />
      <Circle cx={x + w * 0.79} cy={gy - 2 * s} r={9 * s} fill={palette.charcoalDark} />
      <Circle cx={x + w * 0.79} cy={gy - 2 * s} r={4 * s} fill={palette.slateLight} />
    </G>
  );
}

/** Two neighbours watching from the pavement — silhouettes, never characters. */
function onlookers(x: number, gy: number, s: number) {
  const person = (px: number, hgt: number, coat: string, hat: string) => (
    <G>
      {contact(px, gy + 2, hgt * 0.26)}
      <Path d={`M ${px - hgt * 0.2} ${gy} q 0 ${-hgt * 0.55} ${hgt * 0.2} ${-hgt * 0.55} q ${hgt * 0.2} 0 ${hgt * 0.2} ${hgt * 0.55} z`} fill={coat} />
      <Circle cx={px} cy={gy - hgt * 0.68} r={hgt * 0.16} fill={hat} />
      <Path d={`M ${px - hgt * 0.17} ${gy - hgt * 0.72} a ${hgt * 0.17} ${hgt * 0.17} 0 0 1 ${hgt * 0.34} 0 z`} fill={SHADE} />
    </G>
  );
  return (
    <G opacity={0.85}>
      {person(x, 62 * s, '#5C6B9E', '#E0B48C')}
      {person(x + 26 * s, 52 * s, '#7C88B5', '#C68C64')}
    </G>
  );
}

/** A layered tree — back mass, front mass, highlight, trunk (never 3 circles). */
function tree(x: number, gy: number, s: number, back: string = '#3E9A55', front: string = palette.leafGreen) {
  return (
    <G>
      {contact(x, gy + 3, 22 * s)}
      <Rect x={x - 5 * s} y={gy - 42 * s} width={10 * s} height={44 * s} rx={5 * s} fill={palette.woodDark} />
      <Rect x={x - 5 * s} y={gy - 42 * s} width={3.4 * s} height={44 * s} fill={HILITE_SOFT} />
      <Path d={`M ${x - 30 * s} ${gy - 44 * s} q ${-4 * s} ${-30 * s} ${20 * s} ${-34 * s} q ${8 * s} ${-16 * s} ${24 * s} ${-6 * s} q ${22 * s} ${-2 * s} ${18 * s} ${22 * s} q ${8 * s} ${16 * s} ${-14 * s} ${18 * s} z`} fill={back} />
      <Path d={`M ${x - 24 * s} ${gy - 46 * s} q ${-2 * s} ${-22 * s} ${16 * s} ${-25 * s} q ${8 * s} ${-12 * s} ${20 * s} ${-4 * s} q ${16 * s} ${0} ${13 * s} ${17 * s} q ${5 * s} ${12 * s} ${-11 * s} ${12 * s} z`} fill={front} />
      <Path d={`M ${x - 14 * s} ${gy - 66 * s} q ${6 * s} ${-10 * s} ${18 * s} ${-8 * s} q ${-8 * s} ${4 * s} ${-18 * s} ${8 * s} z`} fill={HILITE} />
    </G>
  );
}

/** Traffic cone with its band and shadow. */
function cone(x: number, gy: number, s: number) {
  return (
    <G>
      {contact(x, gy + 2, 12 * s)}
      <Path d={`M ${x} ${gy - 30 * s} q ${6 * s} ${14 * s} ${12 * s} ${28 * s} h ${-24 * s} q ${6 * s} ${-14 * s} ${12 * s} ${-28 * s} z`} fill={palette.orange} />
      <Rect x={x - 7 * s} y={gy - 16 * s} width={14 * s} height={6 * s} fill={palette.white} opacity={0.9} />
      <Rect x={x - 15 * s} y={gy - 4 * s} width={30 * s} height={6 * s} rx={3 * s} fill={palette.orangeDark} />
      <Path d={`M ${x - 3 * s} ${gy - 28 * s} l ${-5 * s} ${24 * s} h ${3 * s} z`} fill={HILITE} />
    </G>
  );
}

/** A wall-mounted shelf plank on two brackets. */
function shelf(x: number, y: number, w: number, wood: string = palette.wood) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={9} rx={4} fill={wood} />
      <Rect x={x} y={y} width={w} height={3.4} rx={1.7} fill={HILITE} />
      <Rect x={x} y={y + 9} width={w} height={3} rx={1.5} fill={SHADE} />
      <Path d={`M ${x + 10} ${y + 9} l 0 12 l 10 -12 z`} fill={wood} opacity={0.75} />
      <Path d={`M ${x + w - 20} ${y + 9} l 10 12 l 0 -12 z`} fill={wood} opacity={0.75} />
    </G>
  );
}

/** A chalkboard with a frame and a chalk tray. */
function chalkboard(x: number, y: number, w: number, h: number) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={10} fill={palette.woodDark} />
      <Rect x={x + 7} y={y + 7} width={w - 14} height={h - 18} rx={6} fill="#2E3A46" />
      <Rect x={x + 7} y={y + 7} width={w - 14} height={(h - 18) * 0.28} rx={6} fill={HILITE_SOFT} />
      <Rect x={x + 4} y={y + h - 12} width={w - 8} height={9} rx={4} fill={palette.wood} />
      <Rect x={x + 16} y={y + h - 9} width={16} height={4} rx={2} fill={palette.white} opacity={0.8} />
    </G>
  );
}

/** A stack of pale storage jars for shelves. */
function jars(x: number, y: number, s: number, tints: readonly string[]) {
  return (
    <G>
      {tints.map((t, i) => {
        const jx = x + i * 30 * s;
        const jh = (26 + (i % 3) * 8) * s;
        return (
          <G key={`j${i}`}>
            <Rect x={jx} y={y - jh} width={22 * s} height={jh} rx={7 * s} fill={t} />
            <Rect x={jx} y={y - jh} width={7 * s} height={jh} rx={3.5 * s} fill={HILITE} />
            <Rect x={jx - 2 * s} y={y - jh - 6 * s} width={26 * s} height={8 * s} rx={4 * s} fill={palette.tanDark} />
          </G>
        );
      })}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Variants                                                            */
/* ------------------------------------------------------------------ */

function streetArt(w: number, h: number, gy: number, s: number) {
  const roadY = gy + 64;
  /* The shop fronts are anchored to the TOP of the frame, not to the ground:
     on a tall game box a fixed offset from the kerb left 400 px of bare sky
     above them (art director's note on Hydrant Match). The centre of the frame
     still stays calm — only the flanks are built up. */
  const leftTop = Math.max(48, Math.min(h * 0.17, gy - 150));
  const rightTop = Math.max(58, Math.min(h * 0.21, gy - 140));
  const midTop = Math.max(120, Math.min(h * 0.45, gy - 110));
  return (
    <G>
      {skylineBand(w, Math.max(56, leftTop - 26), '#7FB6E4', 2)}
      {building({ x: -18, w: 138 * s, top: leftTop, wall: '#F4DCB0', roof: palette.engineRed, awning: 'stripe', rows: 4, cols: 2 }, gy, 'b1')}
      {building({ x: w - 132 * s, w: 150 * s, top: rightTop, wall: '#EFD3B6', roof: '#4A5FA8', rows: 4, cols: 2 }, gy, 'b2')}
      {building({ x: w * 0.42, w: 104 * s, top: midTop, wall: '#F7E6C6', roof: '#3B8E3F', awning: 'stripe', awningA: '#3B8E3F', rows: 2, cols: 2 }, gy, 'b3')}
      {/* pavement, kerb and the road below it */}
      {groundPlane(w, h, gy, grounds.street.near, grounds.street.lip)}
      <Rect x={0} y={roadY} width={w} height={Math.max(0, h - roadY)} fill="#8E96AE" />
      <Rect x={0} y={roadY} width={w} height={7} rx={3.5} fill="#E7EBF4" />
      <Rect x={0} y={roadY + 7} width={w} height={5} fill={SHADE} />
      <Path d={`M 0 ${roadY + 40} H ${w}`} stroke={palette.white} strokeWidth={4} strokeDasharray="22 20" strokeLinecap="round" opacity={0.8} />
      {/* drain grate */}
      <G>
        <Rect x={w * 0.62} y={roadY + 12} width={40 * s} height={15 * s} rx={5} fill="#6F7893" />
        <Rect x={w * 0.62 + 5} y={roadY + 15} width={30 * s} height={2.6} rx={1.3} fill={SHADE} />
        <Rect x={w * 0.62 + 5} y={roadY + 20} width={30 * s} height={2.6} rx={1.3} fill={SHADE} />
      </G>
      {parkedTruck(w * 0.03, roadY + 30, s * 0.92)}
      {lampPost(w - 44 * s, gy + 2, 178 * s)}
      {onlookers(w * 0.53, gy, s)}
      {/* planters against the wall */}
      <G>
        {contact(w * 0.3, gy + 4, 20 * s)}
        <Path d={`M ${w * 0.3 - 18 * s} ${gy - 20 * s} h ${36 * s} l ${-5 * s} ${22 * s} h ${-26 * s} z`} fill={palette.wood} />
        <Path d={`M ${w * 0.3 - 18 * s} ${gy - 20 * s} h ${10 * s} l ${-2 * s} ${22 * s} h ${-8 * s} z`} fill={HILITE_SOFT} />
        <Circle cx={w * 0.3} cy={gy - 30 * s} r={16 * s} fill={palette.leafGreen} />
        <Circle cx={w * 0.3 - 12 * s} cy={gy - 24 * s} r={11 * s} fill="#3E9A55" />
        <Circle cx={w * 0.3 + 11 * s} cy={gy - 25 * s} r={10 * s} fill={palette.grass} />
      </G>
      {cone(w * 0.86, roadY + 34, s * 0.9)}
    </G>
  );
}

function yardArt(w: number, h: number, gy: number, s: number) {
  const wallTop = Math.max(46, Math.min(h * 0.2, gy - 150));
  const towerTop = Math.max(24, Math.min(h * 0.1, gy - 240));
  const towerH = gy - towerTop;
  const rows = Math.max(2, Math.floor(towerH / (64 * s)));
  return (
    <G>
      {skylineBand(w, Math.max(52, wallTop - 22), '#8CBEE7', 5)}
      {/* training tower silhouette */}
      <G>
        {contact(w * 0.845, gy + 6, 52 * s)}
        <Rect x={w * 0.78} y={towerTop} width={62 * s} height={towerH} rx={8} fill="#C2A377" />
        <Rect x={w * 0.78} y={towerTop} width={16 * s} height={towerH} fill={HILITE_SOFT} />
        <Rect x={w * 0.78 - 8 * s} y={towerTop - 12 * s} width={78 * s} height={16 * s} rx={7} fill="#9E7F55" />
        {Array.from({ length: rows }, (_, i) => (
          <G key={`t${i}`}>
            <Rect x={w * 0.78 + 16 * s} y={towerTop + 26 * s + i * 64 * s} width={30 * s} height={34 * s} rx={6} fill="#33477A" />
            <Rect x={w * 0.78 + 12 * s} y={towerTop + 62 * s + i * 64 * s} width={38 * s} height={5 * s} rx={2.5} fill={SHADE} />
          </G>
        ))}
      </G>
      {/* station wall on the left with a hose reel */}
      <G>
        <Rect x={-20} y={wallTop} width={w * 0.56} height={gy - wallTop} rx={8} fill={palette.tan} />
        <Rect x={-20} y={wallTop} width={w * 0.56} height={13} rx={6} fill={palette.engineRed} />
        <Rect x={-20} y={wallTop + 13} width={w * 0.56} height={6} fill={SHADE} />
        <Rect x={-20} y={wallTop + 19} width={w * 0.1} height={gy - wallTop - 19} fill={HILITE_SOFT} />
        {/* bay door */}
        <Rect x={w * 0.06} y={gy - 96 * s} width={w * 0.34} height={96 * s} rx={9} fill={palette.engineRed} />
        <Rect x={w * 0.06} y={gy - 96 * s} width={w * 0.34} height={12 * s} rx={6} fill={palette.engineRedDark} />
        {[0, 1, 2].map((i) => (
          <Rect key={`d${i}`} x={w * 0.075} y={gy - 78 * s + i * 24 * s} width={w * 0.31} height={5 * s} rx={2.5} fill={SHADE} />
        ))}
        <Rect x={w * 0.1} y={gy - 66 * s} width={w * 0.26} height={16 * s} rx={5} fill="#3D6FB0" />
        {/* upper wall furniture: windows, an ENGINE 1 plate and the hose reel,
            all high enough to read over whatever the game parks in front */}
        {[0.08, 0.24].map((f, i) => (
          <G key={`sw${i}`}>
            <Rect x={w * f - 3} y={wallTop + 34} width={w * 0.11 + 6} height={46 * s + 6} rx={7} fill={palette.creamDeep} />
            <Rect x={w * f} y={wallTop + 37} width={w * 0.11} height={46 * s} rx={5} fill="#33477A" />
            <Rect x={w * f} y={wallTop + 37 + 23 * s} width={w * 0.11} height={3} fill={palette.creamDeep} opacity={0.8} />
            <Rect x={w * f - 5} y={wallTop + 37 + 46 * s + 4} width={w * 0.11 + 10} height={5} rx={2.5} fill={SHADE} />
          </G>
        ))}
        <G>
          <Rect x={w * 0.4} y={wallTop + 40} width={w * 0.13} height={22} rx={10} fill={palette.cream} />
          <Rect x={w * 0.415} y={wallTop + 45} width={w * 0.1} height={5} rx={2.5} fill={palette.navyMuted} opacity={0.5} />
        </G>
        <G>
          <Circle cx={w * 0.47} cy={wallTop + 96} r={22 * s} fill={palette.slateLight} />
          <Circle cx={w * 0.47} cy={wallTop + 96} r={16 * s} fill={palette.engineRed} />
          <Circle cx={w * 0.47} cy={wallTop + 96} r={9 * s} fill={palette.engineRedDark} />
          <Circle cx={w * 0.47 - 6 * s} cy={wallTop + 90} r={4 * s} fill={HILITE} />
        </G>
      </G>
      {groundPlane(w, h, gy, grounds.yard.near, grounds.yard.lip)}
      {/* chalk practice lines on the apron */}
      <G opacity={0.55}>
        <Path d={`M ${w * 0.1} ${gy + 46} H ${w * 0.92}`} stroke={palette.white} strokeWidth={5} strokeLinecap="round" strokeDasharray="26 18" />
        <Path d={`M ${w * 0.16} ${gy + 82} H ${w * 0.86}`} stroke={palette.white} strokeWidth={4} strokeLinecap="round" strokeDasharray="18 16" />
        <Ellipse cx={w * 0.5} cy={gy + 64} rx={w * 0.2} ry={22} fill="none" stroke={palette.white} strokeWidth={4} strokeDasharray="14 14" />
      </G>
      {cone(w * 0.12, gy + 40, s)}
      {cone(w * 0.3, gy + 56, s * 0.9)}
      {cone(w * 0.68, gy + 52, s * 0.95)}
      {cone(w * 0.9, gy + 34, s * 0.85)}
      {/* coiled hose on the apron */}
      <G>
        {contact(w * 0.52, gy + 96, 26 * s)}
        <Circle cx={w * 0.52} cy={gy + 86} r={24 * s} fill={palette.safetyYellow} />
        <Circle cx={w * 0.52} cy={gy + 86} r={15 * s} fill={palette.gold} />
        <Circle cx={w * 0.52} cy={gy + 86} r={7 * s} fill={grounds.yard.near} />
        <Path d={`M ${w * 0.52 - 18 * s} ${gy + 74} a ${20 * s} ${20 * s} 0 0 1 ${18 * s} ${-6 * s}`} stroke={HILITE} strokeWidth={4 * s} fill="none" strokeLinecap="round" />
      </G>
    </G>
  );
}

function parkArt(w: number, h: number, gy: number, s: number) {
  return (
    <G>
      {skylineBand(w, gy - 132 * s, '#8CC7EA', 3)}
      {/* far hedge line */}
      <Path d={`M -10 ${gy - 34 * s} q ${w * 0.18} ${-42 * s} ${w * 0.34} ${-6 * s} q ${w * 0.2} ${-36 * s} ${w * 0.4} ${-4 * s} q ${w * 0.16} ${-22 * s} ${w * 0.32} ${6 * s} L ${w + 10} ${gy} L -10 ${gy} Z`} fill="#3E9A55" />
      {groundPlane(w, h, gy, grounds.park.near, grounds.park.lip)}
      {/* path curving through the grass */}
      <Path d={`M ${-10} ${h} Q ${w * 0.34} ${gy + 44} ${w * 0.62} ${gy + 16} L ${w * 0.82} ${gy + 12} L ${w * 0.9} ${h} Z`} fill="#E4D3AE" opacity={0.85} />
      {/* pond */}
      <G>
        <Ellipse cx={w * 0.24} cy={gy + 92} rx={78 * s} ry={30 * s} fill="#2FA9DC" />
        <Ellipse cx={w * 0.24} cy={gy + 88} rx={72 * s} ry={26 * s} fill={palette.waterCyan} />
        <Path d={`M ${w * 0.24 - 40 * s} ${gy + 82} q ${18 * s} ${-7 * s} ${36 * s} 0`} stroke={palette.white} strokeWidth={3.4} fill="none" opacity={0.6} strokeLinecap="round" />
        <Path d={`M ${w * 0.24 - 20 * s} ${gy + 96} q ${16 * s} ${-6 * s} ${34 * s} 0`} stroke={palette.white} strokeWidth={2.6} fill="none" opacity={0.45} strokeLinecap="round" />
      </G>
      {tree(w * 0.09, gy + 6, s * 1.05)}
      {tree(w * 0.9, gy + 14, s * 1.2, '#2F8748', palette.grassDark)}
      {tree(w * 0.66, gy - 6, s * 0.8)}
      {/* park bench */}
      <G>
        {contact(w * 0.72, gy + 74, 40 * s)}
        <Rect x={w * 0.72 - 38 * s} y={gy + 46} width={76 * s} height={9 * s} rx={4 * s} fill={palette.wood} />
        <Rect x={w * 0.72 - 38 * s} y={gy + 32} width={76 * s} height={8 * s} rx={4 * s} fill={palette.wood} />
        <Rect x={w * 0.72 - 38 * s} y={gy + 46} width={76 * s} height={3 * s} rx={1.5 * s} fill={HILITE} />
        <Rect x={w * 0.72 - 32 * s} y={gy + 55} width={7 * s} height={18 * s} rx={3 * s} fill={palette.woodDark} />
        <Rect x={w * 0.72 + 25 * s} y={gy + 55} width={7 * s} height={18 * s} rx={3 * s} fill={palette.woodDark} />
      </G>
      {/* flower tufts */}
      {[0.16, 0.42, 0.56, 0.84].map((f, i) => (
        <G key={`fl${i}`}>
          <Path d={`M ${w * f} ${gy + 118} q ${-6 * s} ${-14 * s} 0 ${-20 * s} q ${6 * s} ${6 * s} 0 ${20 * s} z`} fill="#3E9A55" />
          <Circle cx={w * f} cy={gy + 96} r={5 * s} fill={i % 2 ? palette.safetyYellow : palette.pink} />
        </G>
      ))}
    </G>
  );
}

function counterArt(w: number, h: number, gy: number, s: number) {
  const tileTop = 0;
  return (
    <G>
      <Rect x={0} y={tileTop} width={w} height={gy + 4} fill="#FBE9CC" />
      {/* tiled splash-back */}
      <G opacity={0.5}>
        {Array.from({ length: 7 }, (_, r) =>
          Array.from({ length: Math.ceil(w / 46) + 1 }, (_, c) => (
            <Rect key={`t${r}-${c}`} x={c * 46 + (r % 2 ? -23 : 0)} y={gy - 190 + r * 30} width={42} height={26} rx={7} fill="#FFF6E5" />
          )),
        )}
      </G>
      {/* pot rack with hanging pans */}
      <G>
        <Rect x={w * 0.08} y={44} width={w * 0.5} height={8} rx={4} fill={palette.charcoal} />
        <Rect x={w * 0.08} y={44} width={w * 0.5} height={3} rx={1.5} fill={HILITE} />
        {[0.16, 0.3, 0.44].map((f, i) => (
          <G key={`p${i}`}>
            <Rect x={w * f} y={52} width={4} height={16} rx={2} fill={palette.charcoalDark} />
            <Path d={`M ${w * f - 20} 68 h 44 a 20 18 0 0 1 -44 0 z`} fill={i === 1 ? palette.slate : palette.charcoal} />
            <Path d={`M ${w * f - 14} 72 h 12 a 12 10 0 0 1 -12 0 z`} fill={HILITE} />
          </G>
        ))}
      </G>
      {/* chalkboard menu */}
      {chalkboard(w * 0.64, 44, w * 0.3, 96)}
      {/* spice shelf */}
      {shelf(w * 0.06, gy - 150, w * 0.42)}
      {jars(w * 0.08, gy - 150, s, ['#CFE9F8', '#FFE1B8', '#E7D8FF', '#D9F2D2'])}
      {/* tea towel on a rail */}
      <G>
        <Rect x={w * 0.66} y={gy - 128} width={w * 0.26} height={6} rx={3} fill={palette.slate} />
        <Path d={`M ${w * 0.7} ${gy - 124} h ${w * 0.16} v 66 q ${-w * 0.08} 10 ${-w * 0.16} 0 z`} fill={palette.white} />
        <Path d={`M ${w * 0.7} ${gy - 124} h ${w * 0.05} v 62 q ${-w * 0.025} 6 ${-w * 0.05} 4 z`} fill={SHADE_SOFT} />
        <Path d={`M ${w * 0.75} ${gy - 100} q 8 8 0 16 q -8 -8 0 -16 z`} fill={palette.engineRed} opacity={0.85} />
      </G>
      {/* counter top */}
      {groundPlane(w, h, gy, grounds.counter.near, grounds.counter.lip)}
      <Rect x={0} y={gy + 34} width={w} height={Math.max(0, h - gy - 34)} fill="#C99C5F" />
      <Rect x={0} y={gy + 34} width={w} height={6} fill={SHADE} />
      {Array.from({ length: 4 }, (_, i) => (
        <Rect key={`pl${i}`} x={0} y={gy + 52 + i * 28} width={w} height={3} rx={1.5} fill={SHADE_SOFT} />
      ))}
      {/* checked cloth, rounded — never a hard square */}
      <G>
        <Path d={`M -6 ${gy + 22} h ${w * 0.34} a 14 14 0 0 1 14 14 v 40 a 14 14 0 0 1 -14 14 h ${-w * 0.34} z`} fill={palette.white} />
        <G opacity={0.85}>
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 5 }, (_, c) =>
              (r + c) % 2 === 0 ? <Rect key={`c${r}-${c}`} x={c * (w * 0.07) - 6} y={gy + 22 + r * 23} width={w * 0.07} height={23} fill="#F2685C" /> : null,
            ),
          )}
        </G>
      </G>
    </G>
  );
}

function radioRoomArt(w: number, h: number, gy: number, s: number) {
  return (
    <G>
      <Rect x={0} y={0} width={w} height={gy + 4} fill="#7C87A8" />
      <Rect x={0} y={0} width={w} height={gy * 0.52} fill="#8D97B6" />
      <Rect x={0} y={gy * 0.52 - 8} width={w} height={9} rx={4} fill={SHADE} />
      {/* pinned town map */}
      <G>
        <Rect x={w * 0.05} y={54} width={w * 0.42} height={126} rx={10} fill="#DCE6D8" />
        <Rect x={w * 0.05} y={54} width={w * 0.42} height={126} rx={10} fill={HILITE_SOFT} />
        <Path d={`M ${w * 0.07} 150 q ${w * 0.1} -60 ${w * 0.18} -30 q ${w * 0.08} 26 ${w * 0.2} -22`} stroke="#9FB4CE" strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path d={`M ${w * 0.06} 108 h ${w * 0.4}`} stroke={palette.white} strokeWidth={5} strokeLinecap="round" />
        <Circle cx={w * 0.2} cy={96} r={7} fill={palette.engineRed} />
        <Circle cx={w * 0.36} cy={140} r={6} fill={palette.safetyYellow} />
      </G>
      {/* cork board with slips */}
      <G>
        <Rect x={w * 0.54} y={44} width={w * 0.4} height={112} rx={10} fill="#C89A62" />
        <Rect x={w * 0.54} y={44} width={w * 0.4} height={112} rx={10} fill={SHADE_SOFT} />
        {[0, 1, 2].map((i) => (
          <G key={`slip${i}`}>
            <Rect x={w * 0.57 + (i % 2) * w * 0.17} y={58 + Math.floor(i / 2) * 46} width={w * 0.15} height={38} rx={6} fill={palette.cream} />
            <Rect x={w * 0.585 + (i % 2) * w * 0.17} y={66 + Math.floor(i / 2) * 46} width={w * 0.09} height={4} rx={2} fill={palette.navyMuted} opacity={0.5} />
            <Rect x={w * 0.585 + (i % 2) * w * 0.17} y={76 + Math.floor(i / 2) * 46} width={w * 0.11} height={4} rx={2} fill={palette.navyMuted} opacity={0.35} />
          </G>
        ))}
      </G>
      {/* equipment shelf */}
      {shelf(w * 0.08, gy - 118, w * 0.84, palette.slate)}
      <G>
        <Rect x={w * 0.12} y={gy - 156} width={54 * s} height={38 * s} rx={7} fill={palette.charcoal} />
        <Rect x={w * 0.13} y={gy - 148} width={36 * s} height={16 * s} rx={4} fill="#5CE08A" opacity={0.8} />
        <Rect x={w * 0.36} y={gy - 146} width={26 * s} height={28 * s} rx={6} fill={palette.engineRed} />
        <Rect x={w * 0.365} y={gy - 154} width={5 * s} height={10 * s} rx={2.5} fill={palette.charcoalDark} />
        <Rect x={w * 0.5} y={gy - 142} width={40 * s} height={24 * s} rx={6} fill={palette.slateLight} />
        <Rect x={w * 0.68} y={gy - 150} width={30 * s} height={32 * s} rx={7} fill={palette.safetyYellow} />
      </G>
      {/* desk edge */}
      {groundPlane(w, h, gy, '#5E688A', '#7C87A8')}
      <Rect x={0} y={gy + 30} width={w} height={Math.max(0, h - gy - 30)} fill="#49527090" />
      <Rect x={0} y={gy + 26} width={w} height={8} rx={4} fill={HILITE_SOFT} />
      {/* mug + mic base on the desk */}
      <G>
        {contact(w * 0.12, gy + 60, 20 * s)}
        <Rect x={w * 0.12 - 16 * s} y={gy + 26} width={32 * s} height={32 * s} rx={7 * s} fill={palette.cream} />
        <Path d={`M ${w * 0.12 + 16 * s} ${gy + 34} a ${9 * s} ${9 * s} 0 0 1 0 ${16 * s}`} stroke={palette.cream} strokeWidth={6 * s} fill="none" />
        <Rect x={w * 0.12 - 16 * s} y={gy + 26} width={11 * s} height={32 * s} rx={5 * s} fill={HILITE} />
      </G>
      <G>
        {contact(w * 0.84, gy + 62, 26 * s)}
        <Ellipse cx={w * 0.84} cy={gy + 54} rx={26 * s} ry={9 * s} fill={palette.charcoalDark} />
        <Path d={`M ${w * 0.84} ${gy + 50} q ${-6 * s} ${-34 * s} ${22 * s} ${-40 * s}`} stroke={palette.charcoal} strokeWidth={5 * s} fill="none" strokeLinecap="round" />
        <Ellipse cx={w * 0.84 + 24 * s} cy={gy + 8} rx={11 * s} ry={13 * s} fill={palette.slate} />
      </G>
    </G>
  );
}

function classroomArt(w: number, h: number, gy: number, s: number) {
  return (
    <G>
      <Rect x={0} y={0} width={w} height={gy + 4} fill="#F1E7D2" />
      <Rect x={0} y={0} width={w} height={62} fill="#E3D6BA" />
      <Rect x={0} y={58} width={w} height={8} rx={4} fill={SHADE_SOFT} />
      {/* alphabet frieze */}
      <G>
        {Array.from({ length: 7 }, (_, i) => (
          <G key={`al${i}`}>
            <Rect x={10 + i * (w - 20) / 7} y={14} width={(w - 20) / 7 - 8} height={34} rx={9} fill={[palette.pink, palette.safetyYellow, palette.waterCyan, palette.leafGreen][i % 4]} opacity={0.8} />
            <Rect x={14 + i * (w - 20) / 7} y={20} width={(w - 20) / 7 - 20} height={7} rx={3.5} fill={HILITE} />
          </G>
        ))}
      </G>
      {/* the big board */}
      {chalkboard(w * 0.08, 84, w * 0.62, 168)}
      {/* wall clock */}
      <G>
        <Circle cx={w * 0.84} cy={132} r={40 * s} fill={palette.cream} />
        <Circle cx={w * 0.84} cy={132} r={32 * s} fill={palette.white} />
        <Circle cx={w * 0.84} cy={132} r={32 * s} fill={HILITE_SOFT} />
        <Rect x={w * 0.84 - 2.5} y={132 - 22 * s} width={5} height={24 * s} rx={2.5} fill={palette.navy} />
        <Rect x={w * 0.84 - 2.5} y={129} width={20 * s} height={5} rx={2.5} fill={palette.navySoft} />
        <Circle cx={w * 0.84} cy={132} r={4} fill={palette.engineRed} />
      </G>
      {/* bookshelf */}
      {shelf(w * 0.72, gy - 124, w * 0.24)}
      <G>
        {[palette.engineRed, palette.waterCyanDark, palette.safetyYellow, palette.purple].map((c, i) => (
          <Rect key={`bk${i}`} x={w * 0.74 + i * 15 * s} y={gy - 124 - (30 + (i % 3) * 8) * s} width={11 * s} height={(30 + (i % 3) * 8) * s} rx={3} fill={c} />
        ))}
      </G>
      {groundPlane(w, h, gy, grounds.classroom.near, grounds.classroom.lip)}
      {/* desk edge */}
      <Rect x={0} y={gy + 44} width={w} height={Math.max(0, h - gy - 44)} fill="#C0A87C" />
      <Rect x={0} y={gy + 40} width={w} height={9} rx={4} fill="#EBD9B4" />
      <G>
        {contact(w * 0.16, gy + 40, 26 * s)}
        <Path d={`M ${w * 0.16 - 22 * s} ${gy + 34} l ${6 * s} ${-40 * s} h ${32 * s} l ${6 * s} ${40 * s} z`} fill={palette.waterCyanLight} />
        <Path d={`M ${w * 0.16 - 22 * s} ${gy + 34} l ${6 * s} ${-40 * s} h ${10 * s} l ${-4 * s} ${40 * s} z`} fill={HILITE} />
        {[0, 1, 2].map((i) => (
          <Rect key={`pn${i}`} x={w * 0.16 - 14 * s + i * 10 * s} y={gy - 22 * s} width={6 * s} height={30 * s} rx={3 * s} fill={[palette.engineRed, palette.leafGreen, palette.purple][i]} />
        ))}
      </G>
    </G>
  );
}

function pantryArt(w: number, h: number, gy: number, s: number) {
  return (
    <G>
      <Rect x={0} y={0} width={w} height={gy + 4} fill="#F3E4C8" />
      {/* plank wall */}
      {Array.from({ length: 6 }, (_, i) => (
        <Rect key={`pw${i}`} x={0} y={i * 62} width={w} height={4} rx={2} fill={SHADE_SOFT} />
      ))}
      {/* three loaded shelves */}
      {[0, 1, 2].map((r) => {
        const y = 96 + r * 108;
        return (
          <G key={`sh${r}`}>
            {shelf(w * 0.05, y, w * 0.9)}
            {r === 0 ? jars(w * 0.09, y, s * 1.1, ['#FFE1B8', '#CFE9F8', '#E7D8FF', '#D9F2D2', '#FFD2E5']) : null}
            {r === 1 ? (
              <G>
                {[0, 1, 2, 3].map((i) => (
                  <G key={`sk${i}`}>
                    <Path d={`M ${w * 0.09 + i * 62 * s} ${y} q ${-6 * s} ${-40 * s} ${16 * s} ${-46 * s} q ${22 * s} ${6 * s} ${16 * s} ${46 * s} z`} fill="#D8B98A" />
                    <Path d={`M ${w * 0.09 + i * 62 * s + 6 * s} ${y} q ${-4 * s} ${-32 * s} ${8 * s} ${-38 * s} q ${4 * s} ${8 * s} ${2 * s} ${38 * s} z`} fill={HILITE_SOFT} />
                    <Rect x={w * 0.09 + i * 62 * s + 4 * s} y={y - 50 * s} width={24 * s} height={7 * s} rx={3.5 * s} fill={palette.tanDark} />
                  </G>
                ))}
              </G>
            ) : null}
            {r === 2 ? (
              <G>
                {[0, 1, 2].map((i) => (
                  <G key={`cr${i}`}>
                    <Rect x={w * 0.1 + i * 92 * s} y={y - 52 * s} width={76 * s} height={52 * s} rx={7} fill={palette.wood} />
                    <Rect x={w * 0.1 + i * 92 * s} y={y - 52 * s} width={76 * s} height={9 * s} rx={4} fill={HILITE} />
                    <Rect x={w * 0.1 + i * 92 * s + 6 * s} y={y - 38 * s} width={64 * s} height={6 * s} rx={3} fill={SHADE} />
                    {[0, 1, 2].map((k) => (
                      <Circle key={`v${k}`} cx={w * 0.1 + i * 92 * s + (18 + k * 22) * s} cy={y - 58 * s} r={10 * s} fill={[palette.engineRed, palette.leafGreen, palette.orange][(i + k) % 3]} />
                    ))}
                  </G>
                ))}
              </G>
            ) : null}
          </G>
        );
      })}
      {groundPlane(w, h, gy, grounds.pantry.near, grounds.pantry.lip)}
      {/* checkerboard floor */}
      <G opacity={0.6}>
        {Array.from({ length: 3 }, (_, r) =>
          Array.from({ length: Math.ceil(w / 58) + 1 }, (_, c) =>
            (r + c) % 2 === 0 ? <Rect key={`fl${r}-${c}`} x={c * 58 - (r % 2) * 29} y={gy + 24 + r * 44} width={58} height={44} fill="#C4CCDE" /> : null,
          ),
        )}
      </G>
    </G>
  );
}

function stallArt(w: number, h: number, gy: number, s: number) {
  const canopyY = 54;
  return (
    <G>
      {skylineBand(w, gy - 120 * s, '#8CBEE7', 4)}
      {building({ x: -24, w: 120 * s, top: gy - 180 * s, wall: '#F0DBB8', roof: '#4A5FA8', rows: 2, cols: 2 }, gy, 'sb1')}
      {building({ x: w - 108 * s, w: 130 * s, top: gy - 160 * s, wall: '#F6E3C2', roof: palette.engineRed, rows: 2, cols: 2 }, gy, 'sb2')}
      {/* striped canopy across the top */}
      <G>
        <Path d={`M -10 ${canopyY} h ${w + 20} v 22 q ${-w / 2} 22 ${-(w + 20)} 0 z`} fill={palette.engineRed} />
        {Array.from({ length: Math.ceil(w / 46) + 1 }, (_, i) =>
          i % 2 === 0 ? <Path key={`cs${i}`} d={`M ${i * 46 - 10} ${canopyY} h 46 v 24 q -23 8 -46 2 z`} fill={palette.white} /> : null,
        )}
        <Rect x={-10} y={canopyY - 8} width={w + 20} height={12} rx={6} fill={palette.engineRedDark} />
        <Rect x={20} y={canopyY + 34} width={9} height={gy - canopyY - 34} rx={4.5} fill={palette.wood} />
        <Rect x={w - 30} y={canopyY + 34} width={9} height={gy - canopyY - 34} rx={4.5} fill={palette.wood} />
      </G>
      {/* produce table under the canopy */}
      <G>
        {contact(w * 0.5, gy + 6, w * 0.36)}
        <Rect x={w * 0.14} y={gy - 78 * s} width={w * 0.72} height={16 * s} rx={7} fill={palette.wood} />
        <Rect x={w * 0.14} y={gy - 78 * s} width={w * 0.72} height={6 * s} rx={3} fill={HILITE} />
        <Path d={`M ${w * 0.14} ${gy - 62 * s} h ${w * 0.72} l ${-w * 0.04} ${52 * s} h ${-w * 0.64} z`} fill="#A8752F" />
        {[0, 1, 2].map((i) => (
          <G key={`bx${i}`}>
            <Rect x={w * 0.17 + i * w * 0.24} y={gy - 108 * s} width={w * 0.19} height={32 * s} rx={6} fill={palette.tan} />
            <Rect x={w * 0.17 + i * w * 0.24} y={gy - 108 * s} width={w * 0.19} height={8 * s} rx={4} fill={HILITE} />
            {[0, 1, 2].map((k) => (
              <Circle key={`q${k}`} cx={w * 0.19 + i * w * 0.24 + k * w * 0.06} cy={gy - 114 * s} r={11 * s} fill={[palette.engineRed, palette.orange, palette.leafGreen][(i + k) % 3]} />
            ))}
          </G>
        ))}
      </G>
      {groundPlane(w, h, gy, grounds.stall.near, grounds.stall.lip)}
      {/* cobbles */}
      <G opacity={0.35}>
        {Array.from({ length: 3 }, (_, r) =>
          Array.from({ length: Math.ceil(w / 54) + 1 }, (_, c) => (
            <Rect key={`cb${r}-${c}`} x={c * 54 - (r % 2) * 27} y={gy + 34 + r * 34} width={46} height={26} rx={11} fill="#AEB7CD" />
          )),
        )}
      </G>
      {cone(w * 0.06, gy + 92, s * 0.85)}
    </G>
  );
}

function storeRoomArt(w: number, h: number, gy: number, s: number) {
  return (
    <G>
      <Rect x={0} y={0} width={w} height={gy + 4} fill="#E3D3B4" />
      <Rect x={0} y={0} width={w} height={gy * 0.34} fill="#EFE0C4" />
      {/* pegboard */}
      <G>
        <Rect x={w * 0.06} y={48} width={w * 0.52} height={150} rx={12} fill="#D8B98A" />
        <Rect x={w * 0.06} y={48} width={w * 0.52} height={150} rx={12} fill={SHADE_SOFT} />
        <G opacity={0.45}>
          {Array.from({ length: 5 }, (_, r) =>
            Array.from({ length: 7 }, (_, c) => (
              <Circle key={`pg${r}-${c}`} cx={w * 0.09 + c * (w * 0.075)} cy={62 + r * 27} r={2.6} fill={palette.navy} />
            )),
          )}
        </G>
        {/* hanging gear: axe-less — a coiled hose, a helmet and a lantern */}
        <G>
          <Circle cx={w * 0.15} cy={104} r={30 * s} fill={palette.safetyYellow} />
          <Circle cx={w * 0.15} cy={104} r={18 * s} fill={palette.gold} />
          <Circle cx={w * 0.15} cy={104} r={8 * s} fill="#D8B98A" />
        </G>
        <G>
          <Path d={`M ${w * 0.33 - 30 * s} 120 c 0 ${-34 * s} ${14 * s} ${-44 * s} ${30 * s} ${-44 * s} s ${30 * s} ${10 * s} ${30 * s} ${44 * s} z`} fill={palette.engineRed} />
          <Rect x={w * 0.33 - 38 * s} y={116} width={76 * s} height={13 * s} rx={6 * s} fill={palette.engineRedDark} />
          <Path d={`M ${w * 0.33} ${86} q ${8 * s} ${8 * s} 0 ${18 * s} q ${-8 * s} ${-10 * s} 0 ${-18 * s} z`} fill={palette.safetyYellow} />
        </G>
        <G>
          <Rect x={w * 0.48} y={78} width={26 * s} height={34 * s} rx={6} fill={palette.charcoal} />
          <Rect x={w * 0.485} y={84} width={18 * s} height={20 * s} rx={4} fill="#FFE9A8" />
          <Rect x={w * 0.49} y={68} width={14 * s} height={10 * s} rx={4} fill={palette.charcoalDark} />
        </G>
      </G>
      {/* lockers — wall furniture ABOVE the bench, never a full-height band
          behind the play area (they used to swallow the bin labels) */}
      <G>
        {[0, 1, 2].map((i) => {
          const lx = w * 0.64 + i * (w * 0.12);
          const lTop = 40;
          // wall furniture only: the lockers stop well above the bench so bin
          // labels are never read against a blue door
          const lH = Math.max(90, Math.min(184, gy - 300 - lTop));
          return (
            <G key={`lk${i}`}>
              <Rect x={lx} y={lTop} width={w * 0.108} height={lH} rx={8} fill="#5F82B8" />
              <Rect x={lx} y={lTop} width={w * 0.03} height={lH} fill={HILITE_SOFT} />
              <Rect x={lx} y={lTop + lH - 8} width={w * 0.108} height={8} rx={4} fill={SHADE} />
              <Rect x={lx + w * 0.015} y={lTop + 22} width={w * 0.078} height={7} rx={3.5} fill={SHADE} />
              <Rect x={lx + w * 0.015} y={lTop + 36} width={w * 0.078} height={7} rx={3.5} fill={SHADE} />
              <Circle cx={lx + w * 0.085} cy={lTop + 92} r={4.6} fill={palette.safetyYellow} />
              <Rect x={lx + w * 0.02} y={lTop + 110} width={w * 0.066} height={18} rx={6} fill={palette.cream} />
            </G>
          );
        })}
      </G>
      {/* work shelf */}
      {shelf(w * 0.05, gy - 116, w * 0.54, palette.slate)}
      <G>
        {[0, 1, 2].map((i) => (
          <G key={`cb${i}`}>
            <Rect x={w * 0.08 + i * 66 * s} y={gy - 158} width={52 * s} height={42 * s} rx={7} fill={[palette.cream, palette.waterCyanLight, palette.tan][i]} />
            <Rect x={w * 0.08 + i * 66 * s} y={gy - 158} width={52 * s} height={10 * s} rx={5} fill={HILITE} />
            <Rect x={w * 0.09 + i * 66 * s} y={gy - 140} width={34 * s} height={6 * s} rx={3} fill={SHADE} />
          </G>
        ))}
      </G>
      {groundPlane(w, h, gy, grounds['store-room'].near, grounds['store-room'].lip)}
      <G opacity={0.4}>
        {Array.from({ length: Math.ceil(w / 70) + 1 }, (_, c) => (
          <Rect key={`fs${c}`} x={c * 70} y={gy + 12} width={4} height={h - gy} fill="#9AA3BC" />
        ))}
      </G>
      {cone(w * 0.9, gy + 66, s * 0.9)}
    </G>
  );
}

function towerArt(w: number, h: number, gy: number, s: number) {
  const towerW = Math.min(w * 0.62, 232 * s);
  const tx = (w - towerW) / 2;
  const top = Math.max(24, gy - 420 * s);
  return (
    <G>
      {skylineBand(w, gy - 116 * s, '#7FB6E4', 6)}
      {building({ x: -26, w: 116 * s, top: gy - 168 * s, wall: '#F2DCB6', roof: '#4A5FA8', rows: 2, cols: 1 }, gy, 'tw1')}
      {building({ x: w - 92 * s, w: 124 * s, top: gy - 150 * s, wall: '#EED6BA', roof: palette.engineRed, rows: 2, cols: 1 }, gy, 'tw2')}
      {/* the clock tower itself */}
      <G>
        {contact(tx + towerW / 2, gy + 8, towerW * 0.6)}
        <Rect x={tx} y={top + 46} width={towerW} height={gy - top - 46} rx={10} fill="#F0E3C6" />
        <Rect x={tx} y={top + 46} width={towerW * 0.17} height={gy - top - 46} fill={HILITE_SOFT} />
        <Path d={`M ${tx + towerW * 0.83} ${top + 46} L ${tx + towerW} ${top + 58} L ${tx + towerW} ${gy} L ${tx + towerW * 0.83} ${gy} Z`} fill={SHADE} />
        {/* roof */}
        <Path d={`M ${tx - 14} ${top + 50} L ${tx + towerW / 2} ${top - 12} L ${tx + towerW + 14} ${top + 50} Z`} fill="#4A5FA8" />
        <Rect x={tx - 18} y={top + 42} width={towerW + 36} height={14} rx={7} fill="#33478A" />
        {/* cornice bands */}
        <Rect x={tx - 6} y={gy - 78 * s} width={towerW + 12} height={13} rx={6} fill="#DCC79F" />
        <Rect x={tx - 6} y={gy - 78 * s + 13} width={towerW + 12} height={5} rx={2.5} fill={SHADE} />
        {/* arched windows */}
        {[0, 1].map((i) => (
          <G key={`aw${i}`}>
            <Path
              d={`M ${tx + towerW * (0.24 + i * 0.4)} ${gy - 44 * s} v ${-30 * s} a ${16 * s} ${16 * s} 0 0 1 ${32 * s} 0 v ${30 * s} z`}
              fill="#33477A"
            />
            <Rect x={tx + towerW * (0.24 + i * 0.4) - 5} y={gy - 44 * s} width={32 * s + 10} height={6} rx={3} fill={SHADE} />
          </G>
        ))}
        {/* the ledge Luna sits on */}
        <Rect x={tx - 12} y={top + 116} width={towerW + 24} height={12} rx={6} fill="#DCC79F" />
        <Rect x={tx - 12} y={top + 126} width={towerW + 24} height={5} rx={2.5} fill={SHADE} />
      </G>
      {groundPlane(w, h, gy, grounds.tower.near, grounds.tower.lip)}
      <Rect x={0} y={gy + 62} width={w} height={Math.max(0, h - gy - 62)} fill="#8E96AE" />
      <Rect x={0} y={gy + 62} width={w} height={7} rx={3.5} fill="#E7EBF4" />
      {lampPost(w * 0.1, gy + 4, 150 * s)}
      {tree(w * 0.92, gy + 10, s * 0.95)}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Static art switch                                                   */
/* ------------------------------------------------------------------ */

const StageArt = memo(function StageArt({ variant, w, h, gh }: { variant: StageVariant; w: number; h: number; gh: number }) {
  const g = grounds[variant];
  const gy = h - gh;
  const s = Math.max(0.7, Math.min(1.3, w / 390));
  const outdoor = variant === 'street' || variant === 'yard' || variant === 'park' || variant === 'stall' || variant === 'tower';
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="stage-haze" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={g.haze} stopOpacity={0} />
          <Stop offset="1" stopColor={g.haze} stopOpacity={0.92} />
        </LinearGradient>
      </Defs>
      {outdoor ? <Rect x={0} y={Math.max(0, gy - 210)} width={w} height={210} fill="url(#stage-haze)" /> : null}
      {variant === 'street' ? streetArt(w, h, gy, s) : null}
      {variant === 'yard' ? yardArt(w, h, gy, s) : null}
      {variant === 'park' ? parkArt(w, h, gy, s) : null}
      {variant === 'counter' ? counterArt(w, h, gy, s) : null}
      {variant === 'radio-room' ? radioRoomArt(w, h, gy, s) : null}
      {variant === 'classroom' ? classroomArt(w, h, gy, s) : null}
      {variant === 'pantry' ? pantryArt(w, h, gy, s) : null}
      {variant === 'stall' ? stallArt(w, h, gy, s) : null}
      {variant === 'store-room' ? storeRoomArt(w, h, gy, s) : null}
      {variant === 'tower' ? towerArt(w, h, gy, s) : null}
    </Svg>
  );
});

/* ------------------------------------------------------------------ */
/* Ambient life (rule #9) — one drifting, one swaying, per scene        */
/* ------------------------------------------------------------------ */

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

function Birds({ w, y, periodMs }: { w: number; y: number; periodMs: number }) {
  const t = useLoop(periodMs);
  const flap = usePulse(760, 0.5);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -70 + t.value * (w + 140) }, { translateY: Math.sin(t.value * Math.PI * 2) * 14 }],
  }));
  const wing = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.7 + flap.value * 0.6 }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.layer, { top: y }, style]}>
      <Animated.View style={wing}>
        <Svg width={70} height={30}>
          <Path d="M6 16 q 8 -10 15 0 q 7 -10 15 0" stroke={palette.navySoft} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.55} />
          <Path d="M40 24 q 6 -8 12 0 q 6 -8 12 0" stroke={palette.navySoft} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.4} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** A hanging object that sways from its top edge (bunting, sign, pan, plant). */
function Sway({ x, y, deg, periodMs, children }: { x: number; y: number; deg: number; periodMs: number; children: React.ReactNode }) {
  const t = useIdleBob(deg, periodMs);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${t.value}deg` }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.layer, { left: x, top: y, transformOrigin: 'top center' }, style]}>
      {children}
    </Animated.View>
  );
}

function StageLife({ variant, w, h, gh }: { variant: StageVariant; w: number; h: number; gh: number }) {
  const gy = h - gh;
  const s = Math.max(0.7, Math.min(1.3, w / 390));
  switch (variant) {
    case 'street':
    case 'tower':
      return (
        <>
          <DriftCloud w={w} y={Math.max(6, gy - 300)} size={150} periodMs={54000} />
          <Birds w={w} y={Math.max(30, gy - 250)} periodMs={26000} />
          <Sway x={w * 0.5 - 90} y={18} deg={1.6} periodMs={4200}>
            <Svg width={180} height={46}>
              <Path d="M 0 4 Q 90 30 180 4" stroke={palette.navySoft} strokeWidth={2} fill="none" opacity={0.45} />
              {[0.18, 0.36, 0.5, 0.64, 0.82].map((f, i) => {
                const px = f * 180;
                const py = 4 + Math.sin(f * Math.PI) * 24;
                const col = [palette.engineRed, palette.safetyYellow, palette.waterCyan, palette.leafGreen, palette.pink][i] ?? palette.engineRed;
                return <Path key={i} d={`M ${px - 8} ${py} L ${px + 8} ${py} L ${px} ${py + 16} Z`} fill={col} />;
              })}
            </Svg>
          </Sway>
        </>
      );
    case 'yard':
    case 'stall':
      return (
        <>
          <DriftCloud w={w} y={Math.max(6, gy - 280)} size={130} periodMs={48000} />
          <Birds w={w} y={Math.max(24, gy - 230)} periodMs={31000} />
          <Sway x={w * 0.5 - 90} y={16} deg={1.4} periodMs={4600}>
            <Svg width={180} height={44}>
              <Path d="M 0 4 Q 90 28 180 4" stroke={palette.navySoft} strokeWidth={2} fill="none" opacity={0.4} />
              {[0.2, 0.4, 0.6, 0.8].map((f, i) => {
                const px = f * 180;
                const py = 4 + Math.sin(f * Math.PI) * 22;
                const col = [palette.engineRed, palette.white, palette.safetyYellow, palette.white][i] ?? palette.engineRed;
                return <Path key={i} d={`M ${px - 8} ${py} L ${px + 8} ${py} L ${px} ${py + 15} Z`} fill={col} />;
              })}
            </Svg>
          </Sway>
        </>
      );
    case 'park':
      return (
        <>
          <DriftCloud w={w} y={Math.max(6, gy - 290)} size={160} periodMs={52000} />
          <Birds w={w} y={Math.max(24, gy - 240)} periodMs={24000} />
          <Sway x={w * 0.9 - 30} y={Math.max(30, gy - 150 * s)} deg={1.8} periodMs={3800}>
            <Svg width={60} height={54}>
              <Path d="M30 0 q -26 8 -24 30 q 12 -14 24 -12 q 12 -2 24 12 q 2 -22 -24 -30 z" fill={palette.leafGreen} opacity={0.9} />
            </Svg>
          </Sway>
        </>
      );
    case 'counter':
    case 'pantry':
      return (
        <Sway x={w * 0.3} y={44} deg={2.2} periodMs={5200}>
          <Svg width={54} height={78}>
            <Rect x={25} y={0} width={4} height={22} rx={2} fill={palette.charcoalDark} />
            <Path d="M6 22 h42 a 21 20 0 0 1 -42 0 z" fill={palette.slate} />
            <Path d="M14 28 h14 a 12 10 0 0 1 -14 0 z" fill={HILITE} />
          </Svg>
        </Sway>
      );
    case 'radio-room':
    case 'store-room':
    case 'classroom':
      return (
        <Sway x={w * 0.5 - 22} y={30} deg={2.4} periodMs={5000}>
          <Svg width={44} height={64}>
            <Rect x={20} y={0} width={4} height={20} rx={2} fill={palette.charcoalDark} />
            <Path d="M22 20 q -16 12 -14 26 q 10 -10 14 -8 q 6 -2 14 8 q 2 -14 -14 -26 z" fill={palette.leafGreen} opacity={0.9} />
          </Svg>
        </Sway>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Stage                                                               */
/* ------------------------------------------------------------------ */

/**
 * Absolutely fills its parent and draws the scene behind whatever the parent
 * renders next. Games pass it to `GameShell`/`GameFrame`'s `backdrop` slot;
 * screens can drop it in as the first child of a relative container.
 */
export function Stage({ variant = 'street', groundHeight, children, style, still }: StageProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((p) => (Math.abs(p.w - width) < 1 && Math.abs(p.h - height) < 1 ? p : { w: width, h: height }));
  }, []);

  const gh = useMemo(() => {
    const base = groundHeight ?? grounds[variant].ground;
    // never let the ground plane eat more than half of a short box
    return Math.max(0, Math.min(base, box.h * 0.42));
  }, [box.h, groundHeight, variant]);

  const ready = box.w > 4 && box.h > 4 && variant !== 'sky';

  return (
    <View style={[styles.root, style]} pointerEvents="box-none" onLayout={onLayout}>
      {ready ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <StageArt variant={variant} w={box.w} h={box.h} gh={gh} />
          {still ? null : <StageLife variant={variant} w={box.w} h={box.h} gh={gh} />}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** The navy contact shadow every grounded object gets (consistency rule #3). */
export function ContactShadow({ width, height, opacity = CONTACT, style }: { width: number; height?: number; opacity?: number; style?: StyleProp<ViewStyle> }) {
  const h = height ?? Math.max(6, width * 0.22);
  return (
    <Svg width={width} height={h} style={style} pointerEvents="none">
      <Ellipse cx={width / 2} cy={h / 2} rx={width / 2} ry={h / 2} fill={palette.navy} opacity={opacity} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  layer: { position: 'absolute' },
});
