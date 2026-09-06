/**
 * THE DOORS INTO THE 3D LAYER — free of `three`.
 *
 * Importing `@/three` pulls the renderer (~600 KB min) into whatever bundle the
 * importer lands in, and the web build is a single page: one eager import
 * anywhere in `app/` puts three on the first-paint path for every route,
 * including the ones that never show a canvas. That is exactly what happened —
 * the Garage imported `@/three` at the top of the file and the road's careful
 * lazy loading bought nothing, because three was already in the entry chunk.
 *
 * So the rule is now mechanical rather than remembered: **screens import from
 * here, never from `@/three`**. These two components are the same pattern
 * `src/minigames/tactile/TruckRun/RoadScene.tsx` uses for the road —
 *
 *   - `lazy()` so the renderer is a chunk fetched when a canvas is really
 *     wanted, not a cost every route pays at first paint;
 *   - inside a `ThreeBoundary`, which starts already tripped when there is no
 *     GL context (`webgl.ts`), because three throws during canvas setup where
 *     an error boundary cannot see it;
 *   - with the 2D art as *both* the boundary fallback and the `<Suspense>`
 *     fallback, so the child sees their truck (or their badge) immediately and
 *     keeps it if the chunk or the context never arrives.
 *
 * Because the boundary renders its fallback without ever mounting the children,
 * a device with no WebGL — and Jest, where `WEBGL_AVAILABLE` is false — never
 * even fires the dynamic import. Nothing under `src/three` reaches a test.
 */
import React, { Suspense, lazy } from 'react';
import { palette } from '@/theme';
import { BadgeArt } from '@/ui/kit/BadgeArt';
import { toBadge3DIcon } from './badgeIcons';
import { ThreeBoundary } from './ThreeBoundary';
import { TruckFallback } from './TruckFallback';
import type { Badge3DProps } from './Badge3D';
import type { TruckScene3DProps } from './truckSceneProps';

const TruckScene3D = lazy(async () => {
  const mod = await import('./TruckScene3D');
  return { default: mod.TruckScene3D };
});

const Badge3D = lazy(async () => {
  const mod = await import('./Badge3D');
  return { default: mod.Badge3D };
});

/**
 * The truck turntable — drag to rotate, honk, wash — with the SVG `<FireTruck/>`
 * standing in until (or unless) the canvas arrives. Same props as
 * `<TruckScene3D/>`; see `truckSceneProps.ts`.
 */
export function LazyTruckScene3D({ fallback, forceFallback, ...props }: TruckScene3DProps) {
  const flat = fallback ?? (
    <TruckFallback style={props.style} height={props.height ?? 300} spinning={props.spinning} containerStyle={props.containerStyle} />
  );
  return (
    <ThreeBoundary forceFallback={forceFallback} fallback={flat}>
      <Suspense fallback={flat}>
        <TruckScene3D {...props} />
      </Suspense>
    </ThreeBoundary>
  );
}

export interface LazyBadge3DProps extends Badge3DProps {
  /** override the 2D badge — `CelebrationOverlay` passes its own flipping SVG */
  fallback?: React.ReactNode;
}

/**
 * The badge as a real medal, with `<BadgeArt/>` (or whatever 2D badge the caller
 * hands us) in its place until the canvas arrives. Earning a badge can never be
 * the thing that breaks.
 */
export function LazyBadge3D({ fallback, forceFallback, ...props }: LazyBadge3DProps) {
  const { color = palette.engineRed, icon, size = 104 } = props;
  const flat = fallback ?? <BadgeArt color={color} icon={toBadge3DIcon(icon)} size={size} />;
  return (
    <ThreeBoundary forceFallback={forceFallback} fallback={flat}>
      <Suspense fallback={flat}>
        <Badge3D {...props} />
      </Suspense>
    </ThreeBoundary>
  );
}
