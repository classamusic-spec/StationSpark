import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { palette } from '@/theme';
import { useLoop } from '@/hooks';

function Puff({ size, periodMs, phase, tint }: { size: number; periodMs: number; phase: number; tint: string }) {
  const t = useLoop(periodMs);
  const style = useAnimatedStyle(() => {
    const p = (t.value + phase) % 1;
    return {
      opacity: p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88,
      transform: [{ translateY: -p * size * 2.6 }, { translateX: Math.sin(p * 6.1) * size * 0.35 }, { scale: 0.45 + p * 0.95 }],
    };
  });
  return (
    <Animated.View style={[styles.puff, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 30 30">
        <Circle cx={12} cy={18} r={9} fill={tint} />
        <Circle cx={20} cy={14} r={8} fill={tint} />
        <Circle cx={15} cy={11} r={7} fill={tint} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Friendly chimney puffs — soft grey-white clouds that rise, drift and fade.
 * Never dark or smothering (see the safety direction).
 */
export function ChimneySmoke({ size = 26, count = 3, tint = palette.smoke }: { size?: number; count?: number; tint?: string }) {
  const puffs = Array.from({ length: Math.max(1, Math.min(4, count)) }, (_, i) => i);
  return (
    <View style={[styles.wrap, { width: size * 1.8, height: size * 3.2 }]} pointerEvents="none">
      {puffs.map((i) => (
        <Puff key={i} size={size} periodMs={4200 + i * 260} phase={i / puffs.length} tint={tint} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'flex-end' },
  puff: { position: 'absolute', bottom: 0 },
});
