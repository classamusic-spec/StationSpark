/**
 * BIRDS — the slowest, quietest piece of life in the sky.
 *
 * One bird crosses the frame on a long shallow arc roughly every 20 s, flaps
 * while it goes and is simply absent the rest of the time. Two animated nodes
 * per bird (the flight transform and the wing flap), no per-frame React state,
 * and nothing at all when the child has asked for less motion.
 */
import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { palette } from '@/theme';
import { useLoop, usePulse, useReducedMotion } from '@/hooks';
import { SHADE } from './tone';

/** A little silhouette: body, two wings and a dot of a beak. No outlines. */
const BirdArt = memo(function BirdArt({ size, tint }: { size: number; tint: string }) {
  return (
    <Svg width={size} height={size * 0.5} viewBox="0 0 40 20" pointerEvents="none">
      <Ellipse cx={20} cy={13} rx={8.4} ry={4.6} fill={tint} />
      <Ellipse cx={23.6} cy={14} rx={5} ry={3.4} fill={SHADE} />
      <Ellipse cx={13.4} cy={10.6} rx={3.6} ry={3.4} fill={tint} />
      <Path d="M 10 10.2 L 6.4 11.4 L 10 12.6 Z" fill={palette.safetyYellow} />
      <Path d="M 26.6 12.4 Q 33 12.8 38 9.4 Q 33 15.4 26.4 15 Z" fill={tint} />
    </Svg>
  );
});

/** The wings, drawn separately so only they flap. */
const Wings = memo(function Wings({ size, tint }: { size: number; tint: string }) {
  return (
    <Svg width={size} height={size * 0.5} viewBox="0 0 40 20" pointerEvents="none">
      <Path d="M 19 11 Q 12.6 3.4 4.4 2.2 Q 12 8.6 15.4 12.6 Z" fill={tint} />
      <Path d="M 21 11 Q 27.6 3 36 2 Q 28 8.4 24.6 12.6 Z" fill={tint} />
      <Path d="M 21 11 Q 27.6 3 36 2 Q 30.6 6.6 27 11 Z" fill={SHADE} />
    </Svg>
  );
});

interface FlightProps {
  size: number;
  tint: string;
  /** total cycle, including the long off-screen wait */
  periodMs: number;
  /** fraction of the cycle actually spent on screen */
  span: number;
  /** 0..1 offset into the cycle so two birds never launch together */
  phase: number;
  /** vertical centre of the flight path */
  baseY: number;
  /** how far the arc rises above `baseY` at mid-crossing */
  arc: number;
  fieldW: number;
  /** -1 = right → left */
  dir: 1 | -1;
}

function Bird({ size, tint, periodMs, span, phase, baseY, arc, fieldW, dir }: FlightProps) {
  const t = useLoop(periodMs);
  const flap = usePulse(460, 0.5);

  const flight = useAnimatedStyle(() => {
    const p = (t.value + phase) % 1;
    const k = p / span;
    if (k > 1) return { opacity: 0, transform: [{ translateX: -fieldW }, { translateY: baseY }] };
    const travel = dir > 0 ? k : 1 - k;
    const x = -size + travel * (fieldW + size * 2);
    const y = baseY - Math.sin(k * Math.PI) * arc;
    // fade in and out at the very edges so nothing ever pops
    const fade = k < 0.06 ? k / 0.06 : k > 0.94 ? (1 - k) / 0.06 : 1;
    return { opacity: fade, transform: [{ translateX: x }, { translateY: y }, { scaleX: dir }] };
  });

  const wing = useAnimatedStyle(() => ({ transform: [{ translateY: -flap.value * size * 0.05 }, { scaleY: 0.42 + flap.value * 0.72 }] }));

  return (
    <Animated.View style={[styles.bird, { width: size, height: size * 0.5 }, flight]} pointerEvents="none">
      <BirdArt size={size} tint={tint} />
      <Animated.View style={[StyleSheet.absoluteFill, styles.wings, wing]}>
        <Wings size={size} tint={tint} />
      </Animated.View>
    </Animated.View>
  );
}

export interface BirdsProps {
  /** 1 or 2 reads best — more than that and the sky gets busy */
  count?: number;
  /** where the flight path sits, from the top of the parent */
  top?: number;
  /** how long between crossings */
  periodMs?: number;
  /** how far the arc lifts at mid-crossing */
  arc?: number;
  size?: number;
  tint?: string;
}

/**
 * Ambient sky life. Drop it into any backdrop — it fills the parent and never
 * takes touches.
 */
export function Birds({ count = 1, top = 96, periodMs = 20000, arc = 34, size = 34, tint = '#5B6BA8' }: BirdsProps) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const n = Math.max(1, Math.min(2, count));

  if (reduced) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: n }, (_, i) => (
        <Bird
          key={i}
          size={i === 0 ? size : size * 0.74}
          tint={tint}
          periodMs={periodMs * (i === 0 ? 1 : 1.37)}
          span={0.42}
          phase={i === 0 ? 0.72 : 0.24}
          baseY={top + i * 44}
          arc={i === 0 ? arc : arc * 0.62}
          fieldW={width}
          dir={i === 0 ? 1 : -1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bird: { position: 'absolute', left: 0, top: 0 },
  wings: { alignItems: 'center', justifyContent: 'flex-start' },
});
