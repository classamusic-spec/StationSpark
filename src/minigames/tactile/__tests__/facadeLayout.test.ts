import { facadeLayout, windowAt } from '@/world/props/facadeLayout';
import { ringSlots } from '@/world/props/ringLayout';

const boxes = [
  { w: 320, h: 480 }, // small phone
  { w: 390, h: 700 }, // design box
  { w: 430, h: 900 }, // large phone
  { w: 834, h: 1000 }, // tablet
  { w: 900, h: 420 }, // landscape
];

const grids = [
  { rows: 1, cols: 2 },
  { rows: 2, cols: 3 },
  { rows: 3, cols: 3 },
  { rows: 3, cols: 4 },
];

describe('facadeLayout', () => {
  it('makes one window per grid cell, indexed row-major', () => {
    for (const grid of grids) {
      const l = facadeLayout(grid, { w: 390, h: 700 });
      expect(l.windows).toHaveLength(grid.rows * grid.cols);
      l.windows.forEach((win, i) => {
        expect(win.index).toBe(i);
        expect(win.row).toBe(Math.floor(i / grid.cols));
        expect(win.col).toBe(i % grid.cols);
        expect(win.cx).toBeCloseTo(win.x + win.w / 2);
        expect(win.cy).toBeCloseTo(win.y + win.h / 2);
      });
    }
  });

  it('keeps the whole building inside the play area on every screen', () => {
    for (const area of boxes) {
      for (const grid of grids) {
        const l = facadeLayout(grid, area);
        expect(l.box.x).toBeGreaterThanOrEqual(-0.01);
        expect(l.box.x + l.box.w).toBeLessThanOrEqual(area.w + 0.01);
        expect(l.box.y).toBeGreaterThanOrEqual(-0.01);
        expect(l.box.y + l.box.h).toBeLessThanOrEqual(area.h + 0.01);
        expect(l.u).toBeGreaterThan(0);
      }
    }
  });

  it('stacks roof → windows → door down the building', () => {
    const l = facadeLayout({ rows: 2, cols: 3 }, { w: 390, h: 700 });
    const firstRow = l.windows.filter((w) => w.row === 0);
    const lastRow = l.windows.filter((w) => w.row === 1);
    const firstTop = Math.min(...firstRow.map((w) => w.y));
    const lastBottom = Math.max(...lastRow.map((w) => w.y + w.h));
    expect(l.roof.y + l.roof.h).toBeLessThanOrEqual(firstTop);
    expect(lastBottom).toBeLessThanOrEqual(l.door.y + 0.01);
    expect(l.door.y + l.door.h).toBeLessThanOrEqual(l.groundY + 0.01);
  });

  it('never overlaps two windows in a row', () => {
    const l = facadeLayout({ rows: 2, cols: 3 }, { w: 390, h: 700 });
    const row = l.windows.filter((w) => w.row === 0).sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i += 1) {
      const prev = row[i - 1];
      const cur = row[i];
      if (!prev || !cur) throw new Error('missing window');
      expect(cur.x).toBeGreaterThan(prev.x + prev.w);
    }
  });

  it('survives a degenerate area without producing NaN', () => {
    const l = facadeLayout({ rows: 0, cols: 0 }, { w: 0, h: 0 });
    expect(l.windows).toHaveLength(1);
    expect(Number.isFinite(l.u)).toBe(true);
    expect(Number.isFinite(l.box.w)).toBe(true);
  });
});

describe('windowAt', () => {
  const l = facadeLayout({ rows: 2, cols: 3 }, { w: 390, h: 700 });

  it('finds the window under the aim point', () => {
    const target = l.windows[4];
    if (!target) throw new Error('missing window');
    expect(windowAt(l.windows, target.cx, target.cy, l.u * 2)?.index).toBe(4);
  });

  it('returns null when the child sprays the sky', () => {
    expect(windowAt(l.windows, 5, 5, 10)).toBeNull();
  });

  it('picks the nearest window when two are in range', () => {
    const a = l.windows[0];
    const b = l.windows[1];
    if (!a || !b) throw new Error('missing window');
    const between = a.cx + (b.cx - a.cx) * 0.3;
    expect(windowAt(l.windows, between, a.cy, 1000)?.index).toBe(0);
  });
});

describe('ringSlots', () => {
  it('spreads the barrier slots evenly around the fire, starting at the top', () => {
    const slots = ringSlots(100, 100, 50, 4);
    expect(slots).toHaveLength(4);
    const first = slots[0];
    if (!first) throw new Error('missing slot');
    expect(first.x).toBeCloseTo(100);
    expect(first.y).toBeCloseTo(50);
    slots.forEach((s) => expect(Math.hypot(s.x - 100, s.y - 100)).toBeCloseTo(50));
  });

  it('always returns at least one slot', () => {
    expect(ringSlots(0, 0, 10, 0)).toHaveLength(1);
  });
});
