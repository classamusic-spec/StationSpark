import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { ShapePieceKind } from '@/learning/types';
import { palette } from '@/theme';

const SHEEN = 'rgba(255,255,255,0.34)';
const SHADE = 'rgba(31,42,90,0.16)';

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
            stroke={ghost ? ghostLine : undefined}
            strokeWidth={ghost ? 2.5 : 0}
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
            stroke={ghost ? ghostLine : undefined}
            strokeWidth={ghost ? 2.5 : 0}
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
  const dots = Array.from({ length: 7 }, (_, r) => Array.from({ length: 9 }, (_, c) => [c, r] as [number, number])).flat();
  return (
    <Svg width={width} height={width * 0.62} viewBox="0 0 360 224" preserveAspectRatio="xMidYMin slice">
      <Rect x={0} y={0} width={360} height={224} fill={palette.creamDeep} />
      <Rect x={0} y={0} width={360} height={10} fill="rgba(31,42,90,0.08)" />
      {dots.map(([c, r]) => (
        <Circle key={`${c}-${r}`} cx={26 + c * 39} cy={34 + r * 26} r={2.4} fill="rgba(158,106,54,0.22)" />
      ))}
      {/* a saw and two clamps hanging on the board */}
      <G>
        <Rect x={22} y={20} width={58} height={9} rx={4.5} fill={palette.slateLight} />
        <Path d="M22 29h58l-6 12H28z" fill={palette.slate} />
        <Rect x={72} y={14} width={26} height={9} rx={4.5} fill={palette.wood} />
      </G>
      <G>
        <Rect x={280} y={16} width={12} height={44} rx={6} fill={palette.engineRed} />
        <Rect x={300} y={16} width={12} height={54} rx={6} fill={palette.waterCyanDark} />
        <Rect x={320} y={16} width={12} height={36} rx={6} fill={palette.safetyYellow} />
      </G>
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
