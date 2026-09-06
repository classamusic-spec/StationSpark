/**
 * TRUCK RUN — the 3D entry point.
 *
 * One file for both platforms: `./Stage` resolves to the DOM canvas on web and
 * to the `expo-gl` canvas on native, and this scene needs no drag on the canvas
 * (steering is a gesture layer above it), so there is nothing platform-specific
 * left to split.
 *
 * The caller decides what happens if GL is missing: the game wraps this in a
 * `ThreeBoundary` whose fallback is the 2D road, which plays exactly the same
 * run. See `src/minigames/tactile/TruckRun/RoadScene.tsx`.
 */
import React, { memo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { TruckStyle } from '@/state/store';
import type { RunFrame } from '@/minigames/tactile/TruckRun/run';
import { CAMERA } from '@/minigames/tactile/TruckRun/projection';
import { Stage } from './Stage';
import { TruckRunRoad } from './TruckRunRoad';

export interface TruckRunScene3DProps {
  /** the live sim, sampled once per drawn frame — never through React state */
  sample: () => RunFrame;
  /** the child's own engine, from `selectTruck` */
  truck: TruckStyle;
  height: number;
  reduced?: boolean;
  /** the run's scene — which corner of Spark City the street is dressed as */
  scene?: string;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Level, on the road's centre line: `projection.ts` assumes exactly this. The
 * field of view is only a starting value — `TruckRunRoad` sets the real one
 * from the canvas size, because on a tall phone the road, not the height, is
 * what has to fit.
 */
const TRUCK_RUN_CAMERA = { position: [0, CAMERA.height, 0] as [number, number, number], fov: CAMERA.maxFov };

export const TruckRunScene3D = memo(function TruckRunScene3D({
  sample,
  truck,
  height,
  reduced,
  scene,
  containerStyle,
  testID,
}: TruckRunScene3DProps) {
  return (
    <Stage height={height} camera={TRUCK_RUN_CAMERA} style={containerStyle} touchAction="none" testID={testID}>
      <TruckRunRoad sample={sample} truck={truck} reduced={reduced} scene={scene} />
    </Stage>
  );
});

export default TruckRunScene3D;
