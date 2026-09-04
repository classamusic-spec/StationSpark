import { useEffect } from 'react';
import {
  Easing,
  cancelAnimation,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { idle } from '@/theme';
import { useReducedMotion } from './useReducedMotion';

/** A shared value that gently bobs between -amp..+amp forever. */
export function useIdleBob(amplitude = idle.bobAmplitude, periodMs = idle.bobPeriodMs, phase = 0): SharedValue<number> {
  const v = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      v.value = 0;
      return;
    }
    const half = periodMs / 2;
    v.value = withSequence(
      withTiming(amplitude * Math.sin(phase), { duration: 1 }),
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
  }, [amplitude, periodMs, phase, reduced, v]);
  return v;
}

/** 0..1 blink amount: 1 = eyes closed. Random cadence per character. */
export function useBlink(minMs = idle.blinkMinMs, maxMs = idle.blinkMaxMs): SharedValue<number> {
  const v = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let alive = true;
    const schedule = () => {
      const wait = minMs + Math.random() * (maxMs - minMs);
      timer = setTimeout(() => {
        if (!alive) return;
        v.value = withSequence(withTiming(1, { duration: 70 }), withTiming(0, { duration: 110 }));
        schedule();
      }, wait);
    };
    schedule();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [maxMs, minMs, reduced, v]);
  return v;
}

/** Continuous 0..1 loop (for waving flags, drifting clouds). */
export function useLoop(periodMs: number, reverse = false): SharedValue<number> {
  const v = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    v.value = withRepeat(withTiming(1, { duration: periodMs, easing: Easing.linear }), -1, reverse);
    return () => cancelAnimation(v);
  }, [periodMs, reduced, reverse, v]);
  return v;
}
