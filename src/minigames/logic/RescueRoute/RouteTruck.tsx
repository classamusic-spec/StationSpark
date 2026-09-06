/**
 * ROUTE TRUCK — the top-down engine on the street board.
 *
 * A child programming a Left has to know which way the truck is *facing*
 * before they choose, so the drawing is deliberately lopsided: the cab and
 * windscreen sit at the nose, a white chevron points the way, and a soft
 * headlight beam falls on the road ahead. Rotate it and the heading is still
 * obvious at a glance, even at 40 px.
 *
 * The art is drawn nose-up (north). The board rotates it; nothing here spins.
 */
import React from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';

/** The drawing box is wider than the truck so the beam has somewhere to fall. */
export const TRUCK_BOX = 120;

export function RouteTruck({ size, beam = true }: { size: number; beam?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${TRUCK_BOX} ${TRUCK_BOX}`}>
      <Defs>
        <LinearGradient id="routeBeam" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={palette.safetyYellow} stopOpacity={0.5} />
          <Stop offset="1" stopColor={palette.safetyYellow} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* the road ahead, lit */}
      {beam ? <Path d="M44 32 L76 32 L94 2 L26 2 Z" fill="url(#routeBeam)" /> : null}

      {/* contact shadow */}
      <Rect x={37} y={35} width={46} height={60} rx={12} fill="rgba(31,42,90,0.20)" />

      {/* wheels */}
      {[
        [32, 46],
        [82, 46],
        [32, 72],
        [82, 72],
      ].map(([x, y]) => (
        <Rect key={`${x}-${y}`} x={x} y={y} width={6} height={16} rx={3} fill={palette.charcoalDark} />
      ))}

      {/* pump body */}
      <Rect x={38} y={44} width={44} height={48} rx={9} fill={palette.engineRed} />
      <Rect x={38} y={44} width={44} height={9} rx={4.5} fill="rgba(255,255,255,0.22)" />
      {/* ladder on the roof */}
      <Rect x={46} y={50} width={28} height={30} rx={5} fill={palette.engineRedLight} />
      {[54, 62, 70].map((y) => (
        <Rect key={y} x={48} y={y} width={24} height={3.4} rx={1.7} fill={palette.creamDeep} />
      ))}
      {/* reflective stripe */}
      <Rect x={38} y={83} width={44} height={7} rx={3} fill={palette.safetyYellow} />

      {/* cab at the nose */}
      <Rect x={38} y={29} width={44} height={20} rx={9} fill={palette.engineRedDark} />
      <Rect x={44} y={32} width={32} height={11} rx={4.5} fill={palette.waterCyanLight} />
      <Rect x={44} y={32} width={32} height={4} rx={2} fill="rgba(255,255,255,0.5)" />

      {/* beacons + headlights */}
      <Circle cx={43} cy={46} r={3.4} fill={palette.waterCyan} />
      <Circle cx={77} cy={46} r={3.4} fill={palette.safetyYellow} />
      <Rect x={42} y={28} width={9} height={4} rx={2} fill={palette.creamDeep} />
      <Rect x={69} y={28} width={9} height={4} rx={2} fill={palette.creamDeep} />

      {/* which way is forward */}
      <G opacity={0.95}>
        <Path d="M52 26 L60 18 L68 26" stroke={palette.white} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    </Svg>
  );
}
