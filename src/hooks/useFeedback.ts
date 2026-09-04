import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';

/**
 * The standard right/wrong feedback animation pair.
 *   pop()    → scale 1 → 1.15 → 1 (+ 'correct' sfx + success haptic)
 *   wobble() → translateX ±6 ×3 (+ 'wrong-soft' sfx + nudge haptic)
 * Attach `style` to an Animated.View.
 */
export function useFeedbackAnim() {
  const scale = useSharedValue(1);
  const x = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: x.value }],
  }));

  const pop = useCallback(
    (opts: { silent?: boolean } = {}) => {
      scale.value = withSequence(withSpring(1.15, springs.pop), withSpring(1, springs.bounce));
      if (!opts.silent) {
        sfx.play('correct');
        haptics.success();
      }
    },
    [scale],
  );

  const wobble = useCallback(
    (opts: { silent?: boolean } = {}) => {
      x.value = withSequence(
        withTiming(-6, { duration: 55 }),
        withTiming(6, { duration: 55 }),
        withTiming(-5, { duration: 55 }),
        withTiming(4, { duration: 55 }),
        withTiming(0, { duration: 60 }),
      );
      if (!opts.silent) {
        sfx.play('wrong-soft');
        haptics.nudge();
      }
    },
    [x],
  );

  const press = useCallback(
    (down: boolean) => {
      scale.value = withSpring(down ? 0.94 : 1, springs.pop);
    },
    [scale],
  );

  return { style, pop, wobble, press, scale, x };
}
