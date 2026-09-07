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
import { courseLines, darker, fanJoints, fanStripe, lighter, mix, rowOf, rp, vary, type SceneFrame } from './frame';
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
      /* a corner turret with a witch's hat — the old water tower read as a
         mushroom on a stalk, which is not a thing a town has */
      caps += rp(x - 2 * s, top - 4 * s, bw + 4 * s, 6 * s);
      const tx = x + bw * 0.7;
      const tw2 = Math.max(7 * s, bw * 0.2);
      nodes.push(
        <G key={`fw${i}`}>
          <Rect x={tx - tw2} y={top - 30 * s} width={tw2 * 2} height={34 * s} rx={4} fill={tint} />
          <Path d={`M ${tx - tw2 - 3 * s} ${top - 30 * s} L ${tx} ${top - 52 * s} L ${tx + tw2 + 3 * s} ${top - 30 * s} Z`} fill={tint} />
        </G>,
      );
      caps += rp(x + bw * 0.14, top - 12 * s, 4 * s, 9 * s);
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
export function MidTerrace({
  f,
  seed = 4,
  opacity = 0.88,
  tints,
  haze,
  fade = 0,
}: {
  f: SceneFrame;
  seed?: number;
  opacity?: number;
  tints?: { walls?: readonly string[]; roofs?: readonly string[] };
  /** the sky tone the whole terrace is washed towards */
  haze?: string;
  /** 0 = full strength, 1 = the sky. The value step behind the hero. */
  fade?: number;
}) {
  const air = haze ?? '#CFE6F7';
  const back = (c: string): string => (fade > 0 ? mix(c, air, fade) : c);
  const walls = (tints?.walls ?? MID_WALLS).map((c) => back(c));
  const roofs = (tints?.roofs ?? MID_ROOFS).map((c) => back(c));
  const baseY = f.gy + 6;
  const u = Math.max(44, f.bh);
  const s = f.s;
  const glassTone = back('#4A5C8E');
  const trim = back(palette.cream);
  const shade = fade > 0.3 ? SHADE_SOFT : SHADE;
  const out: React.ReactElement[] = [];
  const unit = Math.max(54, f.bw * 0.32);
  let x = -unit * 0.35;
  let i = 0;
  while (x < f.w + 8 && i < 10) {
    const bw = unit * (0.8 + vary(i, seed + 2) * 0.5);
    /* The neighbours give the hero its scale, so they may not out-rank it:
       most sit below its eaves and only the odd one shoulders past. A terrace
       drawn half again as tall as the building the scene is *about* is what
       made the hero look like a shed in its own picture. */
    const bh = Math.min(u * (0.52 + vary(i + 6, seed + 2) * 0.56), baseY - 26 * s);
    const top = baseY - bh;
    const wall = walls[i % walls.length] ?? '#F0DCBB';
    const roof = roofs[(i * 2 + seed) % roofs.length] ?? '#C4776A';
    const awn = back(MID_AWNS[(i + seed) % MID_AWNS.length] ?? palette.engineRed);
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
            <Rect x={x - 5} y={top + 2 * s} width={bw + 10} height={4 * s} rx={2} fill={shade} />
          </G>
        )}
        <Path d={reveals} fill={trim} opacity={0.55} />
        <Path d={panes} fill={glassTone} opacity={0.6} />
        <Path d={sills} fill={shade} />
        <Rect x={x + 4} y={baseY - shopH - 13 * s} width={bw - 8} height={11 * s} rx={4} fill={trim} />
        <Path d={`M ${x + 2} ${baseY - shopH} h ${bw - 4} l ${-5 * s} ${13 * s} h ${-(bw - 4 - 10 * s)} z`} fill={awn} />
        <Path
          d={rp(x + 8, baseY - shopH + 18 * s, bw * 0.42, Math.max(4, shopH - 20 * s)) + rp(x + bw * 0.6, baseY - shopH + 16 * s, bw * 0.24, Math.max(4, shopH - 18 * s))}
          fill={glassTone}
          opacity={0.45}
        />
      </G>,
    );
    x += bw + 3;
    i += 1;
  }
  return <G opacity={opacity}>{out}</G>;
}

/**
 * A TREE LINE for the middle distance — what stands behind a park gate. A row
 * of shopfronts there told the child they were on a high street; a bank of
 * canopies with trunks between them tells them they are looking into a park.
 * Three value steps only: back mass, front mass, trunks.
 */
export function TreeLine({ f, back, front, haze, fade = 0.3, opacity = 0.95 }: { f: SceneFrame; back: string; front: string; haze: string; fade?: number; opacity?: number }) {
  const baseY = f.gy + 8;
  const s = f.s;
  const u = Math.max(52, f.bh);
  const b = mix(back, haze, fade);
  const fr = mix(front, haze, fade * 0.7);
  const trunk = mix('#6B4A2C', haze, fade);
  let mass = '';
  let crown = '';
  let trunks = '';
  const step = Math.max(46 * s, f.w / 7);
  const n = Math.ceil((f.w + step) / step) + 1;
  for (let i = 0; i < n; i += 1) {
    const cx = -step * 0.4 + i * step;
    const r = step * (0.42 + vary(i, 7) * 0.2);
    const hgt = u * (0.36 + vary(i + 3, 7) * 0.3);
    const cy = baseY - hgt;
    mass += `M ${(cx - r).toFixed(1)} ${(cy + r * 0.5).toFixed(1)} a ${r.toFixed(1)} ${(r * 0.94).toFixed(1)} 0 1 1 ${(r * 2).toFixed(1)} 0 z`;
    trunks += rp(cx - 4.4 * s, cy + r * 0.4, 8.8 * s, hgt);
    if (i % 2 === 0) crown += `M ${(cx - r * 0.66).toFixed(1)} ${(cy + r * 0.2).toFixed(1)} a ${(r * 0.66).toFixed(1)} ${(r * 0.6).toFixed(1)} 0 1 1 ${(r * 1.32).toFixed(1)} 0 z`;
  }
  return (
    <G opacity={opacity}>
      <Rect x={-2} y={baseY - 10 * s} width={f.w + 4} height={30 * s} fill={b} />
      <Path d={trunks} fill={trunk} />
      <Path d={mass} fill={b} />
      <Path d={crown} fill={fr} />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Near ground                                                          */
/* ------------------------------------------------------------------ */

export type GroundKind = 'paving' | 'grass' | 'apron';

/**
 * How far below its ground line a scene may stand its dressing, in design
 * units. The pavement is guaranteed to be at least this deep, so a crate
 * authored at `height + 70` is on the pavement in every frame it is drawn in.
 */
export const DRESSING_DEPTH = 78;

/** A band of diagonal road hatching, batched into one path. */
function hatch(w: number, y: number, hgt: number, tw: number, step: number): string {
  let d = '';
  for (let x = -hgt; x < w + step; x += step) {
    d += `M ${x.toFixed(1)} ${(y + hgt).toFixed(1)} L ${(x + hgt).toFixed(1)} ${y.toFixed(1)} L ${(x + hgt + tw).toFixed(1)} ${y.toFixed(1)} L ${(x + tw).toFixed(1)} ${(y + hgt).toFixed(1)} Z`;
  }
  return d;
}

/** Where the pavement gives way to the road — shared by the ground and its furniture. */
/**
 * Where the pavement gives way to the road.
 *
 * Most of the near plane is *pavement*: that is the part carrying joints,
 * furniture and the place's own dressing, and a road handed half of it is
 * simply a hole in the picture. The floor of `DRESSING_DEPTH × k` is what
 * keeps a scene honest across aspect ratios — a scene's crates and puddles are
 * authored in design units below its ground line, so on a short landscape
 * panel a pavement measured only as a fraction of the frame would end above
 * them and stand the bakery's bicycle in the middle of the road.
 */
export const roadLine = (f: SceneFrame): number =>
  f.gy +
  Math.min(
    Math.max((f.h - f.gy) * 0.62, DRESSING_DEPTH * f.k),
    Math.max(38 * f.s, f.h - f.gy - 24 * f.s),
  );

/**
 * THE NEAR GROUND PLANE.
 *
 * The failure this replaces: pavement and road drawn one value apart, ruled
 * with parallel vertical lines, filling the bottom 40 % of the frame with a
 * single grey nothing. A ground plane needs three things to stop reading as a
 * wall — joints that *recede* (`fanJoints`, converging on the horizon, with
 * cross-courses that open out towards the viewer), a real kerb with a lit top
 * edge and a shadowed face, and a road that is properly darker than the
 * pavement rather than a shade of it. Each band is one clear value step down
 * from the one behind it, which is the same rule the depth planes above obey.
 */
export function GroundPlane({ f, near, lip, kind = 'paving' }: { f: SceneFrame; near: string; lip: string; kind?: GroundKind }) {
  const { w, h, gy, s } = f;
  const edge = `M 0 ${gy + 7 * s} Q ${w / 2} ${gy - 5 * s} ${w} ${gy + 7 * s}`;
  const roadY = Math.min(roadLine(f), h - 6 * s);
  /* a road thinner than a kerb is a stripe, not a road: on a short panel the
     near plane is simply all pavement */
  const hasRoad = kind !== 'grass' && roadY < h - Math.max(12 * s, h * 0.055);
  const kerbH = Math.max(5, 9 * s);
  const tarmac = mix(near, palette.charcoal, 0.46);
  const front = hasRoad ? roadY : h;

  if (kind === 'grass') {
    /* mown bands widen towards the viewer, and a worn path runs to the gate */
    const bands = courseLines(w, gy + 10 * s, h, 7, 7 * s);
    const pathTop = gy + (h - gy) * 0.1;
    return (
      <G>
        <Path d={`${edge} L ${w} ${h} L 0 ${h} Z`} fill={near} />
        <Path d={`${edge} L ${w} ${gy + 15 * s} Q ${w / 2} ${gy + 3 * s} 0 ${gy + 15 * s} Z`} fill={lip} />
        <Path d={bands} fill={SHADE_SOFT} />
        <Path
          d={`M ${w * 0.5 - w * 0.09} ${pathTop} L ${w * 0.5 + w * 0.09} ${pathTop} L ${w * 0.5 + w * 0.42} ${h} L ${w * 0.5 - w * 0.42} ${h} Z`}
          fill={mix(near, '#E8DFC8', 0.62)}
        />
        <Path d={fanJoints(w, gy, pathTop + 4 * s, h, 5, 2.6 * s)} fill={SHADE_SOFT} opacity={0.7} />
        <Path d={courseLines(w, pathTop, h, 4, 2.4 * s)} fill={SHADE_SOFT} opacity={0.45} />
      </G>
    );
  }

  const apron = kind === 'apron';
  const joints = fanJoints(w, gy, gy + 14 * s, front, apron ? 5 : 9, apron ? 3.4 * s : 2.8 * s);
  const courses = courseLines(w, gy + 12 * s, front, apron ? 2 : 3, 2.6 * s);
  /* The station's forecourt is one continuous surface from the bay doors to the
     kerb. Drawn inside the building's design box it stopped a third of the way
     down and left a second, slightly different grey behind it — two grounds
     where the child should read one. In px space it always reaches the kerb. */
  const surface = apron ? lighter(near, 0.16) : near;
  const surfaceLip = apron ? lighter(lip, 0.2) : lip;
  return (
    <G>
      <Path d={`${edge} L ${w} ${h} L 0 ${h} Z`} fill={surface} />
      <Path d={`${edge} L ${w} ${gy + 15 * s} Q ${w / 2} ${gy + 3 * s} 0 ${gy + 15 * s} Z`} fill={surfaceLip} />
      {/* each slab lit along its far edge and shaded along its near one: a joint
          drawn as a single dark line is a scratch, a joint drawn as a bevel is
          a paving slab, and that is the difference between a grey area and a
          surface the eye believes it could walk on */}
      <Path d={joints + courses} fill="rgba(255,255,255,0.5)" />
      <G y={1.7 * s}>
        <Path d={joints + courses} fill={SHADE_SOFT} />
      </G>
      {apron ? (
        /* The two guide lines the engines line up on, receding with the surface.
           They are the *bays'* lines, so they are quoted off the building's own
           box rather than off the frame: 87.5 and 212.5 are the shutter centres
           in `stationYardArt`'s design units. Drawn at a fixed fraction of the
           frame they landed outside the doors on a phone and inside them on a
           tablet, which is the one thing a guide line may not do. */
        <Path
          d={
            fanStripe(w, gy, gy + 18 * s, front - 4 * s, (f.ox + 87.5 * f.k) / w, 9 * s) +
            fanStripe(w, gy, gy + 18 * s, front - 4 * s, (f.ox + 212.5 * f.k) / w, 9 * s)
          }
          fill={palette.safetyYellow}
          opacity={0.5}
        />
      ) : null}
      {hasRoad ? (
        <G>
          {/* tarmac, a full value step below the pavement */}
          <Rect x={0} y={roadY} width={w} height={h - roadY} fill={tarmac} />
          {/* the kerb: lit top edge, shadowed face, and the gutter it casts */}
          <Rect x={0} y={roadY - 3 * s} width={w} height={4.4 * s} rx={2 * s} fill={lighter(lip, 0.45)} />
          <Rect x={0} y={roadY + 1 * s} width={w} height={kerbH} fill={darker(lip, 0.2)} />
          <Rect x={0} y={roadY + kerbH} width={w} height={3.4 * s} fill={darker(tarmac, 0.24)} opacity={0.75} />
          {f.detail ? (
            <G>
              {/* two worn wheel tracks, so the tarmac is a surface cars use */}
              <Path
                d={rp(-4, roadY + (h - roadY) * 0.22, w + 8, (h - roadY) * 0.2) + rp(-4, roadY + (h - roadY) * 0.74, w + 8, (h - roadY) * 0.18)}
                fill="rgba(255,255,255,0.05)"
              />
              {kind === 'apron' ? (
                /* KEEP CLEAR hatching outside the engine bays — the one piece of
                   road marking a fire station always has */
                <Path d={hatch(w, roadY + kerbH + 5 * s, Math.max(14, (h - roadY) * 0.4), 7 * s, 26 * s)} fill={palette.safetyYellow} opacity={0.5} />
              ) : null}
              <Path
                d={`M 0 ${roadY + (h - roadY) * 0.62} H ${w}`}
                stroke={palette.cream}
                strokeWidth={4.4 * s}
                strokeDasharray={`${22 * s} ${18 * s}`}
                strokeLinecap="round"
                opacity={0.7}
              />
            </G>
          ) : null}
        </G>
      ) : null}
    </G>
  );
}

/** The street lamp that anchors the left of the near plane. */
function NearLamp({ f, x, base }: { f: SceneFrame; x: number; base: number }) {
  const s = f.s;
  const hgt = Math.min(f.h * 0.58, (base - f.gy) * 1.5 + 165 * s);
  const top = base - hgt;
  const armR = 22 * s;
  return (
    <G>
      {/* the shadow it throws down-right, because the light is top-left. A long
          cast shadow is the cheapest thing that turns an empty pavement into a
          lit one, and it costs a single path. */}
      <Path
        d={`M ${x - 7 * s} ${base} L ${x + 7 * s} ${base} L ${x + 78 * s} ${base + 40 * s} L ${x + 52 * s} ${base + 42 * s} Z`}
        fill={palette.navy}
        opacity={0.075}
      />
      <Ellipse cx={x} cy={base - 2 * s} rx={19 * s} ry={4.6 * s} fill={palette.navy} opacity={0.16} />
      <Rect x={x - 11 * s} y={base - 16 * s} width={22 * s} height={16 * s} rx={6} fill={palette.charcoal} />
      <Rect x={x - 11 * s} y={base - 16 * s} width={7 * s} height={16 * s} rx={4} fill={HILITE} />
      <Rect x={x - 5.6 * s} y={top + armR} width={11 * s} height={hgt - armR - 10 * s} rx={5.6 * s} fill={palette.charcoalDark} />
      <Rect x={x - 5.6 * s} y={top + armR} width={4 * s} height={hgt - armR - 10 * s} fill={HILITE} />
      <Path d={`M ${x} ${top + armR + 4 * s} q 0 ${-armR} ${armR} ${-armR}`} stroke={palette.charcoalDark} strokeWidth={8 * s} fill="none" strokeLinecap="round" />
      <Path d={`M ${x + armR * 0.5} ${top} h ${26 * s} l ${-6 * s} ${24 * s} h ${-14 * s} z`} fill={palette.charcoal} />
      <Path d={`M ${x + armR * 0.5 + 4 * s} ${top + 3 * s} h ${18 * s} l ${-4.4 * s} ${17 * s} h ${-9.2 * s} z`} fill="#FFE9A8" />
      <Ellipse cx={x + armR * 0.5 + 13 * s} cy={top + 12 * s} rx={30 * s} ry={23 * s} fill={palette.safetyYellow} opacity={0.16} />
      <Rect x={x + armR * 0.5 + 7 * s} y={top - 7 * s} width={13 * s} height={8 * s} rx={3} fill={palette.charcoalDark} />
    </G>
  );
}

/**
 * The hydrant at the right-hand kerb. It is the near plane's second anchor and
 * — in a fire-department game — the one prop that belongs on every street in
 * town, so the same red says "this is our patch" in all ten places.
 */
function NearHydrant({ f, x, base }: { f: SceneFrame; x: number; base: number }) {
  const u = Math.max(0.5, f.s) * 1.5;
  return (
    <G x={x} y={base} scale={u}>
      <Path d="M -12 0 L 12 0 L 62 26 L 30 28 Z" fill={palette.navy} opacity={0.075} />
      <Ellipse cx={0} cy={0} rx={17} ry={4} fill={palette.navy} opacity={0.16} />
      <Rect x={-15} y={-7} width={30} height={8} rx={3.4} fill={palette.engineRedDark} />
      <Rect x={-15} y={-7} width={30} height={2.6} rx={1.3} fill={HILITE} />
      <Rect x={-10} y={-38} width={20} height={32} rx={7} fill={palette.engineRed} />
      <Rect x={-10} y={-36} width={5.4} height={28} rx={2.7} fill={HILITE} />
      <Rect x={4} y={-36} width={6} height={28} rx={3} fill={SHADE} />
      <Rect x={-17} y={-31} width={8} height={10} rx={4} fill={palette.engineRedDark} />
      <Rect x={9} y={-31} width={8} height={10} rx={4} fill={palette.engineRedDark} />
      <Rect x={-13} y={-45} width={26} height={8} rx={4} fill={palette.engineRedDark} />
      <Rect x={-13} y={-45} width={26} height={2.6} rx={1.3} fill={HILITE} />
      <Path d="M -9 -45 q 0 -10 9 -10 q 9 0 9 10 z" fill={palette.engineRed} />
      <Path d="M -9 -45 q 0 -10 9 -10 l 0 10 z" fill={HILITE} />
      <Circle cx={0} cy={-56} r={3.6} fill={palette.gold} />
      <Rect x={-11} y={-24} width={22} height={4} rx={2} fill={palette.safetyYellow} opacity={0.9} />
    </G>
  );
}

/**
 * THE NEAREST PLANE. A pavement that runs 150 px down the frame with nothing on
 * it is the same mistake as a bare sky, so the front of the frame gets real
 * furniture — darker, crisper and much larger than anything on the building,
 * which is what tells the eye it is in front. It stands at the two edges, so
 * a dialogue bubble in the middle of the screen never lands on top of it.
 */
export function NearStreet({ f, kind }: { f: SceneFrame; kind: GroundKind }) {
  if (!f.detail) return null;
  const s = f.s;
  const roadY = Math.min(roadLine(f), f.h - 6 * s);
  /* the furniture stands *on* the pavement a little back from the kerb, not
     balanced on its edge — and high enough that a dialogue card across the
     bottom of the screen never swallows the whole prop */
  const kerb = f.gy + (roadY - f.gy) * 0.86;
  if (kind === 'grass') {
    /* a park closes at the front with a low rail and a scatter of daisies */
    const y = f.h - 10 * s;
    return (
      <G>
        <NearLamp f={f} x={f.w * 0.08} base={f.gy + (f.h - f.gy) * 0.34} />
        <G>
          <Path d={rowOf(9, -10, y - 26 * s, 3.4 * s, 26 * s, f.w / 8)} fill="#4E5776" opacity={0.9} />
          <Rect x={-6} y={y - 30 * s} width={f.w + 12} height={5.4 * s} rx={2.7 * s} fill="#4E5776" />
          <Rect x={-6} y={y - 30 * s} width={f.w + 12} height={2 * s} rx={1 * s} fill={HILITE} />
        </G>
        <Path
          d={rp(f.w * 0.26, f.h - 40 * s, 3.4 * s, 3.4 * s) + rp(f.w * 0.34, f.h - 30 * s, 3 * s, 3 * s) + rp(f.w * 0.71, f.h - 36 * s, 3.2 * s, 3.2 * s)}
          fill={palette.white}
          opacity={0.7}
        />
      </G>
    );
  }
  return (
    <G>
      <NearLamp f={f} x={f.w * 0.075} base={kerb} />
      {/* the yard draws its own hydrant on the apron; two would be one too many */}
      {kind === 'paving' ? <NearHydrant f={f} x={f.w * 0.915} base={kerb} /> : null}
      {/* the drain in the gutter and a manhole out on the tarmac, so both
          surfaces read as surfaces rather than as fills */}
      <Drain x={f.w * 0.72} y={roadY + 5 * s} s={Math.max(0.55, s * 0.95)} />
      <Ellipse cx={f.w * 0.4} cy={roadY + (f.h - roadY) * 0.42} rx={26 * s} ry={8 * s} fill={SHADE} />
      <Ellipse cx={f.w * 0.4} cy={roadY + (f.h - roadY) * 0.42 - 1.8 * s} rx={22 * s} ry={6.4 * s} fill="#9AA3BB" />
      <Path d={rowOf(3, f.w * 0.4 - 13 * s, roadY + (f.h - roadY) * 0.42 - 3 * s, 26 * s, 1.6 * s, 3.4 * s)} fill={SHADE} opacity={0.6} />
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
