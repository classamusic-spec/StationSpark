import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';

const W = { width: 32, height: 32, viewBox: '0 0 32 32' } as const;

export const TruckGlyph = () => (
  <Svg {...W}>
    <Rect x={3} y={12} width={26} height={11} rx={3} fill={palette.white} />
    <Rect x={6} y={8} width={9} height={4} rx={2} fill={palette.white} />
    <Circle cx={9} cy={25} r={3.4} fill={palette.white} />
    <Circle cx={23} cy={25} r={3.4} fill={palette.white} />
  </Svg>
);

export const ConeGlyph = () => (
  <Svg {...W}>
    <Path d="M16 4 L24 24 H8 Z" fill={palette.white} />
    <Rect x={5} y={24} width={22} height={4} rx={2} fill={palette.white} />
    <Rect x={11.4} y={13} width={9.2} height={3.4} fill={palette.orange} />
  </Svg>
);

export const ChefGlyph = () => (
  <Svg {...W}>
    <Path d="M9 19c-4 0-5.4-3.4-4-6C3 9.4 6.4 5 10.6 6.4 12.2 2.4 20 2 21.6 6.4 25.4 5.4 28.6 10 27 13c1.4 2.6 0 6-4 6z" fill={palette.white} />
    <Rect x={9} y={19} width={14} height={7} rx={2} fill={palette.white} opacity={0.85} />
  </Svg>
);

export const BookGlyph = () => (
  <Svg {...W}>
    <Path d="M4 6c4-1.8 8-1.8 12 0v20c-4-1.8-8-1.8-12 0z" fill={palette.white} />
    <Path d="M28 6c-4-1.8-8-1.8-12 0v20c4-1.8 8-1.8 12 0z" fill={palette.white} opacity={0.82} />
  </Svg>
);
