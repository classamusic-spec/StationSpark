/**
 * Pure geometry for the Build-the-Barrier safety ring. No React, no theme —
 * unit tested in `src/minigames/tactile/__tests__/facadeLayout.test.ts`.
 */

export interface RingSlot {
  index: number;
  x: number;
  y: number;
  /** degrees, tangent to the ring */
  angle: number;
}

/** Positions `total` evenly spaced slots around a circle, starting at the top. */
export function ringSlots(cx: number, cy: number, radius: number, total: number): RingSlot[] {
  const n = Math.max(1, Math.round(total));
  const out: RingSlot[] = [];
  for (let i = 0; i < n; i += 1) {
    const theta = (i / n) * Math.PI * 2 - Math.PI / 2;
    out.push({
      index: i,
      x: cx + Math.cos(theta) * radius,
      y: cy + Math.sin(theta) * radius,
      angle: (theta * 180) / Math.PI + 90,
    });
  }
  return out;
}
