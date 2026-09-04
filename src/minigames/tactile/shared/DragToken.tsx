import React, { useCallback, useMemo } from 'react';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { radii, shadows, springs } from '@/theme';

export interface DragTokenProps {
  children: React.ReactNode;
  disabled?: boolean;
  /** gold glow — used by the hint ladder's auto-assist */
  highlight?: boolean;
  /** how far the token must travel out of the tray to count as a drop (px up) */
  liftThreshold?: number;
  /** fired on a tap, or on a drag that cleared the threshold */
  onPlace: () => void;
  /** fired when the child first picks the token up */
  onPickUp?: () => void;
  accessibilityLabel?: string;
}

/**
 * A tray token the child can TAP or DRAG onto the board. Kids aim badly, so a
 * drop counts as long as the token left the tray — and a plain tap works too.
 */
export function DragToken({
  children,
  disabled,
  highlight,
  liftThreshold = 50,
  onPlace,
  onPickUp,
  accessibilityLabel,
}: DragTokenProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const lift = useSharedValue(0);

  const release = useCallback(
    (placed: boolean) => {
      if (placed) onPlace();
    },
    [onPlace],
  );

  const pick = useCallback(() => onPickUp?.(), [onPickUp]);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(!disabled)
      .minDistance(6)
      .onBegin(() => {
        lift.value = withSpring(1, springs.pop);
        runOnJS(pick)();
      })
      .onUpdate((e) => {
        x.value = e.translationX;
        y.value = e.translationY;
      })
      .onEnd((e) => {
        runOnJS(release)(e.translationY < -liftThreshold);
      })
      .onFinalize(() => {
        x.value = withSpring(0, springs.snap);
        y.value = withSpring(0, springs.snap);
        lift.value = withSpring(0, springs.pop);
      });
    const tap = Gesture.Tap()
      .enabled(!disabled)
      .maxDistance(12)
      .onEnd((_e, ok) => {
        if (ok) runOnJS(release)(true);
      });
    return Gesture.Race(pan, tap);
  }, [disabled, lift, liftThreshold, pick, release, x, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: 1 + lift.value * 0.08 }],
    zIndex: lift.value > 0 ? 20 : 1,
    opacity: disabled ? 0.35 : 1,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[style, highlight && styles.highlight]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  highlight: { borderRadius: radii.tile, ...shadows.glowGold },
});
