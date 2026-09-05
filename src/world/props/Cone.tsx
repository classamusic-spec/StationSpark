import React from 'react';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '../tone';

export interface ConeProps {
  size?: number;
  /** reflective bands (the reference cones wear two) */
  bands?: 1 | 2;
}

/**
 * A traffic cone — the training-yard marker, drawn in a 60 × 60 box standing
 * on y ≈ 55. Orange body with a navy shade down the light-away side, a white
 * highlight strip, white reflective bands, a dark base plate and a contact
 * shadow. No outlines.
 */
export function Cone({ size = 48, bands = 2 }: ConeProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Ellipse cx={30} cy={55} rx={22} ry={shadowRy(22)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      {/* base plate */}
      <Rect x={5} y={46} width={50} height={11} rx={5.5} fill={palette.orangeDark} />
      <Rect x={5} y={52} width={50} height={5} rx={2.5} fill={SHADE} />
      <Rect x={9} y={47} width={30} height={3} rx={1.5} fill={HIGHLIGHT} />
      {/* body */}
      <Path d="M27 7q3-5 6 0l12 41H15z" fill={palette.orange} />
      <Path d="M33 7l12 41h-9L30 8z" fill={SHADE} />
      <Path d="M27.5 10l-8 34h3.6l7-33z" fill={HIGHLIGHT} />
      {/* reflective bands */}
      <Path d="M22.4 29h15.2l2 7.4H20.4z" fill={palette.white} />
      <Path d="M31 29h6.6l2 7.4h-6.4z" fill={SHADE} opacity={0.5} />
      {bands === 2 ? (
        <>
          <Path d="M25.6 16.5h8.8l1.4 5.2h-11.6z" fill={palette.white} />
          <Path d="M30.6 16.5h3.8l1.4 5.2h-3.8z" fill={SHADE} opacity={0.5} />
        </>
      ) : null}
    </Svg>
  );
}
