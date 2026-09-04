import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { useLoop, usePulse } from '@/hooks';

const Rays = memo(function Rays({ size }: { size: number }) {
  const c = size / 2;
  const spokes = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} pointerEvents="none">
      {spokes.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const inner = size * 0.26;
        const outer = size * 0.48;
        const x1 = c + Math.cos(rad) * inner;
        const y1 = c + Math.sin(rad) * inner;
        const x2 = c + Math.cos(rad) * outer;
        const y2 = c + Math.sin(rad) * outer;
        return <Path key={deg} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#FFE07A" strokeWidth={size * 0.045} strokeLinecap="round" opacity={0.7} />;
      })}
    </Svg>
  );
});

const Disc = memo(function Disc({ size }: { size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} pointerEvents="none">
      <Defs>
        <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0.45" stopColor="#FFE9A8" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#FFE9A8" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={c} fill="url(#sunGlow)" />
      <Circle cx={c} cy={c} r={size * 0.24} fill={palette.safetyYellow} />
      <Circle cx={c - size * 0.06} cy={c - size * 0.07} r={size * 0.08} fill="#FFF1A8" opacity={0.85} />
    </Svg>
  );
});

/** Warm sun with slowly turning soft rays and a breathing glow. */
export function Sun({ size = 132, top = 8, right = 10 }: { size?: number; top?: number; right?: number }) {
  const spin = useLoop(60000);
  const glow = usePulse(4200, 0.5);

  const raysStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const discStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.97 + glow.value * 0.06 }] }));

  return (
    <View style={[styles.wrap, { top, right, width: size, height: size }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, raysStyle]}>
        <Rays size={size} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, discStyle]}>
        <Disc size={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
