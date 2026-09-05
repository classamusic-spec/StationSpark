/**
 * The truck turntable — NATIVE (iOS / Android).
 *
 * Identical scene to the web file; only the input differs. A gesture-handler
 * `Pan` feeds the same `DragController`, with `activeOffsetX` so a vertical
 * swipe still scrolls the Garage list and only a sideways drag takes over the
 * turntable. The callbacks run on the JS thread (`runOnJS`) because that is
 * where the GL frame loop already lives — no worklet hop, no bridge chatter.
 */
import React, { useMemo } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useReducedMotion } from '@/hooks';
import { DragController } from './dragControl';
import { Stage } from './Stage';
import { ThreeBoundary } from './ThreeBoundary';
import { TruckFallback } from './TruckFallback';
import { TRUCK_CAMERA, TruckSceneContent } from './TruckSceneContent';
import type { TruckScene3DProps } from './truckSceneProps';

export function TruckScene3D({
  style,
  spinning,
  honk,
  shine,
  height = 300,
  fallback,
  forceFallback,
  containerStyle,
  testID,
}: TruckScene3DProps) {
  const reduced = useReducedMotion();
  const drag = useMemo(() => new DragController(), []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .activeOffsetX([-8, 8])
        .onBegin((e) => drag.begin(e.x, e.y))
        .onUpdate((e) => drag.move(e.x, e.y))
        .onFinalize(() => drag.end()),
    [drag],
  );

  return (
    <ThreeBoundary
      forceFallback={forceFallback}
      fallback={fallback ?? <TruckFallback style={style} height={height} spinning={spinning} containerStyle={containerStyle} />}
    >
      <GestureDetector gesture={pan}>
        <Stage height={height} camera={TRUCK_CAMERA} style={containerStyle} testID={testID}>
          <TruckSceneContent style={style} spinning={spinning} honk={honk} shine={shine} reduced={reduced} drag={drag} />
        </Stage>
      </GestureDetector>
    </ThreeBoundary>
  );
}
