import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useSharedValue, useFrameCallback, type SharedValue } from 'react-native-reanimated';
import { spacing } from '@/theme';
import type { AgeBand } from '@/learning/types';

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
  pad: number;
  gap: number;
}

/** Screen-size scaling: phones ≈ 1, tablets up to 1.75, tiny phones ≥ 0.82. */
export function useStage(compact?: boolean): Stage {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const raw = Math.min(width / DESIGN.w, height / DESIGN.h);
    const scale = Math.max(0.82, Math.min(raw, 1.75));
    return {
      windowW: width,
      windowH: height,
      scale,
      s: (n: number) => n * scale,
      isTablet: Math.min(width, height) >= 600,
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

/** Band A gets bigger targets and fewer words; band C gets the maths written out. */
export interface BandPresentation {
  /** minimum tap/drag target */
  target: number;
  /** show equations / fractions as symbols */
  showEquations: boolean;
  /** show counting icons next to numerals */
  showCountIcons: boolean;
  /** keep prompts short */
  terse: boolean;
}

export function bandPresentation(band: AgeBand, stage: Stage): BandPresentation {
  if (band === 'A') return { target: Math.max(72, stage.s(78)), showEquations: false, showCountIcons: true, terse: true };
  if (band === 'B') return { target: Math.max(64, stage.s(68)), showEquations: true, showCountIcons: false, terse: false };
  return { target: Math.max(64, stage.s(64)), showEquations: true, showCountIcons: false, terse: false };
}
