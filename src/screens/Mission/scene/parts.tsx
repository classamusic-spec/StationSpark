/**
 * The sticker vocabulary every scene is built from.
 *
 * House rules (docs/ART_DIRECTION.md, docs/ART_CRITIQUE.md §Consistency):
 * one base fill → one navy-14 % shade → one white-32 % highlight, no black
 * outlines, light from the top-left, radii from `@/theme`, and a soft navy
 * contact ellipse (`ry ≈ rx × 0.22`) under anything that stands on ground.
 *
 * Everything here is authored in a scene's **design units** (see `frame.ts`),
 * and anything that repeats — window grids, roof tiles, brick courses, paving,
 * awning stripes, railings — is concatenated into a single `<Path/>` so a
 * hundred small shapes cost one node instead of a hundred.
 */
import React from 'react';
import { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { fontFamily, palette } from '@/theme';
import { HIGHLIGHT, SHADE, SHADE_DEEP, SHADOW_FILL, SHADOW_OPACITY } from '@/world/tone';
import { rowOf, rp } from './frame';

export { HIGHLIGHT, SHADE, SHADE_DEEP };
export const SHEEN = 'rgba(255,255,255,0.32)';
export const SHADE_SOFT = 'rgba(31,42,90,0.08)';
export const GLASS = '#7FB6E8';
export const GLASS_DEEP = '#4E7CB8';
export const GLASS_WARM = '#FFE9A8';

/** The navy contact ellipse every grounded object gets (consistency rule #3). */
export function Contact({ cx, cy, rx, o = SHADOW_OPACITY }: { cx: number; cy: number; rx: number; o?: number }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={Math.max(1.4, rx * 0.22)} fill={SHADOW_FILL} opacity={o} />;
}

/**
 * THE SHADOW A BUILDING CASTS — not the same shape as the shadow a crate
 * casts. `Contact`'s `ry = rx × 0.22` is right for a bin; on a 150-unit-wide
 * façade it draws a 66-unit grey lens that arcs halfway down the pavement and
 * reads as a smudge on the lens. A wall's shadow is a low, wide band hugging
 * its base and thrown a little to the right, because the light is top-left.
 */
export function BaseShadow({ cx, y, rx }: { cx: number; y: number; rx: number }) {
  return (
    <G>
      <Ellipse cx={cx + rx * 0.05} cy={y} rx={rx} ry={Math.max(3, rx * 0.062)} fill={SHADOW_FILL} opacity={0.13} />
      <Ellipse cx={cx + rx * 0.08} cy={y - 1} rx={rx * 0.82} ry={Math.max(2, rx * 0.034)} fill={SHADOW_FILL} opacity={0.1} />
    </G>
  );
}

/**
 * A wall bracket for a hanging shop sign. Without it the swaying ornament is a
 * card floating in mid-air beside the building; with it the sign is *hung* —
 * and the bracket is where the eye reads the pivot the sway turns about.
 */
export function SignBracket({ x, y, reach = 26, drop = 8 }: { x: number; y: number; reach?: number; drop?: number }) {
  const armX = Math.min(x, x + reach);
  const armW = Math.abs(reach);
  return (
    <G>
      <Rect x={x - 4} y={y - drop - 5} width={8} height={drop + 14} rx={3} fill={palette.charcoalDark} />
      <Rect x={x - 4} y={y - drop - 5} width={3} height={drop + 14} rx={1.5} fill={HIGHLIGHT} />
      <Rect x={armX} y={y - drop} width={armW} height={5} rx={2.5} fill={palette.charcoal} />
      <Rect x={armX} y={y - drop} width={armW} height={2} rx={1} fill={HIGHLIGHT} />
      <Path
        d={`M ${x} ${y - drop + 5} L ${x + reach * 0.6} ${y - drop + 5} L ${x} ${y - drop + 5 + armW * 0.52} Z`}
        fill={palette.charcoal}
        opacity={0.7}
      />
      <Circle cx={x + reach} cy={y - drop + 4} r={2.6} fill={palette.charcoalDark} />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Roofs                                                                */
/* ------------------------------------------------------------------ */

/**
 * A pitched roof with real tile courses, a ridge cap, an eaves band and the
 * soffit shadow it drops onto the wall below.
 */
export function PitchedRoof({
  x,
  y,
  w,
  rise,
  over = 10,
  tone,
  toneDark,
  tiles = true,
}: {
  x: number;
  y: number;
  w: number;
  rise: number;
  over?: number;
  tone: string;
  toneDark: string;
  tiles?: boolean;
}) {
  const apex = x + w / 2;
  let courses = '';
  if (tiles) {
    const n = Math.max(2, Math.round(rise / 9));
    for (let i = 1; i < n; i += 1) {
      const t = i / n;
      const hw = (w / 2 + over) * t;
      courses += rp(apex - hw, y - rise + t * rise - 1.6, hw * 2, 2.2);
    }
  }
  return (
    <G>
      <Path d={`M ${x - over} ${y} L ${apex} ${y - rise} L ${x + w + over} ${y} Z`} fill={tone} />
      <Path d={`M ${x - over} ${y} L ${apex} ${y - rise} L ${apex} ${y} Z`} fill={HIGHLIGHT} />
      {tiles ? <Path d={courses} fill={SHADE_SOFT} /> : null}
      <Path d={`M ${apex - 4} ${y - rise} l 4 -5 l 4 5 z`} fill={toneDark} />
      <Rect x={x - over - 3} y={y - 5} width={w + over * 2 + 6} height={11} rx={5} fill={toneDark} />
      <Rect x={x - over - 3} y={y - 5} width={w + over * 2 + 6} height={3.4} rx={1.7} fill={HIGHLIGHT} />
      <Rect x={x} y={y + 6} width={w} height={6} fill={SHADE_SOFT} />
    </G>
  );
}

/** A hipped roof — the firehouse's own roofline: a trapezoid, not a triangle. */
export function HippedRoof({
  x,
  y,
  w,
  rise,
  inset,
  over = 8,
  tone,
  toneLight,
  toneDark,
}: {
  x: number;
  y: number;
  w: number;
  rise: number;
  inset: number;
  over?: number;
  tone: string;
  toneLight: string;
  toneDark: string;
}) {
  return (
    <G>
      <Path
        d={`M ${x - over} ${y} L ${x + inset} ${y - rise} L ${x + w - inset} ${y - rise} L ${x + w + over} ${y} Z`}
        fill={tone}
      />
      <Path d={`M ${x + inset} ${y - rise} L ${x + w - inset} ${y - rise} L ${x + w - inset - 5} ${y - rise + 9} L ${x + inset + 5} ${y - rise + 9} Z`} fill={toneLight} />
      <Path d={`M ${x + w - inset} ${y - rise} L ${x + w + over} ${y} L ${x + w + over - 8} ${y} L ${x + w - inset - 4} ${y - rise + 2} Z`} fill={SHADE} />
      <Rect x={x - over - 4} y={y - 6} width={w + over * 2 + 8} height={13} rx={6} fill={toneDark} />
      <Rect x={x - over - 4} y={y - 6} width={w + over * 2 + 8} height={4} rx={2} fill={HIGHLIGHT} />
      <Rect x={x} y={y + 7} width={w} height={7} fill={SHADE_SOFT} />
    </G>
  );
}

/** A flat roof with a capping course — the parapet a town shop wears. */
export function Parapet({ x, y, w, tone, toneDark }: { x: number; y: number; w: number; tone: string; toneDark: string }) {
  return (
    <G>
      <Rect x={x - 7} y={y - 13} width={w + 14} height={15} rx={6} fill={tone} />
      <Rect x={x - 7} y={y - 13} width={w + 14} height={4} rx={2} fill={HIGHLIGHT} />
      <Rect x={x - 7} y={y - 1} width={w + 14} height={6} rx={3} fill={toneDark} />
      <Rect x={x} y={y + 5} width={w} height={6} fill={SHADE_SOFT} />
    </G>
  );
}

/** A chimney stack with its cap and its lit face. */
export function Chimney({ x, y, w, h, tone, cap }: { x: number; y: number; w: number; h: number; tone: string; cap: string }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={3} fill={tone} />
      <Rect x={x} y={y} width={w * 0.32} height={h} fill={HIGHLIGHT} />
      <Rect x={x - 3} y={y - 6} width={w + 6} height={8} rx={3.5} fill={cap} />
      <Rect x={x - 3} y={y - 6} width={w + 6} height={2.6} rx={1.3} fill={HIGHLIGHT} />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Walls, courses and openings                                          */
/* ------------------------------------------------------------------ */

/** A field of brickwork: staggered courses, batched into one path. */
export function Brickwork({ x, y, w, h, bw = 15, bh = 7.5, tone = SHADE_SOFT }: { x: number; y: number; w: number; h: number; bw?: number; bh?: number; tone?: string }) {
  let d = '';
  const rows = Math.max(1, Math.floor(h / bh));
  for (let r = 0; r < rows; r += 1) {
    const oy = y + r * bh;
    d += rp(x, oy, w, 1.1);
    const off = r % 2 === 0 ? 0 : bw / 2;
    for (let c = 0; x + off + c * bw < x + w; c += 1) {
      const cx = x + off + c * bw;
      if (cx <= x || cx >= x + w) continue;
      d += rp(cx, oy, 1.1, bh);
    }
  }
  return <Path d={d} fill={tone} />;
}

/** Square glazed wall tiles — the bakery's shopfront skin. */
export function TileField({ x, y, w, h, size = 11, tone = SHADE_SOFT }: { x: number; y: number; w: number; h: number; size?: number; tone?: string }) {
  let d = '';
  for (let gy = y; gy < y + h - 1; gy += size) d += rp(x, gy, w, 1.1);
  for (let gx = x; gx < x + w - 1; gx += size) d += rp(gx, y, 1.1, h);
  return <Path d={d} fill={tone} />;
}

export interface WindowGridProps {
  rows: number;
  cols: number;
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  glass?: string;
  frame?: string;
  /** vertical / horizontal mullion counts inside each pane */
  mullions?: [number, number];
  sill?: string;
  /** which pane index (row * cols + col) is lit warm */
  lit?: number;
}

/**
 * A grid of recessed windows: reveal, glass, mullions, a reflection streak and
 * a sill under each — the whole grid in six nodes however many panes it has
 * (consistency rule #8: a window is never a bare rounded rectangle).
 */
export function WindowGrid({ rows, cols, x, y, w, h, dx, dy, glass = GLASS, frame = palette.cream, mullions = [1, 1], sill = SHADE, lit }: WindowGridProps) {
  let reveals = '';
  let panes = '';
  let bars = '';
  let sills = '';
  let shine = '';
  let warm = '';
  const [mv, mh] = mullions;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const px = x + c * dx;
      const py = y + r * dy;
      reveals += rp(px - 3, py - 3, w + 6, h + 6);
      if (lit !== undefined && r * cols + c === lit) warm += rp(px, py, w, h);
      else panes += rp(px, py, w, h);
      for (let i = 1; i <= mv; i += 1) bars += rp(px + (w / (mv + 1)) * i - 1, py, 2, h);
      for (let i = 1; i <= mh; i += 1) bars += rp(px, py + (h / (mh + 1)) * i - 1, w, 2);
      shine += `M ${px + 1} ${py + h - 1} L ${px + w * 0.52} ${py + 1} L ${px + w * 0.74} ${py + 1} L ${px + 1 + w * 0.22} ${py + h - 1} Z`;
      sills += rp(px - 5, py + h + 2, w + 10, 4);
    }
  }
  return (
    <G>
      <Path d={reveals} fill={frame} />
      <Path d={panes} fill={glass} />
      {warm ? <Path d={warm} fill={GLASS_WARM} /> : null}
      <Path d={shine} fill={palette.white} opacity={0.22} />
      <Path d={bars} fill={frame} opacity={0.9} />
      <Path d={sills} fill={sill} />
    </G>
  );
}

/** A round-headed window: arch, glass, radiating bars, sill. */
export function ArchWindow({ x, y, w, h, glass = GLASS, frame = palette.cream }: { x: number; y: number; w: number; h: number; glass?: string; frame?: string }) {
  const r = w / 2;
  const body = `M ${x} ${y + h} L ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} L ${x + w} ${y + h} Z`;
  return (
    <G>
      <Path d={`M ${x - 3} ${y + h} L ${x - 3} ${y + r} A ${r + 3} ${r + 3} 0 0 1 ${x + w + 3} ${y + r} L ${x + w + 3} ${y + h} Z`} fill={frame} />
      <Path d={body} fill={glass} />
      <Path d={`M ${x + 2} ${y + h - 2} L ${x + w * 0.55} ${y + r * 0.7} L ${x + w * 0.78} ${y + r * 0.8} L ${x + w * 0.3} ${y + h - 2} Z`} fill={palette.white} opacity={0.2} />
      <Path d={rp(x + w / 2 - 1, y + r * 0.4, 2, h - r * 0.4) + rp(x, y + r + h * 0.22, w, 2)} fill={frame} opacity={0.85} />
      <Rect x={x - 5} y={y + h} width={w + 10} height={4.4} rx={2} fill={SHADE} />
    </G>
  );
}

/** A shop door: reveal, leaf, glazing with a bar, a handle, a kick plate, a step. */
export function ShopDoor({
  x,
  y,
  w,
  h,
  wood = '#8A5A32',
  woodDark = '#6B4325',
  glass = GLASS,
  step = true,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  wood?: string;
  woodDark?: string;
  glass?: string;
  step?: boolean;
}) {
  return (
    <G>
      <Rect x={x - 4} y={y - 4} width={w + 8} height={h + 4} rx={6} fill={woodDark} />
      <Rect x={x} y={y} width={w} height={h} rx={4} fill={wood} />
      <Rect x={x} y={y} width={w * 0.22} height={h} fill={HIGHLIGHT} />
      <Rect x={x} y={y} width={w} height={4.4} rx={2.2} fill={SHADE_DEEP} />
      <Rect x={x + w * 0.14} y={y + h * 0.1} width={w * 0.72} height={h * 0.42} rx={4} fill={glass} />
      <Path d={`M ${x + w * 0.18} ${y + h * 0.5} L ${x + w * 0.6} ${y + h * 0.12} L ${x + w * 0.76} ${y + h * 0.12} L ${x + w * 0.34} ${y + h * 0.5} Z`} fill={palette.white} opacity={0.24} />
      <Rect x={x + w * 0.14} y={y + h * 0.29} width={w * 0.72} height={2} fill={wood} opacity={0.8} />
      <Rect x={x + w * 0.16} y={y + h * 0.68} width={w * 0.68} height={h * 0.16} rx={3} fill={SHADE_SOFT} />
      <Circle cx={x + w * 0.83} cy={y + h * 0.6} r={2.6} fill={palette.gold} />
      <Rect x={x + w * 0.78} y={y + h * 0.56} width={9} height={2.6} rx={1.3} fill={palette.gold} />
      {step ? (
        <G>
          <Rect x={x - 8} y={y + h - 1} width={w + 16} height={6} rx={3} fill="#DCE3F2" />
          <Rect x={x - 8} y={y + h + 3} width={w + 16} height={3} rx={1.5} fill={SHADE} />
        </G>
      ) : null}
    </G>
  );
}

/**
 * THE ONE PLAQUE TREATMENT (consistency rule #10): a cream board inside a tan
 * frame, lit along its top edge and shaded along its bottom.
 */
export function SignBoard({
  x,
  y,
  w,
  h = 24,
  label,
  fill = palette.cream,
  frame = palette.tanDark,
  ink = '#7A4A24',
  size,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  label: string;
  fill?: string;
  frame?: string;
  ink?: string;
  size?: number;
}) {
  const fs = size ?? Math.min(h * 0.58, (w / Math.max(4, label.length)) * 1.55);
  return (
    <G>
      <Rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={11} fill={frame} />
      <Rect x={x - 4} y={y - 4} width={w + 8} height={3.4} rx={1.7} fill={HIGHLIGHT} />
      <Rect x={x} y={y} width={w} height={h} rx={8} fill={fill} />
      <Rect x={x} y={y + h - 4} width={w} height={4} rx={2} fill={SHADE} />
      <SvgText
        x={x + w / 2}
        y={y + h / 2 + fs * 0.36}
        fontFamily={fontFamily.display}
        fontSize={fs}
        fontWeight="700"
        fill={ink}
        textAnchor="middle"
        letterSpacing={0.6}
      >
        {label}
      </SvgText>
    </G>
  );
}

/**
 * A striped canopy with a **scalloped valance** — the shopfront signature of
 * this town. Every stripe and every scallop is batched by colour, so the whole
 * awning is six nodes.
 */
export function Awning({
  x,
  y,
  w,
  h = 22,
  bands = 7,
  stripe = palette.engineRed,
  alt = palette.cream,
  proj = 6,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  bands?: number;
  stripe?: string;
  alt?: string;
  proj?: number;
}) {
  const bx = (t: number) => x - proj + t * (w + proj * 2);
  let a = '';
  let b = '';
  let sa = '';
  let sb = '';
  const vy = y + h;
  for (let i = 0; i < bands; i += 1) {
    const t0 = i / bands;
    const t1 = (i + 1) / bands;
    const seg = `M ${(x + t0 * w).toFixed(1)} ${y} L ${(x + t1 * w).toFixed(1)} ${y} L ${bx(t1).toFixed(1)} ${vy} L ${bx(t0).toFixed(1)} ${vy} Z`;
    const x0 = bx(t0);
    const x1 = bx(t1);
    const r = (x1 - x0) / 2;
    const sc = `M ${x0.toFixed(1)} ${vy} Q ${(x0 + r).toFixed(1)} ${(vy + r * 1.75).toFixed(1)} ${x1.toFixed(1)} ${vy} Z`;
    if (i % 2 === 0) {
      a += seg;
      sa += sc;
    } else {
      b += seg;
      sb += sc;
    }
  }
  return (
    <G>
      <Path d={a} fill={stripe} />
      <Path d={b} fill={alt} />
      <Path d={sa} fill={stripe} />
      <Path d={sb} fill={alt} />
      <Rect x={x - proj - 3} y={y - 5} width={w + proj * 2 + 6} height={8} rx={4} fill={stripe} />
      <Rect x={x - proj - 3} y={y - 5} width={w + proj * 2 + 6} height={3} rx={1.5} fill={HIGHLIGHT} />
      <Rect x={x} y={y + h + 1} width={w} height={5} fill={SHADE_SOFT} opacity={0.6} />
    </G>
  );
}

/** The shop bell over a door — a tiny brass note that says "come in". */
export function DoorBell({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Path d="M -5 0 q 3 -9 5 -9 q 2 0 5 9 z" fill={palette.gold} />
      <Path d="M -5 0 q 3 -9 5 -9 l 0 9 z" fill={HIGHLIGHT} />
      <Rect x={-6.5} y={0} width={13} height={2.6} rx={1.3} fill={palette.goldDark} />
      <Circle cx={0} cy={4} r={1.7} fill={palette.goldDark} />
      <Path d="M -8 -10 q 8 -6 16 0" stroke={palette.charcoal} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Ground dressing — the third scale                                    */
/* ------------------------------------------------------------------ */

/** A planter of clipped green with two flowers. */
export function Planter({ x, y, s = 1, pot = palette.tanDark }: { x: number; y: number; s?: number; pot?: string }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={1} rx={14} />
      <Ellipse cx={-4} cy={-19} rx={10} ry={8} fill="#3F944E" />
      <Ellipse cx={5} cy={-18} rx={9} ry={7.4} fill="#4FA858" />
      <Ellipse cx={0} cy={-24} rx={7.4} ry={6} fill="#5CB861" />
      <Ellipse cx={-3} cy={-27} rx={4} ry={2.4} fill={HIGHLIGHT} />
      <Circle cx={-7} cy={-24} r={2.6} fill={palette.pink} />
      <Circle cx={6} cy={-26} r={2.4} fill={palette.safetyYellow} />
      <Path d="M -11 -13 L 11 -13 L 8 1 L -8 1 Z" fill={pot} />
      <Path d="M 3 -13 L 11 -13 L 8 1 L 2 1 Z" fill={SHADE} />
      <Rect x={-12.5} y={-15} width={25} height={5} rx={2.5} fill={palette.creamDeep} />
      <Rect x={-12.5} y={-12.4} width={25} height={2.4} rx={1.2} fill={SHADE} />
    </G>
  );
}

/** A slatted crate, optionally heaped with produce. */
export function Crate({ x, y, s = 1, fruit }: { x: number; y: number; s?: number; fruit?: readonly [string, string] }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={1} rx={14} />
      <Rect x={-13} y={-14} width={26} height={15} rx={3} fill={palette.wood} />
      <Rect x={-13} y={-14} width={26} height={4} rx={2} fill={HIGHLIGHT} />
      <Path d={rp(-13, -9, 26, 1.6) + rp(-13, -4.5, 26, 1.6) + rp(-1, -14, 1.6, 15)} fill={palette.woodDark} opacity={0.55} />
      {fruit ? (
        <G>
          <Circle cx={-6} cy={-16} r={4.4} fill={fruit[0]} />
          <Circle cx={2} cy={-18} r={4.6} fill={fruit[1]} />
          <Circle cx={8} cy={-15.5} r={4} fill={fruit[0]} />
          <Circle cx={-7} cy={-18} r={1.6} fill={HIGHLIGHT} />
        </G>
      ) : null}
    </G>
  );
}

/** A stack of two crates — the way a delivery is always half unloaded. */
export function CrateStack({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={1} rx={16} />
      <Rect x={-14} y={-14} width={28} height={15} rx={3} fill={palette.wood} />
      <Rect x={-11} y={-28} width={24} height={14} rx={3} fill="#D19A5C" />
      <Rect x={-11} y={-28} width={24} height={4} rx={2} fill={HIGHLIGHT} />
      <Path d={rp(-14, -9, 28, 1.6) + rp(-11, -23, 24, 1.6) + rp(-11, -19, 24, 1.6)} fill={palette.woodDark} opacity={0.5} />
    </G>
  );
}

/** An A-frame chalkboard with three chalked lines. */
export function Chalkboard({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={1} rx={16} />
      <Path d="M 8 0 L 13 -26 L 16 -26 L 12 0 Z" fill={palette.woodDark} />
      <Rect x={-15} y={-30} width={28} height={30} rx={4} fill={palette.wood} />
      <Rect x={-15} y={-30} width={28} height={4} rx={2} fill={HIGHLIGHT} />
      <Rect x={-11.5} y={-26.5} width={21} height={23} rx={3} fill="#2E3A46" />
      <Path d={rp(-8, -22, 15, 2.2) + rp(-8, -17, 11, 2.2) + rp(-8, -12, 13, 2.2) + rp(-8, -7, 8, 2.2)} fill={palette.white} opacity={0.6} />
    </G>
  );
}

/** A bicycle leaning against a wall. Two wheels, a frame, a basket. */
export function Bicycle({ x, y, s = 1, tone = palette.engineRed, basket = true }: { x: number; y: number; s?: number; tone?: string; basket?: boolean }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={1} rx={20} />
      <Circle cx={-13} cy={-9} r={9} fill={palette.charcoal} />
      <Circle cx={-13} cy={-9} r={6} fill="#B9C0D6" />
      <Circle cx={-13} cy={-9} r={2} fill={palette.slate} />
      <Circle cx={13} cy={-9} r={9} fill={palette.charcoal} />
      <Circle cx={13} cy={-9} r={6} fill="#B9C0D6" />
      <Circle cx={13} cy={-9} r={2} fill={palette.slate} />
      <Path d="M -13 -9 L 0 -9 L 5 -21 L -5 -21 Z M 0 -9 L 13 -9 L 5 -21" stroke={tone} strokeWidth={3} fill="none" strokeLinejoin="round" />
      <Path d="M -13 -9 L -6 -22" stroke={tone} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Rect x={-9} y={-24} width={9} height={3} rx={1.5} fill={palette.charcoalDark} />
      <Path d="M 4 -22 q 5 -3 8 0" stroke={palette.charcoalDark} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      {basket ? (
        <G>
          <Path d="M 6 -21 L 17 -21 L 15 -12 L 8 -12 Z" fill="#D8A05C" />
          <Path d="M 6 -21 L 17 -21 L 16.6 -19 L 6.4 -19 Z" fill={HIGHLIGHT} />
        </G>
      ) : null}
    </G>
  );
}

/** A lidded street bin. */
export function Bin({ x, y, s = 1, tone = '#5F6A8C' }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={1} rx={11} />
      <Path d="M -9 -22 L 9 -22 L 7 0 L -7 0 Z" fill={tone} />
      <Path d="M 2 -22 L 9 -22 L 7 0 L 1 0 Z" fill={SHADE} />
      <Rect x={-11} y={-26} width={22} height={5.4} rx={2.7} fill={palette.charcoal} />
      <Rect x={-11} y={-26} width={22} height={2} rx={1} fill={HIGHLIGHT} />
      <Rect x={-2} y={-30} width={4} height={5} rx={2} fill={palette.charcoal} />
    </G>
  );
}

/** A shallow puddle with a sky reflection. */
export function Puddle({ x, y, rx = 16, tone = '#9FC9E8' }: { x: number; y: number; rx?: number; tone?: string }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={rx} ry={rx * 0.3} fill={tone} opacity={0.7} />
      <Ellipse cx={x - rx * 0.2} cy={y - rx * 0.06} rx={rx * 0.5} ry={rx * 0.13} fill={palette.white} opacity={0.45} />
    </G>
  );
}

/** A cat curled on the pavement or sitting on a ledge. */
export function Cat({ x, y, s = 1, tone = '#F0A24A', facing = 1 }: { x: number; y: number; s?: number; tone?: string; facing?: 1 | -1 }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={1} rx={12} />
      <Path d={`M ${-11 * facing} 0 q ${-7 * facing} -6 ${-2 * facing} -11`} stroke={tone} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Ellipse cx={0} cy={-5} rx={11} ry={6.4} fill={tone} />
      <Circle cx={8 * facing} cy={-12} r={6.4} fill={tone} />
      <Path d={`M ${4 * facing} -17 l ${2 * facing} -5 l ${3.4 * facing} 4 z M ${11 * facing} -18 l ${3.4 * facing} -4 l ${1.4 * facing} 5 z`} fill={tone} />
      <Ellipse cx={-2} cy={-8} rx={6} ry={3} fill={HIGHLIGHT} />
      <Circle cx={6.4 * facing} cy={-13} r={1.2} fill={palette.navy} />
      <Circle cx={10.6 * facing} cy={-13} r={1.2} fill={palette.navy} />
      <Path d={`M ${8.5 * facing} -10.4 l ${1.4 * facing} 1.2 l ${-1.4 * facing} 1 z`} fill={palette.pink} />
    </G>
  );
}

/** A pigeon — the smallest life a street can have. */
export function Pigeon({ x, y, s = 1, facing = 1 }: { x: number; y: number; s?: number; facing?: 1 | -1 }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={1} rx={7} />
      <Ellipse cx={0} cy={-4} rx={7} ry={4.6} fill="#8C94B3" />
      <Circle cx={5 * facing} cy={-9} r={3.4} fill="#9AA2BE" />
      <Path d={`M ${8 * facing} -9 l ${4 * facing} 1 l ${-4 * facing} 1.6 z`} fill={palette.gold} />
      <Ellipse cx={-2} cy={-5} rx={4.4} ry={2.4} fill="#6F7893" />
      <Circle cx={5.6 * facing} cy={-9.6} r={0.9} fill={palette.navy} />
    </G>
  );
}

/** A park bench: slats, arms and two cast-iron legs. */
export function Bench({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={1} rx={30} />
      <Rect x={-26} y={-27} width={52} height={5} rx={2.5} fill="#D69B52" />
      <Rect x={-26} y={-20} width={52} height={5} rx={2.5} fill={palette.wood} />
      <Rect x={-27} y={-12} width={54} height={6} rx={3} fill={palette.wood} />
      <Rect x={-27} y={-12} width={54} height={2.2} rx={1.1} fill={HIGHLIGHT} />
      <Rect x={-23} y={-7} width={5} height={8} rx={2.5} fill={palette.navySoft} />
      <Rect x={18} y={-7} width={5} height={8} rx={2.5} fill={palette.navySoft} />
      <Rect x={-25} y={-29} width={4} height={18} rx={2} fill={palette.navySoft} />
      <Rect x={21} y={-29} width={4} height={18} rx={2} fill={palette.navySoft} />
    </G>
  );
}

/** A warm street lamp with its lantern and a soft pool of light. */
export function LampPost({ x, y, h = 66, s = 1 }: { x: number; y: number; h?: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={1} rx={11} />
      <Rect x={-7} y={-9} width={14} height={10} rx={4} fill={palette.charcoal} />
      <Rect x={-3.4} y={-h} width={6.8} height={h - 6} rx={3.4} fill={palette.charcoalDark} />
      <Rect x={-3.4} y={-h} width={2.4} height={h - 6} fill={HIGHLIGHT} />
      <Path d={`M -8 ${-h - 2} h 16 l -3 12 h -10 z`} fill={palette.charcoal} />
      <Path d={`M -5.4 ${-h + 1} h 10.8 l -2 8.4 h -6.8 z`} fill="#FFE9A8" />
      <Ellipse cx={0} cy={-h + 4} rx={17} ry={13} fill={palette.safetyYellow} opacity={0.15} />
      <Rect x={-4} y={-h - 8} width={8} height={6} rx={2.6} fill={palette.charcoalDark} />
    </G>
  );
}

/** A layered tree — back mass, front mass, highlight, trunk. Never 3 circles. */
export function Tree({ x, y, s = 1, back = '#3E9A55', front = palette.leafGreen }: { x: number; y: number; s?: number; back?: string; front?: string }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={2} rx={21} />
      <Rect x={-4.4} y={-38} width={8.8} height={39} rx={4.4} fill={palette.woodDark} />
      <Rect x={-4.4} y={-38} width={3} height={39} fill={HIGHLIGHT} />
      <Path d="M -27 -40 q -4 -27 18 -31 q 7 -14 21 -5 q 20 -2 16 20 q 7 14 -12 16 z" fill={back} />
      <Path d="M -21 -42 q -2 -20 14 -23 q 7 -11 18 -4 q 14 0 12 15 q 4 11 -10 11 z" fill={front} />
      <Path d="M -12 -60 q 5 -9 16 -7 q -7 4 -16 7 z" fill={HIGHLIGHT} />
    </G>
  );
}

/** A clipped hedge with a rounded top — the quiet way to close a composition. */
export function Hedge({ x, y, w, h, back = '#3E8F58', front = '#57A96C' }: { x: number; y: number; w: number; h: number; back?: string; front?: string }) {
  return (
    <G>
      <Contact cx={x + w / 2} cy={y + 2} rx={w / 2} />
      <Path d={`M ${x} ${y} v ${-h * 0.6} q ${w * 0.14} ${-h * 0.5} ${w * 0.3} ${-h * 0.1} q ${w * 0.16} ${-h * 0.44} ${w * 0.34} ${-h * 0.06} q ${w * 0.16} ${-h * 0.36} ${w * 0.36} ${h * 0.12} L ${x + w} ${y} Z`} fill={back} />
      <Path d={`M ${x + 5} ${y} v ${-h * 0.44} q ${w * 0.18} ${-h * 0.34} ${w * 0.36} ${-h * 0.04} q ${w * 0.2} ${-h * 0.3} ${w * 0.4} ${h * 0.06} L ${x + w - 5} ${y} Z`} fill={front} />
    </G>
  );
}

/** A yellow bollard guarding an apron. */
export function Bollard({ x, y, h = 24, s = 1 }: { x: number; y: number; h?: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={0} rx={7} />
      <Rect x={-5} y={-h} width={10} height={h} rx={5} fill={palette.safetyYellow} />
      <Rect x={1} y={-h + 2} width={3.4} height={h - 4} rx={1.7} fill={SHADE} />
      <Rect x={-4} y={-h + 3} width={2.4} height={h - 7} rx={1.2} fill={HIGHLIGHT} />
      <Rect x={-5} y={-h * 0.62} width={10} height={4.4} fill={palette.white} opacity={0.85} />
    </G>
  );
}

/** A traffic cone with its band. */
export function Cone({ x, y, h = 22, s = 1 }: { x: number; y: number; h?: number; s?: number }) {
  return (
    <G x={x} y={y} scale={s}>
      <Contact cx={0} cy={0} rx={10} />
      <Rect x={-9.5} y={-4.6} width={19} height={5} rx={2.5} fill={palette.orangeDark} />
      <Path d={`M 0 ${-h} q 2.6 0 3.6 3.6 L 7 -4 L -7 -4 L -3.6 ${-h + 3.6} q 1 -3.6 3.6 -3.6 z`} fill={palette.orange} />
      <Path d={`M 0 ${-h} q 2.6 0 3.6 3.6 L 7 -4 L 1 -4 z`} fill={SHADE} />
      <Path d={`M -4 ${-h * 0.56} L 4 ${-h * 0.56} L 4.8 ${-h * 0.32} L -4.8 ${-h * 0.32} Z`} fill={palette.white} />
    </G>
  );
}

/** A run of railing: uprights batched, with a top rail and a shadow. */
export function Railing({ x, y, w, h = 18, n, tone = palette.navySoft }: { x: number; y: number; w: number; h?: number; n?: number; tone?: string }) {
  const count = n ?? Math.max(3, Math.round(w / 12));
  const step = w / count;
  return (
    <G>
      <Path d={rowOf(count + 1, x, y - h, 2.6, h, step)} fill={tone} />
      <Rect x={x - 2} y={y - h - 4} width={w + 6} height={4.6} rx={2.3} fill={tone} />
      <Rect x={x - 2} y={y - h - 4} width={w + 6} height={1.8} rx={0.9} fill={HIGHLIGHT} />
    </G>
  );
}

/** A flight of steps up to a door. */
export function Steps({ x, y, w, n = 3, rise = 5, tone = '#DCE3F2' }: { x: number; y: number; w: number; n?: number; rise?: number; tone?: string }) {
  let d = '';
  let sh = '';
  for (let i = 0; i < n; i += 1) {
    const iw = w + i * 12;
    d += rp(x - i * 6, y - (n - i) * rise, iw, rise);
    sh += rp(x - i * 6, y - (n - i) * rise + rise - 1.8, iw, 1.8);
  }
  return (
    <G>
      <Path d={d} fill={tone} />
      <Path d={sh} fill={SHADE} />
    </G>
  );
}

/** A line of pennants on a sagging string — triangles, never rounded rects. */
export function Bunting({ x1, y1, x2, y2, sag = 22, tints }: { x1: number; y1: number; x2: number; y2: number; sag?: number; tints: readonly string[] }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  const n = Math.max(tints.length, Math.round(Math.abs(x2 - x1) / 34));
  const byTint: string[] = tints.map(() => '');
  for (let i = 1; i <= n; i += 1) {
    const t = i / (n + 1);
    const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
    const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
    const k = (i - 1) % tints.length;
    byTint[k] = `${byTint[k] ?? ''}M ${(px - 6).toFixed(1)} ${py.toFixed(1)} L ${(px + 6).toFixed(1)} ${py.toFixed(1)} L ${px.toFixed(1)} ${(py + 14).toFixed(1)} Z`;
  }
  return (
    <G>
      <Path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} stroke={palette.navySoft} strokeWidth={1.8} fill="none" opacity={0.5} />
      {byTint.map((d, i) => (
        <Path key={i} d={d} fill={tints[i] ?? palette.cream} opacity={0.94} />
      ))}
    </G>
  );
}
