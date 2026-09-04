import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import type { SignalId } from '@/learning/types';
import { palette } from '@/theme';

export interface GlyphProps {
  size?: number;
  color?: string;
}

const SHADE = 'rgba(31,42,90,0.14)';
const SHEEN = 'rgba(255,255,255,0.34)';

/* ---------------------------------------------------------------- */
/* Pattern symbols (spray-pattern, count strips)                      */
/* ---------------------------------------------------------------- */

export function FlameGlyph({ size = 48, out }: GlyphProps & { out?: boolean }) {
  const outer = out ? palette.slateLight : palette.flameOuter;
  const mid = out ? '#E7EAF4' : palette.flameMid;
  const core = out ? palette.white : palette.flameCore;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M24 3c6 8 13 12 13 22a13 13 0 0 1-26 0C11 16 18 12 24 3z" fill={outer} />
      <Path d="M24 14c3.5 5 7 7.5 7 13a7 7 0 0 1-14 0c0-5.5 3.5-8 7-13z" fill={mid} />
      <Ellipse cx={24} cy={32} rx={4} ry={5} fill={core} />
    </Svg>
  );
}

export function DropGlyph({ size = 48 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d="M24 5c8 10 13 15 13 22a13 13 0 0 1-26 0c0-7 5-12 13-22z" fill={palette.waterCyan} />
      <Path d="M24 12c5 7 8 10 8 15a8 8 0 0 1-3 6c2-8-2-13-5-21z" fill={SHEEN} />
      <Circle cx={19} cy={30} r={3.4} fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}

export function ConeGlyph({ size = 48 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x={7} y={37} width={34} height={7} rx={3.5} fill={palette.orangeDark} />
      <Path d="M24 5c1.6 0 3 1 3.4 2.4L37 38.5H11L20.6 7.4C21 6 22.4 5 24 5z" fill={palette.orange} />
      <Path d="M18.4 22h11.2l1.6 5.6H16.8z" fill={palette.white} />
      <Path d="M24 5c1.6 0 3 1 3.4 2.4L37 38.5h-4.5L23.2 5.1z" fill={SHADE} />
    </Svg>
  );
}

export function StarGlyph({ size = 48, color = palette.safetyYellow }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M24 5l5.8 12 13.2 1.7-9.7 9 2.5 13.1L24 34.4 12.2 40.8l2.5-13.1-9.7-9L18.2 17z"
        fill={color}
        stroke={palette.goldDark}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M24 11l3.4 7-3.4 1.5z" fill={SHEEN} />
    </Svg>
  );
}

export type PatternSymbol = 'fire' | 'water' | 'cone' | 'star';

export function PatternGlyph({ symbol, size = 48 }: { symbol: PatternSymbol; size?: number }) {
  if (symbol === 'fire') return <FlameGlyph size={size} />;
  if (symbol === 'water') return <DropGlyph size={size} />;
  if (symbol === 'cone') return <ConeGlyph size={size} />;
  return <StarGlyph size={size} />;
}

/* ---------------------------------------------------------------- */
/* Route command icons                                                */
/* ---------------------------------------------------------------- */

export function ForwardArrow({ size = 40, color = palette.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M20 4l12 13h-7v18a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V17H8z" fill={color} />
    </Svg>
  );
}

export function TurnArrow({ size = 40, color = palette.white, dir = 'left' }: GlyphProps & { dir?: 'left' | 'right' }) {
  const flip = dir === 'right' ? 'scale(-1,1) translate(-40,0)' : undefined;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <G transform={flip}>
        <Path
          d="M31 36v-9a10 10 0 0 0-10-10h-6"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
        <Path d="M17 8l-9 9 9 9z" fill={color} />
      </G>
    </Svg>
  );
}

export function UTurnArrow({ size = 40, color = palette.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M11 34V17a8 8 0 0 1 16 0v11" stroke={color} strokeWidth={6} strokeLinecap="round" fill="none" />
      <Path d="M27 36l-7-8h14z" fill={color} />
    </Svg>
  );
}

export function PlayGlyph({ size = 40, color = palette.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M13 8.5c0-1.6 1.8-2.6 3.2-1.8l16 11.3a2.1 2.1 0 0 1 0 3.6L16.2 33c-1.4.8-3.2-.2-3.2-1.8z" fill={color} />
    </Svg>
  );
}

/* ---------------------------------------------------------------- */
/* Signal cards (firefighter sequencing)                              */
/* ---------------------------------------------------------------- */

export function SignalGlyph({ id, size = 56 }: { id: SignalId; size?: number }) {
  const s = size;
  switch (id) {
    case 'bell':
      return (
        <Svg width={s} height={s} viewBox="0 0 56 56">
          <Path d="M28 8a12 12 0 0 1 12 12v10l4 6H12l4-6V20A12 12 0 0 1 28 8z" fill={palette.safetyYellow} />
          <Path d="M28 8a12 12 0 0 1 12 12v10l4 6h-6l-3-6V20a12 12 0 0 0-9-11.8z" fill="rgba(31,42,90,0.12)" />
          <Circle cx={28} cy={44} r={4.5} fill={palette.gold} />
          <Rect x={25.5} y={3} width={5} height={6} rx={2.5} fill={palette.gold} />
        </Svg>
      );
    case 'truck':
      return (
        <Svg width={s} height={s} viewBox="0 0 56 56">
          <Rect x={4} y={20} width={34} height={18} rx={5} fill={palette.engineRed} />
          <Path d="M38 26h7l7 8v4H38z" fill={palette.engineRedDark} />
          <Rect x={9} y={24} width={11} height={8} rx={2.5} fill={palette.waterCyanLight} />
          <Rect x={4} y={31} width={48} height={4} fill={palette.safetyYellow} />
          <Circle cx={16} cy={41} r={5.5} fill={palette.charcoal} />
          <Circle cx={42} cy={41} r={5.5} fill={palette.charcoal} />
          <Circle cx={16} cy={41} r={2.2} fill={palette.slateLight} />
          <Circle cx={42} cy={41} r={2.2} fill={palette.slateLight} />
        </Svg>
      );
    case 'water':
      return <DropGlyph size={s} />;
    case 'check':
      return (
        <Svg width={s} height={s} viewBox="0 0 56 56">
          <Circle cx={28} cy={28} r={22} fill={palette.leafGreen} />
          <Circle cx={28} cy={28} r={22} fill={SHEEN} opacity={0.2} />
          <Path d="M17 29l8 8 15-16" stroke={palette.white} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'ladder':
      return (
        <Svg width={s} height={s} viewBox="0 0 56 56">
          <Rect x={13} y={6} width={7} height={44} rx={3.5} fill={palette.gold} />
          <Rect x={36} y={6} width={7} height={44} rx={3.5} fill={palette.gold} />
          {[13, 24, 35].map((y) => (
            <Rect key={y} x={13} y={y} width={30} height={6} rx={3} fill={palette.safetyYellow} />
          ))}
        </Svg>
      );
    case 'hose':
      return (
        <Svg width={s} height={s} viewBox="0 0 56 56">
          <Circle cx={28} cy={28} r={21} fill={palette.safetyYellow} />
          <Circle cx={28} cy={28} r={14} fill={palette.gold} />
          <Circle cx={28} cy={28} r={7} fill={palette.creamDeep} />
          <Rect x={40} y={24} width={13} height={8} rx={4} fill={palette.charcoal} />
        </Svg>
      );
    case 'map':
      return (
        <Svg width={s} height={s} viewBox="0 0 56 56">
          <Path d="M6 14l14-6 16 6 14-6v34l-14 6-16-6-14 6z" fill={palette.mint} />
          <Path d="M20 8v34M36 14v34" stroke={palette.leafGreen} strokeWidth={3} />
          <Path d="M8 24c8 2 12 8 22 6" stroke={palette.waterCyan} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <Circle cx={38} cy={26} r={5} fill={palette.engineRed} />
        </Svg>
      );
    case 'radio':
    default:
      return (
        <Svg width={s} height={s} viewBox="0 0 56 56">
          <Rect x={14} y={12} width={26} height={38} rx={7} fill={palette.charcoal} />
          <Rect x={18} y={17} width={18} height={11} rx={3} fill={palette.leafGreen} />
          <Rect x={34} y={2} width={4} height={12} rx={2} fill={palette.slate} />
          {[32, 38, 44].map((y) => (
            <Rect key={y} x={19} y={y} width={16} height={3.5} rx={1.75} fill={palette.slate} />
          ))}
        </Svg>
      );
  }
}

export const signalName: Record<SignalId, { en: string; es: string }> = {
  bell: { en: 'Bell rings', es: 'Suena la campana' },
  truck: { en: 'Truck rolls', es: 'Sale el camión' },
  water: { en: 'Water on', es: 'Agua' },
  check: { en: 'All clear', es: 'Todo bien' },
  ladder: { en: 'Raise ladder', es: 'Sube la escalera' },
  hose: { en: 'Roll out hose', es: 'Saca la manguera' },
  map: { en: 'Check the map', es: 'Mira el mapa' },
  radio: { en: 'Radio call', es: 'Llamada de radio' },
};

/* ---------------------------------------------------------------- */
/* Decoration                                                         */
/* ---------------------------------------------------------------- */

export function SparkleBurst({ size = 60, color = palette.safetyYellow }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <Rect
          key={a}
          x={28}
          y={4}
          width={4}
          height={12}
          rx={2}
          fill={color}
          transform={`rotate(${a} 30 30)`}
        />
      ))}
      <Circle cx={30} cy={30} r={7} fill={palette.white} opacity={0.9} />
    </Svg>
  );
}

export function WaterBurst({ size = 70 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 70 70">
      <Circle cx={35} cy={35} r={18} fill="rgba(79,195,247,0.35)" />
      {[
        [12, 18],
        [56, 20],
        [16, 52],
        [54, 50],
        [35, 8],
        [35, 60],
      ].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={i % 2 ? 5 : 6.5} fill={palette.waterCyanLight} />
      ))}
      <Circle cx={35} cy={35} r={9} fill={palette.white} opacity={0.85} />
    </Svg>
  );
}

/** A hose section for the pipe puzzle. `straight` runs N–S, `corner` joins N–E. */
export function PipeGlyph({
  kind,
  size = 60,
  water,
  wet,
}: {
  kind: 'straight' | 'corner';
  size?: number;
  /** cyan water inside */
  water?: boolean;
  /** faint preview tint */
  wet?: boolean;
}) {
  const d = kind === 'straight' ? 'M30 -4 V64' : 'M30 -4 V30 H64';
  const inner = water ? palette.waterCyan : wet ? palette.waterCyanLight : '#F1B7B1';
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Path d={d} stroke={palette.engineRedDark} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={d} stroke={palette.engineRed} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={d} stroke={inner} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={30} cy={30} r={6} fill={palette.safetyYellow} opacity={0.9} />
    </Svg>
  );
}

/** Small orange/white striped barrier used on closed roads. */
export function BarrierGlyph({ width = 60, height = 34 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 60 34">
      <Rect x={10} y={16} width={5} height={18} rx={2} fill={palette.slate} />
      <Rect x={45} y={16} width={5} height={18} rx={2} fill={palette.slate} />
      <Rect x={4} y={4} width={52} height={13} rx={4} fill={palette.white} />
      {[6, 18, 30, 42].map((x) => (
        <Polygon key={x} points={`${x},17 ${x + 7},4 ${x + 13},4 ${x + 6},17`} fill={palette.orange} />
      ))}
      <Rect x={4} y={4} width={52} height={13} rx={4} fill="none" stroke={palette.slateLight} strokeWidth={2} />
    </Svg>
  );
}
