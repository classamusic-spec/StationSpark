import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks';
import { makeConfetti, type ConfettiParticle } from '@/world/fx';

function Piece({ p, box, play, reduced, durationMs }: { p: ConfettiParticle; box: { w: number; h: number }; play: number; reduced: boolean; durationMs: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = 0;
    if (reduced) return;
    t.value = withDelay(p.delay * durationMs, withTiming(1, { duration: p.duration * durationMs, easing: Easing.out(Easing.quad) }));
  }, [durationMs, p.delay, p.duration, play, reduced, t]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value <= 0 ? 0 : t.value > 0.86 ? (1 - t.value) / 0.14 : 1,
    transform: [
      { translateX: p.driftX * t.value },
      { translateY: p.fall * box.h * t.value },
      { rotate: `${p.rotation + p.spin * t.value}deg` },
      { scaleX: 0.6 + Math.abs(Math.cos(t.value * 6)) * 0.4 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          left: p.x * box.w,
          top: p.y * box.h,
          width: p.size,
          height: p.shape === 'circle' ? p.size : p.size * p.aspect,
          borderRadius: p.shape === 'circle' ? p.size : 2,
          backgroundColor: p.color,
        },
        style,
      ]}
    />
  );
}

export interface ConfettiBurstProps {
  /** change this number to fire another burst */
  play?: number;
  count?: number;
  /** total burst time in ms (default 2500) */
  durationMs?: number;
  colors?: readonly string[];
  /** 'rain' falls from above the frame, 'burst' fires out of the middle */
  origin?: 'burst' | 'rain';
  /** absolutely fill the parent (default true) */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Brand confetti — red, yellow, cyan, green and white rectangles and circles
 * falling with a tumble. Reanimated (not Skia) so it renders identically on
 * iOS, Android and web, and so a mini-game can drop one in without a Canvas.
 */
export function ConfettiBurst({ play = 0, count = 44, durationMs = 2500, colors, origin = 'rain', fill = true, style }: ConfettiBurstProps) {
  const reduced = useReducedMotion();
  const window = useWindowDimensions();
  const [box, setBox] = useState({ w: window.width, h: window.height });

  const parts = useMemo(() => makeConfetti({ count, seed: 7 + (play % 11), colors, origin }), [colors, count, origin, play]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setBox({ w: width, h: height });
  };

  if (reduced) return null;

  return (
    <View pointerEvents="none" onLayout={onLayout} style={[fill ? styles.fill : undefined, style]}>
      {parts.map((p: ConfettiParticle) => (
        <Piece key={p.id} p={p} box={box} play={play} reduced={reduced} durationMs={durationMs} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  piece: { position: 'absolute' },
});
