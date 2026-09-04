import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { palette, springs } from '@/theme';
import { useReducedMotion } from '@/hooks';

export interface ProgressBarProps {
  /** current amount */
  value: number;
  /** the full amount (default 1, i.e. `value` is already 0..1) */
  max?: number;
  height?: number;
  /** fill colour (default leaf green) */
  color?: string;
  trackColor?: string;
  /** a highlight that slides along the fill (default true) */
  sheen?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * The station progress bar: a fat rounded track with a green fill that springs
 * to its new length and carries a slow moving sheen, so it reads as "alive"
 * even when nothing has changed.
 */
export function ProgressBar({
  value,
  max = 1,
  height = 18,
  color = palette.leafGreen,
  trackColor = palette.slateLight,
  sheen = true,
  style,
  accessibilityLabel,
}: ProgressBarProps) {
  const target = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const t = useSharedValue(0);
  const shine = useSharedValue(0);
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();

  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);

  useEffect(() => {
    t.value = reduced ? target : withSpring(target, springs.gentle);
  }, [reduced, t, target]);

  useEffect(() => {
    if (reduced || !sheen || width <= 0) return;
    shine.value = 0;
    shine.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => cancelAnimation(shine);
  }, [reduced, sheen, shine, width]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0.0001, t.value) }] }));
  const shineStyle = useAnimatedStyle(() => ({
    opacity: Math.sin(shine.value * Math.PI) * 0.5,
    transform: [{ translateX: -width * 0.25 + shine.value * width * 1.25 }],
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(target * 100) }}
      onLayout={onLayout}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }, style]}
    >
      <Animated.View style={[styles.fillWrap, { borderRadius: height / 2, backgroundColor: color }, fillStyle]}>
        <View style={[styles.fillTop, { height: Math.max(3, height * 0.26), borderRadius: height / 2 }]} />
        {sheen ? <Animated.View style={[styles.shine, { width: Math.max(12, width * 0.2) }, shineStyle]} /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', width: '100%' },
  fillWrap: {
    ...StyleSheet.absoluteFill,
    transformOrigin: 'left',
    overflow: 'hidden',
  },
  fillTop: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
  },
});
