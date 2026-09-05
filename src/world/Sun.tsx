import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { usePulse } from '@/hooks';

/**
 * The bloom. Three nested radial falloffs instead of the old clip-art spokes:
 * a very wide warm wash, a tighter halo, then the disc itself with one
 * highlight. Nothing here has an edge, so it never collides with UI chrome.
 */
const Bloom = memo(function Bloom({ size }: { size: number }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} pointerEvents="none">
      <Defs>
        <RadialGradient id="sunWash" cx="50%" cy="50%" r="50%">
          <Stop offset="0.18" stopColor="#FFF3C4" stopOpacity={0.5} />
          <Stop offset="0.58" stopColor="#FFE9A8" stopOpacity={0.2} />
          <Stop offset="1" stopColor="#FFE9A8" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
          <Stop offset="0.42" stopColor="#FFE07A" stopOpacity={0.85} />
          <Stop offset="0.72" stopColor="#FFE07A" stopOpacity={0.28} />
          <Stop offset="1" stopColor="#FFE07A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={c} cy={c} r={c} fill="url(#sunWash)" />
      <Circle cx={c} cy={c} r={size * 0.34} fill="url(#sunHalo)" />
      <Circle cx={c} cy={c} r={size * 0.19} fill={palette.safetyYellow} />
      <Circle cx={c - size * 0.05} cy={c - size * 0.055} r={size * 0.07} fill="#FFF6D2" opacity={0.75} />
    </Svg>
  );
});

/** Warm sun: a soft radial bloom that breathes. No spokes, no hard disc edge. */
export function Sun({ size = 132, top = 8, right = 10 }: { size?: number; top?: number; right?: number }) {
  const glow = usePulse(6200, 0.5);
  const bloomStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.95 + glow.value * 0.1 }], opacity: 0.88 + glow.value * 0.12 }));

  return (
    <View style={[styles.wrap, { top, right, width: size, height: size }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, bloomStyle]}>
        <Bloom size={size} />
      </Animated.View>
    </View>
  );
}

/** The evening moon — a soft crescent with the same bloom treatment. */
export const Moon = memo(function Moon({ size = 96, top = 18, right = 22 }: { size?: number; top?: number; right?: number }) {
  const c = size / 2;
  return (
    <View style={[styles.wrap, { top, right, width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="moonWash" cx="50%" cy="50%" r="50%">
            <Stop offset="0.24" stopColor="#E9EDFF" stopOpacity={0.42} />
            <Stop offset="1" stopColor="#E9EDFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={c} cy={c} r={c} fill="url(#moonWash)" />
        <Circle cx={c} cy={c} r={size * 0.2} fill="#FFF7DF" />
        <Circle cx={c - size * 0.075} cy={c - size * 0.05} r={size * 0.175} fill="#8FA0D8" opacity={0.55} />
        <Circle cx={c + size * 0.045} cy={c + size * 0.04} r={size * 0.038} fill="#F1E2BC" opacity={0.7} />
        <Circle cx={c + size * 0.085} cy={c - size * 0.05} r={size * 0.026} fill="#F1E2BC" opacity={0.55} />
      </Svg>
    </View>
  );
});

const STAR_SPOTS: [number, number, number][] = [
  [0.08, 0.1, 1],
  [0.19, 0.24, 0.7],
  [0.31, 0.07, 0.85],
  [0.44, 0.19, 0.6],
  [0.57, 0.09, 0.9],
  [0.68, 0.26, 0.65],
  [0.79, 0.13, 0.8],
  [0.91, 0.22, 0.7],
  [0.14, 0.36, 0.55],
  [0.5, 0.33, 0.5],
  [0.86, 0.38, 0.6],
];

function Twinkle({ x, y, s, band, phase }: { x: number; y: number; s: number; band: number; phase: number }) {
  const t = usePulse(3200 + phase * 1700, 0.6);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + t.value * 0.6, transform: [{ scale: 0.82 + t.value * 0.3 }] }));
  const r = 2.2 * s;
  return (
    <Animated.View style={[styles.star, { left: `${x * 100}%`, top: y * band, width: r * 2, height: r * 2 }, style]} pointerEvents="none">
      <Svg width={r * 2} height={r * 2} viewBox="0 0 10 10">
        <Path d="M 5 0 Q 5.7 4.3 10 5 Q 5.7 5.7 5 10 Q 4.3 5.7 0 5 Q 4.3 4.3 5 0 Z" fill="#FFF6D2" />
      </Svg>
    </Animated.View>
  );
}

/** A scatter of soft four-point stars for the evening sky. */
export function Stars({ band = 260, count = 9 }: { band?: number; count?: number }) {
  const spots = STAR_SPOTS.slice(0, Math.max(1, Math.min(STAR_SPOTS.length, count)));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {spots.map((s, i) => (
        <Twinkle key={i} x={s[0]} y={s[1]} s={s[2]} band={band} phase={(i % 4) / 4} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  star: { position: 'absolute' },
});
