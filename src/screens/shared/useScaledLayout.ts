import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { activity } from '@/theme';

/** Everything is designed on an iPhone-sized box and scaled from there. */
export const DESIGN = { w: 390, h: 844 } as const;
/** A column of prose or a single stack of cards never gets wider than this. */
export const MAX_CONTENT = 520;
/**
 * A *board* — a grid of choices — is allowed to use the window, up to here.
 * Centring a 520 px phone column in a 1024 px window is the tablet mistake:
 * the child gets a narrow ribbon of cards with sky either side.
 */
export const MAX_GRID = 1160;
/** the gap every board leaves between its cards */
export const GRID_GAP = 14;

export interface ScaledLayout {
  width: number;
  height: number;
  /** design-box px → screen px */
  scale: number;
  s: (n: number) => number;
  /** width of the centred reading column */
  contentWidth: number;
  /** width a multi-column board may use — the window, capped */
  gridWidth: number;
  isTablet: boolean;
  landscape: boolean;
  /** there is room to stand a rail of detail beside the main area */
  wide: boolean;
  /** how many cards at least `min` px wide fit across the board */
  columns: (min: number, max?: number) => number;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * Design-box scaling: lay a screen out for 390×844, then let `s()` grow it on
 * tablets (capped) and shrink it on short/small screens.
 *
 * Two widths, on purpose. `contentWidth` is the reading column — a task line,
 * a single card, a sheet. `gridWidth` is the board: it grows with the window so
 * a tablet gets more *cards*, not bigger ones.
 */
export function useScaledLayout(): ScaledLayout {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const contentWidth = Math.min(width, MAX_CONTENT);
    const gridWidth = Math.min(width, MAX_GRID);
    const scale = clamp(Math.min(contentWidth / DESIGN.w, height / (DESIGN.h * 0.92)), 0.76, 1.42);
    const inner = gridWidth - 32;
    return {
      width,
      height,
      scale,
      s: (n: number) => Math.round(n * scale),
      contentWidth,
      gridWidth,
      isTablet: Math.min(width, height) >= 600,
      landscape: width > height,
      wide: width >= activity.sideLayoutMinWidth,
      columns: (min: number, max = 4) => clamp(Math.floor((inner + GRID_GAP) / (min + GRID_GAP)), 1, max),
    };
  }, [height, width]);
}
