import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { durations, easings, palette } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { makeSparkles, polar, type SparkleParticle } from '@/world/fx';

function Spark({ p, play, reduced }: { p: SparkleParticle; play: number; reduced: boolean }) {
  const t = useSharedValue(0);
  const target = useMemo(() => polar(p.angle, p.distance), [p.angle, p.distance]);

  useEffect(() => {
    if (reduced) {
      t.value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 60 }));
      return;
    }
    t.value = 0;
    t.value = withDelay(p.delay, withSequence(withTiming(1, { duration: durations.slow, easing: easings.out }), withTiming(0, { duration: 1 })));
  }, [p.delay, play, reduced, t]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : Math.sin(t.value * Math.PI),
    transform: [
      { translateX: target.x * t.value },
      { translateY: target.y * t.value },
      { scale: 0.3 + Math.sin(t.value * Math.PI) * 0.9 },
      { rotate: `${t.value * 90}deg` },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.spark, style]}>
      <Svg width={p.size} height={p.size} viewBox="0 0 24 24">
        <Path d="M 12 0 L 14.6 9.4 L 24 12 L 14.6 14.6 L 12 24 L 9.4 14.6 L 0 12 L 9.4 9.4 Z" fill={p.color} />
      </Svg>
    </Animated.View>
  );
}

export interface SparkleBurstProps {
  /** change this number to fire another burst */
  play?: number;
  /** how far the sparks travel, in px */
  radius?: number;
  count?: number;
  colors?: readonly string[];
  /** absolutely fill the parent and centre the burst (default true) */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The little radial "ding!" that fires on every correct answer.
 * Drop it inside the thing that was tapped and bump `play` to replay it.
 */
export function SparkleBurst({ play = 0, radius = 38, count = 8, colors, fill = true, style }: SparkleBurstProps) {
  const reduced = useReducedMotion();
  const parts = useMemo(
    () => makeSparkles({ count, radius, seed: 3 + (play % 7), colors: colors ?? [palette.safetyYellow, palette.white, palette.gold] }),
    [colors, count, play, radius],
  );
  return (
    <View pointerEvents="none" style={[fill ? styles.fill : styles.inline, style]}>
      {parts.map((p) => (
        <Spark key={p.id} p={p} play={play} reduced={reduced} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  inline: { alignItems: 'center', justifyContent: 'center' },
  spark: { position: 'absolute' },
});
