/**
 * THE DEPTH PLANES — sky furniture, far distance, middle distance, near ground.
 *
 * The rule `src/world/Stage.tsx` documents at the top of the file, applied to a
 * scene that has to work as a dispatch-slip thumbnail *and* as a full-screen
 * backdrop: every layer's fill runs down to the one in front of it, so there is
 * never a band of raw sky or raw paint across the middle of the frame, and each
 * plane is one value step darker and crisper than the one behind it. Only the
 * near plane gets a saturated hue.
 *
 * All of these are drawn in **px space** and parameterised by the measured box,
 * which is what lets one composition fill a 390 × 694 portrait phone and a
 * 1024 × 340 landscape panel without an empty sky band or a cropped roof.
 */
import React from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { darker, lighter, rp, vary, type SceneFrame } from './frame';
import { HIGHLIGHT, SHADE, SHADE_SOFT } from './parts';

const HILITE = HIGHLIGHT;

/* ------------------------------------------------------------------ */
/* Sky furniture                                                        */
/* ------------------------------------------------------------------ */

/** A flat cloud bank — pale, static and shadowless, to break an empty sky. */
function bank(cx: number, cy: number, s: number, opacity: number, key: string) {
  return (
    <G key={key} opacity={opacity}>
      <Ellipse cx={cx} cy={cy} rx={48 * s} ry={14 * s} fill={palette.white} />
      <Ellipse cx={cx - 24 * s} cy={cy + 3 * s} rx={27 * s} ry={11 * s} fill={palette.white} />
      <Ellipse cx={cx + 27 * s} cy={cy + 4 * s} rx={23 * s} ry={10 * s} fill={palette.white} />
      <Ellipse cx={cx + 5 * s} cy={cy - 9 * s} rx={25 * s} ry={12 * s} fill={palette.white} />
    </G>
  );
}

/** Gulls, drawn as pen strokes, far enough away to be scenery. */
function gulls(x: number, y: number, s: number, opacity = 0.3) {
  const d =
    `M ${x} ${y} q ${5 * s} ${-6 * s} ${10 * s} 0 q ${5 * s} ${-6 * s} ${10 * s} 0 ` +
    `M ${x + 24 * s} ${y + 12 * s} q ${4 * s} ${-5 * s} ${8 * s} 0 q ${4 * s} ${-5 * s} ${8 * s} 0 ` +
    `M ${x + 5 * s} ${y + 22 * s} q ${3.4 * s} ${-4 * s} ${6.8 * s} 0 q ${3.4 * s} ${-4 * s} ${6.8 * s} 0`;
  return <Path d={d} stroke={palette.navySoft} strokeWidth={2.2 * s} fill="none" strokeLinecap="round" opacity={opacity} />;
}

/** Cloud banks and gulls, spread through whatever sky the frame has. */
export function SkyFurniture({ f, seed = 1 }: { f: SceneFrame; seed?: number }) {
  const top = Math.max(6, f.gy * 0.06);
  const room = Math.max(20, f.oy - top);
  const s = f.s;
  return (
    <G>
      {bank(f.w * 0.2, top + room * 0.22, s * 0.95, 0.6, 'c1')}
      {bank(f.w * 0.78, top + room * 0.1, s * 0.7, 0.44, 'c2')}
      {room > 90 * s ? bank(f.w * 0.52, top + room * 0.55, s * 0.62, 0.3, 'c3') : null}
      {gulls(f.w * (0.3 + vary(seed, 2) * 0.4), top + room * 0.42, s * 0.9)}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Far distance — hills and the distant town                            */
/* ------------------------------------------------------------------ */

/**
 * A soft rolling ridge. The fill always runs down to `bottom`, because a far
 * layer that stops short leaves a stripe of raw sky sitting on the ground.
 */
export function Hills({ f, y, amp, tint, seed = 3, opacity = 0.75 }: { f: SceneFrame; y: number; amp: number; tint: string; seed?: number; opacity?: number }) {
  const w = f.w;
  const a = 0.2 + vary(seed, 3) * 0.22;
  const b = 0.62 + vary(seed + 1, 4) * 0.26;
  const d =
    `M -12 ${f.gy + 20} L -12 ${y + amp * 0.62} ` +
    `Q ${w * 0.16} ${y + amp * a} ${w * 0.38} ${y + amp * 0.5} ` +
    `Q ${w * 0.56} ${y + amp * b} ${w * 0.74} ${y + amp * 0.34} ` +
    `Q ${w * 0.9} ${y + amp * (a * 0.6)} ${w + 12} ${y + amp * 0.58} ` +
    `L ${w + 12} ${f.gy + 20} Z`;
  return <Path d={d} fill={tint} opacity={opacity} />;
}

/**
 * THE DISTANT TOWN — a pale, low-contrast band of rooftops with real
 * architecture: parapets, gables, stepped gables, a water tower, a spire and a
 * dome, so a row never reads as one rectangle repeated. Depth here is *value*,
 * not detail, and every window is batched into one path.
 */
export function FarSkyline({ f, baseY, tint, light, seed = 2, opacity = 0.5 }: { f: SceneFrame; baseY: number; tint: string; light: string; seed?: number; opacity?: number }) {
  const w = f.w;
  const s = Math.max(0.5, f.s);
  /* heights are quoted against the hero building, not in absolute px: a far
     layer measured in px vanishes behind the terrace on a tall frame and
     towers over it on a short one */
  const u = Math.max(50, f.bh);
  const nodes: React.ReactElement[] = [];
  let caps = '';
  let wins = '';
  let x = -20 * s;
  let i = 0;
  while (x < w + 20 && i < 20) {
    const bw = (30 + Math.round(vary(i, seed) * 42)) * s;
    const bh = u * (0.45 + vary(i + 5, seed) * 0.85);
    const top = baseY - bh;
    const kind = Math.floor(vary(i + 11, seed) * 5);
    nodes.push(<Rect key={`fb${i}`} x={x} y={top} width={bw} height={bh + 30} rx={4} fill={i % 3 === 1 ? light : tint} />);
    if (kind === 0) {
      caps += rp(x - 3 * s, top - 6 * s, bw + 6 * s, 8 * s);
    } else if (kind === 1) {
      nodes.push(<Path key={`fr${i}`} d={`M ${x - 4 * s} ${top + 2} L ${x + bw / 2} ${top - 18 * s} L ${x + bw + 4 * s} ${top + 2} Z`} fill={tint} />);
      caps += rp(x + bw * 0.62, top - 14 * s, 7 * s, 16 * s);
    } else if (kind === 2) {
      caps += rp(x, top - 7 * s, bw, 8 * s) + rp(x + bw * 0.17, top - 14 * s, bw * 0.66, 8 * s) + rp(x + bw * 0.34, top - 21 * s, bw * 0.32, 8 * s);
    } else if (kind === 3) {
      caps += rp(x - 2 * s, top - 4 * s, bw + 4 * s, 6 * s);
      nodes.push(
        <G key={`fw${i}`}>
          <Rect x={x + bw * 0.24} y={top - 26 * s} width={bw * 0.5} height={15 * s} rx={5} fill={tint} />
          <Path d={`M ${x + bw * 0.24} ${top - 26 * s} h ${bw * 0.5} l ${-bw * 0.08} ${-7 * s} h ${-bw * 0.34} z`} fill={tint} />
        </G>,
      );
      caps += rp(x + bw * 0.3, top - 11 * s, 3.4 * s, 8 * s) + rp(x + bw * 0.62, top - 11 * s, 3.4 * s, 8 * s);
    } else {
      caps += rp(x - 2 * s, top - 4 * s, bw + 4 * s, 6 * s) + rp(x + bw * 0.5, top - 26 * s, 2.6 * s, 23 * s);
    }
    const cols = bw > 50 * s ? 3 : 2;
    const rows = Math.min(7, Math.max(1, Math.floor(bh / (26 * s))));
    const cw = (bw - 8 * s) / (cols * 2 - 1);
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (vary(i * 17 + r * 5 + c, seed + 9) < 0.22) continue;
        wins += rp(x + 4 * s + c * cw * 2, top + 12 * s + r * 24 * s, cw, 11 * s);
      }
    }
    caps += rp(x - 2 * s, baseY - 10 * s, bw + 4 * s, 6 * s);
    x += bw + 3 * s + Math.round(vary(i + 17, seed) * 10) * s;
    i += 1;
  }
  /* two landmarks, tall enough to give the upper sky a scale */
  const cx = w * 0.68;
  const dx = w * 0.17;
  const domeH = Math.min(u * 0.98, baseY - 46 * s);
  const towerH = Math.min(u * 1.42, baseY - 30 * s);
  const dw = Math.max(26, u * 0.17);
  const tw = Math.max(11, u * 0.075);
  return (
    <G opacity={opacity}>
      {nodes}
      <Path d={caps} fill={tint} />
      <G>
        <Rect x={dx - dw / 2} y={baseY - domeH} width={dw} height={domeH + 26} rx={5} fill={light} />
        <Path d={`M ${dx - dw / 2 - 2} ${baseY - domeH} a ${dw / 2 + 2} ${dw * 0.5} 0 0 1 ${dw + 4} 0 z`} fill={tint} />
        <Path d={`M ${dx - 2} ${baseY - domeH - dw * 0.5} h 4 v ${-10 * s} h -4 z`} fill={tint} />
      </G>
      <G>
        <Rect x={cx - tw} y={baseY - towerH} width={tw * 2} height={towerH + 26} rx={5} fill={light} />
        <Path d={`M ${cx - tw - 5 * s} ${baseY - towerH + 2} L ${cx} ${baseY - towerH - tw * 1.3} L ${cx + tw + 5 * s} ${baseY - towerH + 2} Z`} fill={tint} />
        <Circle cx={cx} cy={baseY - towerH + tw * 1.1} r={tw * 0.62} fill={palette.cream} opacity={0.72} />
      </G>
      <Path d={wins} fill={palette.cream} opacity={0.42} />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Middle distance — the rest of the block                              */
/* ------------------------------------------------------------------ */

const MID_WALLS = ['#F0DCBB', '#E9D3BF', '#F5E4C6', '#E2D5C1', '#EEDCC8', '#F2E0C0'] as const;
const MID_ROOFS = ['#C4776A', '#6E7FB8', '#6EA472', '#C9946A', '#8D7AAE', '#B96F62'] as const;
const MID_AWNS = [palette.engineRed, '#3E8FBF', '#4E9E5C', '#C9863B', '#8E76C0'] as const;

/**
 * A terrace of little shops between the far haze and the hero building: warmer
 * and crisper than the skyline, paler and simpler than the near façade. That
 * value ladder is what makes the street read as deep rather than as a poster.
 *
 * Heights are quoted as a fraction of the hero building's own height, so the
 * neighbours always relate to it — a few shoulder above it, most sit below.
 */
export function MidTerrace({ f, seed = 4, opacity = 0.88, tints }: { f: SceneFrame; seed?: number; opacity?: number; tints?: { walls?: readonly string[]; roofs?: readonly string[] } }) {
  const walls = tints?.walls ?? MID_WALLS;
  const roofs = tints?.roofs ?? MID_ROOFS;
  const baseY = f.gy + 6;
  const u = Math.max(44, f.bh);
  const s = f.s;
  const out: React.ReactElement[] = [];
  const unit = Math.max(54, f.bw * 0.32);
  let x = -unit * 0.35;
  let i = 0;
  while (x < f.w + 8 && i < 12) {
    const bw = unit * (0.8 + vary(i, seed + 2) * 0.5);
    /* the neighbours are the tall ones: a two-storey shop flanked by four
       storeys is what a town looks like, and it is what fills the sky */
    const bh = Math.min(u * (0.66 + vary(i + 6, seed + 2) * 0.86), baseY - 26 * s);
    const top = baseY - bh;
    const wall = walls[i % walls.length] ?? '#F0DCBB';
    const roof = roofs[(i * 2 + seed) % roofs.length] ?? '#C4776A';
    const awn = MID_AWNS[(i + seed) % MID_AWNS.length] ?? palette.engineRed;
    const pitched = vary(i + 21, seed) > 0.45;
    const chim = vary(i + 31, seed) > 0.5;
    const shopH = Math.min(bh * 0.3, 54 * s);
    /* the window grid, batched: panes, reveals and sills in three paths */
    const winTop = top + 24 * s;
    const winBottom = baseY - shopH - 16 * s;
    const cols = bw > 92 * s ? 3 : 2;
    const cw = (bw * 0.76) / (cols * 1.42);
    const wh = 24 * s;
    const rows = Math.max(1, Math.min(6, Math.floor((winBottom - winTop) / (wh + 16 * s))));
    const dy = (winBottom - winTop) / rows;
    let panes = '';
    let sills = '';
    let reveals = '';
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const px = x + bw * 0.12 + c * cw * 1.42;
        const py = winTop + r * dy;
        reveals += rp(px - 2.4, py - 2.4, cw + 4.8, wh + 4.8);
        panes += rp(px, py, cw, wh);
        sills += rp(px - 4, py + wh + 2, cw + 8, 3.4 * s);
      }
    }
    out.push(
      <G key={`mt${i}`}>
        <Rect x={x} y={top} width={bw} height={bh + 20} rx={5} fill={wall} />
        <Rect x={x} y={top} width={bw * 0.15} height={bh + 20} fill="rgba(255,255,255,0.2)" />
        {chim ? <Rect x={x + bw * 0.7} y={top - 22 * s} width={12 * s} height={24 * s} rx={3} fill={roof} /> : null}
        {pitched ? (
          <G>
            <Path d={`M ${x - 6} ${top + 4} L ${x + bw / 2} ${top - 20 * s} L ${x + bw + 6} ${top + 4} Z`} fill={roof} />
            <Path d={`M ${x - 6} ${top + 4} L ${x + bw / 2} ${top - 20 * s} L ${x + bw / 2} ${top + 4} Z`} fill="rgba(255,255,255,0.18)" />
          </G>
        ) : (
          <G>
            <Rect x={x - 5} y={top - 9 * s} width={bw + 10} height={13 * s} rx={5} fill={roof} />
            <Rect x={x - 5} y={top + 2 * s} width={bw + 10} height={4 * s} rx={2} fill={SHADE} />
          </G>
        )}
        <Path d={reveals} fill={palette.cream} opacity={0.55} />
        <Path d={panes} fill="#4A5C8E" opacity={0.72} />
        <Path d={sills} fill={SHADE} />
        <Rect x={x + 4} y={baseY - shopH - 13 * s} width={bw - 8} height={11 * s} rx={4} fill={palette.cream} />
        <Path d={`M ${x + 2} ${baseY - shopH} h ${bw - 4} l ${-5 * s} ${13 * s} h ${-(bw - 4 - 10 * s)} z`} fill={awn} />
        <Path
          d={rp(x + 8, baseY - shopH + 18 * s, bw * 0.42, Math.max(4, shopH - 20 * s)) + rp(x + bw * 0.6, baseY - shopH + 16 * s, bw * 0.24, Math.max(4, shopH - 18 * s))}
          fill="#4A5C8E"
          opacity={0.55}
        />
      </G>,
    );
    x += bw + 3;
    i += 1;
  }
  return <G opacity={opacity}>{out}</G>;
}

/* ------------------------------------------------------------------ */
/* Near ground                                                          */
/* ------------------------------------------------------------------ */

export type GroundKind = 'paving' | 'grass' | 'apron';

/**
 * The near ground plane: a soft-topped slab with a lighter lip, its surface
 * marked (paving joints, mown bands or an apron's guide dashes) and a kerb
 * where the pavement meets the road. Never a hard-edged rectangle.
 */
/** Where the pavement gives way to the road — shared by the ground and its furniture. */
export const roadLine = (f: SceneFrame): number => f.gy + Math.max(56 * f.s, (f.h - f.gy) * 0.4);

export function GroundPlane({ f, near, lip, kind = 'paving' }: { f: SceneFrame; near: string; lip: string; kind?: GroundKind }) {
  const { w, h, gy, s } = f;
  const edge = `M 0 ${gy + 7 * s} Q ${w / 2} ${gy - 5 * s} ${w} ${gy + 7 * s}`;
  const roadY = roadLine(f);
  const step = Math.max(26, 56 * s);
  let marks = '';
  if (kind === 'paving') {
    for (let i = 0; i * step < w + step; i += 1) marks += rp(i * step, gy + 12 * s, 2.4 * s, Math.max(6, roadY - gy - 14 * s));
    marks += rp(0, gy + (roadY - gy) * 0.52, w, 2.4 * s);
  } else if (kind === 'grass') {
    for (let i = 0; i < 5; i += 1) marks += rp(0, gy + 14 * s + i * 20 * s, w, 4 * s);
  } else {
    for (let i = 0; i * step < w + step; i += 1) marks += rp(i * step, gy + 12 * s, 2.4 * s, Math.max(6, roadY - gy - 14 * s));
  }
  return (
    <G>
      <Path d={`${edge} L ${w} ${h} L 0 ${h} Z`} fill={near} />
      <Path d={`${edge} L ${w} ${gy + 15 * s} Q ${w / 2} ${gy + 3 * s} 0 ${gy + 15 * s} Z`} fill={lip} />
      <Path d={marks} fill={SHADE_SOFT} />
      {f.detail && kind !== 'grass' && roadY < h - 4 ? (
        <G>
          <Rect x={0} y={roadY} width={w} height={h - roadY} fill={darker(near, 0.22)} />
          <Rect x={0} y={roadY} width={w} height={5 * s} rx={2.5 * s} fill={lighter(lip, 0.4)} />
          <Rect x={0} y={roadY + 5 * s} width={w} height={4 * s} fill={SHADE} />
          <Path d={`M 0 ${roadY + (h - roadY) * 0.62} H ${w}`} stroke={palette.white} strokeWidth={3.4 * s} strokeDasharray={`${18 * s} ${16 * s}`} strokeLinecap="round" opacity={0.75} />
        </G>
      ) : null}
    </G>
  );
}

/**
 * THE NEAREST PLANE. A pavement that runs 150 px down the frame with nothing on
 * it is the same mistake as a bare sky, so a street scene gets one big piece of
 * furniture standing at the kerb — darker, crisper and much larger than
 * anything on the building, which is what tells the eye it is in front.
 */
export function NearStreet({ f, kind }: { f: SceneFrame; kind: GroundKind }) {
  if (!f.detail || kind !== 'paving') return null;
  const s = f.s;
  const roadY = roadLine(f);
  const x = f.w * 0.085;
  const hgt = Math.min(f.h * 0.56, (roadY - f.gy) * 1.6 + 150 * s);
  const top = roadY - hgt;
  const armR = 22 * s;
  return (
    <G>
      <Ellipse cx={x} cy={roadY - 2 * s} rx={17 * s} ry={4 * s} fill={palette.navy} opacity={0.14} />
      <Rect x={x - 11 * s} y={roadY - 16 * s} width={22 * s} height={16 * s} rx={6} fill={palette.charcoal} />
      <Rect x={x - 11 * s} y={roadY - 16 * s} width={7 * s} height={16 * s} rx={4} fill={HILITE} />
      <Rect x={x - 5.6 * s} y={top + armR} width={11 * s} height={hgt - armR - 10 * s} rx={5.6 * s} fill={palette.charcoalDark} />
      <Rect x={x - 5.6 * s} y={top + armR} width={4 * s} height={hgt - armR - 10 * s} fill={HILITE} />
      <Path d={`M ${x} ${top + armR + 4 * s} q 0 ${-armR} ${armR} ${-armR}`} stroke={palette.charcoalDark} strokeWidth={8 * s} fill="none" strokeLinecap="round" />
      <Path d={`M ${x + armR * 0.5} ${top} h ${26 * s} l ${-6 * s} ${24 * s} h ${-14 * s} z`} fill={palette.charcoal} />
      <Path d={`M ${x + armR * 0.5 + 4 * s} ${top + 3 * s} h ${18 * s} l ${-4.4 * s} ${17 * s} h ${-9.2 * s} z`} fill="#FFE9A8" />
      <Ellipse cx={x + armR * 0.5 + 13 * s} cy={top + 12 * s} rx={30 * s} ry={23 * s} fill={palette.safetyYellow} opacity={0.16} />
      <Rect x={x + armR * 0.5 + 7 * s} y={top - 7 * s} width={13 * s} height={8 * s} rx={3} fill={palette.charcoalDark} />
      {/* a manhole out on the road, so the tarmac is a surface too */}
      <Ellipse cx={f.w * 0.68} cy={roadY + (f.h - roadY) * 0.36} rx={22 * s} ry={7 * s} fill={SHADE} />
      <Ellipse cx={f.w * 0.68} cy={roadY + (f.h - roadY) * 0.36 - 1.5 * s} rx={19 * s} ry={5.6 * s} fill="#AEB6CC" />
    </G>
  );
}

/** The drain grate that makes a pavement read as a real surface. */
export function Drain({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Rect x={-13} y={-6} width={26} height={12} rx={5} fill="rgba(31,42,90,0.22)" />
      <Rect x={-11} y={-4} width={22} height={8} rx={3.5} fill="#AEB6CC" />
      <Rect x={-9} y={-2.4} width={18} height={1.6} rx={0.8} fill="rgba(31,42,90,0.22)" />
      <Rect x={-9} y={0.6} width={18} height={1.6} rx={0.8} fill="rgba(31,42,90,0.22)" />
    </G>
  );
}

/** A soft haze band so the far layers never meet the near ones at a seam. */
export function Haze({ f, gradientId }: { f: SceneFrame; gradientId: string }) {
  const top = Math.max(0, f.gy - 190 * f.s);
  return <Rect x={0} y={top} width={f.w} height={f.gy - top + 2} fill={`url(#${gradientId})`} />;
}

export { HIGHLIGHT };
