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
  // State remembers which text it belongs to, so a new line derives a fresh 0
  // without a synchronous reset inside the effect.
  const [state, setState] = useState<{ forText: string; count: number }>({ forText: text, count: 0 });
  const count = instant ? text.length : state.forText === text ? state.count : 0;
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    if (instant || !text.length) return;
    const step = Math.max(16, Math.round(1000 / cps));
    const id = setInterval(() => {
      setState((s) => {
        const current = s.forText === textRef.current ? s.count : 0;
        const next = Math.min(current + 1, textRef.current.length);
        if (next >= textRef.current.length) clearInterval(id);
        return { forText: textRef.current, count: next };
      });
    }, step);
    return () => clearInterval(id);
  }, [cps, instant, text]);

  const finish = useCallback(() => setState({ forText: textRef.current, count: textRef.current.length }), []);

  return { shown: text.slice(0, count), done: count >= text.length, finish };
}
