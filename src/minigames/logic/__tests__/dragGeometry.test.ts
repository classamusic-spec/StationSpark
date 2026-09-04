import {
  distanceToCenter,
  findSlotAt,
  nearestSlot,
  pickDropSlot,
  rectCenter,
  rectContains,
  snapDelta,
  type SlotRect,
} from '../shared/dragGeometry';

const slot = (id: string, x: number, y: number, extra: Partial<SlotRect> = {}): SlotRect => ({
  id,
  x,
  y,
  width: 60,
  height: 60,
  enabled: true,
  ...extra,
});

describe('drag geometry', () => {
  it('finds the centre and containment of a rect', () => {
    const r = { x: 10, y: 20, width: 40, height: 60 };
    expect(rectCenter(r)).toEqual({ x: 30, y: 50 });
    expect(rectContains(r, 30, 50)).toBe(true);
    expect(rectContains(r, 9, 50)).toBe(false);
    expect(rectContains(r, 9, 50, 4)).toBe(true);
  });

  it('picks the top-most slot under the finger', () => {
    const slots = [slot('a', 0, 0), slot('b', 40, 40)];
    // overlapping region → later slot wins (drawn on top)
    expect(findSlotAt(slots, 50, 50)?.id).toBe('b');
    expect(findSlotAt(slots, 10, 10)?.id).toBe('a');
    expect(findSlotAt(slots, 500, 500)).toBeNull();
  });

  it('respects groups and disabled slots', () => {
    const slots = [slot('a', 0, 0, { group: 'hose' }), slot('b', 0, 0, { group: 'cone' })];
    expect(findSlotAt(slots, 10, 10, 'hose')?.id).toBe('a');
    expect(findSlotAt(slots, 10, 10, 'cone')?.id).toBe('b');
    expect(findSlotAt(slots, 10, 10, 'ladder')).toBeNull();
    const off = [slot('a', 0, 0, { enabled: false })];
    expect(findSlotAt(off, 10, 10)).toBeNull();
  });

  it('falls back to the nearest slot within the snap radius', () => {
    const slots = [slot('a', 0, 0), slot('b', 200, 0)];
    expect(distanceToCenter(slots[0]!, 30, 30)).toBe(0);
    expect(pickDropSlot(slots, 100, 30)).toBeNull();
    expect(pickDropSlot(slots, 100, 30, undefined, 80)?.id).toBe('a');
    expect(nearestSlot(slots, 205, 30, 80)?.id).toBe('b');
    expect(nearestSlot(slots, 900, 900, 80)).toBeNull();
  });

  it('computes the snap offset between two rects', () => {
    expect(snapDelta({ x: 0, y: 0, width: 20, height: 20 }, { x: 100, y: 50, width: 40, height: 40 })).toEqual({
      x: 110,
      y: 60,
    });
  });
});
