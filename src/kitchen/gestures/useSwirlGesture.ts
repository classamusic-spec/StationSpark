import { useMemo } from 'react';
import { Gesture, type PanGesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

export interface SwirlGesture {
  gesture: PanGesture;
  /** total rotation the hand has stirred, in radians (signed) — spin the art by this */
  spin: SharedValue<number>;
  /** live pointer inside the surface, in px */
  x: SharedValue<number>;
  y: SharedValue<number>;
  active: SharedValue<number>;
}

export interface SwirlOptions {
  /** the middle of the bowl / blender / pot, in the same px space as the touches */
  cx: number;
  cy: number;
  /** how much turning counts as one stir — default a half turn */
  turnRadians?: number;
  /** one stir of the spoon. `tapped` when the child tapped instead of circling. */
  onStir: (tapped: boolean) => void;
  enabled?: boolean;
}

const TAU = Math.PI * 2;

/**
 * THE FORGIVING STIR — a circular drag round a bowl, blender or pot.
 *
 * It measures how far round the middle the hand has travelled, in either
 * direction, and never cares about the radius: a wobbly, lopsided, half-hearted
 * circle stirs exactly as well as a neat one. Scrubbing back and forth across
 * the bowl also racks up turning, so a child who cannot draw a circle still
 * mixes the batter. A tap is one stir, always.
 */
export function useSwirlGesture({ cx, cy, turnRadians = Math.PI, onStir, enabled = true }: SwirlOptions): SwirlGesture {
  const spin = useSharedValue(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const active = useSharedValue(0);
  const last = useSharedValue(0);
  const turned = useSharedValue(0);
  const total = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .minDistance(0)
        .onBegin((e) => {
          x.value = e.x;
          y.value = e.y;
          last.value = Math.atan2(e.y - cy, e.x - cx);
          turned.value = 0;
          total.value = 0;
          active.value = withTiming(1, { duration: 110 });
        })
        .onUpdate((e) => {
          x.value = e.x;
          y.value = e.y;
          const a = Math.atan2(e.y - cy, e.x - cx);
          let d = a - last.value;
          // shortest way round, so crossing 12 o'clock is not a huge jump
          if (d > Math.PI) d -= TAU;
          if (d < -Math.PI) d += TAU;
          last.value = a;
          if (!Number.isFinite(d)) return;
          spin.value += d;
          turned.value += Math.abs(d);
          total.value += Math.abs(d);
          const need = Math.max(0.4, turnRadians);
          while (turned.value >= need) {
            turned.value -= need;
            runOnJS(onStir)(false);
          }
        })
        .onEnd(() => {
          if (total.value < 0.12) runOnJS(onStir)(true);
        })
        .onFinalize(() => {
          active.value = withTiming(0, { duration: 240 });
        }),
    [active, cx, cy, enabled, last, onStir, spin, total, turnRadians, turned, x, y],
  );

  return { gesture, spin, x, y, active };
}
