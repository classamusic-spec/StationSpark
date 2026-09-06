import { useMemo } from 'react';
import { Gesture, type PanGesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

export interface Stroke {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** length of the stroke in px */
  length: number;
  /** true when the child tapped rather than swiped */
  tapped: boolean;
}

export interface StrokeGesture {
  gesture: PanGesture;
  /** where the stroke started, in px inside the surface */
  x0: SharedValue<number>;
  y0: SharedValue<number>;
  /** where the hand is now */
  x: SharedValue<number>;
  y: SharedValue<number>;
  active: SharedValue<number>;
}

export interface StrokeOptions {
  /** a completed knife stroke */
  onStroke: (stroke: Stroke) => void;
  /** shorter than this and the stroke counts as a tap, not a cut */
  tapSlop?: number;
  enabled?: boolean;
}

/**
 * THE KNIFE STROKE — one straight swipe across the food.
 *
 * The gesture reports where the hand went in and where it came out, and leaves
 * every decision about *what* that cut means to the game (which can then be as
 * generous as it likes about lining the stroke up with a cut line). A press
 * that never travelled comes back as `tapped`, which every caller treats as
 * "cut the next thing for me" — so the knife always works, even one-fingered.
 */
export function useStrokeGesture({ onStroke, tapSlop = 16, enabled = true }: StrokeOptions): StrokeGesture {
  const x0 = useSharedValue(0);
  const y0 = useSharedValue(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const active = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .minDistance(0)
        .onBegin((e) => {
          x0.value = e.x;
          y0.value = e.y;
          x.value = e.x;
          y.value = e.y;
          active.value = withTiming(1, { duration: 90 });
        })
        .onUpdate((e) => {
          x.value = e.x;
          y.value = e.y;
        })
        .onEnd((e) => {
          const dx = e.x - x0.value;
          const dy = e.y - y0.value;
          const length = Math.hypot(dx, dy);
          runOnJS(onStroke)({
            x0: x0.value,
            y0: y0.value,
            x1: e.x,
            y1: e.y,
            length,
            tapped: length < tapSlop,
          });
        })
        .onFinalize(() => {
          active.value = withTiming(0, { duration: 180 });
        }),
    [active, enabled, onStroke, tapSlop, x, x0, y, y0],
  );

  return { gesture, x0, y0, x, y, active };
}
