/**
 * TOWN ART — the pieces that stand in the blocks between the roads.
 *
 * Everything here returns SVG *fragments* (`<G>`), because the whole board is
 * one `<Svg>`: roads, kerbs, plots and buildings share a coordinate space, so
 * a kerb can never drift away from the street it belongs to. Coordinates are
 * board pixels, not a nested viewBox.
 *
 * House rules: flat fills, one navy shade, one white sheen, no outlines, a
 * consistent light from above, and a friendly contained flame.
 */
import React from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { SceneId } from '@/learning/types';
import { palette } from '@/theme';

export const SHADE = 'rgba(31,42,90,0.13)';
export const SHEEN = 'rgba(255,255,255,0.34)';

export const ROAD = {
  tarmac: '#7C8AA6',
  tarmacDeep: '#6E7B95',
  paint: 'rgba(255,255,255,0.62)',
  kerbFace: '#E7ECF7',
  kerbLip: '#BFCADE',
  frame: '#E2E8F3',
  grass: palette.grass,
  grassLip: palette.grassDark,
} as const;

type RoofStyle = 'gable' | 'flat' | 'tower';
type EmblemKind = 'bread' | 'pizza' | 'flag' | 'clock' | 'paw' | 'book' | 'basket' | 'window' | 'helmet' | 'none';

interface SceneStyle {
  wall: string;
  roof: string;
  trim: string;
  roofStyle: RoofStyle;
  awning: boolean;
  emblem: EmblemKind;
}

const SCENE: Record<SceneId, SceneStyle> = {
  bakery: { wall: '#FFEFD6', roof: palette.engineRed, trim: palette.engineRedDark, roofStyle: 'gable', awning: true, emblem: 'bread' },
  pizza: { wall: palette.cream, roof: palette.leafGreen, trim: palette.leafGreenDark, roofStyle: 'gable', awning: true, emblem: 'pizza' },
  school: { wall: palette.creamDeep, roof: palette.navySoft, trim: palette.navy, roofStyle: 'flat', awning: false, emblem: 'flag' },
  park: { wall: palette.grass, roof: palette.grassDark, trim: palette.leafGreenDark, roofStyle: 'flat', awning: false, emblem: 'none' },
  'clock-tower': { wall: '#FFF3E0', roof: palette.engineRedDark, trim: palette.engineRed, roofStyle: 'tower', awning: false, emblem: 'clock' },
  apartments: { wall: '#E3E9F5', roof: palette.navySoft, trim: '#B9C3DC', roofStyle: 'flat', awning: false, emblem: 'window' },
  'pet-shop': { wall: '#FFE3EE', roof: palette.pink, trim: '#E9629B', roofStyle: 'gable', awning: true, emblem: 'paw' },
  library: { wall: palette.creamDeep, roof: palette.purple, trim: '#7A5CE0', roofStyle: 'flat', awning: false, emblem: 'book' },
  market: { wall: palette.cream, roof: palette.orange, trim: palette.orangeDark, roofStyle: 'gable', awning: true, emblem: 'basket' },
  'station-yard': { wall: palette.tan, roof: palette.engineRed, trim: palette.engineRedDark, roofStyle: 'flat', awning: false, emblem: 'helmet' },
};

/* ------------------------------------------------------------------ */
/* Plots — the ground a block stands on                                */
/* ------------------------------------------------------------------ */

/**
 * The pavement slab a block sits on. Its edge IS the kerb, which is what makes
 * the road between two plots read as a street rather than a gap.
 */
export function PlotSlab({
  x,
  y,
  w,
  h,
  radius,
  green,
  lit,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  green?: boolean;
  lit?: boolean;
}) {
  const lip = Math.max(3, h * 0.055);
  return (
    <G>
      <Rect x={x} y={y + lip * 0.7} width={w} height={h} rx={radius} fill="rgba(31,42,90,0.10)" />
      <Rect x={x} y={y} width={w} height={h} rx={radius} fill={green ? ROAD.grassLip : ROAD.kerbLip} />
      <Rect x={x} y={y} width={w} height={h - lip} rx={radius} fill={green ? ROAD.grass : ROAD.kerbFace} />
      <Rect x={x + radius * 0.5} y={y + 1.5} width={w - radius} height={2} rx={1} fill="rgba(255,255,255,0.5)" />
      {lit ? (
        <Rect
          x={x + 1.5}
          y={y + 1.5}
          width={w - 3}
          height={h - 3}
          rx={radius}
          fill="none"
          stroke={palette.safetyYellow}
          strokeWidth={Math.max(2, h * 0.026)}
          opacity={0.9}
        />
      ) : null}
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* Buildings                                                            */
/* ------------------------------------------------------------------ */

function Emblem({ kind, cx, cy, r }: { kind: EmblemKind; cx: number; cy: number; r: number }) {
  switch (kind) {
    case 'bread':
      return <Ellipse cx={cx} cy={cy} rx={r} ry={r * 0.66} fill={palette.wood} />;
    case 'pizza':
      return <Path d={`M${cx} ${cy - r} L${cx + r} ${cy + r * 0.7} L${cx - r} ${cy + r * 0.7} Z`} fill={palette.safetyYellow} />;
    case 'flag':
      return <Path d={`M${cx - r * 0.7} ${cy - r} h${r * 1.5} l-${r * 0.5} ${r} l${r * 0.5} ${r} h-${r * 1.5} Z`} fill={palette.engineRed} />;
    case 'clock':
      return (
        <G>
          <Circle cx={cx} cy={cy} r={r} fill={palette.white} />
          <Path d={`M${cx} ${cy - r * 0.6} V${cy} h${r * 0.5}`} stroke={palette.navy} strokeWidth={Math.max(1.4, r * 0.22)} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'paw':
      return (
        <G>
          <Circle cx={cx} cy={cy + r * 0.28} r={r * 0.6} fill={palette.navySoft} />
          <Circle cx={cx - r * 0.7} cy={cy - r * 0.4} r={r * 0.3} fill={palette.navySoft} />
          <Circle cx={cx} cy={cy - r * 0.7} r={r * 0.3} fill={palette.navySoft} />
          <Circle cx={cx + r * 0.7} cy={cy - r * 0.4} r={r * 0.3} fill={palette.navySoft} />
        </G>
      );
    case 'book':
      return (
        <G>
          <Rect x={cx - r} y={cy - r * 0.7} width={r * 2} height={r * 1.4} rx={r * 0.2} fill={palette.purple} />
          <Rect x={cx - r * 0.12} y={cy - r * 0.7} width={r * 0.24} height={r * 1.4} fill={palette.white} />
        </G>
      );
    case 'basket':
      return (
        <G>
          <Path d={`M${cx - r} ${cy - r * 0.3} h${r * 2} l-${r * 0.3} ${r * 1.2} h-${r * 1.4} Z`} fill={palette.wood} />
          <Path d={`M${cx - r * 0.6} ${cy - r * 0.3} a${r * 0.6} ${r * 0.6} 0 0 1 ${r * 1.2} 0`} stroke={palette.woodDark} strokeWidth={r * 0.24} fill="none" />
        </G>
      );
    case 'helmet':
      return (
        <G>
          <Path d={`M${cx - r} ${cy + r * 0.4} a${r} ${r} 0 0 1 ${r * 2} 0 Z`} fill={palette.engineRed} />
          <Rect x={cx - r * 1.2} y={cy + r * 0.34} width={r * 2.4} height={r * 0.44} rx={r * 0.22} fill={palette.engineRedDark} />
        </G>
      );
    case 'window':
      return (
        <G>
          <Rect x={cx - r * 0.9} y={cy - r * 0.9} width={r * 0.8} height={r * 0.8} rx={r * 0.16} fill={palette.waterCyanLight} />
          <Rect x={cx + r * 0.1} y={cy - r * 0.9} width={r * 0.8} height={r * 0.8} rx={r * 0.16} fill={palette.waterCyanLight} />
          <Rect x={cx - r * 0.9} y={cy + r * 0.1} width={r * 0.8} height={r * 0.8} rx={r * 0.16} fill={palette.waterCyanLight} />
          <Rect x={cx + r * 0.1} y={cy + r * 0.1} width={r * 0.8} height={r * 0.8} rx={r * 0.16} fill={palette.waterCyanLight} />
        </G>
      );
    default:
      return null;
  }
}

/**
 * One little town building, standing on the bottom edge of its plot so it
 * faces the street. `w`/`h` are the space it may fill.
 */
export function Building({
  x,
  y,
  w,
  h,
  scene,
  plain,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  scene: SceneId;
  /** a quiet neighbour: no sign, no awning */
  plain?: boolean;
}) {
  const s = SCENE[scene];
  const tower = s.roofStyle === 'tower';
  const roofH = tower ? h * 0.3 : s.roofStyle === 'gable' ? h * 0.28 : h * 0.16;
  const bodyY = y + roofH;
  const bodyH = h - roofH;
  const r = Math.max(2, w * 0.07);
  const doorW = w * 0.24;
  const doorH = bodyH * 0.36;
  /** where the ground floor starts: the canopy hangs from here */
  const shopY = bodyY + bodyH * 0.5;

  return (
    <G>
      {/* body */}
      <Rect x={x} y={bodyY} width={w} height={bodyH} rx={r} fill={s.wall} />
      <Rect x={x} y={bodyY} width={w} height={bodyH * 0.16} rx={r} fill={SHEEN} />
      <Rect x={x} y={bodyY + bodyH - bodyH * 0.14} width={w} height={bodyH * 0.14} rx={r * 0.6} fill={SHADE} />

      {/* roof */}
      {s.roofStyle === 'gable' ? (
        <Path d={`M${x - w * 0.06} ${bodyY + 1} L${x + w / 2} ${y} L${x + w * 1.06} ${bodyY + 1} Z`} fill={s.roof} />
      ) : tower ? (
        <Path d={`M${x - w * 0.04} ${bodyY + 1} L${x + w / 2} ${y - roofH * 0.18} L${x + w * 1.04} ${bodyY + 1} Z`} fill={s.roof} />
      ) : (
        <G>
          <Rect x={x - w * 0.05} y={y} width={w * 1.1} height={roofH} rx={r * 0.8} fill={s.roof} />
          <Rect x={x - w * 0.05} y={y} width={w * 1.1} height={roofH * 0.34} rx={r * 0.8} fill={SHEEN} />
        </G>
      )}

      {/* upstairs: a shop sign, or a pair of windows on a house */}
      {!plain ? (
        <G>
          <Rect x={x + w * 0.18} y={bodyY + bodyH * 0.1} width={w * 0.64} height={bodyH * 0.32} rx={r} fill={s.trim} opacity={0.2} />
          <Emblem kind={s.emblem} cx={x + w * 0.5} cy={bodyY + bodyH * 0.26} r={Math.min(w * 0.64, bodyH * 0.32) * 0.34} />
        </G>
      ) : (
        <G>
          <Rect x={x + w * 0.14} y={bodyY + bodyH * 0.14} width={w * 0.3} height={bodyH * 0.24} rx={r * 0.7} fill={palette.waterCyanLight} />
          <Rect x={x + w * 0.56} y={bodyY + bodyH * 0.14} width={w * 0.3} height={bodyH * 0.24} rx={r * 0.7} fill={palette.waterCyanLight} />
          <Rect x={x + w * 0.14} y={bodyY + bodyH * 0.14} width={w * 0.3} height={bodyH * 0.08} rx={r * 0.7} fill="rgba(255,255,255,0.45)" />
          <Rect x={x + w * 0.56} y={bodyY + bodyH * 0.14} width={w * 0.3} height={bodyH * 0.08} rx={r * 0.7} fill="rgba(255,255,255,0.45)" />
        </G>
      )}

      {/* the shopfront: a striped canopy over a wooden door between two windows */}
      {s.awning && !plain ? (
        <G>
          <Path
            d={`M${x + w * 0.08} ${shopY} h${w * 0.84} l-${w * 0.07} ${bodyH * 0.14} h-${w * 0.7} Z`}
            fill={s.trim}
          />
          <Path
            d={`M${x + w * 0.08} ${shopY} h${w * 0.28} l-${w * 0.025} ${bodyH * 0.14} h-${w * 0.235} Z`}
            fill="rgba(255,255,255,0.45)"
          />
          <Path
            d={`M${x + w * 0.64} ${shopY} h${w * 0.28} l-${w * 0.07} ${bodyH * 0.14} h-${w * 0.235} Z`}
            fill="rgba(255,255,255,0.45)"
          />
        </G>
      ) : null}

      {/* ground floor: door, and a window either side when the front is wide */}
      <Rect
        x={x + w * 0.5 - doorW / 2}
        y={bodyY + bodyH - doorH}
        width={doorW}
        height={doorH}
        rx={doorW * 0.3}
        fill={palette.woodDark}
      />
      <Rect
        x={x + w * 0.5 - doorW / 2 + doorW * 0.14}
        y={bodyY + bodyH - doorH + doorH * 0.12}
        width={doorW * 0.3}
        height={doorH * 0.62}
        rx={doorW * 0.14}
        fill="rgba(255,255,255,0.26)"
      />
      {!plain ? (
        <G>
          <Rect x={x + w * 0.1} y={bodyY + bodyH - doorH * 0.88} width={w * 0.2} height={doorH * 0.5} rx={r * 0.6} fill={palette.waterCyanLight} />
          <Rect x={x + w * 0.7} y={bodyY + bodyH - doorH * 0.88} width={w * 0.2} height={doorH * 0.5} rx={r * 0.6} fill={palette.waterCyanLight} />
        </G>
      ) : null}
    </G>
  );
}

/** A tree — the block dressing that is not a building. */
export function Tree({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy + r * 0.92} rx={r * 0.85} ry={r * 0.26} fill="rgba(31,42,90,0.12)" />
      <Rect x={cx - r * 0.16} y={cy + r * 0.2} width={r * 0.32} height={r * 0.8} rx={r * 0.16} fill={palette.wood} />
      <Circle cx={cx} cy={cy} r={r * 0.8} fill={palette.leafGreenDark} />
      <Circle cx={cx - r * 0.34} cy={cy + r * 0.2} r={r * 0.52} fill={palette.grassDark} />
      <Circle cx={cx + r * 0.3} cy={cy - r * 0.16} r={r * 0.44} fill={palette.leafGreen} />
    </G>
  );
}

/** A park block: grass, a straight path, a pond and a tree or two. */
export function Park({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = Math.min(w, h * 0.6) * 0.34;
  const tall = h > w * 1.15;
  return (
    <G>
      {/* the path runs along the block, never curving into a face */}
      <Rect
        x={tall ? x + w * 0.44 : x}
        y={tall ? y : y + h * 0.72}
        width={tall ? w * 0.12 : w}
        height={tall ? h : h * 0.13}
        rx={Math.min(w, h) * 0.06}
        fill="rgba(255,255,255,0.42)"
      />
      <Ellipse
        cx={x + (tall ? w * 0.28 : w * 0.76)}
        cy={y + (tall ? h * 0.74 : h * 0.34)}
        rx={w * (tall ? 0.2 : 0.17)}
        ry={h * (tall ? 0.1 : 0.16)}
        fill={palette.waterCyanLight}
      />
      <Tree cx={x + (tall ? w * 0.26 : w * 0.24)} cy={y + (tall ? h * 0.26 : h * 0.36)} r={r} />
      {tall ? <Tree cx={x + w * 0.76} cy={y + h * 0.5} r={r * 0.78} /> : null}
      {!tall && w > h * 1.4 ? <Tree cx={x + w * 0.5} cy={y + h * 0.4} r={r * 0.78} /> : null}
    </G>
  );
}

/** The friendly contained flame that marks the call — or its steam once out. */
export function CallFlame({ cx, cy, size, out }: { cx: number; cy: number; size: number; out?: boolean }) {
  if (out) {
    return (
      <G opacity={0.85}>
        <Circle cx={cx} cy={cy} r={size * 0.34} fill={palette.smoke} />
        <Circle cx={cx - size * 0.26} cy={cy + size * 0.12} r={size * 0.22} fill={palette.smoke} opacity={0.7} />
        <Circle cx={cx + size * 0.24} cy={cy - size * 0.1} r={size * 0.18} fill={palette.smoke} opacity={0.6} />
      </G>
    );
  }
  const s = size / 2;
  return (
    <G>
      <Path
        d={`M${cx} ${cy - s} C${cx + s * 0.9} ${cy - s * 0.2} ${cx + s * 0.7} ${cy + s} ${cx} ${cy + s} C${cx - s * 0.7} ${cy + s} ${cx - s * 0.9} ${cy - s * 0.2} ${cx} ${cy - s} Z`}
        fill={palette.flameOuter}
      />
      <Path
        d={`M${cx} ${cy - s * 0.5} C${cx + s * 0.5} ${cy + s * 0.05} ${cx + s * 0.4} ${cy + s * 0.7} ${cx} ${cy + s * 0.7} C${cx - s * 0.4} ${cy + s * 0.7} ${cx - s * 0.5} ${cy + s * 0.05} ${cx} ${cy - s * 0.5} Z`}
        fill={palette.flameMid}
      />
      <Ellipse cx={cx} cy={cy + s * 0.32} rx={s * 0.22} ry={s * 0.28} fill={palette.flameCore} />
    </G>
  );
}
