/**
 * The four stat-tile glyphs from reference frame F6 — truck, cone, chef hat,
 * book — drawn white-forward for a coloured tile. Each carries one shade tone
 * and one highlight, and stands on the navy contact ellipse (rules 2 and 3).
 * Window and stripe cut-outs use the tile colour so they read as holes.
 */
import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '@/world/tone';

const W = { width: 38, height: 38, viewBox: '0 0 48 48' } as const;
const WHITE = palette.white;
const HI = 'rgba(255,255,255,0.55)';

const Ground = ({ rx = 17, cy = 43 }: { rx?: number; cy?: number }) => (
  <Ellipse cx={24} cy={cy} rx={rx} ry={shadowRy(rx)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
);

export const TruckGlyph = ({ tile = palette.engineRed }: { tile?: string }) => (
  <Svg {...W}>
    <Ground rx={19} cy={42.5} />
    {/* roof ladder */}
    <Rect x={6} y={12} width={20} height={3.4} rx={1.7} fill={WHITE} opacity={0.85} />
    <Rect x={9} y={9.5} width={2.4} height={6} rx={1.2} fill={WHITE} opacity={0.85} />
    <Rect x={20} y={9.5} width={2.4} height={6} rx={1.2} fill={WHITE} opacity={0.85} />
    {/* cab */}
    <Rect x={27} y={10} width={17} height={14} rx={4} fill={WHITE} />
    <Rect x={30} y={13} width={10} height={7} rx={2.4} fill={tile} />
    {/* body */}
    <Rect x={3} y={16} width={42} height={20} rx={5} fill={WHITE} />
    <Rect x={8} y={20} width={14} height={8} rx={2.4} fill={tile} opacity={0.55} />
    <Rect x={3} y={31} width={42} height={5} rx={2.5} fill={SHADE} />
    <Rect x={5} y={17.5} width={12} height={2.4} rx={1.2} fill={HI} />
    {/* light bar */}
    <Rect x={31} y={6.5} width={5} height={4} rx={1.6} fill={palette.waterCyan} />
    <Rect x={37} y={6.5} width={5} height={4} rx={1.6} fill={palette.safetyYellow} />
    {/* wheels */}
    <Circle cx={13} cy={37} r={5.6} fill="#2B3466" />
    <Circle cx={35} cy={37} r={5.6} fill="#2B3466" />
    <Circle cx={13} cy={37} r={2.4} fill={WHITE} />
    <Circle cx={35} cy={37} r={2.4} fill={WHITE} />
  </Svg>
);

export const ConeGlyph = ({ tile = palette.orange }: { tile?: string }) => (
  <Svg {...W}>
    <Ground rx={16} cy={44} />
    <Path d="M 24 5 C 27.2 5 29 7 29.8 10.6 L 36.5 38 L 11.5 38 L 18.2 10.6 C 19 7 20.8 5 24 5 Z" fill={WHITE} />
    {/* the stripes are cut-outs in the tile colour */}
    <Path d="M 20.6 17 L 27.4 17 L 28.9 25 L 19.1 25 Z" fill={tile} />
    <Path d="M 18.2 30 L 29.8 30 L 30.9 35.5 L 17.1 35.5 Z" fill={tile} opacity={0.8} />
    {/* shade down the right side, highlight up the left */}
    <Path d="M 24 5 C 27.2 5 29 7 29.8 10.6 L 36.5 38 L 30 38 L 25.5 10.6 C 25.2 8 24.8 6.4 24 5 Z" fill={SHADE} />
    <Path d="M 21.6 8.5 L 20 15" stroke={HI} strokeWidth={2.4} strokeLinecap="round" />
    <Rect x={5} y={37.5} width={38} height={7} rx={3.5} fill={WHITE} />
    <Rect x={5} y={41} width={38} height={3.5} rx={1.75} fill={SHADE} />
  </Svg>
);

export const ChefGlyph = ({ tile = '#3E8FE0' }: { tile?: string }) => (
  <Svg {...W}>
    <Ground rx={14} cy={44} />
    <Circle cx={13.5} cy={19} r={9.4} fill={WHITE} />
    <Circle cx={34.5} cy={19} r={9.4} fill={WHITE} />
    <Circle cx={24} cy={13.5} r={11.4} fill={WHITE} />
    <Rect x={12} y={22} width={24} height={20} rx={5} fill={WHITE} />
    {/* the band, with the fold line as a cut-out */}
    <Rect x={12} y={31} width={24} height={4} rx={2} fill={SHADE} />
    <Rect x={12} y={35} width={24} height={7} rx={3.5} fill={WHITE} />
    <Rect x={15} y={37.4} width={18} height={2.2} rx={1.1} fill={tile} opacity={0.5} />
    {/* shade on the right puff */}
    <Path d="M 34.5 9.6 A 9.4 9.4 0 0 1 43.9 19 A 9.4 9.4 0 0 1 38 27.8 L 36 22 Z" fill={SHADE} />
    <Path d="M 15 11.4 C 17 8.4 20.4 6.4 24 6.2" stroke={HI} strokeWidth={2.6} strokeLinecap="round" fill="none" />
  </Svg>
);

export const BookGlyph = ({ tile = palette.leafGreen }: { tile?: string }) => (
  <Svg {...W}>
    <Ground rx={18} cy={43} />
    {/* cover */}
    <Path d="M 24 12 C 18 8 10 7 4 8 L 4 36 C 10 35 18 36 24 40 C 30 36 38 35 44 36 L 44 8 C 38 7 30 8 24 12 Z" fill={SHADE} transform="translate(0 1.8)" />
    <Path d="M 24 12 C 18 8 10 7 4 8 L 4 36 C 10 35 18 36 24 40 C 30 36 38 35 44 36 L 44 8 C 38 7 30 8 24 12 Z" fill={WHITE} />
    {/* the gutter, in the tile colour */}
    <Path d="M 24 12 L 24 40" stroke={tile} strokeWidth={2.6} strokeLinecap="round" opacity={0.7} />
    {/* printed lines, as cut-outs */}
    <Path d="M 9 16 h 10 M 9 22 h 10 M 9 28 h 10 M 29 16 h 10 M 29 22 h 10 M 29 28 h 10" stroke={tile} strokeWidth={2.2} strokeLinecap="round" opacity={0.55} />
    <Path d="M 6 11 C 10 10 14 10 18 11" stroke={HI} strokeWidth={2.4} strokeLinecap="round" fill="none" />
  </Svg>
);
