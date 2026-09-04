import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/hooks';

/**
 * Kitchen motion helpers. The kitchen is the calm room: everything here is a
 * slow sine, never a snap. All loops stop when the child asked for less motion.
 */

/** −amplitude … +amplitude, forever, as a soft sine. Good for sways and bobs. */
export function useSwing(amplitude: number, periodMs: number, delayMs = 0): SharedValue<number> {
  const v = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      v.value = 0;
      return;
    }
    const half = periodMs / 2;
    v.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(amplitude, { duration: half, easing: Easing.inOut(Easing.sin) }),
          withTiming(-amplitude, { duration: half, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(v);
  }, [amplitude, delayMs, periodMs, reduced, v]);
  return v;
}

/** 0 → 1 sawtooth, forever. Good for rising steam and travelling waves. */
export function useRise(periodMs: number, delayMs = 0): SharedValue<number> {
  const v = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      v.value = 0;
      return;
    }
    v.value = withDelay(delayMs, withRepeat(withTiming(1, { duration: periodMs, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(v);
  }, [delayMs, periodMs, reduced, v]);
  return v;
}
