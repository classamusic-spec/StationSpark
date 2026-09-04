import { useEffect, useState } from 'react';
import { idle } from '@/theme';
import { useReducedMotion } from './useReducedMotion';

/**
 * Boolean companion to `useBlink` (which returns a shared value).
 *
 * Character rigs are drawn with react-native-svg, and animating raw SVG props
 * off the UI thread is not reliable on web — so the *shape* of the eye is
 * swapped in React instead. A blink is two cheap re-renders of a small SVG
 * every 2.6–5.2 s, which is free. Cadence comes from `idle` in @/theme.
 *
 * Returns `true` while the eyes are closed. Always `false` under reduced motion.
 */
export function useBlinkState(minMs = idle.blinkMinMs, maxMs = idle.blinkMaxMs, closedMs = 120): boolean {
  const [closed, setClosed] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setClosed(false);
      return;
    }
    let alive = true;
    let waitTimer: ReturnType<typeof setTimeout> | undefined;
    let openTimer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      const wait = minMs + Math.random() * Math.max(0, maxMs - minMs);
      waitTimer = setTimeout(() => {
        if (!alive) return;
        setClosed(true);
        openTimer = setTimeout(() => {
          if (!alive) return;
          setClosed(false);
          schedule();
        }, closedMs);
      }, wait);
    };
    schedule();

    return () => {
      alive = false;
      if (waitTimer) clearTimeout(waitTimer);
      if (openTimer) clearTimeout(openTimer);
    };
  }, [closedMs, maxMs, minMs, reduced]);

  return closed;
}
