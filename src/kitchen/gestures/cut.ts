import { TAU, type Pt } from '../fractionMath';

/**
 * Angle of a knife stroke in the pizza's convention (0 = up, clockwise),
 * folded onto a half turn because a line drawn either way is the same cut.
 */
export function strokeAngle(from: Pt, to: Pt): number {
  const a = Math.atan2(to.x - from.x, from.y - to.y);
  const half = Math.PI;
  const m = a % half;
  return m < 0 ? m + half : m;
}

/** Smallest gap between two angles that are only defined up to a half turn. */
export function halfTurnGap(a: number, b: number): number {
  const half = Math.PI;
  const d = Math.abs(((a - b) % half) + half) % half;
  return Math.min(d, half - d);
}

/**
 * WHICH CUT DID THE CHILD MEAN?
 *
 * `matchCutLine` in fractionMath is strict: the stroke has to run end to end
 * along a diameter. That is the right rule for a grown-up's aim and a terrible
 * one for a five-year-old's, who cuts a short confident line somewhere across
 * the middle and expects the pizza to fall apart.
 *
 * So: any stroke long enough to be deliberate picks the *nearest cut still to
 * be made*, by angle alone. A stroke that is 40° out from every line still
 * cuts — just the line it was closest to. Nothing here can fail; the caller
 * only has to decide whether the stroke was long enough to mean anything.
 */
export function chooseCutLine(
  from: Pt,
  to: Pt,
  angles: readonly number[],
  done: readonly boolean[],
): number | null {
  const pending = angles.map((angle, index) => ({ angle, index })).filter((a) => !done[a.index]);
  if (pending.length === 0) return null;
  const first = pending[0];
  if (!first) return null;
  const wanted = strokeAngle(from, to);
  let best = first;
  let bestGap = halfTurnGap(first.angle, wanted);
  for (const line of pending) {
    const gap = halfTurnGap(line.angle, wanted);
    if (gap < bestGap) {
      bestGap = gap;
      best = line;
    }
  }
  return best.index;
}

/** The next cut still to be made, for the tap path and for Captain Bea's help. */
export function nextCut(done: readonly boolean[]): number {
  return done.findIndex((c) => !c);
}

/** How far round the pizza a cut line points, for drawing the guide arrows. */
export function cutDirection(angle: number): Pt {
  const a = ((angle % TAU) + TAU) % TAU;
  return { x: Math.sin(a), y: -Math.cos(a) };
}
