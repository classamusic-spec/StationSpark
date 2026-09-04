import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export interface TypewriterOptions {
  /** characters per second (default 28 — comfortable read-along speed) */
  cps?: number;
  /** pause typing (e.g. while the overlay is animating in) */
  enabled?: boolean;
}

export interface Typewriter {
  /** the visible prefix of `text` */
  shown: string;
  /** true once the whole line is on screen */
  done: boolean;
  /** show the whole line immediately (tap-to-finish) */
  finish: () => void;
}

/**
 * "Types on" a line of dialogue character by character. Tap-to-finish is the
 * `finish()` callback. Reduced motion (or `enabled: false`) shows the line at once.
 */
export function useTypewriter(text: string, { cps = 28, enabled = true }: TypewriterOptions = {}): Typewriter {
  const reduced = useReducedMotion();
  const instant = reduced || !enabled || cps <= 0;
  const [count, setCount] = useState(() => (instant ? text.length : 0));
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (instant) {
      setCount(text.length);
      return;
    }
    setCount(0);
    if (!text.length) return;
    const step = Math.max(16, Math.round(1000 / cps));
    const id = setInterval(() => {
      setCount((c) => {
        const next = c + 1;
        if (next >= textRef.current.length) clearInterval(id);
        return Math.min(next, textRef.current.length);
      });
    }, step);
    return () => clearInterval(id);
  }, [cps, instant, text]);

  const finish = useCallback(() => setCount(textRef.current.length), []);

  return { shown: text.slice(0, count), done: count >= text.length, finish };
}
