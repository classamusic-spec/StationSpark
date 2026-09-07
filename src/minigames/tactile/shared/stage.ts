import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useSharedValue, useFrameCallback, type SharedValue } from 'react-native-reanimated';
import { activity, spacing } from '@/theme';

/** Everything is laid out against this design box and then scaled. */
export const DESIGN = { w: 390, h: 700 } as const;

export interface Stage {
  windowW: number;
  windowH: number;
  /** multiply design-box numbers by this */
  scale: number;
  /** scale a design-box number */
  s: (n: number) => number;
  isTablet: boolean;
  /**
   * True when `GameShell` has moved the tray into a side rail. A rail is a tall
   * narrow column, so a tray laid out as a wrapping ROW spills out of it — the
   * defect that left a 14-unit barrier hanging over both edges of the panel.
   * Games ask this and stack their tray instead.
   */
  rail: boolean;
  /** how wide a tray token may be before it overflows the tray or the rail */
  trayWidth: number;
  pad: number;
  gap: number;
}

/** Screen-size scaling: phones ≈ 1, tablets up to 1.75, tiny phones ≥ 0.82. */
export function useStage(compact?: boolean): Stage {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const raw = Math.min(width / DESIGN.w, height / DESIGN.h);
    const scale = Math.max(0.82, Math.min(raw, 1.75));
    const rail = width >= activity.sideLayoutMinWidth;
    return {
      windowW: width,
      windowH: height,
      scale,
      s: (n: number) => n * scale,
      isTablet: Math.min(width, height) >= 600,
      rail,
      /* the rail is a fixed column; the bottom tray is the window less its
         own padding. Either way this is the widest a token may be drawn. */
      trayWidth: (rail ? activity.sidePanelWidth : Math.min(width, 640)) - spacing.md * 2 - spacing.sm * 2,
      pad: compact ? spacing.sm : spacing.md,
      gap: compact ? spacing.xs : spacing.sm,
    };
  }, [compact, height, width]);
}

export interface Box {
  w: number;
  h: number;
}

/** Measures the play area the host handed us (we get a flex:1 box, not the screen). */
export function useMeasuredBox(): { box: Box; ready: boolean; onLayout: (e: LayoutChangeEvent) => void } {
  const [box, setBox] = useState<Box>({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((prev) => (Math.abs(prev.w - width) < 1 && Math.abs(prev.h - height) < 1 ? prev : { w: width, h: height }));
  }, []);
  return { box, ready: box.w > 4 && box.h > 4, onLayout };
}

/** A free-running seconds clock on the UI thread, for Skia shaders/particles. */
export function useClock(active = true): SharedValue<number> {
  const clock = useSharedValue(0);
  const frame = useFrameCallback((info) => {
    'worklet';
    clock.value = info.timeSinceFirstFrame / 1000;
  }, false);

  useEffect(() => {
    frame.setActive(active);
    return () => frame.setActive(false);
  }, [active, frame]);

  return clock;
}
