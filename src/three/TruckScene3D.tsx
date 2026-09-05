/**
 * The truck turntable — WEB.
 *
 * A transparent canvas over whatever backdrop the screen already paints, with
 * pointer capture on the canvas element for drag-to-rotate. `touch-action:
 * pan-y` means a child can still scroll the page with a finger on the truck
 * while a sideways drag spins it.
 *
 * `TruckScene3D.native.tsx` is the same scene driven by a gesture-handler Pan.
 */
import React, { useMemo } from 'react';
import { useReducedMotion } from '@/hooks';
import { DragController } from './dragControl';
import { Stage } from './Stage';
import type { StagePointerProps } from './stageTypes';
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

  const pointer = useMemo<StagePointerProps>(
    () => ({
      onPointerDown: (e) => {
        drag.begin(e.clientX, e.clientY);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* capture is a nicety; the drag still works without it */
        }
      },
      onPointerMove: (e) => drag.move(e.clientX, e.clientY),
      onPointerUp: (e) => {
        drag.end();
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
      },
      onPointerCancel: () => drag.end(),
      onPointerLeave: () => drag.end(),
    }),
    [drag],
  );

  return (
    <ThreeBoundary
      forceFallback={forceFallback}
      fallback={fallback ?? <TruckFallback style={style} height={height} spinning={spinning} containerStyle={containerStyle} />}
    >
      <Stage height={height} camera={TRUCK_CAMERA} style={containerStyle} pointer={pointer} testID={testID}>
        <TruckSceneContent style={style} spinning={spinning} honk={honk} shine={shine} reduced={reduced} drag={drag} />
      </Stage>
    </ThreeBoundary>
  );
}
