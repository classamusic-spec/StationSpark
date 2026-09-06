/**
 * ONE PROJECTION, TWO RENDERERS.
 *
 * The 3D road and the 2D fallback have to agree about where a cone is, and the
 * gate labels — which are real `@/ui` `<Text>` in an overlay, because a child
 * has to read them in the app's own font — have to land exactly on the gate
 * banners in *both*.
 *
 * So the camera is deliberately the simplest one that can exist: level, looking
 * straight down the road, no pitch and no roll. That makes the screen position
 * of a point a plain pinhole projection, computed here in ordinary JavaScript:
 *
 *     x = w/2 + (X − camX) · f / d      d = road units in front of the camera
 *     y = h/2 + (camY − Y) · f / d
 *
 * The 3D scene takes its focal length, field of view and lateral position from
 * the very same functions, so the two agree to the pixel. The jolt after a bump
 * shakes the whole play area — canvas *and* overlay — never the camera, so they
 * can never drift apart.
 */

export const CAMERA = {
  /** how high above the tarmac the camera floats, in road units */
  height: 5,
  /** how far behind the truck it sits */
  back: 13,
  /** the widest field of view it will ever use, degrees */
  maxFov: 56,
  /** how much of the truck's lane change the camera follows (0 = fixed) */
  follow: 0.62,
  near: 0.5,
  far: 150,
} as const;

/** Road units between two lane centres (the truck is 1.84 wide). */
export const LANE_WIDTH = 3;
/** Half the tarmac, shoulders included. */
export const ROAD_HALF = LANE_WIDTH * 1.5 + 0.7;
/** How much wider than the screen the tarmac reads where the truck is. */
const ROAD_FIT = 1.12;

export interface Viewport {
  w: number;
  h: number;
}

/**
 * A viewport plus where the camera is looking from — build one per frame and
 * hand it to `project`.
 */
export interface RoadView extends Viewport {
  /** focal length in pixels */
  f: number;
  /** the camera's own lane offset, in road units */
  camX: number;
}

export interface Projected {
  x: number;
  y: number;
  /** pixels per road unit at this distance */
  scale: number;
  /** how far in front of the camera, in road units */
  depth: number;
}

/** Where lane centre `lane` sits, in road units, left of centre being negative. */
export const laneX = (lane: number): number => (lane - 1) * LANE_WIDTH;

/**
 * Focal length in pixels.
 *
 * A phone play area is far taller than it is wide, so a fixed field of view
 * would make one lane fill the screen. The road is what has to fit, so the
 * focal length is whichever is *smaller*: the widest field of view we allow, or
 * the one that puts the tarmac's edges just past the screen at the truck.
 */
export function focal(vp: Viewport): number {
  const byFov = vp.h / 2 / Math.tan((CAMERA.maxFov * Math.PI) / 360);
  const byWidth = ((vp.w / 2) * ROAD_FIT * CAMERA.back) / ROAD_HALF;
  return Math.max(1, Math.min(byFov, byWidth));
}

/** The vertical field of view, in degrees, that matches `focal(vp)`. */
export const fovFor = (vp: Viewport): number => (Math.atan(vp.h / 2 / focal(vp)) * 360) / Math.PI;

/** Where the camera sits laterally when the truck is in `truckLane`. */
export const cameraX = (truckLane: number): number => laneX(truckLane) * CAMERA.follow;

/** The view for one frame: the play area, plus the camera the truck has pulled along. */
export const roadView = (vp: Viewport, truckLane: number): RoadView => ({
  w: vp.w,
  h: vp.h,
  f: focal(vp),
  camX: cameraX(truckLane),
});

/**
 * Screen position of a point on (or above) the road.
 *
 * @param lane   continuous lane position, 0 … 2
 * @param ahead  road units in front of the truck (0 = level with it)
 * @param height road units above the tarmac
 */
export function project(view: RoadView, lane: number, ahead: number, height = 0): Projected {
  const depth = Math.max(0.5, ahead + CAMERA.back);
  const scale = view.f / depth;
  return {
    x: view.w / 2 + (laneX(lane) - view.camX) * scale,
    y: view.h / 2 + (CAMERA.height - height) * scale,
    scale,
    depth,
  };
}

/** The vanishing line: everything far away converges here. */
export const horizonY = (vp: Viewport): number => vp.h / 2;
