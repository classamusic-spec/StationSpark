import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';

/** The friendly street hydrant — scene dressing for the yard and the town. */
export function Hydrant({ size = 64 }: { size?: number }) {
  const w = size * 0.72;
  return (
    <Svg width={w} height={size} viewBox="0 0 72 100">
      <Ellipse cx={36} cy={95} rx={26} ry={5} fill={palette.navy} opacity={0.14} />
      <Rect x={10} y={84} width={52} height={12} rx={6} fill={palette.engineRedDark} />
      <Rect x={16} y={34} width={40} height={54} rx={14} fill={palette.engineRed} />
      <Rect x={21} y={38} width={9} height={46} rx={4.5} fill={palette.white} opacity={0.3} />
      <Rect x={4} y={48} width={16} height={16} rx={7} fill={palette.engineRedDark} />
      <Rect x={52} y={48} width={16} height={16} rx={7} fill={palette.engineRedDark} />
      <Circle cx={10} cy={56} r={5} fill={palette.gold} />
      <Circle cx={62} cy={56} r={5} fill={palette.gold} />
      <Rect x={12} y={26} width={48} height={12} rx={6} fill={palette.engineRedDark} />
      <Path d="M20 26c0-10 7-16 16-16s16 6 16 16z" fill={palette.engineRed} />
      <Rect x={30} y={2} width={12} height={12} rx={5} fill={palette.gold} />
      <Ellipse cx={28} cy={18} rx={7} ry={4} fill={palette.white} opacity={0.35} />
    </Svg>
  );
}

/** A traffic cone — used to dress the training yard. */
export function Cone({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Ellipse cx={30} cy={55} rx={22} ry={4} fill={palette.navy} opacity={0.14} />
      <Rect x={6} y={48} width={48} height={9} rx={4.5} fill={palette.orangeDark} />
      <Path d="M30 6l14 42H16z" fill={palette.orange} />
      <Path d="M22.5 30h15l1.8 6H20.7z" fill={palette.white} />
      <Path d="M27 8h4l1 8h-6z" fill={palette.white} opacity={0.35} />
    </Svg>
  );
}
