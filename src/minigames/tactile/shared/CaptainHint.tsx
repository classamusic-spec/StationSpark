import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { HintBubble } from '@/ui';
import { palette } from '@/theme';
import { useReducedMotion } from '@/hooks';
import type { HintText } from './useHintLadder';

/** Beacon's bubble, wired to the hint ladder. Tap it to dismiss. */
export function CaptainHint({ hint, onDismiss }: { hint: HintText | null; onDismiss: () => void }) {
  return <HintBubble visible={hint !== null} text={hint?.text ?? ''} es={hint?.es} onDismiss={onDismiss} />;
}

/**
 * The pulsing gold ring Beacon points at the next thing to touch.
 * Absolutely positioned by the caller; never intercepts touches.
 */
export function PulseRing({
  x,
  y,
  size,
  tone = palette.safetyYellow,
  visible = true,
}: {
  x: number;
  y: number;
  size: number;
  tone?: string;
  visible?: boolean;
}) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      p.value = 0;
      return;
    }
    if (reduced) {
      p.value = 0.5;
      return;
    }
    p.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 780, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 10 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(p);
  }, [p, reduced, visible]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - p.value) * 0.9,
    transform: [{ scale: 0.72 + p.value * 0.55 }],
  }));

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={[styles.ringWrap, { left: x - size / 2, top: y - size / 2, width: size, height: size }]}>
      <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: tone }, style]} />
      <View style={[styles.ringStatic, { width: size * 0.72, height: size * 0.72, borderRadius: size / 2, borderColor: tone }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  ringWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 30 },
  ring: { position: 'absolute', borderWidth: 6 },
  ringStatic: { position: 'absolute', borderWidth: 4, opacity: 0.55 },
});
