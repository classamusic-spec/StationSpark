import { useEffect, useRef, useState } from 'react';
import { durations } from '@/theme';
import { useReducedMotion } from './useReducedMotion';

export interface CountUpOptions {
  /** total animation time (default `durations.cinematic`) */
  durationMs?: number;
  /** wait this long before starting (lets a card spring in first) */
  delayMs?: number;
  /** start counting from here (default 0) */
  from?: number;
  /** set false to hold at `from` until the celebration is ready */
  enabled?: boolean;
}

/** Ease-out so the number decelerates into its final value. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animated number for score/XP/Sparks read-outs. Runs on the JS thread with
 * requestAnimationFrame because the value has to become *text*.
 * Reduced motion jumps straight to the target.
 */
export function useCountUp(target: number, { durationMs = durations.cinematic, delayMs = 0, from = 0, enabled = true }: CountUpOptions = {}): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced || !enabled ? target : from);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setValue(from);
      return;
    }
    if (reduced || durationMs <= 0) {
      setValue(target);
      return;
    }
    let cancelled = false;
    let start = 0;
    setValue(from);

    const tick = (now: number) => {
      if (cancelled) return;
      if (!start) start = now;
      const elapsed = now - start - delayMs;
      if (elapsed < 0) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / durationMs);
      setValue(Math.round(from + (target - from) * easeOut(t)));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    };
  }, [delayMs, durationMs, enabled, from, reduced, target]);

  return value;
}
