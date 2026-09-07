import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { ShapePieceKind } from '@/learning/types';
import { palette } from '@/theme';

const SHEEN = 'rgba(255,255,255,0.34)';
const SHADE = 'rgba(31,42,90,0.16)';
/** a hairline of navy so a cream or tan piece still reads on a white tray card */
const EDGE = 'rgba(31,42,90,0.22)';

/* ================================================================= */
/* Geometry — a shape is always drawn to FIT its box, so turning a     */
/* piece never makes it stick out of its slot.                        */
/* ================================================================= */

export type Turn = 0 | 90 | 180 | 270;

export function piecePath(shape: ShapePieceKind, w: number, h: number, rotation: Turn): string {
  switch (shape) {
    case 'triangle':
      if (rotation === 90) return `M${w} ${h / 2} L0 ${h} L0 0 Z`;
      if (rotation === 180) return `M${w / 2} ${h} L0 0 L${w} 0 Z`;
      if (rotation === 270) return `M0 ${h / 2} L${w} 0 L${w} ${h} Z`;
      return `M${w / 2} 0 L${w} ${h} L0 ${h} Z`;
    case 'semicircle':
      if (rotation === 90) return `M0 0 A${w} ${h / 2} 0 0 1 0 ${h} Z`;
      if (rotation === 180) return `M0 0 A${w / 2} ${h} 0 0 0 ${w} 0 Z`;
      if (rotation === 270) return `M${w} 0 A${w} ${h / 2} 0 0 0 ${w} ${h} Z`;
      return `M0 ${h} A${w / 2} ${h} 0 0 1 ${w} ${h} Z`;
    case 'quarter':
      if (rotation === 90) return `M${w} 0 L${w} ${h} A${w} ${h} 0 0 1 0 0 Z`;
      if (rotation === 180) return `M${w} ${h} L0 ${h} A${w} ${h} 0 0 1 ${w} 0 Z`;
      if (rotation === 270) return `M0 ${h} L0 0 A${w} ${h} 0 0 1 ${w} ${h} Z`;
      return `M0 0 L${w} 0 A${w} ${h} 0 0 1 0 ${h} Z`;
    default:
      return '';
  }
}

export const shapeName: Record<ShapePieceKind, { en: string; es: string; plural: string }> = {
  square: { en: 'square', es: 'cuadrado', plural: 'squares' },
  rect: { en: 'rectangle', es: 'rectángulo', plural: 'rectangles' },
  triangle: { en: 'triangle', es: 'triángulo', plural: 'triangles' },
  semicircle: { en: 'half circle', es: 'semicírculo', plural: 'half circles' },
  circle: { en: 'circle', es: 'círculo', plural: 'circles' },
  quarter: { en: 'quarter circle', es: 'cuarto de círculo', plural: 'quarter circles' },
};

export const blueprintName: Record<string, { en: string; es: string }> = {
  house: { en: 'house', es: 'casa' },
  truck: { en: 'fire truck', es: 'camión de bomberos' },
  ladder: { en: 'ladder', es: 'escalera' },
  hydrant: { en: 'hydrant', es: 'hidrante' },
  rocket: { en: 'rocket', es: 'cohete' },
  tower: { en: 'clock tower', es: 'torre del reloj' },
  boat: { en: 'rescue boat', es: 'bote de rescate' },
};

/* ================================================================= */
/* The piece itself                                                   */
/* ================================================================= */

export interface PieceArtProps {
  shape: ShapePieceKind;
  /** rendered size in px */
  w: number;
  h: number;
  rotation: Turn;
  color: string;
  /** dashed outline on the blueprint instead of a solid piece */
  ghost?: boolean;
}

/** One workshop piece: flat fill, a soft shade and a white sheen — sticker, not line art. */
export function PieceArt({ shape, w, h, rotation, color, ghost }: PieceArtProps) {
  const round = Math.max(2, Math.min(w, h) * 0.16);
  const stroke = Math.max(2, Math.min(w, h) * 0.1);
  const ghostFill = 'rgba(255,255,255,0.12)';
  const ghostLine = 'rgba(255,255,255,0.78)';
  const fill = ghost ? ghostFill : color;

  const body = () => {
    if (shape === 'circle') {
      return (
        <G>
          <Ellipse
            cx={w / 2}
            cy={h / 2}
            rx={Math.max(1, w / 2 - 1)}
            ry={Math.max(1, h / 2 - 1)}
            fill={fill}
            stroke={ghost ? ghostLine : EDGE}
            strokeWidth={ghost ? 2.5 : 1.5}
            strokeDasharray={ghost ? '7 5' : undefined}
          />
          {ghost ? null : (
            <G>
              <Circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.22} fill={SHEEN} />
              <Ellipse cx={w * 0.34} cy={h * 0.3} rx={w * 0.14} ry={h * 0.09} fill="rgba(255,255,255,0.45)" />
            </G>
          )}
        </G>
      );
    }
    if (shape === 'square' || shape === 'rect') {
      return (
        <G>
          <Rect
            x={1}
            y={1}
            width={Math.max(1, w - 2)}
            height={Math.max(1, h - 2)}
            rx={round}
            fill={fill}
            stroke={ghost ? ghostLine : EDGE}
            strokeWidth={ghost ? 2.5 : 1.5}
            strokeDasharray={ghost ? '7 5' : undefined}
          />
          {ghost ? null : (
            <G>
              <Rect x={3} y={3} width={Math.max(1, w - 6)} height={Math.max(2, h * 0.22)} rx={round * 0.7} fill={SHEEN} />
              <Rect x={3} y={h - Math.max(3, h * 0.16)} width={Math.max(1, w - 6)} height={Math.max(2, h * 0.12)} rx={round * 0.5} fill={SHADE} />
            </G>
          )}
        </G>
      );
    }
    const d = piecePath(shape, w, h, rotation);
    return (
      <G>
        <Path
          d={d}
          fill={fill}
          stroke={ghost ? ghostLine : color}
          strokeWidth={ghost ? 2.5 : stroke}
          strokeDasharray={ghost ? '7 5' : undefined}
          strokeLinejoin="round"
        />
        {ghost ? null : <Path d={d} fill={SHEEN} opacity={0.28} transform={`translate(${w * 0.08} ${h * 0.1}) scale(0.6)`} />}
      </G>
    );
  };

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {body()}
    </Svg>
  );
}

/* ================================================================= */
/* The blueprint sheet on the workbench                               */
/* ================================================================= */

/** Deep blue paper with a faint grid and four gold pins — the outlines go on top. */
export function BlueprintSheet({ size }: { size: number }) {
  const lines = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect x={0} y={0} width={100} height={100} rx={4} fill={palette.navySoft} />
      <Rect x={0} y={0} width={100} height={100} rx={4} fill={palette.navy} opacity={0.25} />
      {lines.map((v) => (
        <G key={v}>
          <Rect x={v} y={0} width={0.5} height={100} fill="rgba(255,255,255,0.13)" />
          <Rect x={0} y={v} width={100} height={0.5} fill="rgba(255,255,255,0.13)" />
        </G>
      ))}
      <Rect x={3} y={3} width={94} height={94} rx={2.5} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.9} />
      {([
        [5, 5],
        [95, 5],
        [5, 95],
        [95, 95],
      ] as [number, number][]).map(([cx, cy]) => (
        <G key={`${cx}-${cy}`}>
          <Circle cx={cx} cy={cy + 0.6} r={2.6} fill={palette.goldDark} />
          <Circle cx={cx} cy={cy} r={2.4} fill={palette.safetyYellow} />
          <Circle cx={cx - 0.7} cy={cy - 0.8} r={0.8} fill="rgba(255,255,255,0.8)" />
        </G>
      ))}
    </Svg>
  );
}

/**
 * The workshop the bench stands in: a pegboard wall with a few tools hanging
 * on it and a plank floor, so the game never sits on raw sky.
 */
export function WorkshopWall({ width }: { width: number }) {
  /* the peg holes, as one path: 63 circles would be 63 nodes behind every frame */
  const holes = Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => {
      const cx = 40 + c * 35;
      const cy = 34 + r * 20;
      return `M ${cx - 2.2} ${cy} a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 z`;
    }).join(' '),
  ).join(' ');
  return (
    <Svg width={width} height={width * 0.62} viewBox="0 0 360 224" preserveAspectRatio="xMidYMin slice">
      <Rect x={0} y={0} width={360} height={224} fill={palette.creamDeep} />
      <Rect x={0} y={0} width={360} height={10} fill="rgba(31,42,90,0.08)" />
      {/*
       * A REAL PEGBOARD, NOT A FIELD OF DOTS. The tools all used to hang in the
       * top 60 px and the rest of the wall was one flat cream slab with a
       * scatter of holes on it. The board is now a bounded panel with a frame,
       * and the wall under it carries a paint shelf, the workshop clock and a
       * dado rail — so something happens at every height.
       */}
      <Rect x={14} y={14} width={332} height={112} rx={10} fill="rgba(158,106,54,0.28)" />
      <Rect x={14} y={14} width={332} height={107} rx={10} fill={palette.tan} />
      <Rect x={14} y={14} width={332} height={7} rx={3.5} fill={SHEEN} />
      <Path d={holes} fill="rgba(158,106,54,0.3)" />
      {/* a saw, a square and a mallet hanging on the board */}
      <G>
        <Rect x={30} y={26} width={62} height={9} rx={4.5} fill={palette.slateLight} />
        <Path d="M30 35h62l-7 13H37z" fill={palette.slate} />
        <Rect x={82} y={20} width={28} height={9} rx={4.5} fill={palette.wood} />
      </G>
      <G>
        <Path d="M150 26h11v58h-11z" fill={palette.waterCyanDark} />
        <Path d="M150 73h58v11h-58z" fill={palette.waterCyanDark} />
        <Path d="M150 26h4v58h-4z" fill={SHEEN} />
      </G>
      <G>
        <Rect x={250} y={24} width={10} height={54} rx={5} fill={palette.wood} />
        <Rect x={238} y={20} width={34} height={17} rx={6} fill={palette.woodDark} />
        <Rect x={238} y={20} width={34} height={6} rx={3} fill={SHEEN} />
      </G>
      <G>
        <Rect x={296} y={26} width={11} height={40} rx={5.5} fill={palette.engineRed} />
        <Rect x={314} y={26} width={11} height={50} rx={5.5} fill={palette.safetyYellow} />
        <Rect x={296} y={26} width={4} height={40} rx={2} fill={SHEEN} />
      </G>
      {/* a paint shelf with three tins standing on it */}
      <G>
        <Rect x={22} y={162} width={150} height={9} rx={4.5} fill={palette.wood} />
        <Rect x={22} y={162} width={150} height={3.4} rx={1.7} fill={SHEEN} />
        <Path d="M40 171h12l-4 14H44z M126 171h12l-4 14h-8z" fill={palette.woodDark} />
        {[
          { x: 34, c: palette.engineRedLight },
          { x: 74, c: palette.waterCyan },
          { x: 114, c: palette.leafGreen },
        ].map((t) => (
          <G key={t.x}>
            <Rect x={t.x} y={134} width={30} height={28} rx={4} fill={t.c} />
            <Rect x={t.x} y={134} width={9} height={28} rx={4} fill={SHEEN} />
            <Rect x={t.x - 2} y={130} width={34} height={7} rx={3.5} fill={palette.slateLight} />
            <Rect x={t.x + 4} y={146} width={22} height={6} rx={3} fill={palette.cream} opacity={0.75} />
          </G>
        ))}
      </G>
      {/* the workshop clock */}
      <G>
        <Circle cx={288} cy={152} r={23} fill={SHADE} />
        <Circle cx={288} cy={150} r={23} fill={palette.engineRed} />
        <Circle cx={288} cy={150} r={19} fill={palette.cream} />
        <Path d="M288 150l11-8" stroke={palette.navy} strokeWidth={3} strokeLinecap="round" />
        <Path d="M288 150l-3-13" stroke={palette.navy} strokeWidth={2.4} strokeLinecap="round" />
        <Circle cx={288} cy={150} r={2.6} fill={palette.safetyYellow} />
      </G>
      {/* dado rail and the half-tone below it */}
      <Rect x={0} y={192} width={360} height={32} fill="rgba(31,42,90,0.055)" />
      <Rect x={0} y={192} width={360} height={6} rx={3} fill={palette.tanDark} />
      <Rect x={0} y={192} width={360} height={2.4} rx={1.2} fill={SHEEN} />
    </Svg>
  );
}

/** Plank floor for the bottom of the workshop. */
export function WorkshopFloor({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * 0.2} viewBox="0 0 360 72" preserveAspectRatio="xMidYMax slice">
      <Rect x={0} y={0} width={360} height={72} fill={palette.wood} />
      <Rect x={0} y={0} width={360} height={7} rx={3} fill={palette.woodDark} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Rect key={i} x={i * 74 + 12} y={10} width={3} height={62} fill="rgba(31,42,90,0.10)" />
      ))}
      {[16, 40, 62].map((y) => (
        <Rect key={y} x={0} y={y} width={360} height={2} fill="rgba(255,255,255,0.14)" />
      ))}
    </Svg>
  );
}

/** The "turn me round" badge on a piece that is facing the wrong way. */
export function TurnBadge({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill={palette.waterCyanDark} />
      <Circle cx={12} cy={11} r={10} fill={palette.waterCyan} />
      <Path
        d="M6.5 13.5a6 6 0 1 1 2 4"
        stroke={palette.white}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M4 10.5l2.6 4.4 4.4-2.4z" fill={palette.white} />
    </Svg>
  );
}

/** A wooden ruler + pencil resting on the bench, purely for life. */
export function BenchTools({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * 0.14} viewBox="0 0 300 42">
      <Rect x={4} y={12} width={176} height={20} rx={6} fill={palette.tanDark} />
      <Rect x={4} y={12} width={176} height={8} rx={4} fill={palette.tan} />
      {Array.from({ length: 11 }, (_, i) => (
        <Rect key={i} x={16 + i * 15} y={20} width={2.4} height={i % 2 ? 6 : 10} rx={1.2} fill={palette.woodDark} opacity={0.6} />
      ))}
      <Rect x={196} y={16} width={86} height={13} rx={5} fill={palette.safetyYellow} />
      <Rect x={196} y={16} width={86} height={5} rx={2.5} fill="rgba(255,255,255,0.4)" />
      <Path d="M282 16l16 6.5-16 6.5z" fill={palette.tan} />
      <Path d="M294 20l4 2.5-4 2.5z" fill={palette.charcoal} />
    </Svg>
  );
}
