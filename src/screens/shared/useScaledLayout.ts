import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Everything is designed on an iPhone-sized box and scaled from there. */
export const DESIGN = { w: 390, h: 844 } as const;
/** Content never gets wider than this — on tablets it centres instead. */
export const MAX_CONTENT = 520;

export interface ScaledLayout {
  width: number;
  height: number;
  /** design-box px → screen px */
  scale: number;
  s: (n: number) => number;
  /** width of the centred content column */
  contentWidth: number;
  isTablet: boolean;
  landscape: boolean;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Design-box scaling: lay a screen out for 390×844, then let `s()` grow it on
 * tablets (capped) and shrink it on short/small screens. Content stays centred
 * inside `contentWidth`.
 */
export function useScaledLayout(): ScaledLayout {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const contentWidth = Math.min(width, MAX_CONTENT);
    const scale = clamp(Math.min(contentWidth / DESIGN.w, height / (DESIGN.h * 0.92)), 0.76, 1.42);
    return {
      width,
      height,
      scale,
      s: (n: number) => Math.round(n * scale),
      contentWidth,
      isTablet: Math.min(width, height) >= 600,
      landscape: width > height,
    };
  }, [height, width]);
}
