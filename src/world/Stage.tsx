/**
 * STAGE — the shared three-layer backdrop every scene and mini-game stands on
 * (art critique item #1): far haze band → mid silhouette band → near ground
 * plane with a soft top edge. Renders absolutely behind its children.
 *
 * Baseline implementation; the world art pass enriches each variant (props,
 * signage, lamp posts, chalk lines, counters) without changing this API.
 */
import React, { memo } from 'react';
import { StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';

export type StageVariant = 'street' | 'yard' | 'park' | 'counter' | 'sky';

export interface StageProps {
  variant?: StageVariant;
  /** height of the near ground plane in px (default 120) */
  groundHeight?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const grounds: Record<StageVariant, { near: string; lip: string; mid: string; haze: string }> = {
  street: { near: '#C9CFE0', lip: '#DDE2EF', mid: '#A9D8F6', haze: '#D9EEFF' },
  yard: { near: palette.grass, lip: '#A8DE8A', mid: '#8FCFF7', haze: '#D9EEFF' },
  park: { near: palette.grassDark, lip: palette.grass, mid: '#9AD5F5', haze: '#DCEFFF' },
  counter: { near: palette.tan, lip: '#F9E4BA', mid: '#F3D8AE', haze: '#FFF1DC' },
  sky: { near: 'transparent', lip: 'transparent', mid: '#A9D8F6', haze: '#D9EEFF' },
};

function StageBackdrop({ variant, groundHeight }: { variant: StageVariant; groundHeight: number }) {
  const { width, height } = useWindowDimensions();
  const g = grounds[variant];
  const groundTop = height - groundHeight;
  // mid silhouette band: soft bumps (distant hills / rooftops)
  const bumps = Array.from({ length: 7 }, (_, i) => {
    const x = (i / 6) * width;
    const r = 60 + ((i * 37) % 50);
    return `M ${x - r} ${groundTop + 8} a ${r} ${r * 0.55} 0 0 1 ${r * 2} 0 z`;
  }).join(' ');
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="stage-haze" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={g.haze} stopOpacity={0} />
          <Stop offset="1" stopColor={g.haze} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>
      {/* far haze band */}
      <Rect x={0} y={groundTop - 140} width={width} height={140} fill="url(#stage-haze)" />
      {/* mid silhouette band */}
      <Path d={bumps} fill={g.mid} opacity={0.9} />
      {/* near ground plane with a soft curved top edge and a lighter lip */}
      {variant !== 'sky' ? (
        <>
          <Path d={`M 0 ${groundTop + 10} Q ${width / 2} ${groundTop - 6} ${width} ${groundTop + 10} L ${width} ${height} L 0 ${height} Z`} fill={g.near} />
          <Path d={`M 0 ${groundTop + 10} Q ${width / 2} ${groundTop - 6} ${width} ${groundTop + 10} L ${width} ${groundTop + 18} Q ${width / 2} ${groundTop + 2} 0 ${groundTop + 18} Z`} fill={g.lip} opacity={0.9} />
        </>
      ) : null}
    </Svg>
  );
}

const MemoBackdrop = memo(StageBackdrop);

export function Stage({ variant = 'street', groundHeight = 120, children, style }: StageProps) {
  return (
    <View style={[styles.root, style]} pointerEvents="box-none">
      <MemoBackdrop variant={variant} groundHeight={groundHeight} />
      {children}
    </View>
  );
}

/** The navy contact shadow every grounded object gets (consistency rule #3). */
export function ContactShadow({ width, height, opacity = 0.12, style }: { width: number; height?: number; opacity?: number; style?: StyleProp<ViewStyle> }) {
  const h = height ?? Math.max(6, width * 0.22);
  return (
    <Svg width={width} height={h} style={style} pointerEvents="none">
      <Ellipse cx={width / 2} cy={h / 2} rx={width / 2} ry={h / 2} fill={palette.navy} opacity={opacity} />
    </Svg>
  );
}

const styles = StyleSheet.create({ root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } });
