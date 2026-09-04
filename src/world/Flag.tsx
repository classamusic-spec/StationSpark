import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { idle, palette } from '@/theme';
import { useLoop } from '@/hooks';

const Cloth = memo(function Cloth({ w, h, color, shade }: { w: number; h: number; color: string; shade: string }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 40" pointerEvents="none">
      {/* wavy pennant — one flat fill + one darker tone, sticker language */}
      <Path d="M 0 2 L 58 6 Q 52 18 58 30 L 0 34 Z" fill={color} />
      <Path d="M 0 22 L 58 25 Q 55 28 58 30 L 0 34 Z" fill={shade} opacity={0.55} />
      <Path d="M 0 3 L 58 7 L 58 11 L 0 8 Z" fill="#FFFFFF" opacity={0.28} />
    </Svg>
  );
});

export interface FlagProps {
  /** total flag cloth width */
  width?: number;
  /** pole height above the cloth anchor */
  poleHeight?: number;
  /** gold when the 'flag-gold' station upgrade is unlocked */
  gold?: boolean;
  poleColor?: string;
}

/**
 * Waving flag. The cloth is skewed and rotated on a loop (a cheap, cross-platform
 * stand-in for a path morph that stays smooth on web) — it reads as fabric snapping.
 */
export function Flag({ width = 56, poleHeight = 74, gold, poleColor = palette.charcoal }: FlagProps) {
  const t = useLoop(idle.flagWavePeriodMs, true);
  const h = width * 0.66;

  const clothStyle = useAnimatedStyle(() => {
    const k = t.value * 2 - 1; // -1..1
    return {
      transform: [
        { perspective: 320 },
        { skewY: `${k * 3.2}deg` },
        { rotateY: `${k * 12}deg` },
        { translateY: k * 1.6 },
      ],
    };
  });

  const color = gold ? palette.safetyYellow : palette.engineRed;
  const shade = gold ? palette.goldDark : palette.engineRedDark;

  return (
    <View style={[styles.wrap, { width: width + 8, height: poleHeight + h }]} pointerEvents="none">
      <View style={[styles.pole, { height: poleHeight + h, backgroundColor: poleColor }]} />
      <View style={[styles.knob, { backgroundColor: gold ? palette.gold : palette.safetyYellow }]} />
      <Animated.View style={[styles.cloth, clothStyle]}>
        <Cloth w={width} h={h} color={color} shade={shade} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start', justifyContent: 'flex-start' },
  pole: { position: 'absolute', left: 0, top: 0, width: 5, borderRadius: 3 },
  knob: { position: 'absolute', left: -2, top: -5, width: 9, height: 9, borderRadius: 5 },
  cloth: { position: 'absolute', left: 4, top: 4 },
});
