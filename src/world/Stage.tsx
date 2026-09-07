/**
 * STAGE — the shared backdrop every scene and mini-game stands on.
 *
 * **Four depth planes, and no gaps between them.** Sky furniture (a flat cloud
 * bank, gulls, a kite) → far distance (hills and `farSkyline`, the palest and
 * flattest layer) → middle distance (`midTerrace` outdoors, wall furniture
 * indoors) → the near ground plane with its soft lip and its dressing. The
 * blandest thing a backdrop can do is leave a band of raw sky or raw paint
 * across the middle of the frame, so every layer's fill runs down to the one
 * in front of it and something is happening at every height.
 *
 * Contrast, not detail, keeps the play area legible: each plane is one value
 * step darker and crisper than the one behind it, and the near plane is the
 * only one allowed a saturated hue. Signage, bunting and skyline stay in the
 * top band; kerbs, props and plants in the bottom; the middle carries only
 * quiet, low-contrast mass.
 *
 * House rules obeyed here: no outlines, three tones per object (base → navy
 * 14 % shade → white 32 % highlight), a navy contact ellipse under everything
 * that touches the ground, radii from `@/theme`, no emoji, ≤ 5 hues plus
 * neutrals per composition, one ground plane with a soft lip, 2.5D buildings,
 * and at least one drifting + one swaying element per scene (reduced-motion
 * aware). Everything static is memoized; only two or three nodes animate, and
 * repeated small shapes (window grids, banding, cobbles, tiles, floorboards)
 * are concatenated into a single `Path` so shape count stays inside budget —
 * roughly 400 nodes for the busiest variant on a phone.
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
const SHADE_DEEP = 'rgba(31,42,90,0.22)';
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
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * A stable 0..1 from two integers. Variety in a row of buildings has to be
 * deterministic (the art is memoized and must not shimmer between renders) but
 * it must not read as a pattern either — hence a hash rather than `i % 3`.
 */
function vary(i: number, salt: number): number {
  const n = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * One rectangle expressed as path data. Repeated small shapes — window grids,
 * brick banding, cobbles, floor boards — are concatenated into a single `Path`
 * so a hundred of them cost one node instead of a hundred (these backdrops
 * render behind every game, so shape count is a budget, not a detail).
 */
function rp(x: number, y: number, w: number, h: number): string {
  return `M ${x.toFixed(1)} ${y.toFixed(1)} h ${w.toFixed(1)} v ${h.toFixed(1)} h ${(-w).toFixed(1)} z`;
}

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

/* ------------------------------------------------------------------ */
/* Far distance — hills, cloud banks, skyline                          */
/* ------------------------------------------------------------------ */

/**
 * A soft rolling ridge. `amp` is how far the crest wanders below `y`; the fill
 * always runs all the way down to `bottom`, because a far layer that stops
 * short leaves a stripe of raw sky sitting on the ground — which is exactly
 * what used to read as a river across the middle of the park.
 */
function hillRidge(w: number, y: number, amp: number, bottom: number, tint: string, seed: number, opacity = 1) {
  const a = 0.2 + vary(seed, 3) * 0.22;
  const b = 0.62 + vary(seed + 1, 4) * 0.26;
  const d =
    `M -12 ${bottom} L -12 ${y + amp * 0.62} ` +
    `Q ${w * 0.16} ${y + amp * a} ${w * 0.38} ${y + amp * 0.5} ` +
    `Q ${w * 0.56} ${y + amp * b} ${w * 0.74} ${y + amp * 0.34} ` +
    `Q ${w * 0.9} ${y + amp * (a * 0.6)} ${w + 12} ${y + amp * 0.58} ` +
    `L ${w + 12} ${bottom} Z`;
  return <Path d={d} fill={tint} opacity={opacity} />;
}

/** A flat cloud bank — static, pale and shadowless, to break an empty sky. */
function cloudBank(cx: number, cy: number, s: number, opacity: number) {
  return (
    <G opacity={opacity}>
      <Ellipse cx={cx} cy={cy} rx={54 * s} ry={16 * s} fill={palette.white} />
      <Ellipse cx={cx - 26 * s} cy={cy + 3 * s} rx={30 * s} ry={12 * s} fill={palette.white} />
      <Ellipse cx={cx + 30 * s} cy={cy + 4 * s} rx={26 * s} ry={11 * s} fill={palette.white} />
      <Ellipse cx={cx + 6 * s} cy={cy - 10 * s} rx={28 * s} ry={14 * s} fill={palette.white} />
    </G>
  );
}

/** Two or three gulls, drawn as pen strokes, far enough away to be scenery. */
function farBirds(x: number, y: number, s: number, opacity = 0.34) {
  const d =
    `M ${x} ${y} q ${5 * s} ${-6 * s} ${10 * s} 0 q ${5 * s} ${-6 * s} ${10 * s} 0 ` +
    `M ${x + 26 * s} ${y + 13 * s} q ${4 * s} ${-5 * s} ${8 * s} 0 q ${4 * s} ${-5 * s} ${8 * s} 0 ` +
    `M ${x + 6 * s} ${y + 24 * s} q ${3.4 * s} ${-4 * s} ${6.8 * s} 0 q ${3.4 * s} ${-4 * s} ${6.8 * s} 0`;
  return <Path d={d} stroke={palette.navySoft} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" opacity={opacity} />;
}

/**
 * THE DISTANT TOWN. A pale, low-contrast band of rooftops with real
 * architecture: parapets, gables, stepped gables, mansards, a water tower, a
 * spire, a dome and a clock — so a row never reads as one rectangle repeated.
 * Depth here is *value*, not detail: this is the palest, flattest layer, and
 * every window in it is batched into one path.
 */
function farSkyline(w: number, baseY: number, seed: number, tint: string, light: string, opacity = 0.5) {
  const nodes: React.ReactElement[] = [];
  let caps = '';
  let wins = '';
  let x = -26;
  let i = 0;
  while (x < w + 24 && i < 22) {
    const bw = 34 + Math.round(vary(i, seed) * 46);
    const bh = 38 + Math.round(vary(i + 5, seed) * 96);
    const top = baseY - bh;
    const kind = Math.floor(vary(i + 11, seed) * 6);
    nodes.push(<Rect key={`fb${i}`} x={x} y={top} width={bw} height={bh + 34} rx={4} fill={i % 3 === 1 ? light : tint} />);
    if (kind === 0) {
      /* parapet with a capping course */
      caps += rp(x - 3, top - 7, bw + 6, 9);
    } else if (kind === 1) {
      /* pitched roof */
      nodes.push(<Path key={`fr${i}`} d={`M ${x - 5} ${top + 3} L ${x + bw / 2} ${top - 21} L ${x + bw + 5} ${top + 3} Z`} fill={tint} />);
      caps += rp(x + bw * 0.62, top - 16, 8, 18);
    } else if (kind === 2) {
      /* stepped gable */
      caps += rp(x, top - 8, bw, 9) + rp(x + bw * 0.17, top - 16, bw * 0.66, 9) + rp(x + bw * 0.34, top - 24, bw * 0.32, 9);
    } else if (kind === 3) {
      /* flat roof carrying a water tower */
      caps += rp(x - 2, top - 5, bw + 4, 7);
      nodes.push(
        <G key={`fw${i}`}>
          <Rect x={x + bw * 0.24} y={top - 30} width={bw * 0.5} height={17} rx={6} fill={tint} />
          <Path d={`M ${x + bw * 0.24} ${top - 30} h ${bw * 0.5} l ${-bw * 0.08} -8 h ${-bw * 0.34} z`} fill={tint} />
        </G>,
      );
      caps += rp(x + bw * 0.3, top - 13, 4, 9) + rp(x + bw * 0.62, top - 13, 4, 9);
    } else if (kind === 4) {
      /* mansard */
      nodes.push(<Path key={`fm${i}`} d={`M ${x - 4} ${top + 2} L ${x + bw * 0.2} ${top - 17} L ${x + bw * 0.8} ${top - 17} L ${x + bw + 4} ${top + 2} Z`} fill={tint} />);
      caps += rp(x + bw * 0.4, top - 24, bw * 0.2, 8);
    } else {
      /* flat roof with a slim antenna mast */
      caps += rp(x - 2, top - 5, bw + 4, 7) + rp(x + bw * 0.5, top - 30, 3, 26);
    }
    /* faint window grid, batched — with about a fifth of the panes left out so
       the face reads as a building rather than as graph paper */
    const cols = bw > 58 ? 3 : 2;
    const rows = Math.min(4, Math.max(1, Math.floor(bh / 28)));
    const cw = (bw - 10) / (cols * 2 - 1);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (vary(i * 17 + r * 5 + c, seed + 9) < 0.22) continue;
        wins += rp(x + 5 + c * cw * 2, top + 13 + r * 24, cw, 12);
      }
    }
    /* a plinth course along the pavement, so nothing ends as a bare rectangle */
    caps += rp(x - 2, baseY - 12, bw + 4, 7);
    x += bw + 4 + Math.round(vary(i + 17, seed) * 12);
    i += 1;
  }
  /* two landmarks so the horizon has somewhere to look */
  const cx = w * 0.63;
  const dx = w * 0.19;
  return (
    <G opacity={opacity}>
      {nodes}
      <Path d={caps} fill={tint} />
      {/* domed hall */}
      <G>
        <Rect x={dx - 30} y={baseY - 62} width={60} height={96} rx={5} fill={light} />
        <Path d={`M ${dx - 32} ${baseY - 62} a 32 30 0 0 1 64 0 z`} fill={tint} />
        <Path d={`M ${dx - 2} ${baseY - 98} h 4 v -10 h -4 z`} fill={tint} />
      </G>
      {/* clock tower */}
      <G>
        <Rect x={cx - 15} y={baseY - 128} width={30} height={162} rx={5} fill={light} />
        <Path d={`M ${cx - 20} ${baseY - 126} L ${cx} ${baseY - 158} L ${cx + 20} ${baseY - 126} Z`} fill={tint} />
        <Circle cx={cx} cy={baseY - 106} r={10} fill={palette.cream} opacity={0.75} />
        <Path d={`M ${cx} ${baseY - 106} v -6 M ${cx} ${baseY - 106} h 5`} stroke={tint} strokeWidth={2} strokeLinecap="round" />
      </G>
      <Path d={wins} fill={palette.cream} opacity={0.42} />
    </G>
  );
}

/**
 * The middle distance: a terrace of little shops between the far haze and the
 * near buildings. Warmer and crisper than the skyline, paler and simpler than
 * the near façades — that value ladder is what makes the street read as deep.
 */
function midTerrace(w: number, baseY: number, seed: number, opacity = 0.82, minH = 92, varH = 72) {
  const walls = ['#F0DCBB', '#E9D3BF', '#F5E4C6', '#E2D5C1', '#EEDCC8', '#F2E0C0'] as const;
  const roofs = ['#C4776A', '#6E7FB8', '#6EA472', '#C9946A', '#8D7AAE', '#B96F62'] as const;
  const awns = [palette.engineRed, '#3E8FBF', '#4E9E5C', '#C9863B', '#8E76C0'] as const;
  const out: React.ReactElement[] = [];
  let x = -20;
  let i = 0;
  while (x < w + 12 && i < 12) {
    const bw = 78 + Math.round(vary(i, seed + 2) * 44);
    const bh = minH + Math.round(vary(i + 6, seed + 2) * varH);
    const top = baseY - bh;
    const wall = walls[i % walls.length] ?? '#F0DCBB';
    const roof = roofs[(i * 2 + seed) % roofs.length] ?? '#C4776A';
    const awn = awns[(i + seed) % awns.length] ?? palette.engineRed;
    const pitched = vary(i + 21, seed) > 0.45;
    const chim = vary(i + 31, seed) > 0.4;
    out.push(
      <G key={`mt${i}`}>
        <Rect x={x} y={top} width={bw} height={bh + 22} rx={5} fill={wall} />
        <Rect x={x} y={top} width={bw * 0.16} height={bh + 22} fill={HILITE_SOFT} />
        {chim ? <Rect x={x + bw * 0.68} y={top - 24} width={13} height={26} rx={3} fill={roof} /> : null}
        {pitched ? (
          <Path d={`M ${x - 7} ${top + 4} L ${x + bw / 2} ${top - 20} L ${x + bw + 7} ${top + 4} Z`} fill={roof} />
        ) : (
          <G>
            <Rect x={x - 6} y={top - 9} width={bw + 12} height={13} rx={5} fill={roof} />
            <Rect x={x - 6} y={top + 1} width={bw + 12} height={5} rx={2.5} fill={SHADE} />
          </G>
        )}
        {/* two upper windows with sills */}
        <Path d={rp(x + bw * 0.14, top + 20, bw * 0.26, 22) + rp(x + bw * 0.58, top + 20, bw * 0.26, 22)} fill="#4A5C8E" opacity={0.75} />
        <Path d={rp(x + bw * 0.11, top + 43, bw * 0.32, 4) + rp(x + bw * 0.55, top + 43, bw * 0.32, 4)} fill={SHADE} />
        {/* shopfront: awning, window, door, signage plate */}
        <Rect x={x + 5} y={baseY - 46} width={bw - 10} height={13} rx={5} fill={palette.cream} />
        <Path d={`M ${x + 2} ${baseY - 33} h ${bw - 4} l -5 15 h ${-(bw - 14)} z`} fill={awn} />
        <Path d={rp(x + 10, baseY - 16, bw * 0.44, 16) + rp(x + bw * 0.62, baseY - 18, bw * 0.24, 18)} fill="#4A5C8E" opacity={0.6} />
      </G>,
    );
    x += bw + 3;
    i += 1;
  }
  return <G opacity={opacity}>{out}</G>;
}

/* ------------------------------------------------------------------ */
/* Near buildings — the town's character                               */
/* ------------------------------------------------------------------ */

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
  /** roof shape — flat parapet, pitched, stepped gable or mansard */
  cap?: 'flat' | 'pitch' | 'step' | 'mansard';
  /** shutters on the top row of windows */
  shutters?: boolean;
  /** window boxes of geraniums under the middle row */
  boxes?: boolean;
  /** a small balcony across the first floor */
  balcony?: boolean;
  chimney?: boolean;
  /** drainpipe down one side */
  pipe?: 'left' | 'right' | 'none';
  /** horizontal brick string courses */
  band?: boolean;
  /** what hangs off the shopfront */
  sign?: 'board' | 'hanging' | 'clock' | 'barber' | 'none';
  /** air-conditioning box bolted to the wall */
  ac?: boolean;
  /** ground-floor shopfront with a door and a display window */
  shop?: boolean;
}

/**
 * A 2.5D neighbour building (rule #8). Front plane, shaded side plane, a
 * roofline with real character, recessed windows with sills — and then the
 * things that make a street a street rather than a row of boxes: shutters,
 * window boxes, a balcony, a drainpipe, brick banding, an air-con unit, a
 * chimney, a shopfront with an awning, and one piece of signage (a board, a
 * hanging sign, a clock or a barber's pole).
 *
 * Light comes from the left in every variant, so the lit strip is always on
 * the left of the front plane and the shaded plane is always on the right.
 */
function building(b: BuildingSpec, gy: number, key: string) {
  const { x, w, top, wall, roof } = b;
  const h = gy - top;
  const side = Math.max(10, w * 0.13);
  const fw = w - side;
  const rows = b.rows ?? 3;
  const cols = b.cols ?? 2;
  const cap = b.cap ?? 'flat';
  const shop = b.shop ?? true;
  const sill = shop ? 46 : 22;
  const winW = fw / (cols + 1);
  const winH = Math.min(30, (h - 46) / (rows + 1));
  const wins: React.ReactElement[] = [];
  let sills = '';
  let panes = '';
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const wx = x + winW * 0.5 + c * winW * 1.35;
      const wy = top + 34 + r * (winH + 20);
      if (wy + winH > gy - sill) continue;
      const ww = winW * 0.78;
      panes += rp(wx, wy, ww, winH);
      sills += rp(wx - 5, wy + winH + 1, ww + 10, 5);
      wins.push(
        <G key={`w${r}-${c}`}>
          <Rect x={wx - 3} y={wy - 3} width={ww + 6} height={winH + 6} rx={7} fill={HILITE_SOFT} />
          <Path d={`M ${wx + 2} ${wy + winH - 2} L ${wx + ww * 0.58} ${wy + 2} L ${wx + ww * 0.8} ${wy + 2} L ${wx + ww * 0.26} ${wy + winH - 2} Z`} fill={palette.white} opacity={0.18} />
          {b.shutters && r === 0 ? (
            <Path d={rp(wx - 9, wy - 2, 7, winH + 4) + rp(wx + ww + 2, wy - 2, 7, winH + 4)} fill={b.awningA ?? palette.engineRed} opacity={0.9} />
          ) : null}
          {b.boxes && r === 1 ? (
            <G>
              <Rect x={wx - 3} y={wy + winH + 4} width={ww + 6} height={9} rx={3} fill={palette.woodDark} />
              <Circle cx={wx + ww * 0.24} cy={wy + winH + 3} r={5} fill={palette.leafGreen} />
              <Circle cx={wx + ww * 0.54} cy={wy + winH + 1} r={5.4} fill={palette.pink} />
              <Circle cx={wx + ww * 0.82} cy={wy + winH + 3} r={4.6} fill={palette.leafGreenDark} />
            </G>
          ) : null}
          {b.awning === 'stripe' && r === 0 ? (
            <G>
              <Path d={`M ${wx - 6} ${wy - 4} h ${ww + 12} l -3 12 h ${-(ww + 6)} z`} fill={b.awningA ?? palette.engineRed} />
              <Rect x={wx + ww * 0.26} y={wy - 4} width={ww * 0.24} height={12} fill={palette.white} opacity={0.85} />
            </G>
          ) : null}
        </G>,
      );
    }
  }
  /* roofline */
  const roofArt =
    cap === 'pitch' ? (
      <G>
        <Path d={`M ${x - 12} ${top + 12} L ${x + w / 2} ${top - 26} L ${x + w + 12} ${top + 12} Z`} fill={roof} />
        <Path d={`M ${x - 12} ${top + 12} L ${x + w / 2} ${top - 26} L ${x + w / 2} ${top + 12} Z`} fill={HILITE_SOFT} />
        <Rect x={x - 12} y={top + 8} width={w + 24} height={10} rx={5} fill={roof} />
        <Rect x={x - 12} y={top + 15} width={w + 24} height={5} rx={2.5} fill={SHADE} />
      </G>
    ) : cap === 'step' ? (
      <G>
        <Rect x={x - 6} y={top} width={w + 10} height={14} rx={6} fill={roof} />
        <Rect x={x + w * 0.16} y={top - 11} width={w * 0.68} height={13} rx={5} fill={roof} />
        <Rect x={x + w * 0.33} y={top - 21} width={w * 0.34} height={12} rx={5} fill={roof} />
        <Rect x={x - 6} y={top + 10} width={w + 10} height={6} rx={3} fill={SHADE} />
      </G>
    ) : cap === 'mansard' ? (
      <G>
        <Path d={`M ${x - 8} ${top + 12} L ${x + w * 0.18} ${top - 20} L ${x + w * 0.82} ${top - 20} L ${x + w + 8} ${top + 12} Z`} fill={roof} />
        <Rect x={x + w * 0.34} y={top - 16} width={w * 0.3} height={14} rx={5} fill={palette.cream} opacity={0.8} />
        <Rect x={x - 8} y={top + 8} width={w + 16} height={10} rx={5} fill={roof} />
        <Rect x={x - 8} y={top + 15} width={w + 16} height={5} rx={2.5} fill={SHADE} />
      </G>
    ) : (
      <G>
        <Rect x={x - 6} y={top} width={w + 10} height={14} rx={6} fill={roof} />
        <Rect x={x - 6} y={top + 10} width={w + 10} height={6} rx={3} fill={SHADE} />
        <Rect x={x - 2} y={top + 1} width={w * 0.5} height={4} rx={2} fill={HILITE} />
      </G>
    );
  const pipeX = b.pipe === 'left' ? x + 5 : x + fw - 9;
  return (
    <G key={key}>
      {contact(x + w / 2, gy + 8, w * 0.56)}
      {/* shaded side plane */}
      <Path d={`M ${x + fw} ${top + 8} L ${x + w} ${top + 18} L ${x + w} ${gy} L ${x + fw} ${gy} Z`} fill={wall} />
      <Path d={`M ${x + fw} ${top + 8} L ${x + w} ${top + 18} L ${x + w} ${gy} L ${x + fw} ${gy} Z`} fill={SHADE} />
      {/* front plane, lit from the left */}
      <Rect x={x} y={top + 8} width={fw} height={h - 8} rx={6} fill={wall} />
      <Rect x={x} y={top + 8} width={fw * 0.16} height={h - 8} fill={HILITE_SOFT} />
      {b.band ? (
        <Path
          d={rp(x, top + 30, fw, 5) + rp(x, top + h * 0.46, fw, 5) + rp(x, gy - sill - 16, fw, 5)}
          fill={SHADE_SOFT}
        />
      ) : null}
      {b.chimney ? (
        <G>
          <Rect x={x + w * 0.68} y={top - 34} width={19} height={40} rx={4} fill={roof} />
          <Rect x={x + w * 0.68} y={top - 34} width={6} height={40} fill={HILITE_SOFT} />
          <Rect x={x + w * 0.68 - 4} y={top - 40} width={27} height={9} rx={4} fill={palette.charcoal} opacity={0.55} />
        </G>
      ) : null}
      {roofArt}
      {wins}
      <Path d={panes} fill="#33477A" />
      <Path d={sills} fill={SHADE} />
      {b.pipe && b.pipe !== 'none' ? (
        <G>
          <Rect x={pipeX} y={top + 18} width={5} height={h - 26 - sill} rx={2.5} fill={SHADE} />
          <Rect x={pipeX - 2} y={top + 18} width={9} height={7} rx={3} fill={SHADE_DEEP} />
          <Rect x={pipeX - 2} y={gy - sill - 14} width={9} height={7} rx={3} fill={SHADE_DEEP} />
        </G>
      ) : null}
      {b.balcony ? (
        <G>
          <Rect x={x + fw * 0.12} y={top + 34 + winH + 12} width={fw * 0.76} height={7} rx={3} fill={palette.slateLight} />
          <Rect x={x + fw * 0.12} y={top + 34 + winH + 12} width={fw * 0.76} height={3} rx={1.5} fill={HILITE} />
          <Path
            d={`M ${x + fw * 0.14} ${top + 34 + winH + 12} v -14 M ${x + fw * 0.34} ${top + 34 + winH + 12} v -14 M ${x + fw * 0.54} ${top + 34 + winH + 12} v -14 M ${x + fw * 0.74} ${top + 34 + winH + 12} v -14 M ${x + fw * 0.86} ${top + 34 + winH + 12} v -14`}
            stroke={palette.slate}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Rect x={x + fw * 0.12} y={top + 34 + winH - 4} width={fw * 0.76} height={5} rx={2.5} fill={palette.slateLight} />
        </G>
      ) : null}
      {b.ac ? (
        <G>
          <Rect x={x + fw * 0.72} y={top + h * 0.38} width={24} height={17} rx={4} fill={palette.slateLight} />
          <Rect x={x + fw * 0.72} y={top + h * 0.38} width={24} height={5} rx={2.5} fill={HILITE} />
          <Circle cx={x + fw * 0.72 + 12} cy={top + h * 0.38 + 10} r={5} fill={palette.slate} />
          <Rect x={x + fw * 0.72 + 2} y={top + h * 0.38 + 17} width={20} height={4} rx={2} fill={SHADE} />
        </G>
      ) : null}
      {shop ? (
        <G>
          {/* stall riser, display window and door */}
          <Rect x={x + 4} y={gy - 44} width={fw - 8} height={44} rx={5} fill={wall} />
          <Rect x={x + 4} y={gy - 44} width={fw - 8} height={5} rx={2.5} fill={SHADE_SOFT} />
          <Rect x={x + fw * 0.08} y={gy - 34} width={fw * 0.42} height={30} rx={5} fill="#3D6FB0" />
          <Path d={`M ${x + fw * 0.1} ${gy - 8} L ${x + fw * 0.34} ${gy - 32} L ${x + fw * 0.44} ${gy - 32} L ${x + fw * 0.2} ${gy - 8} Z`} fill={palette.white} opacity={0.2} />
          <Rect x={x + fw * 0.6} y={gy - 38} width={fw * 0.26} height={38} rx={5} fill={palette.woodDark} />
          <Rect x={x + fw * 0.63} y={gy - 33} width={fw * 0.2} height={20} rx={4} fill="#3D6FB0" />
          <Circle cx={x + fw * 0.82} cy={gy - 18} r={3} fill={palette.gold} />
          {b.awning !== 'none' ? (
            <G>
              <Path d={`M ${x + 2} ${gy - 48} h ${fw - 4} l -6 17 h ${-(fw - 16)} z`} fill={b.awningA ?? palette.engineRed} />
              <Path
                d={`M ${x + fw * 0.2} ${gy - 48} l -3 17 h 11 l 3 -17 z M ${x + fw * 0.52} ${gy - 48} l -3 17 h 11 l 3 -17 z`}
                fill={palette.white}
                opacity={0.85}
              />
              <Rect x={x + 2} y={gy - 51} width={fw - 4} height={6} rx={3} fill={SHADE} />
            </G>
          ) : null}
          {/* signage plate above the awning */}
          <Rect x={x + fw * 0.12} y={gy - 68} width={fw * 0.76} height={16} rx={7} fill={palette.cream} />
          <Rect x={x + fw * 0.16} y={gy - 64} width={fw * 0.4} height={5} rx={2.5} fill={palette.navyMuted} opacity={0.45} />
        </G>
      ) : null}
      {b.sign === 'hanging' ? (
        <G>
          <Rect x={x + fw * 0.78} y={gy - 96} width={22} height={5} rx={2.5} fill={palette.charcoal} />
          <Rect x={x + fw * 0.78 + 18} y={gy - 94} width={4} height={13} rx={2} fill={palette.charcoal} />
          <Rect x={x + fw * 0.78 + 6} y={gy - 82} width={30} height={22} rx={6} fill={palette.creamDeep} />
          <Circle cx={x + fw * 0.78 + 21} cy={gy - 71} r={7} fill={b.awningA ?? palette.engineRed} opacity={0.8} />
        </G>
      ) : b.sign === 'clock' ? (
        <G>
          <Rect x={x + fw * 0.42} y={gy - 100} width={5} height={12} rx={2.5} fill={palette.charcoal} />
          <Circle cx={x + fw * 0.44} cy={gy - 74} r={16} fill={palette.charcoal} />
          <Circle cx={x + fw * 0.44} cy={gy - 74} r={12} fill={palette.cream} />
          <Path d={`M ${x + fw * 0.44} ${gy - 74} v -8 M ${x + fw * 0.44} ${gy - 74} h 6`} stroke={palette.navy} strokeWidth={2.4} strokeLinecap="round" />
        </G>
      ) : b.sign === 'barber' ? (
        <G>
          <Rect x={x + fw * 0.86} y={gy - 96} width={12} height={44} rx={6} fill={palette.white} />
          <Path
            d={`M ${x + fw * 0.86} ${gy - 86} h 12 v 6 h -12 z M ${x + fw * 0.86} ${gy - 74} h 12 v 6 h -12 z M ${x + fw * 0.86} ${gy - 62} h 12 v 6 h -12 z`}
            fill={palette.engineRed}
          />
          <Rect x={x + fw * 0.86 - 2} y={gy - 100} width={16} height={7} rx={3} fill={palette.slateLight} />
          <Rect x={x + fw * 0.86 - 2} y={gy - 55} width={16} height={7} rx={3} fill={palette.slateLight} />
        </G>
      ) : b.sign === 'board' ? (
        <G>
          <Rect x={x + fw * 0.06} y={gy - 30} width={26} height={30} rx={5} fill={palette.woodDark} />
          <Rect x={x + fw * 0.06 + 3} y={gy - 27} width={20} height={22} rx={4} fill="#2E3A46" />
          <Rect x={x + fw * 0.06 + 6} y={gy - 22} width={14} height={3} rx={1.5} fill={palette.white} opacity={0.7} />
          <Rect x={x + fw * 0.06 + 6} y={gy - 16} width={10} height={3} rx={1.5} fill={palette.white} opacity={0.55} />
        </G>
      ) : null}
      {/* soffit shadow onto the wall */}
      <Rect x={x} y={top + 16} width={fw} height={5} rx={2.5} fill={SHADE_SOFT} />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Street furniture                                                    */
/* ------------------------------------------------------------------ */

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

/**
 * A telegraph pole with two wires running off both sides and a bird sitting on
 * one. Wires are the cheapest way to give an empty upper sky a scale — three
 * nodes, no motion.
 */
function wirePole(x: number, gy: number, hgt: number, w: number) {
  const top = gy - hgt;
  return (
    <G opacity={0.5}>
      {contact(x, gy + 3, 12)}
      <Rect x={x - 5} y={top} width={10} height={hgt} rx={4} fill={palette.woodDark} />
      <Rect x={x - 5} y={top} width={3.4} height={hgt} fill={HILITE_SOFT} />
      <Rect x={x - 22} y={top + 14} width={44} height={6} rx={3} fill={palette.woodDark} />
      <Rect x={x - 17} y={top + 34} width={34} height={5} rx={2.5} fill={palette.woodDark} />
      <Path
        d={rp(x - 21, top + 9, 5, 6) + rp(x - 2, top + 9, 5, 6) + rp(x + 17, top + 9, 5, 6) + rp(x - 16, top + 30, 4, 5) + rp(x + 13, top + 30, 4, 5)}
        fill={palette.slateLight}
      />
      <Path
        d={`M ${x - 22} ${top + 17} Q ${(x - 22) / 2} ${top + 54} -20 ${top + 32} M ${x + 22} ${top + 17} Q ${(x + 22 + w) / 2} ${top + 56} ${w + 20} ${top + 30} M ${x - 17} ${top + 37} Q ${(x - 17) / 2} ${top + 70} -20 ${top + 52} M ${x + 17} ${top + 37} Q ${(x + 17 + w) / 2} ${top + 72} ${w + 20} ${top + 50}`}
        stroke={palette.navySoft}
        strokeWidth={2.2}
        fill="none"
        opacity={0.5}
      />
      <G opacity={0.75}>
        <Ellipse cx={x + 36} cy={top + 31} rx={7} ry={5} fill={palette.navySoft} />
        <Circle cx={x + 42} cy={top + 27} r={3.6} fill={palette.navySoft} />
        <Path d={`M ${x + 45} ${top + 27} l 5 1 l -5 2 z`} fill={palette.gold} />
        <Path d={`M ${x + 29} ${top + 30} l -8 -4 l 7 6 z`} fill={palette.navySoft} />
      </G>
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

/** A clipped hedge with a rounded top — the quiet way to close a composition. */
function hedge(x: number, gy: number, w: number, hgt: number, back: string, front: string) {
  return (
    <G>
      <Path d={`M ${x} ${gy} v ${-hgt * 0.6} q ${w * 0.14} ${-hgt * 0.5} ${w * 0.3} ${-hgt * 0.1} q ${w * 0.16} ${-hgt * 0.44} ${w * 0.34} ${-hgt * 0.06} q ${w * 0.16} ${-hgt * 0.36} ${w * 0.36} ${hgt * 0.12} L ${x + w} ${gy} Z`} fill={back} />
      <Path d={`M ${x + 6} ${gy} v ${-hgt * 0.44} q ${w * 0.18} ${-hgt * 0.34} ${w * 0.36} ${-hgt * 0.04} q ${w * 0.2} ${-hgt * 0.3} ${w * 0.4} ${hgt * 0.06} L ${x + w - 6} ${gy} Z`} fill={front} />
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

/**
 * A line of pennants strung between two points. Triangles, not rectangles:
 * at backdrop scale a little rounded rect reads as a floating blob, whereas a
 * triangle on a sagging string reads as bunting from across the street.
 */
function bunting(x1: number, y1: number, x2: number, y2: number, sag: number, tints: readonly string[]) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  const n = Math.max(tints.length, Math.round(Math.abs(x2 - x1) / 52));
  const flags: React.ReactElement[] = [];
  for (let i = 1; i <= n; i += 1) {
    const t = i / (n + 1);
    /* quadratic bezier point */
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
    const c = tints[(i - 1) % tints.length] ?? palette.cream;
    flags.push(<Path key={`pn${i}`} d={`M ${px - 9} ${py} L ${px + 9} ${py} L ${px} ${py + 20} Z`} fill={c} opacity={0.92} />);
  }
  return (
    <G>
      <Path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} stroke={palette.navySoft} strokeWidth={2.4} fill="none" opacity={0.55} />
      {flags}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Interior fittings                                                   */
/* ------------------------------------------------------------------ */

/**
 * An interior wall with a dado rail: a lighter field above, a panelled field
 * below, a moulding between them and a skirting at the floor. One horizontal
 * gives a flat slab of paint a height and a scale, which is the whole reason
 * the radio room and the store room used to read as nothing.
 */
function dadoWall(w: number, gy: number, railYIn: number, upper: string, lower: string, rail: string, panels = true, skirt = true) {
  /* a very short box (a thumbnail-sized Stage) can push the rail below the
     floor; clamp it so the wainscot is always a band, never an inversion */
  const railY = Math.min(railYIn, Math.max(24, gy - 60));
  let grooves = '';
  if (panels && gy - 26 - railY - 22 > 8) {
    const n = Math.max(3, Math.round(w / 96));
    const pw = w / n;
    for (let i = 0; i < n; i += 1) {
      grooves += rp(i * pw + pw * 0.16, railY + 22, pw * 0.68, 3);
      grooves += rp(i * pw + pw * 0.16, gy - 26, pw * 0.68, 3);
      grooves += rp(i * pw + pw * 0.16, railY + 22, 3, gy - 26 - railY - 22);
      grooves += rp(i * pw + pw * 0.16 + pw * 0.68, railY + 22, 3, gy - 26 - railY - 22);
    }
  }
  return (
    <G>
      <Rect x={0} y={0} width={w} height={railY} fill={upper} />
      <Rect x={0} y={railY} width={w} height={Math.max(0, gy + 6 - railY)} fill={lower} />
      <Path d={grooves} fill={SHADE_SOFT} />
      <Rect x={0} y={railY - 9} width={w} height={11} rx={5} fill={rail} />
      <Rect x={0} y={railY - 9} width={w} height={4} rx={2} fill={HILITE} />
      <Rect x={0} y={railY + 2} width={w} height={5} fill={SHADE_SOFT} />
      {skirt ? (
        <G>
          <Rect x={0} y={gy - 16} width={w} height={18} rx={4} fill={rail} />
          <Rect x={0} y={gy - 16} width={w} height={4} rx={2} fill={HILITE} />
        </G>
      ) : null}
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

/**
 * A coat on a hook: shoulders, two sleeves, a collar notch and (for turnout
 * gear) two reflective bands. Drawn once here because three rooms hang one.
 */
function coat(cx: number, top: number, hgt: number, body: string, band?: string) {
  const cw = Math.max(30, hgt * 0.52);
  const half = cw / 2;
  const sleeveW = cw * 0.28;
  return (
    <G>
      {/* hanger */}
      <Path d={`M ${cx} ${top - 14} a 5 5 0 0 1 5 5 v 7`} stroke={palette.slate} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Path d={`M ${cx - half * 0.9} ${top + 8} L ${cx} ${top - 3} L ${cx + half * 0.9} ${top + 8} Z`} fill={palette.slate} opacity={0.55} />
      {/* body: sloped shoulders, slight taper, rounded hem */}
      <Path
        d={
          `M ${cx - half} ${top + 12} Q ${cx - half} ${top + 2} ${cx - half * 0.4} ${top + 1} ` +
          `L ${cx + half * 0.4} ${top + 1} Q ${cx + half} ${top + 2} ${cx + half} ${top + 12} ` +
          `L ${cx + half * 0.86} ${top + hgt - 6} Q ${cx + half * 0.86} ${top + hgt} ${cx + half * 0.7} ${top + hgt} ` +
          `L ${cx - half * 0.7} ${top + hgt} Q ${cx - half * 0.86} ${top + hgt} ${cx - half * 0.86} ${top + hgt - 6} Z`
        }
        fill={body}
      />
      {/* sleeves, one tone darker so they separate from the body */}
      <Rect x={cx - half - sleeveW * 0.72} y={top + 12} width={sleeveW} height={hgt * 0.56} rx={sleeveW * 0.5} fill={body} />
      <Rect x={cx + half - sleeveW * 0.28} y={top + 12} width={sleeveW} height={hgt * 0.56} rx={sleeveW * 0.5} fill={body} />
      <Rect x={cx - half - sleeveW * 0.72} y={top + 12} width={sleeveW} height={hgt * 0.56} rx={sleeveW * 0.5} fill={SHADE} />
      {/* collar notch and front seam */}
      <Path d={`M ${cx - half * 0.42} ${top + 1} L ${cx} ${top + cw * 0.3} L ${cx + half * 0.42} ${top + 1} Z`} fill={SHADE_DEEP} />
      <Rect x={cx - 1.5} y={top + cw * 0.28} width={3} height={hgt - cw * 0.32} fill={SHADE_SOFT} />
      <Rect x={cx - half} y={top + 12} width={cw * 0.16} height={hgt - 14} fill={HILITE_SOFT} />
      {band ? <Path d={rp(cx - half * 0.94, top + hgt * 0.46, cw * 0.94, 6) + rp(cx - half * 0.9, top + hgt * 0.64, cw * 0.9, 6)} fill={band} /> : null}
    </G>
  );
}

/** A framed poster: a picture block over three ruled lines, never real words. */
function poster(x: number, y: number, w: number, h: number, tint: string, frame = palette.cream) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={8} fill={frame} />
      <Rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={6} fill={tint} opacity={0.28} />
      <Circle cx={x + w * 0.5} cy={y + h * 0.36} r={Math.min(w, h) * 0.19} fill={tint} opacity={0.8} />
      <Path
        d={rp(x + w * 0.18, y + h * 0.64, w * 0.64, 5) + rp(x + w * 0.26, y + h * 0.76, w * 0.48, 5)}
        fill={palette.navyMuted}
        opacity={0.4}
      />
    </G>
  );
}

/** A cork pinboard carrying dispatch slips. */
function pinboard(x: number, y: number, w: number, h: number, slips = 4) {
  const notes: React.ReactElement[] = [];
  const cols = 2;
  const nw = (w - 24) / cols - 8;
  const nh = Math.min(46, (h - 22) / Math.ceil(slips / cols) - 8);
  for (let i = 0; i < slips; i += 1) {
    const nx = x + 12 + (i % cols) * (nw + 12);
    const ny = y + 12 + Math.floor(i / cols) * (nh + 10);
    notes.push(
      <G key={`sl${i}`}>
        <Rect x={nx} y={ny} width={nw} height={nh} rx={5} fill={i % 3 === 1 ? palette.creamDeep : palette.cream} />
        <Path d={rp(nx + 7, ny + 10, nw * 0.6, 4) + rp(nx + 7, ny + 20, nw * 0.42, 4)} fill={palette.navyMuted} opacity={0.4} />
        <Circle cx={nx + nw * 0.5} cy={ny + 4} r={3.4} fill={[palette.engineRed, palette.waterCyanDark, palette.leafGreen, palette.safetyYellow][i % 4]} />
      </G>,
    );
  }
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={10} fill="#C89A62" />
      <Rect x={x} y={y} width={w} height={h} rx={10} fill={SHADE_SOFT} />
      <Rect x={x} y={y} width={w} height={7} rx={3.5} fill={HILITE_SOFT} />
      {notes}
    </G>
  );
}

/** A serving hatch / interior window with a shelf and a shutter head. */
function hatch(x: number, y: number, w: number, h: number, inner: string) {
  return (
    <G>
      <Rect x={x - 6} y={y - 6} width={w + 12} height={h + 14} rx={10} fill={palette.creamDeep} />
      <Rect x={x} y={y} width={w} height={h} rx={7} fill={inner} />
      <Rect x={x} y={y} width={w} height={h * 0.24} rx={7} fill={SHADE_DEEP} />
      <Rect x={x - 10} y={y + h} width={w + 20} height={9} rx={4} fill={palette.wood} />
      <Rect x={x - 10} y={y + h} width={w + 20} height={3.4} rx={1.7} fill={HILITE} />
      <Rect x={x - 4} y={y - 16} width={w + 8} height={12} rx={5} fill={palette.slateLight} />
    </G>
  );
}

/** An interior window with a view: sky, a hill and a glazing bar. */
function windowView(x: number, y: number, w: number, h: number) {
  return (
    <G>
      <Rect x={x - 7} y={y - 7} width={w + 14} height={h + 14} rx={12} fill={palette.cream} />
      <Rect x={x} y={y} width={w} height={h} rx={8} fill="#BEE4FB" />
      <Path d={`M ${x} ${y + h * 0.68} q ${w * 0.24} ${-h * 0.3} ${w * 0.5} ${-h * 0.04} q ${w * 0.24} ${h * 0.22} ${w * 0.5} ${-h * 0.1} L ${x + w} ${y + h} L ${x} ${y + h} Z`} fill="#9FD2A0" />
      <Circle cx={x + w * 0.74} cy={y + h * 0.26} r={Math.min(w, h) * 0.1} fill={palette.white} opacity={0.75} />
      <Ellipse cx={x + w * 0.5} cy={y + h * 0.22} rx={w * 0.22} ry={h * 0.07} fill={palette.white} opacity={0.6} />
      <Rect x={x + w * 0.47} y={y} width={6} height={h} fill={palette.cream} />
      <Rect x={x} y={y + h * 0.46} width={w} height={6} fill={palette.cream} />
      <Rect x={x - 12} y={y + h + 5} width={w + 24} height={9} rx={4} fill={palette.creamDeep} />
      <Rect x={x - 12} y={y + h + 5} width={w + 24} height={3.4} rx={1.7} fill={HILITE} />
    </G>
  );
}

/** A flat oval rug, so an interior floor is not one colour. */
function rug(cx: number, cy: number, rx: number, ry: number, a: string, b: string) {
  return (
    <G opacity={0.75}>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={a} />
      <Ellipse cx={cx} cy={cy} rx={rx * 0.78} ry={ry * 0.74} fill={b} />
      <Ellipse cx={cx} cy={cy} rx={rx * 0.5} ry={ry * 0.46} fill={a} />
    </G>
  );
}

/** A wall clock — cream face, navy hands, gentle rim. */
function wallClock(cx: number, cy: number, r: number) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={palette.cream} />
      <Circle cx={cx} cy={cy} r={r * 0.8} fill={palette.white} />
      <Circle cx={cx} cy={cy} r={r * 0.8} fill={HILITE_SOFT} />
      <Rect x={cx - r * 0.06} y={cy - r * 0.56} width={r * 0.12} height={r * 0.6} rx={r * 0.06} fill={palette.navy} />
      <Rect x={cx - r * 0.06} y={cy - r * 0.07} width={r * 0.5} height={r * 0.12} rx={r * 0.06} fill={palette.navySoft} />
      <Circle cx={cx} cy={cy} r={r * 0.1} fill={palette.engineRed} />
    </G>
  );
}

/** A run of conduit down and along a wall, with its brackets. */
function conduit(x1: number, y: number, x2: number, drop: number) {
  return (
    <G opacity={0.5}>
      <Rect x={x1} y={y} width={x2 - x1} height={6} rx={3} fill={SHADE} />
      <Rect x={x1} y={y} width={x2 - x1} height={2.4} rx={1.2} fill={HILITE_SOFT} />
      <Rect x={x2 - 6} y={y} width={6} height={drop} rx={3} fill={SHADE} />
      <Path d={rp(x1 + 30, y - 3, 8, 12) + rp(x1 + 120, y - 3, 8, 12) + rp(x1 + 210, y - 3, 8, 12)} fill={SHADE_DEEP} />
    </G>
  );
}

/** A distant treeline: one batched mass of canopies plus a lighter overlay. */
function treeBand(w: number, y: number, hgt: number, back: string, front: string) {
  let d = `M -12 ${y + hgt}`;
  const n = Math.max(4, Math.round(w / 66));
  const step = (w + 24) / n;
  for (let i = 0; i < n; i += 1) {
    const bx = -12 + i * step;
    const bh = hgt * (0.6 + vary(i, 9) * 0.5);
    d += ` L ${bx} ${y + hgt} Q ${bx + step * 0.5} ${y + hgt - bh} ${bx + step} ${y + hgt}`;
  }
  d += ` L ${w + 12} ${y + hgt + 22} L -12 ${y + hgt + 22} Z`;
  return (
    <G>
      <Path d={d} fill={back} />
      <Path d={d} fill={front} opacity={0.4} transform={`translate(${step * 0.4}, 8)`} />
    </G>
  );
}

/** A kite on a long string — the classic way to give a big sky a scale. */
function kite(x: number, y: number, s: number) {
  return (
    <G opacity={0.85}>
      <Path d={`M ${x} ${y - 20 * s} L ${x + 15 * s} ${y} L ${x} ${y + 24 * s} L ${x - 15 * s} ${y} Z`} fill={palette.engineRed} />
      <Path d={`M ${x} ${y - 20 * s} L ${x + 15 * s} ${y} L ${x} ${y} Z`} fill={palette.safetyYellow} />
      <Path d={`M ${x} ${y + 24 * s} q ${10 * s} ${14 * s} ${-2 * s} ${26 * s} q ${-10 * s} ${12 * s} ${4 * s} ${24 * s}`} stroke={palette.navySoft} strokeWidth={2} fill="none" opacity={0.45} />
      <Path d={`M ${x - 5 * s} ${y + 34 * s} h ${10 * s} M ${x + 1 * s} ${y + 54 * s} h ${10 * s}`} stroke={palette.pink} strokeWidth={3.4} strokeLinecap="round" />
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
  /* The distant town stands BEHIND the near façades — only its varied
     rooflines show above them, which is how a real street reads. */
  const skyBase = leftTop + 34;
  return (
    <G>
      {hillRidge(w, Math.max(10, leftTop - 108), 116, skyBase + 52, '#A9CDE6', 2, 0.7)}
      {farSkyline(w, skyBase, 2, '#8FB8DE', '#A6C9E8', 0.55)}
      {/* the middle distance: the rest of the block, filling the band between
          the far rooftops and the kerb so the centre is never raw sky */}
      {midTerrace(w, gy + 6, 4, 0.78, Math.max(120, Math.min(320, gy - skyBase - 70)), 84)}
      {cloudBank(w * 0.24, Math.max(24, leftTop - 116), s * 0.9, 0.55)}
      {cloudBank(w * 0.82, Math.max(16, leftTop - 74), s * 0.72, 0.42)}
      {farBirds(w * 0.58, Math.max(18, leftTop - 96), s * 0.9)}
      {wirePole(w * 0.34, gy + 6, gy - leftTop + 74, w)}
      {building(
        { x: -18, w: 138 * s, top: leftTop, wall: '#F4DCB0', roof: palette.engineRed, awning: 'stripe', rows: 4, cols: 2, cap: 'step', band: true, boxes: true, pipe: 'right', sign: 'hanging', chimney: true },
        gy,
        'b1',
      )}
      {building(
        { x: w - 132 * s, w: 150 * s, top: rightTop, wall: '#EFD3B6', roof: '#4A5FA8', rows: 4, cols: 2, cap: 'mansard', shutters: true, balcony: true, ac: true, pipe: 'left', awningA: '#4A5FA8', sign: 'barber' },
        gy,
        'b2',
      )}
      {building(
        { x: w * 0.42, w: 104 * s, top: midTop, wall: '#F7E6C6', roof: '#3B8E3F', awning: 'stripe', awningA: '#3B8E3F', rows: 2, cols: 2, cap: 'pitch', chimney: true, band: true, sign: 'clock' },
        gy,
        'b3',
      )}
      {/* bunting strung across the street, above every roof in frame */}
      {bunting(
        w * 0.03,
        Math.min(leftTop + 42, midTop - 34),
        w * 0.95,
        Math.min(rightTop + 48, midTop - 26),
        34,
        [palette.cream, palette.waterCyanLight, palette.pinkSoft, palette.creamDeep, palette.mint],
      )}
      {/* pavement, kerb and the road below it */}
      {groundPlane(w, h, gy, grounds.street.near, grounds.street.lip)}
      <Rect x={0} y={roadY} width={w} height={Math.max(0, h - roadY)} fill="#8E96AE" />
      <Rect x={0} y={roadY} width={w} height={7} rx={3.5} fill="#E7EBF4" />
      <Rect x={0} y={roadY + 7} width={w} height={5} fill={SHADE} />
      <Path d={`M 0 ${roadY + 40} H ${w}`} stroke={palette.white} strokeWidth={4} strokeDasharray="22 20" strokeLinecap="round" opacity={0.8} />
      {/* paving joints, batched */}
      <Path
        d={Array.from({ length: Math.ceil(w / 64) + 1 }, (_, i) => rp(i * 64, gy + 16, 3, roadY - gy - 18)).join('')}
        fill={SHADE_SOFT}
      />
      {/* drain grate */}
      <G>
        <Rect x={w * 0.62} y={roadY + 12} width={40 * s} height={15 * s} rx={5} fill="#6F7893" />
        <Rect x={w * 0.62 + 5} y={roadY + 15} width={30 * s} height={2.6} rx={1.3} fill={SHADE} />
        <Rect x={w * 0.62 + 5} y={roadY + 20} width={30 * s} height={2.6} rx={1.3} fill={SHADE} />
      </G>
      {parkedTruck(w * 0.03, roadY + 30, s * 0.92)}
      {lampPost(w - 44 * s, gy + 2, 178 * s)}
      {onlookers(w * 0.53, gy, s)}
      {/* post box on the kerb */}
      <G>
        {contact(w * 0.72, gy + 6, 15 * s)}
        <Rect x={w * 0.72 - 13 * s} y={gy - 46 * s} width={26 * s} height={48 * s} rx={12 * s} fill={palette.engineRed} />
        <Rect x={w * 0.72 - 13 * s} y={gy - 46 * s} width={8 * s} height={48 * s} rx={4 * s} fill={HILITE_SOFT} />
        <Rect x={w * 0.72 - 8 * s} y={gy - 34 * s} width={16 * s} height={5 * s} rx={2.5 * s} fill={palette.engineRedDark} />
        <Rect x={w * 0.72 - 10 * s} y={gy - 4 * s} width={20 * s} height={6 * s} rx={3 * s} fill={palette.engineRedDark} />
      </G>
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
      {hillRidge(w, Math.max(8, wallTop - 104), 112, wallTop + 88, '#A9CDE6', 5, 0.65)}
      {farSkyline(w, wallTop + 30, 5, '#93BCE0', '#AACDEA', 0.5)}
      {/* the neighbours' roofs, then the yard's own boundary wall */}
      {midTerrace(w, gy - 62, 5, 0.7, Math.max(100, Math.min(260, gy - wallTop - 120)), 70)}
      <G>
        <Rect x={-10} y={gy - 62} width={w + 20} height={70} fill="#D9CEB6" />
        <Rect x={-10} y={gy - 62} width={w + 20} height={10} fill={HILITE_SOFT} />
        <Rect x={-10} y={gy - 72} width={w + 20} height={13} rx={6} fill="#C2B69A" />
        <Rect x={-10} y={gy - 72} width={w + 20} height={4} rx={2} fill={HILITE} />
        <Path
          d={Array.from({ length: Math.ceil(w / 88) + 1 }, (_, i) => rp(i * 88, gy - 59, 5, 64)).join('')}
          fill={SHADE_SOFT}
        />
      </G>
      {cloudBank(w * 0.3, Math.max(20, wallTop - 96), s * 0.85, 0.5)}
      {cloudBank(w * 0.86, Math.max(14, wallTop - 52), s * 0.65, 0.4)}
      {farBirds(w * 0.62, Math.max(16, wallTop - 74), s * 0.85)}
      {/* training tower silhouette */}
      <G>
        {contact(w * 0.845, gy + 6, 52 * s)}
        <Rect x={w * 0.78} y={towerTop} width={62 * s} height={towerH} rx={8} fill="#C2A377" />
        <Rect x={w * 0.78} y={towerTop} width={16 * s} height={towerH} fill={HILITE_SOFT} />
        <Rect x={w * 0.78 - 8 * s} y={towerTop - 12 * s} width={78 * s} height={16 * s} rx={7} fill="#9E7F55" />
        {/* guard rail around the head of the tower */}
        <Path
          d={`M ${w * 0.78 - 6 * s} ${towerTop - 12 * s} v ${-16 * s} M ${w * 0.78 + 26 * s} ${towerTop - 12 * s} v ${-16 * s} M ${w * 0.78 + 60 * s} ${towerTop - 12 * s} v ${-16 * s}`}
          stroke="#9E7F55"
          strokeWidth={4 * s}
          strokeLinecap="round"
        />
        <Rect x={w * 0.78 - 10 * s} y={towerTop - 32 * s} width={82 * s} height={7 * s} rx={3.5 * s} fill="#9E7F55" />
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
        {/* brick banding, batched into one node */}
        <Path
          d={Array.from({ length: 5 }, (_, i) => rp(-20, wallTop + 42 + i * 46, w * 0.56, 4)).join('')}
          fill={SHADE_SOFT}
        />
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
        {/* drying rack: three hose lengths hung over a rail */}
        <G>
          <Rect x={w * 0.06} y={wallTop + 132} width={w * 0.4} height={7} rx={3.5} fill={palette.slate} />
          <Path
            d={`M ${w * 0.12} ${wallTop + 139} v ${52 * s} M ${w * 0.22} ${wallTop + 139} v ${64 * s} M ${w * 0.32} ${wallTop + 139} v ${44 * s}`}
            stroke={palette.safetyYellow}
            strokeWidth={7 * s}
            strokeLinecap="round"
            opacity={0.85}
          />
        </G>
      </G>
      {/* bunting from the tower back to the wall */}
      {bunting(w * 0.5, wallTop + 26, w * 0.8, towerTop - 20, 36, [palette.engineRed, palette.white, palette.safetyYellow, palette.white])}
      {groundPlane(w, h, gy, grounds.yard.near, grounds.yard.lip)}
      {/* chalk practice lines on the apron */}
      <G opacity={0.55}>
        <Path d={`M ${w * 0.1} ${gy + 46} H ${w * 0.92}`} stroke={palette.white} strokeWidth={5} strokeLinecap="round" strokeDasharray="26 18" />
        <Path d={`M ${w * 0.16} ${gy + 82} H ${w * 0.86}`} stroke={palette.white} strokeWidth={4} strokeLinecap="round" strokeDasharray="18 16" />
        <Ellipse cx={w * 0.5} cy={gy + 64} rx={w * 0.2} ry={22} fill="none" stroke={palette.white} strokeWidth={4} strokeDasharray="14 14" />
      </G>
      {/* a puddle from this morning's drill */}
      <Ellipse cx={w * 0.78} cy={gy + 92} rx={44 * s} ry={13 * s} fill={palette.waterCyan} opacity={0.28} />
      <Ellipse cx={w * 0.78} cy={gy + 90} rx={30 * s} ry={8 * s} fill={palette.white} opacity={0.22} />
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
  /* The park is the emptiest frame in the app, so it gets a full depth stack:
     cloud bank → hills → a town at their foot → a treeline → the near park. */
  const ridgeTop = Math.max(70, gy - 300);
  return (
    <G>
      {cloudBank(w * 0.26, Math.max(30, ridgeTop - 240), s, 0.6)}
      {cloudBank(w * 0.8, Math.max(18, ridgeTop - 160), s * 0.72, 0.45)}
      {farBirds(w * 0.56, Math.max(24, ridgeTop - 196), s)}
      {kite(w * 0.86, Math.max(46, ridgeTop - 110), s * 0.9)}
      {hillRidge(w, ridgeTop, 104, gy + 26, '#9AC2DE', 3, 0.95)}
      {hillRidge(w, ridgeTop + 62, 96, gy + 26, '#86BC99', 6, 1)}
      {farSkyline(w, ridgeTop + 176, 3, '#8FB2D0', '#A5C5DD', 0.78)}
      {treeBand(w, gy - 132 * s, 46 * s, '#3E8F58', '#57A96C')}
      {/* far hedge line */}
      <Path d={`M -10 ${gy - 34 * s} q ${w * 0.18} ${-42 * s} ${w * 0.34} ${-6 * s} q ${w * 0.2} ${-36 * s} ${w * 0.4} ${-4 * s} q ${w * 0.16} ${-22 * s} ${w * 0.32} ${6 * s} L ${w + 10} ${gy} L -10 ${gy} Z`} fill="#3E9A55" />
      {/* the bandstand in the middle distance */}
      <G opacity={0.9}>
        <Ellipse cx={w * 0.5} cy={gy - 12 * s} rx={46 * s} ry={9 * s} fill={palette.navy} opacity={0.1} />
        <Rect x={w * 0.5 - 40 * s} y={gy - 22 * s} width={80 * s} height={10 * s} rx={4 * s} fill="#D9CBB0" />
        <Path
          d={`M ${w * 0.5 - 34 * s} ${gy - 22 * s} v ${-34 * s} M ${w * 0.5 - 12 * s} ${gy - 22 * s} v ${-34 * s} M ${w * 0.5 + 12 * s} ${gy - 22 * s} v ${-34 * s} M ${w * 0.5 + 34 * s} ${gy - 22 * s} v ${-34 * s}`}
          stroke="#E7DCC4"
          strokeWidth={6 * s}
          strokeLinecap="round"
        />
        <Path d={`M ${w * 0.5 - 48 * s} ${gy - 56 * s} q ${48 * s} ${-38 * s} ${96 * s} 0 z`} fill="#6E8FC0" />
        <Path d={`M ${w * 0.5 - 2 * s} ${gy - 78 * s} v ${-14 * s} h ${14 * s} l ${-4 * s} ${5 * s} l ${4 * s} ${5 * s} h ${-14 * s}`} fill={palette.engineRed} opacity={0.85} />
      </G>
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
  const railY = Math.max(150, gy - 330);
  const winY = Math.max(160, railY - 168);
  return (
    <G>
      <Rect x={0} y={0} width={w} height={gy + 4} fill="#FBE9CC" />
      {/* the wall above the picture rail is a shade cooler — depth from value */}
      <Rect x={0} y={0} width={w} height={railY} fill="#F3DEBE" />
      <Rect x={0} y={railY - 8} width={w} height={10} rx={5} fill={palette.tanDark} />
      <Rect x={0} y={railY - 8} width={w} height={3.4} rx={1.7} fill={HILITE} />
      {/* tiled splash-back */}
      <G opacity={0.5}>
        <Path
          d={Array.from({ length: 6 }, (_, r) =>
            Array.from({ length: Math.ceil(w / 46) + 1 }, (_, c) => rp(c * 46 + (r % 2 ? -23 : 0), gy - 160 + r * 30, 42, 26)).join(''),
          ).join('')}
          fill="#FFF6E5"
        />
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
      {/* a window onto the yard, so the kitchen has a daylight side */}
      {windowView(w * 0.62, winY, w * 0.3, 112)}
      {/* plate rack on the left */}
      <G>
        {shelf(w * 0.06, winY + 34, w * 0.42)}
        {[0, 1, 2].map((i) => (
          <G key={`pl${i}`}>
            <Circle cx={w * 0.11 + i * w * 0.13} cy={winY + 14} r={20} fill={palette.white} />
            <Circle cx={w * 0.11 + i * w * 0.13} cy={winY + 14} r={13} fill={[palette.waterCyanLight, palette.creamDeep, palette.mint][i] ?? palette.cream} />
            <Path d={`M ${w * 0.11 + i * w * 0.13 - 14} ${winY + 6} a 16 16 0 0 1 10 -10`} stroke={HILITE} strokeWidth={4} fill="none" strokeLinecap="round" />
          </G>
        ))}
      </G>
      {/* a string of herbs and a garlic plait hanging from the rail */}
      <G>
        <Path d={`M ${w * 0.5} ${railY} v 26`} stroke={palette.woodDark} strokeWidth={3} strokeLinecap="round" />
        <Path d={`M ${w * 0.5} ${railY + 26} q -18 26 -6 46 q 8 -18 6 -46 z`} fill="#57A96C" />
        <Path d={`M ${w * 0.5} ${railY + 26} q 20 24 8 46 q -10 -18 -8 -46 z`} fill="#3E8F58" />
        <Path d={`M ${w * 0.56} ${railY} v 18`} stroke={palette.woodDark} strokeWidth={3} strokeLinecap="round" />
        {[0, 1, 2].map((i) => (
          <Ellipse key={`gl${i}`} cx={w * 0.56} cy={railY + 26 + i * 15} rx={11} ry={9} fill={palette.creamDeep} />
        ))}
      </G>
      {/* spice shelf */}
      {shelf(w * 0.06, gy - 190, w * 0.42)}
      {jars(w * 0.08, gy - 190, s, ['#CFE9F8', '#FFE1B8', '#E7D8FF', '#D9F2D2'])}
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
      <Path d={Array.from({ length: 4 }, (_, i) => rp(0, gy + 52 + i * 28, w, 3)).join('')} fill={SHADE_SOFT} />
      {/* checked cloth, rounded — never a hard square */}
      <G>
        <Path d={`M -6 ${gy + 22} h ${w * 0.34} a 14 14 0 0 1 14 14 v 40 a 14 14 0 0 1 -14 14 h ${-w * 0.34} z`} fill={palette.white} />
        <G opacity={0.85}>
          <Path
            d={Array.from({ length: 3 }, (_, r) =>
              Array.from({ length: 5 }, (_, c) => ((r + c) % 2 === 0 ? rp(c * (w * 0.07) - 6, gy + 22 + r * 23, w * 0.07, 23) : '')).join(''),
            ).join('')}
            fill="#F2685C"
          />
        </G>
      </G>
    </G>
  );
}

function radioRoomArt(w: number, h: number, gy: number, s: number) {
  /* `midTop` is the line the top boards stop on: the wall furniture starts
     immediately under it so the room never shows a bare band. */
  const midTop = 190;
  const railY = Math.max(midTop + 156, gy - 300);
  return (
    <G>
      {dadoWall(w, gy, railY, '#8D97B6', '#7C87A8', '#5E688A', true, false)}
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
      {pinboard(w * 0.54, 44, w * 0.4, 112, 4)}
      {/* conduit running the width of the room, dropping to the bench */}
      {conduit(w * 0.04, midTop + 6, w * 0.9, railY - midTop - 6)}
      {/* the watch clock, dead centre, high enough to clear the play area */}
      {wallClock(w * 0.5, midTop + 82, 27)}
      {/* hi-vis coats on wall hooks, left of the rail */}
      <G>
        <Rect x={w * 0.03} y={midTop + 34} width={w * 0.26} height={8} rx={4} fill={palette.charcoal} />
        <Rect x={w * 0.03} y={midTop + 34} width={w * 0.26} height={3} rx={1.5} fill={HILITE} />
        {coat(w * 0.1, midTop + 52, 92, palette.safetyYellow, palette.white)}
        {coat(w * 0.22, midTop + 56, 86, '#3C4A78', palette.safetyYellow)}
      </G>
      {/* the status board, right of the rail */}
      <G>
        <Rect x={w * 0.66} y={midTop + 22} width={w * 0.3} height={104} rx={9} fill={palette.cream} />
        <Rect x={w * 0.66} y={midTop + 22} width={w * 0.3} height={18} rx={9} fill="#3C4A78" />
        <Path
          d={Array.from({ length: 4 }, (_, i) => rp(w * 0.685, midTop + 50 + i * 20, w * 0.17, 6)).join('')}
          fill={palette.navyMuted}
          opacity={0.4}
        />
        {[0, 1, 2, 3].map((i) => (
          <Circle key={`st${i}`} cx={w * 0.92} cy={midTop + 53 + i * 20} r={6} fill={[palette.leafGreen, palette.safetyYellow, palette.engineRed, palette.waterCyanDark][i] ?? palette.leafGreen} />
        ))}
      </G>
      {/* a rack of rolled maps under the town map */}
      <G>
        <Rect x={w * 0.05} y={midTop + 150} width={w * 0.24} height={9} rx={4} fill={palette.slate} />
        {[0, 1, 2].map((i) => (
          <G key={`rl${i}`}>
            <Rect x={w * 0.07 + i * w * 0.07} y={midTop + 106} width={16} height={46} rx={8} fill={[palette.creamDeep, '#CFE0F2', '#DCE6D8'][i] ?? palette.cream} />
            <Rect x={w * 0.07 + i * w * 0.07} y={midTop + 106} width={6} height={46} rx={3} fill={HILITE} />
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
  const midTop = 306;
  const railY = Math.max(midTop + 148, gy - 206);
  return (
    <G>
      {dadoWall(w, gy, railY, '#F1E7D2', '#E6D8BB', '#D3BE94')}
      <Rect x={0} y={0} width={w} height={62} fill="#E3D6BA" />
      <Rect x={0} y={58} width={w} height={8} rx={4} fill={SHADE_SOFT} />
      {/* alphabet frieze */}
      <G>
        {Array.from({ length: 7 }, (_, i) => (
          <G key={`al${i}`}>
            <Rect x={10 + (i * (w - 20)) / 7} y={14} width={(w - 20) / 7 - 8} height={34} rx={9} fill={[palette.pink, palette.safetyYellow, palette.waterCyan, palette.leafGreen][i % 4]} opacity={0.8} />
            <Rect x={14 + (i * (w - 20)) / 7} y={20} width={(w - 20) / 7 - 20} height={7} rx={3.5} fill={HILITE} />
          </G>
        ))}
      </G>
      {/* the big board */}
      {chalkboard(w * 0.08, 84, w * 0.62, 168)}
      {/* wall clock */}
      {wallClock(w * 0.84, 132, 40 * s)}
      {/* a number line pinned under the board — quiet, full width, one node */}
      <G>
        <Rect x={w * 0.06} y={264} width={w * 0.88} height={26} rx={9} fill={palette.cream} />
        <Path d={`M ${w * 0.08} 285 H ${w * 0.92}`} stroke={palette.navyMuted} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
        <Path
          d={Array.from({ length: 11 }, (_, i) => rp(w * 0.08 + (i * w * 0.084), 272, 3, 13)).join('')}
          fill={palette.navyMuted}
          opacity={0.5}
        />
      </G>
      {/* coat pegs down the left */}
      <G>
        <Rect x={w * 0.04} y={midTop} width={w * 0.28} height={9} rx={4} fill={palette.wood} />
        <Rect x={w * 0.04} y={midTop} width={w * 0.28} height={3.4} rx={1.7} fill={HILITE} />
        {coat(w * 0.1, midTop + 16, 74, palette.engineRed)}
        {coat(w * 0.19, midTop + 20, 68, palette.waterCyanDark)}
        {coat(w * 0.27, midTop + 16, 72, palette.purple)}
      </G>
      {/* a window onto the playing field */}
      {windowView(w * 0.6, midTop - 6, w * 0.32, 116)}
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
  const lowShelf = Math.max(360, gy - 172);
  return (
    <G>
      <Rect x={0} y={0} width={w} height={gy + 4} fill="#F3E4C8" />
      {/* plank wall */}
      <Path d={Array.from({ length: 6 }, (_, i) => rp(0, i * 62, w, 4)).join('')} fill={SHADE_SOFT} />
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
      {/* a fourth, lower shelf of mixing bowls, and a window beside it */}
      {shelf(w * 0.05, lowShelf, w * 0.5)}
      <G>
        {[0, 1, 2].map((i) => (
          <G key={`bw${i}`}>
            <Path d={`M ${w * 0.09 + i * w * 0.15} ${lowShelf} a ${26 * s} ${20 * s} 0 0 1 ${52 * s} 0 z`} fill={[palette.waterCyanLight, palette.creamDeep, palette.mint][i] ?? palette.cream} />
            <Path d={`M ${w * 0.09 + i * w * 0.15 + 6 * s} ${lowShelf - 4} a ${20 * s} ${14 * s} 0 0 1 ${16 * s} ${-10 * s}`} stroke={HILITE} strokeWidth={4} fill="none" strokeLinecap="round" />
          </G>
        ))}
      </G>
      {/* the serving hatch through to the kitchen */}
      {hatch(w * 0.64, lowShelf - 120, w * 0.28, 96, '#C7B48C')}
      {/* a pinned produce poster on the left wall */}
      {poster(w * 0.07, lowShelf - 168, w * 0.22, 112, palette.orange)}
      {/* an onion plait hanging between the shelves */}
      <G>
        <Path d={`M ${w * 0.42} 330 v 22`} stroke={palette.woodDark} strokeWidth={3} strokeLinecap="round" />
        {[0, 1, 2, 3].map((i) => (
          <Ellipse key={`on${i}`} cx={w * 0.42 + (i % 2 ? 7 : -7)} cy={352 + i * 16} rx={11} ry={13} fill={i % 2 ? '#E7C58C' : '#D9B279'} />
        ))}
      </G>
      {groundPlane(w, h, gy, grounds.pantry.near, grounds.pantry.lip)}
      {/* checkerboard floor */}
      <G opacity={0.6}>
        <Path
          d={Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: Math.ceil(w / 58) + 1 }, (_, c) => ((r + c) % 2 === 0 ? rp(c * 58 - (r % 2) * 29, gy + 24 + r * 44, 58, 44) : '')).join(''),
          ).join('')}
          fill="#C4CCDE"
        />
      </G>
      {/* flour sacks on the floor, left; nothing in the middle */}
      <G>
        {contact(w * 0.08, gy + 66, 34 * s)}
        <Path d={`M ${w * 0.08 - 26 * s} ${gy + 60} q ${-4 * s} ${-46 * s} ${26 * s} ${-48 * s} q ${30 * s} ${2 * s} ${26 * s} ${48 * s} z`} fill="#EADFC6" />
        <Path d={`M ${w * 0.08 - 26 * s} ${gy + 60} q ${-2 * s} ${-34 * s} ${12 * s} ${-44 * s} q ${2 * s} ${22 * s} ${0 * s} ${44 * s} z`} fill={HILITE} />
        <Rect x={w * 0.08 - 14 * s} y={gy + 20} width={28 * s} height={9 * s} rx={4 * s} fill={palette.tanDark} />
      </G>
    </G>
  );
}

function stallArt(w: number, h: number, gy: number, s: number) {
  const canopyY = 54;
  const skyBase = Math.max(96, gy - 176 * s);
  return (
    <G>
      {hillRidge(w, Math.max(10, skyBase - 150), 118, skyBase + 50, '#A9CDE6', 7, 0.62)}
      {farSkyline(w, skyBase, 4, '#93BCE0', '#AACDEA', 0.5)}
      {midTerrace(w, gy - 96 * s, 4, 0.75, Math.max(110, Math.min(280, gy - skyBase - 40)), 78)}
      {cloudBank(w * 0.22, Math.max(22, skyBase - 156), s * 0.8, 0.5)}
      {farBirds(w * 0.72, Math.max(18, skyBase - 132), s * 0.85)}
      {building({ x: -24, w: 120 * s, top: gy - 210 * s, wall: '#F0DBB8', roof: '#4A5FA8', rows: 3, cols: 2, cap: 'pitch', chimney: true, pipe: 'right', band: true, sign: 'hanging', awningA: '#4A5FA8' }, gy, 'sb1')}
      {building({ x: w - 108 * s, w: 130 * s, top: gy - 190 * s, wall: '#F6E3C2', roof: palette.engineRed, rows: 3, cols: 2, cap: 'step', shutters: true, boxes: true, pipe: 'left', sign: 'clock' }, gy, 'sb2')}
      {/* striped canopy across the top */}
      <G>
        <Path d={`M -10 ${canopyY} h ${w + 20} v 22 q ${-w / 2} 22 ${-(w + 20)} 0 z`} fill={palette.engineRed} />
        <Path
          d={Array.from({ length: Math.ceil(w / 46) + 1 }, (_, i) =>
            i % 2 === 0 ? `M ${i * 46 - 10} ${canopyY} h 46 v 24 q -23 8 -46 2 z` : '',
          ).join('')}
          fill={palette.white}
        />
        <Rect x={-10} y={canopyY - 8} width={w + 20} height={12} rx={6} fill={palette.engineRedDark} />
        <Rect x={20} y={canopyY + 34} width={9} height={gy - canopyY - 34} rx={4.5} fill={palette.wood} />
        <Rect x={w - 30} y={canopyY + 34} width={9} height={gy - canopyY - 34} rx={4.5} fill={palette.wood} />
      </G>
      {/* bunting slung under the canopy */}
      {bunting(34, canopyY + 74, w - 44, canopyY + 74, 30, [palette.safetyYellow, palette.waterCyan, palette.engineRed, palette.leafGreen, palette.purple])}
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
        <Path
          d={Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: Math.ceil(w / 54) + 1 }, (_, c) => rp(c * 54 - (r % 2) * 27, gy + 34 + r * 34, 46, 26)).join(''),
          ).join('')}
          fill="#AEB7CD"
        />
      </G>
      {cone(w * 0.06, gy + 92, s * 0.85)}
    </G>
  );
}

function storeRoomArt(w: number, h: number, gy: number, s: number) {
  const midTop = 208;
  const railY = Math.max(midTop + 150, gy - 300);
  return (
    <G>
      {dadoWall(w, gy, railY, '#EFE0C4', '#DCCAA6', '#C3A97C')}
      {/* pegboard */}
      <G>
        <Rect x={w * 0.06} y={48} width={w * 0.52} height={150} rx={12} fill="#D8B98A" />
        <Rect x={w * 0.06} y={48} width={w * 0.52} height={150} rx={12} fill={SHADE_SOFT} />
        <G opacity={0.45}>
          <Path
            d={Array.from({ length: 5 }, (_, r) =>
              Array.from({ length: 7 }, (_, c) => rp(w * 0.09 + c * (w * 0.075) - 2.6, 62 + r * 27 - 2.6, 5.2, 5.2)).join(''),
            ).join('')}
            fill={palette.navy}
          />
        </G>
        {/* hanging gear: a coiled hose, a helmet and a lantern */}
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
      {/* turnout coats on a rail, left of the dado */}
      <G>
        <Rect x={w * 0.03} y={midTop + 12} width={w * 0.28} height={9} rx={4} fill={palette.slate} />
        <Rect x={w * 0.03} y={midTop + 12} width={w * 0.28} height={3.4} rx={1.7} fill={HILITE} />
        {coat(w * 0.1, midTop + 30, 108, '#2F3A62', palette.safetyYellow)}
        {coat(w * 0.23, midTop + 34, 100, '#3C4A78', palette.safetyYellow)}
      </G>
      {/* hose rack, right of the dado */}
      <G>
        <Rect x={w * 0.6} y={midTop + 16} width={w * 0.36} height={8} rx={4} fill={palette.slate} />
        <Rect x={w * 0.6} y={midTop + 16} width={w * 0.36} height={3} rx={1.5} fill={HILITE} />
        <Path
          d={rp(w * 0.63, midTop + 24, 7, 20) + rp(w * 0.8, midTop + 24, 7, 20) + rp(w * 0.92, midTop + 24, 7, 20)}
          fill={palette.slate}
        />
        {[0, 1, 2].map((i) => {
          const cx = w * 0.68 + i * w * 0.11;
          return (
            <G key={`hr${i}`}>
              <Circle cx={cx} cy={midTop + 62} r={26} fill={palette.safetyYellow} />
              <Circle cx={cx} cy={midTop + 62} r={16} fill={palette.gold} />
              <Circle cx={cx} cy={midTop + 62} r={7} fill="#DCCAA6" />
              <Path d={`M ${cx - 20} ${midTop + 50} a 24 24 0 0 1 18 -8`} stroke={HILITE} strokeWidth={4} fill="none" strokeLinecap="round" />
            </G>
          );
        })}
        <Rect x={w * 0.6} y={midTop + 92} width={w * 0.36} height={8} rx={4} fill={palette.slate} />
        <Rect x={w * 0.6} y={midTop + 92} width={w * 0.36} height={3} rx={1.5} fill={HILITE} />
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
        <Path d={Array.from({ length: Math.ceil(w / 70) + 1 }, (_, c) => rp(c * 70, gy + 12, 4, h - gy)).join('')} fill="#9AA3BC" />
      </G>
      {/* a painted floor lane, so the concrete has a direction */}
      <Path d={`M ${w * 0.04} ${gy + 46} H ${w * 0.96}`} stroke={palette.safetyYellow} strokeWidth={6} strokeLinecap="round" opacity={0.4} strokeDasharray="30 22" />
      {/* a flat boot mat by the bench */}
      {rug(w * 0.2, gy + 84, w * 0.17, 16, '#8E97B3', '#A8B0C8')}
      {cone(w * 0.9, gy + 66, s * 0.9)}
    </G>
  );
}

function towerArt(w: number, h: number, gy: number, s: number) {
  const towerW = Math.min(w * 0.62, 232 * s);
  const tx = (w - towerW) / 2;
  const top = Math.max(24, gy - 420 * s);
  const skyBase = Math.max(90, gy - 172 * s);
  return (
    <G>
      {hillRidge(w, Math.max(8, skyBase - 148), 120, skyBase + 50, '#A9CDE6', 6, 0.6)}
      {farSkyline(w, skyBase, 6, '#8FB8DE', '#A6C9E8', 0.5)}
      {midTerrace(w, gy + 6, 8, 0.72, Math.max(110, Math.min(280, gy - skyBase - 60)), 76)}
      {cloudBank(w * 0.16, Math.max(24, top - 40), s * 0.85, 0.5)}
      {cloudBank(w * 0.88, Math.max(16, top + 40), s * 0.62, 0.4)}
      {farBirds(w * 0.14, Math.max(20, top + 96), s * 0.9)}
      {building({ x: -26, w: 116 * s, top: gy - 208 * s, wall: '#F2DCB6', roof: '#4A5FA8', rows: 3, cols: 1, cap: 'pitch', chimney: true, band: true, pipe: 'right', sign: 'board' }, gy, 'tw1')}
      {building({ x: w - 92 * s, w: 124 * s, top: gy - 196 * s, wall: '#EED6BA', roof: palette.engineRed, rows: 3, cols: 1, cap: 'mansard', shutters: true, boxes: true, pipe: 'left', sign: 'hanging' }, gy, 'tw2')}
      {/* the clock tower itself */}
      <G>
        {contact(tx + towerW / 2, gy + 8, towerW * 0.6)}
        <Rect x={tx} y={top + 46} width={towerW} height={gy - top - 46} rx={10} fill="#F0E3C6" />
        <Rect x={tx} y={top + 46} width={towerW * 0.17} height={gy - top - 46} fill={HILITE_SOFT} />
        <Path d={`M ${tx + towerW * 0.83} ${top + 46} L ${tx + towerW} ${top + 58} L ${tx + towerW} ${gy} L ${tx + towerW * 0.83} ${gy} Z`} fill={SHADE} />
        {/* stone banding */}
        <Path
          d={Array.from({ length: 4 }, (_, i) => rp(tx, top + 150 + i * 62, towerW * 0.83, 6)).join('')}
          fill={SHADE_SOFT}
        />
        {/* roof */}
        <Path d={`M ${tx - 14} ${top + 50} L ${tx + towerW / 2} ${top - 12} L ${tx + towerW + 14} ${top + 50} Z`} fill="#4A5FA8" />
        <Path d={`M ${tx - 14} ${top + 50} L ${tx + towerW / 2} ${top - 12} L ${tx + towerW / 2} ${top + 50} Z`} fill={HILITE_SOFT} />
        <Rect x={tx - 18} y={top + 42} width={towerW + 36} height={14} rx={7} fill="#33478A" />
        {/* weather vane */}
        <Path d={`M ${tx + towerW / 2 - 1.5} ${top - 12} v -22 h 16 l -5 5 l 5 5 h -16`} fill="#33478A" />
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
      {hedge(w * 0.18, gy + 4, w * 0.3, 34 * s, '#3E8F58', '#57A96C')}
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
