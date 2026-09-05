/**
 * PUMPER TRUCK — a side-on engine with a flat deck, drawn so another prop (the
 * water tank, a compartment, a ladder) can be *mounted on it* rather than left
 * floating in the sky (art critique item #19).
 *
 * Drawn in a 360 × 150 design box; `deckY` and `deckX/deckW` tell the caller
 * where the flat deck is in that box so it can place its own art on top.
 */
import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';

export const PUMPER_VB = { w: 360, h: 150 } as const;
/** the flat load deck, in PUMPER_VB units */
export const PUMPER_DECK = { x: 118, y: 58, w: 214 } as const;

const SHADE = 'rgba(31,42,90,0.14)';
const HILITE = 'rgba(255,255,255,0.32)';

export interface PumperTruckProps {
  width: number;
  /** engine body colour (defaults to the house engine red) */
  tone?: string;
}

/** Side-on fire engine: cab, deck, lockers, ladder rack, wheels, light bar. */
export const PumperTruck = memo(function PumperTruck({ width, tone = palette.engineRed }: PumperTruckProps) {
  const height = (PUMPER_VB.h / PUMPER_VB.w) * width;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${PUMPER_VB.w} ${PUMPER_VB.h}`} pointerEvents="none">
      {/* ground contact */}
      <Ellipse cx={186} cy={140} rx={166} ry={9} fill={palette.navy} opacity={0.12} />

      {/* chassis */}
      <Rect x={22} y={112} width={318} height={16} rx={7} fill={palette.charcoalDark} />

      {/* cab */}
      <Path d="M22 60 q0 -18 20 -18 h52 l24 30 v46 h-96 z" fill={tone} />
      <Path d="M22 60 q0 -18 20 -18 h16 v82 h-36 z" fill={HILITE} />
      <Rect x={34} y={52} width={54} height={30} rx={8} fill="#8FC7EC" />
      <Path d="M34 78 L64 52 h14 L44 82 z" fill={palette.white} opacity={0.35} />
      <Rect x={24} y={94} width={94} height={12} rx={5} fill={palette.safetyYellow} />
      <Rect x={20} y={82} width={12} height={16} rx={5} fill={palette.white} />
      {/* light bar */}
      <Rect x={40} y={34} width={44} height={10} rx={5} fill={palette.charcoal} />
      <Rect x={44} y={30} width={16} height={9} rx={4} fill="#7FD3F7" />
      <Rect x={64} y={30} width={16} height={9} rx={4} fill={palette.engineRedLight} />

      {/* body + load deck */}
      <Rect x={PUMPER_DECK.x} y={PUMPER_DECK.y} width={PUMPER_DECK.w} height={60} rx={9} fill={tone} />
      <Rect x={PUMPER_DECK.x} y={PUMPER_DECK.y} width={PUMPER_DECK.w} height={11} rx={5} fill={HILITE} />
      <Rect x={PUMPER_DECK.x} y={94} width={PUMPER_DECK.w} height={13} rx={5} fill={palette.safetyYellow} />
      {/* locker doors with recessed handles */}
      {[0, 1, 2].map((i) => (
        <G key={i}>
          <Rect x={PUMPER_DECK.x + 12 + i * 68} y={PUMPER_DECK.y + 16} width={56} height={40} rx={7} fill={SHADE} />
          <Rect x={PUMPER_DECK.x + 16 + i * 68} y={PUMPER_DECK.y + 20} width={48} height={32} rx={6} fill={tone} />
          <Rect x={PUMPER_DECK.x + 24 + i * 68} y={PUMPER_DECK.y + 32} width={32} height={5} rx={2.5} fill={palette.slateLight} />
        </G>
      ))}
      {/* deck rail so a mounted prop reads as sitting *in* the truck */}
      <Rect x={PUMPER_DECK.x - 6} y={PUMPER_DECK.y - 8} width={PUMPER_DECK.w + 12} height={10} rx={5} fill={palette.slateLight} />
      <Rect x={PUMPER_DECK.x - 6} y={PUMPER_DECK.y - 8} width={PUMPER_DECK.w + 12} height={4} rx={2} fill={palette.white} opacity={0.55} />

      {/* ladder on the rack */}
      <G>
        <Rect x={PUMPER_DECK.x + 26} y={PUMPER_DECK.y - 22} width={168} height={7} rx={3.5} fill={palette.gold} />
        <Rect x={PUMPER_DECK.x + 26} y={PUMPER_DECK.y - 34} width={168} height={7} rx={3.5} fill={palette.gold} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Rect key={i} x={PUMPER_DECK.x + 38 + i * 28} y={PUMPER_DECK.y - 34} width={6} height={19} rx={3} fill={palette.safetyYellow} />
        ))}
      </G>

      {/* wheels */}
      {[78, 268].map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={124} r={22} fill={palette.charcoalDark} />
          <Circle cx={cx} cy={124} r={11} fill={palette.slateLight} />
          <Circle cx={cx} cy={124} r={5} fill={palette.slate} />
        </G>
      ))}
    </Svg>
  );
});
