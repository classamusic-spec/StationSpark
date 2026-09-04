import React from 'react';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';
import { palette } from '@/theme';

type IconProps = { size?: number; color?: string };

export const BackIcon = ({ size = 26, color = palette.navy }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronRightIcon = ({ size = 26, color = palette.white }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CheckIcon = ({ size = 26, color = palette.white }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="4 12.5 9.5 18 20 6.5" stroke={color} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const GearIcon = ({ size = 26, color = palette.navy }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.5l1.8 2.4 2.9-.7.9 2.8 2.8.9-.7 2.9 2.4 1.8-2.4 1.8.7 2.9-2.8.9-.9 2.8-2.9-.7L12 21.5l-1.8-2.4-2.9.7-.9-2.8-2.8-.9.7-2.9L1.9 12l2.4-1.8-.7-2.9 2.8-.9.9-2.8 2.9.7z"
      fill={color}
    />
    <Circle cx={12} cy={12} r={3.4} fill={palette.white} />
  </Svg>
);

export const PauseIcon = ({ size = 26, color = palette.navy }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={4} width={5} height={16} rx={2} fill={color} />
    <Rect x={14} y={4} width={5} height={16} rx={2} fill={color} />
  </Svg>
);

export const ResetIcon = ({ size = 26, color = palette.navy }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12a8 8 0 1 0 2.3-5.7" stroke={color} strokeWidth={3} strokeLinecap="round" />
    <Path d="M4 4v5h5" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const StarIcon = ({ size = 26, color = palette.safetyYellow, stroke = palette.goldDark }: IconProps & { stroke?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"
      fill={color}
      stroke={stroke}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </Svg>
);

export const SpeakerIcon = ({ size = 26, color = palette.navy }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 9v6h4l5 4V5L8 9H4z" fill={color} />
    <Path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

export const LockIcon = ({ size = 26, color = palette.slate }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={10} width={14} height={11} rx={3} fill={color} />
    <Path d="M8 10V7a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </Svg>
);
