import { useEffect, useState } from 'react';
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
 * Reduced motion (or `enabled: false`) skips straight to the target.
 */
export function useCountUp(target: number, { durationMs = durations.cinematic, delayMs = 0, from = 0, enabled = true }: CountUpOptions = {}): number {
  const reduced = useReducedMotion();
  const instant = reduced || durationMs <= 0;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled || instant) return;
    let cancelled = false;
    let startTs = 0;
    let raf = 0;

    const tick = (now: number) => {
      if (cancelled) return;
      if (!startTs) startTs = now;
      const elapsed = now - startTs - delayMs;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / durationMs);
      setProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [delayMs, durationMs, enabled, instant, target]);

  if (!enabled) return from;
  if (instant) return target;
  return Math.round(from + (target - from) * easeOut(progress));
}
