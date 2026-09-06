/**
 * ONE PROJECTION, TWO RENDERERS.
 *
 * The 3D road and the 2D fallback have to agree about where a cone is, and the
 * gate labels — which are real `@/ui` `<Text>` in an overlay, because a child
 * has to be able to read them in the app's own font — have to land exactly on
 * the gate banners in *both*.
 *
 * So the camera is deliberately the simplest one that can exist: it sits above
 * the road, level, looking straight down it, with no pitch and no roll. That
 * makes the screen position of a point a plain pinhole projection, which this
 * module computes in ordinary JavaScript:
 *
 *     x = w/2 + X · f / d          f = (h/2) / tan(fov/2)
 *     y = h/2 + (camY − Y) · f / d d = how far in front of the camera
 *
 * The 3D scene sets its camera from the same constants, so the two agree to the
 * pixel. The jolt after a bump shakes the whole play area (canvas *and*
 * overlay), never the camera, so they can never drift apart.
 */

export const CAMERA = {
  /** how high above the tarmac the camera floats, in road units */
  height: 5.2,
  /** how far behind the truck it sits */
  back: 13,
  /** vertical field of view, degrees */
  fov: 52,
  near: 0.5,
  far: 140,
} as const;

/** Road units between two lane centres (the truck is 1.84 wide). */
export const LANE_WIDTH = 3;
/** Half the tarmac, shoulders included. */
export const ROAD_HALF = LANE_WIDTH * 1.5 + 0.7;

export interface Viewport {
  w: number;
  h: number;
}

export interface Projected {
  x: number;
  y: number;
  /** pixels per road unit at this distance */
  scale: number;
  /** how far in front of the camera, in road units */
  depth: number;
}

/** Focal length in pixels. */
export const focal = (vp: Viewport): number => vp.h / 2 / Math.tan((CAMERA.fov * Math.PI) / 360);

/** Where lane centre `lane` sits, in road units, left of centre being negative. */
export const laneX = (lane: number): number => (lane - 1) * LANE_WIDTH;

/**
 * Screen position of a point on (or above) the road.
 *
 * @param lane   continuous lane position, 0 … 2
 * @param ahead  road units in front of the truck (0 = level with it)
 * @param height road units above the tarmac
 */
export function project(vp: Viewport, lane: number, ahead: number, height = 0): Projected {
  const depth = Math.max(0.5, ahead + CAMERA.back);
  const scale = focal(vp) / depth;
  return {
    x: vp.w / 2 + laneX(lane) * scale,
    y: vp.h / 2 + (CAMERA.height - height) * scale,
    scale,
    depth,
  };
}

/** The vanishing line: everything far away converges here. */
export const horizonY = (vp: Viewport): number => vp.h / 2;

/** Half the road's width in pixels at `ahead`. */
export const roadHalfPx = (vp: Viewport, ahead: number): number => ROAD_HALF * project(vp, 1, ahead).scale;
