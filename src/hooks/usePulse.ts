import { useEffect } from 'react';
import { Easing, cancelAnimation, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { useReducedMotion } from './useReducedMotion';

/**
 * A 0 → 1 → 0 ping-pong loop for glows, hovers and breathing lights.
 * Holds at `restAt` when the child asked for less motion.
 */
export function usePulse(periodMs = 1600, restAt = 0.5): SharedValue<number> {
  const v = useSharedValue(restAt);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      v.value = restAt;
      return;
    }
    v.value = 0;
    v.value = withRepeat(withTiming(1, { duration: periodMs / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(v);
  }, [periodMs, reduced, restAt, v]);

  return v;
}
