/**
 * DRAG GEOMETRY — pure, worklet-safe hit testing for the drag-to-slot system.
 *
 * Every rectangle here is expressed in ARENA coordinates (see DragArena):
 * the top-left of the mini-game's play area is (0, 0). Keeping the maths pure
 * means the drop rules are unit-testable and identical on the UI thread and
 * the JS thread.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SlotRect extends Rect {
  id: string;
  /** slots only accept draggables from the same group (undefined = any) */
  group?: string;
  enabled: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export function rectCenter(r: Rect): Point {
  'worklet';
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

export function rectContains(r: Rect, x: number, y: number, pad = 0): boolean {
  'worklet';
  return x >= r.x - pad && x <= r.x + r.width + pad && y >= r.y - pad && y <= r.y + r.height + pad;
}

/** Squared distance from a point to a rect's centre (cheap ordering metric). */
export function distanceToCenter(r: Rect, x: number, y: number): number {
  'worklet';
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const dx = cx - x;
  const dy = cy - y;
  return Math.sqrt(dx * dx + dy * dy);
}

function accepts(slot: SlotRect, group: string | undefined): boolean {
  'worklet';
  if (!slot.enabled) return false;
  if (group === undefined) return true;
  if (slot.group === undefined) return true;
  return slot.group === group;
}

/** The last (top-most) enabled slot whose padded rect contains the point. */
export function findSlotAt(
  slots: readonly SlotRect[],
  x: number,
  y: number,
  group?: string,
  pad = 0,
): SlotRect | null {
  'worklet';
  let found: SlotRect | null = null;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot) continue;
    if (!accepts(slot, group)) continue;
    if (rectContains(slot, x, y, pad)) found = slot;
  }
  return found;
}

/** Closest enabled slot whose centre is within `maxDistance` of the point. */
export function nearestSlot(
  slots: readonly SlotRect[],
  x: number,
  y: number,
  maxDistance: number,
  group?: string,
): SlotRect | null {
  'worklet';
  let best: SlotRect | null = null;
  let bestD = maxDistance;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot) continue;
    if (!accepts(slot, group)) continue;
    const d = distanceToCenter(slot, x, y);
    if (d <= bestD) {
      bestD = d;
      best = slot;
    }
  }
  return best;
}

/**
 * The slot a released draggable should land in: the one under the finger,
 * otherwise the nearest one within `snapRadius` (forgiving for small hands).
 */
export function pickDropSlot(
  slots: readonly SlotRect[],
  x: number,
  y: number,
  group?: string,
  snapRadius = 0,
): SlotRect | null {
  'worklet';
  const under = findSlotAt(slots, x, y, group, 0);
  if (under) return under;
  if (snapRadius <= 0) return null;
  return nearestSlot(slots, x, y, snapRadius, group);
}

/** Offset that moves `from`'s centre onto `to`'s centre. */
export function snapDelta(from: Rect, to: Rect): Point {
  'worklet';
  return {
    x: to.x + to.width / 2 - (from.x + from.width / 2),
    y: to.y + to.height / 2 - (from.y + from.height / 2),
  };
}
