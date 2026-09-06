/**
 * WHICH ROAD THE CHILD GETS.
 *
 * The 3D road is loaded lazily and behind a boundary, exactly like the badge
 * flip in `CelebrationOverlay`:
 *
 *   - Jest never loads `three` (docs/THREE.md), so the tests take the 2D road;
 *   - no route pays ~600 KB at first paint just because the registry mentions
 *     this game — the chunk is fetched when the child actually starts driving;
 *   - if WebGL is missing, blocked, or the context is lost, the boundary swaps
 *     in the 2D road and the child finishes the same drive.
 *
 * The "missing" case used to need its own probe here, because three throws
 * during canvas setup where an error boundary cannot see it. That probe now
 * lives in `ThreeBoundary` itself (`@/three/webgl`), so the Garage turntable
 * and the badge flip are covered by it too rather than only the road.
 *
 * Both roads are fed by the same sim, so the swap costs nothing but paint.
 */
import React, { Suspense, lazy } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import type { TruckStyle } from '@/state/store';
import { ThreeBoundary } from '@/three/ThreeBoundary';
import type { RunFrame } from './run';
import { RoadView2D } from './RoadView2D';

const LazyRoad3D = lazy(async () => {
  const mod = await import('@/three/TruckRunScene3D');
  return { default: mod.TruckRunScene3D };
});

export interface RoadSceneProps {
  /** the live sim, sampled once per drawn frame */
  sample: () => RunFrame;
  /** the throttled copy React draws the 2D road from */
  frame: RunFrame;
  truck: TruckStyle;
  width: number;
  height: number;
  reduced: boolean;
  /** QA / dev: take the 2D road even where GL works */
  forceFallback?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function RoadScene({ sample, frame, truck, width, height, reduced, forceFallback, containerStyle }: RoadSceneProps) {
  const flat = <RoadView2D frame={frame} truck={truck} width={width} height={height} reduced={reduced} />;
  return (
    <ThreeBoundary forceFallback={forceFallback} fallback={flat}>
      <Suspense fallback={flat}>
        <LazyRoad3D
          sample={sample}
          truck={truck}
          height={height}
          reduced={reduced}
          containerStyle={containerStyle}
          testID="truck-run-canvas"
        />
      </Suspense>
    </ThreeBoundary>
  );
}
