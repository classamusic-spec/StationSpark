import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** The design box every logic mini-game is drawn against (iPhone-ish portrait). */
export const DESIGN = { width: 390, height: 700 } as const;

export interface GameLayout {
  /** window size */
  width: number;
  height: number;
  /** width of the centred play column (capped so tablets don't stretch) */
  boxWidth: number;
  /** uniform scale factor applied to design-box numbers */
  scale: number;
  /** scale a design-box number (rounded) */
  s: (n: number) => number;
  /** true on short screens / training-yard compact mode → tighten paddings */
  tight: boolean;
  /** true on tablets & wide web windows */
  wide: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Layout from a 390×700 design box. Everything scales together so the games
 * look identical on a small phone, a tablet and the web export.
 */
export function useGameLayout(opts: { compact?: boolean; maxWidth?: number; reserve?: number } = {}): GameLayout {
  const { width, height } = useWindowDimensions();
  const maxWidth = opts.maxWidth ?? 560;
  const reserve = opts.reserve ?? 0;
  return useMemo(() => {
    const boxWidth = Math.min(width, maxWidth);
    const usable = Math.max(320, height - reserve);
    const scale = clamp(Math.min(boxWidth / DESIGN.width, usable / DESIGN.height), 0.78, 1.5);
    return {
      width,
      height,
      boxWidth,
      scale,
      s: (n: number) => Math.round(n * scale),
      tight: !!opts.compact || usable < 620,
      wide: width >= 700,
    };
  }, [width, height, maxWidth, reserve, opts.compact]);
}
