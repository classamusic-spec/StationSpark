import { useMemo } from 'react';
import { Gesture, type PanGesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

export interface SweepGesture {
  gesture: PanGesture;
  /** live pointer inside the surface, in screen px relative to the surface */
  x: SharedValue<number>;
  y: SharedValue<number>;
  /** 0 → 1 while a hand is on the food */
  active: SharedValue<number>;
  /** 0 → 1 towards the next pass, so a meter can move while the finger moves */
  partial: SharedValue<number>;
  /** which way the hand is travelling right now: −1 … 1 */
  heading: SharedValue<number>;
}

export interface SweepOptions {
  /** finger travel, in px, that counts as one honest pass */
  passDistance: number;
  /**
   * `'x'` counts side-to-side travel only (rolling a pin, spreading sauce),
   * `'both'` counts any movement at all (kneading, scrubbing).
   */
  axis?: 'x' | 'y' | 'both';
  /** one pass of the hand. `tapped` when the child tapped instead of swiping. */
  onPass: (tapped: boolean) => void;
  enabled?: boolean;
}

/**
 * THE FORGIVING SWEEP — rolling out dough, spreading sauce, kneading.
 *
 * There is no direction to get right, no rhythm to keep and no timing window.
 * The gesture simply adds up how far the hand has travelled: every
 * `passDistance` pixels is one pass, whichever way the child went. Back and
 * forth counts. Small scrubby circles count. A single long swipe counts. A
 * *tap* counts too — that is the accessibility path and the reduced-motion
 * path, and it is always available, so a child who cannot swipe can still cook.
 */
export function useSweepGesture({ passDistance, axis = 'x', onPass, enabled = true }: SweepOptions): SweepGesture {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const active = useSharedValue(0);
  const partial = useSharedValue(0);
  const heading = useSharedValue(0);
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);
  const travel = useSharedValue(0);
  const total = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .minDistance(0)
        .onBegin((e) => {
          x.value = e.x;
          y.value = e.y;
          lastX.value = e.x;
          lastY.value = e.y;
          travel.value = 0;
          total.value = 0;
          active.value = withTiming(1, { duration: 110 });
        })
        .onUpdate((e) => {
          const dx = e.x - lastX.value;
          const dy = e.y - lastY.value;
          lastX.value = e.x;
          lastY.value = e.y;
          x.value = e.x;
          y.value = e.y;
          if (dx !== 0) heading.value = dx > 0 ? 1 : -1;
          const step = axis === 'x' ? Math.abs(dx) : axis === 'y' ? Math.abs(dy) : Math.hypot(dx, dy);
          if (!Number.isFinite(step)) return;
          travel.value += step;
          total.value += step;
          const need = Math.max(1, passDistance);
          while (travel.value >= need) {
            travel.value -= need;
            runOnJS(onPass)(false);
          }
          partial.value = travel.value / need;
        })
        .onEnd(() => {
          // A press that never really moved is a tap: the child asked for one
          // pass without swiping, and that must always work.
          if (total.value < 10) runOnJS(onPass)(true);
        })
        .onFinalize(() => {
          active.value = withTiming(0, { duration: 220 });
          partial.value = 0;
        }),
    [active, axis, enabled, heading, lastX, lastY, onPass, partial, passDistance, total, travel, x, y],
  );

  return { gesture, x, y, active, partial, heading };
}
