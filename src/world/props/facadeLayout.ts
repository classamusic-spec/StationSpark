/**
 * Pure layout maths for a town building façade (Hose Hero and friends).
 *
 * The art is drawn from a "wall unit" grid so every scene scales the same way
 * from phones to tablets: the caller hands us the play-area box, we hand back
 * pixel rects for the roof, sign, door and every window.
 *
 * No React, no side effects — unit tested in
 * `src/minigames/tactile/__tests__/facadeLayout.test.ts`.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WindowRect extends Rect {
  index: number;
  row: number;
  col: number;
  /** centre point — used for aiming / hit tests */
  cx: number;
  cy: number;
}

export interface FacadeLayout {
  /** the whole building (roof + body) */
  box: Rect;
  /** roof band across the top of the building */
  roof: Rect;
  /** the wall under the roof */
  body: Rect;
  /** shop sign plate sitting on the roof band */
  sign: Rect;
  /** front door at the bottom middle of the wall */
  door: Rect;
  windows: WindowRect[];
  /** y of the pavement line the building stands on */
  groundY: number;
  /** one wall unit in px — use it for stroke widths / corner radii */
  u: number;
}

/** Design grid, in wall units. */
const PAD = 1.05;
const WIN_W = 3.3;
const WIN_H = 3.45;
const GAP_X = 0.95;
const GAP_Y = 1.05;
const ROOF = 0.17; // × building width
const DOOR_W = 3.7;
const DOOR_H = 4.3;
const SILL = 0.85; // gap between the window grid and the door

export interface FacadeLayoutOptions {
  /** hard cap so the building never balloons on a tablet */
  maxWidth?: number;
  /** share of the area height kept for the pavement/foreground */
  groundRatio?: number;
}

export function facadeLayout(
  grid: { rows: number; cols: number },
  area: { w: number; h: number },
  options: FacadeLayoutOptions = {},
): FacadeLayout {
  const rows = Math.max(1, Math.round(grid.rows));
  const cols = Math.max(1, Math.round(grid.cols));
  const areaW = Math.max(1, area.w);
  const areaH = Math.max(1, area.h);
  const groundRatio = options.groundRatio ?? 0.14;
  const maxWidth = Math.min(options.maxWidth ?? 560, areaW * 0.94);

  const widthUnits = PAD * 2 + cols * WIN_W + (cols - 1) * GAP_X;
  const roofUnits = widthUnits * ROOF;
  const bodyUnits = PAD + rows * WIN_H + (rows - 1) * GAP_Y + SILL + DOOR_H;
  const heightUnits = roofUnits + bodyUnits;

  const availH = areaH * (1 - groundRatio);
  const u = Math.max(1, Math.min(maxWidth / widthUnits, availH / heightUnits));

  const boxW = widthUnits * u;
  const boxH = heightUnits * u;
  const baseY = Math.max(boxH, areaH * (1 - groundRatio * 0.62));
  const boxX = (areaW - boxW) / 2;
  const boxY = Math.max(0, baseY - boxH);

  const roofH = roofUnits * u;
  const roof: Rect = { x: boxX, y: boxY, w: boxW, h: roofH };
  const body: Rect = { x: boxX, y: boxY + roofH, w: boxW, h: boxH - roofH };

  const sign: Rect = {
    x: boxX + boxW * 0.2,
    y: boxY + roofH * 0.26,
    w: boxW * 0.6,
    h: roofH * 0.78,
  };

  const winW = WIN_W * u;
  const winH = WIN_H * u;
  const gapX = GAP_X * u;
  const gapY = GAP_Y * u;
  const gridX = boxX + PAD * u;
  const gridY = body.y + PAD * u * 0.6;

  const windows: WindowRect[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = gridX + col * (winW + gapX);
      const y = gridY + row * (winH + gapY);
      windows.push({
        index: row * cols + col,
        row,
        col,
        x,
        y,
        w: winW,
        h: winH,
        cx: x + winW / 2,
        cy: y + winH / 2,
      });
    }
  }

  const doorW = DOOR_W * u;
  const doorH = DOOR_H * u;
  const door: Rect = {
    x: boxX + (boxW - doorW) / 2,
    y: body.y + body.h - doorH,
    w: doorW,
    h: doorH,
  };

  return { box: { x: boxX, y: boxY, w: boxW, h: boxH }, roof, body, sign, door, windows, groundY: baseY, u };
}

/** Nearest window to a point, or `null` when the point is further than `radius`. */
export function windowAt(windows: readonly WindowRect[], x: number, y: number, radius: number): WindowRect | null {
  let best: WindowRect | null = null;
  let bestD = radius * radius;
  for (const w of windows) {
    const dx = w.cx - x;
    const dy = w.cy - y;
    const d = dx * dx + dy * dy;
    if (d <= bestD) {
      bestD = d;
      best = w;
    }
  }
  return best;
}
