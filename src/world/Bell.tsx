import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';
import { usePulse } from '@/hooks';

const BellShape = memo(function BellShape({ size, brass }: { size: number; brass?: boolean }) {
  const body = brass ? '#F0B429' : palette.safetyYellow;
  const shade = brass ? '#B87A0B' : palette.goldDark;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" pointerEvents="none">
      <Rect x={21} y={2} width={6} height={7} rx={3} fill={shade} />
      <Path d="M 24 8 C 34 8 39 17 39 28 L 40 33 L 8 33 L 9 28 C 9 17 14 8 24 8 Z" fill={body} />
      <Path d="M 31 10 C 37 14 39 21 39 28 L 40 33 L 30 33 C 33 26 33 16 31 10 Z" fill={shade} opacity={0.5} />
      <Path d="M 17 12 C 14 17 13 23 13 28" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.4} />
      <Rect x={6} y={32} width={36} height={6} rx={3} fill={shade} />
      <Ellipse cx={24} cy={41} rx={4.6} ry={5} fill={shade} />
    </Svg>
  );
});

/** Station bell, swaying gently from its crown. `brass` = the 'bell-brass' upgrade. */
export function Bell({ size = 44, brass }: { size?: number; brass?: boolean }) {
  const sway = usePulse(2600, 0.5);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -size / 2 }, { rotate: `${(sway.value - 0.5) * 11}deg` }, { translateY: size / 2 }],
  }));
  return (
    <View style={[styles.wrap, { width: size, height: size }]} pointerEvents="none">
      <Animated.View style={style}>
        <BellShape size={size} brass={brass} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
