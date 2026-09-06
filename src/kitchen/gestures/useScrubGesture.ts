import { useMemo } from 'react';
import { Gesture, type PanGesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

export interface ScrubGesture {
  gesture: PanGesture;
  /** how far the hand has pulled, in px — drive a nudge/tilt with it */
  pull: SharedValue<number>;
  active: SharedValue<number>;
}

export interface ScrubOptions {
  /** px of drag per step. Big on purpose: 5-year-old thumbs overshoot. */
  stepPx?: number;
  /** +1 for each step up, −1 for each step down */
  onStep: (delta: number) => void;
  enabled?: boolean;
}

/**
 * DRAG A NUMBER — pull up for more, pull down for fewer.
 *
 * Used where a child is *setting an amount* rather than answering a question:
 * scooping more flour into the bowl feels like lifting, not like pressing a
 * button forty times. The steppers stay right next to it, so nobody has to
 * discover this to play; it is the faster, nicer way in for the child who does.
 */
export function useScrubGesture({ stepPx = 34, onStep, enabled = true }: ScrubOptions): ScrubGesture {
  const pull = useSharedValue(0);
  const active = useSharedValue(0);
  const applied = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .minDistance(8)
        .activeOffsetY([-8, 8])
        .onBegin(() => {
          applied.value = 0;
          pull.value = 0;
          active.value = withTiming(1, { duration: 110 });
        })
        .onUpdate((e) => {
          pull.value = e.translationY;
          const step = Math.max(8, stepPx);
          const want = Math.round(-e.translationY / step);
          if (!Number.isFinite(want)) return;
          const delta = want - applied.value;
          if (delta !== 0) {
            applied.value = want;
            runOnJS(onStep)(delta);
          }
        })
        .onFinalize(() => {
          pull.value = withTiming(0, { duration: 200 });
          active.value = withTiming(0, { duration: 200 });
        }),
    [active, applied, enabled, onStep, pull, stepPx],
  );

  return { gesture, pull, active };
}
