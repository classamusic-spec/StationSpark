/**
 * Station Spark's 3D layer — the eager barrel.
 *
 * ⚠️ **Screens must not import this file.** Everything here reaches `three`, so
 * a single eager import anywhere in `app/` or `src/screens` puts ~600 KB of
 * renderer on the first paint of every route (the web build is one page).
 * Import `@/three/lazy` instead: `<LazyTruckScene3D/>` and `<LazyBadge3D/>` are
 * the same two components behind a `lazy()` chunk, a `ThreeBoundary` and the 2D
 * fallback. This barrel is for code that is already inside a canvas.
 *
 * Nothing under `src/three` is loaded by Jest — see docs/THREE.md.
 *
 * Two entry points, both self-contained (canvas + lights + error boundary +
 * 2D fallback), both honouring `useReducedMotion()`:
 *
 *   <TruckScene3D
 *     style={truck}          // TruckStyle from the store: colour/decal/lights/horn
 *     spinning                // wheels turn
 *     honk={honkCount}        // increment → squash-and-bounce
 *     shine={0..1}            // wash shine: emissive lift + sparkles
 *     height={300}            // canvas height; width fills the parent
 *     forceFallback           // render the SVG truck instead (QA)
 *   />
 *
 *   <Badge3D
 *     color={def.color}       // same contract as <BadgeArt/>
 *     icon={def.icon}         // 'flame' | 'star' | 'chef-hat' | 'ladder' | 'hose'
 *                             // | 'book' | 'map' | 'heart' | 'cat' | 'pizza'
 *                             // | 'clock' | 'numbers'  (others fall back to a star)
 *     size={104}              // width in px; the canvas is size × 1.3
 *     flipKey={n}             // bump → 720° flip + sparkle burst
 *   />
 */
export { TruckScene3D } from './TruckScene3D';
export type { TruckScene3DProps } from './truckSceneProps';
export { TruckSceneContent, TRUCK_CAMERA } from './TruckSceneContent';
export { TruckModel, TRUCK_BOX } from './TruckModel';
export type { TruckModelProps } from './TruckModel';
export { TruckFallback } from './TruckFallback';

export { Badge3D, Badge3DContent, badge3DIcons } from './Badge3D';
export type { Badge3DProps, Badge3DContentProps, Badge3DIcon } from './Badge3D';

export { Stage } from './Stage';
export type { StageProps, StageCamera, StagePointerProps } from './stageTypes';
export { ThreeBoundary } from './ThreeBoundary';
export type { ThreeBoundaryProps } from './ThreeBoundary';
export { DragController } from './dragControl';
export { truckTones, decalTones, trim as truckTrim } from './palette3d';
