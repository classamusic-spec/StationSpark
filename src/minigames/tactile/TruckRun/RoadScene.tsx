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
 *     in the 2D road mid-run and the child finishes the same drive.
 *
 * Both roads are fed by the same sim, so the swap costs nothing but paint.
 */
import React, { Suspense, lazy } from 'react';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';
import type { TruckStyle } from '@/state/store';
import { ThreeBoundary } from '@/three/ThreeBoundary';
import type { RunFrame } from './run';
import { RoadView2D } from './RoadView2D';

/**
 * Can this browser actually give us a 3D context?
 *
 * `ThreeBoundary` is the safety net for a context that dies *later*, but it
 * cannot catch this case: three's renderer throws while the canvas is being set
 * up, outside React's render phase, and the boundary never trips — the child is
 * left looking at an empty canvas with the road missing. So we ask the question
 * up front, once, before the canvas is ever mounted. On native `expo-gl`
 * provides the context and there is nothing to probe.
 */
function probeWebGL(): boolean {
  if (process.env.NODE_ENV === 'test') return false; // Jest must never load `three`
  if (Platform.OS !== 'web') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const GL_AVAILABLE = probeWebGL();

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
    <ThreeBoundary forceFallback={forceFallback || !GL_AVAILABLE} fallback={flat}>
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
