import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { HIGHLIGHT, SHADE, SHADE_DEEP } from '../tone';

export type HoseTone = 'red' | 'yellow';

export interface HoseReelProps {
  size?: number;
  /** colour of the hose wound on the drum */
  tone?: HoseTone;
}

const hoseTones: Record<HoseTone, { base: string; deep: string }> = {
  red: { base: palette.engineRed, deep: palette.engineRedDark },
  yellow: { base: palette.safetyYellow, deep: palette.gold },
};

/**
 * A wall-mounted hose reel — station dressing for the apron, the garage and
 * the equipment bay. Drawn in a 100 × 100 box: a charcoal bracket, a drum
 * wound with hose (base → navy shade → white highlight, grooves as rings),
 * a brass hub, and the brass nozzle hanging off the bottom. It hangs on a
 * wall, so it casts a soft offset shadow instead of a ground ellipse.
 */
export function HoseReel({ size = 64, tone = 'red' }: HoseReelProps) {
  const hose = hoseTones[tone];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* shadow on the wall behind */}
      <Circle cx={53} cy={52} r={34} fill={SHADE} />
      {/* bracket */}
      <Rect x={14} y={6} width={72} height={12} rx={6} fill={palette.charcoal} />
      <Rect x={14} y={6} width={72} height={4} rx={2} fill={HIGHLIGHT} />
      <Circle cx={22} cy={12} r={2.6} fill={palette.slateLight} />
      <Circle cx={78} cy={12} r={2.6} fill={palette.slateLight} />
      <Rect x={45} y={14} width={10} height={20} rx={4} fill={palette.charcoalDark} />
      {/* drum + coil rings */}
      <Circle cx={50} cy={48} r={34} fill={hose.deep} />
      <Circle cx={50} cy={48} r={30} fill={hose.base} />
      <Circle cx={50} cy={48} r={25} fill={hose.deep} />
      <Circle cx={50} cy={48} r={21} fill={hose.base} />
      <Circle cx={50} cy={48} r={16} fill={hose.deep} />
      <Circle cx={50} cy={48} r={12.5} fill={hose.base} />
      {/* light falls from the top-left */}
      <Path d="M16 48a34 34 0 0 0 68 0 34 34 0 0 1-68 0z" fill={SHADE} />
      <Path d="M22 36a30 30 0 0 1 22-18 26 26 0 0 0-14 10 24 24 0 0 0-5 9z" fill={HIGHLIGHT} />
      {/* brass hub */}
      <Circle cx={50} cy={48} r={9} fill={palette.gold} />
      <Circle cx={50} cy={50.5} r={7} fill={SHADE} />
      <Circle cx={50} cy={48} r={4.5} fill={palette.goldDark} />
      <Circle cx={47.5} cy={45.5} r={2.2} fill={HIGHLIGHT} />
      {/* hose tail leaving the drum, then the brass nozzle hanging down */}
      <Path d="M70 74q10 4 8 14" stroke={hose.base} strokeWidth={8} strokeLinecap="round" fill="none" />
      <Path d="M70 74q10 4 8 14" stroke={SHADE} strokeWidth={3} strokeLinecap="round" fill="none" />
      <G>
        <Rect x={72} y={84} width={12} height={8} rx={3} fill={palette.gold} />
        <Rect x={73} y={90} width={10} height={9} rx={2.5} fill={palette.charcoal} />
        <Rect x={72} y={84} width={12} height={2.4} rx={1.2} fill={HIGHLIGHT} />
        <Ellipse cx={78} cy={98.5} rx={4} ry={1.4} fill={SHADE_DEEP} />
      </G>
    </Svg>
  );
}
