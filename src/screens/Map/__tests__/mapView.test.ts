import { MAP_PLACES, MAP_VB } from '@/world';
import {
  CONTENT_H,
  CONTENT_W,
  HOME_FOCUS,
  LABEL_HALO,
  LABEL_RATIO,
  MAP_UNIT,
  MARKER_PX,
  frameOn,
  layoutPins,
  mapScales,
  panBounds,
  screenX,
  screenY,
  wholeTown,
} from '../mapView';

/** a phone carries the view toggle and the big CTA over the foot of the map */
const PHONE = { w: 390, h: 762, foot: 166 };
/** a wide window moves both into the rail, so nothing floats over the town */
const TABLET = { w: 676, h: 686, foot: 0 };
const DESKTOP = { w: 845, h: 718, foot: 0 };
const VIEWPORTS = [PHONE, TABLET, DESKTOP];

const allOpen = () => true;

describe('map camera scales', () => {
  it.each(VIEWPORTS)('orders min ≤ home ≤ max at %o', (vp) => {
    const s = mapScales(vp);
    expect(s.min).toBeLessThanOrEqual(s.home);
    expect(s.home).toBeLessThanOrEqual(s.max);
    expect(s.min).toBeGreaterThan(0);
  });

  it.each(VIEWPORTS)('puts the whole town clear of the chrome at min zoom at %o', (vp) => {
    const { min } = mapScales(vp);
    expect(CONTENT_W * min).toBeLessThanOrEqual(vp.w + 0.001);
    expect(CONTENT_H * min).toBeLessThanOrEqual(vp.h - vp.foot + 0.001);
    /* and it is the *largest* such scale — one axis touches the clear area */
    const touches = CONTENT_W * min >= vp.w - 0.001 || CONTENT_H * min >= vp.h - vp.foot - 0.001;
    expect(touches).toBe(true);
  });

  it.each(VIEWPORTS)('rests the whole-town view above the foot chrome at %o', (vp) => {
    const { min } = mapScales(vp);
    const { ty } = wholeTown(min, vp);
    expect(screenY(0, min, ty, vp.h)).toBeGreaterThanOrEqual(-0.001);
    expect(screenY(MAP_VB.h, min, ty, vp.h)).toBeLessThanOrEqual(vp.h - vp.foot + 0.001);
  });

  it.each(VIEWPORTS)('opens close enough that a building reads as a building at %o', (vp) => {
    const { home } = mapScales(vp);
    /* the fire station's block is 85 plan units wide */
    expect(85 * MAP_UNIT * home).toBeGreaterThanOrEqual(160);
  });

  it.each(VIEWPORTS)('covers the viewport at the opening scale at %o', (vp) => {
    const { home } = mapScales(vp);
    expect(Math.max(CONTENT_W * home, CONTENT_H * home)).toBeGreaterThanOrEqual(Math.max(vp.w, vp.h) - 0.001);
  });

  it('degrades safely before the viewport has been measured', () => {
    const s = mapScales({ w: 0, h: 0, foot: 0 });
    expect(s.min).toBe(1);
    expect(s.home).toBe(1);
  });
});

describe('pan bounds', () => {
  it('pins an axis the town does not fill', () => {
    const b = panBounds(0.2, { w: 390, h: 844, foot: 0 });
    expect(b.x).toBe(0);
    expect(b.y).toBe(0);
  });

  it('never lets an edge of the town come inside the frame', () => {
    const vp = PHONE;
    const { home } = mapScales(vp);
    const b = panBounds(home, vp);
    /* at the working scale the town covers the frame, so it never drifts */
    expect(b.cy).toBeCloseTo(0, 10);
    for (const tx of [-b.x, 0, b.x]) {
      expect(screenX(0, home, tx, vp.w)).toBeLessThanOrEqual(0.001);
      expect(screenX(MAP_VB.w, home, tx, vp.w)).toBeGreaterThanOrEqual(vp.w - 0.001);
    }
    for (const ty of [-b.y, 0, b.y]) {
      expect(screenY(0, home, ty, vp.h)).toBeLessThanOrEqual(0.001);
      expect(screenY(MAP_VB.h, home, ty, vp.h)).toBeGreaterThanOrEqual(vp.h - 0.001);
    }
  });
});

describe('framing', () => {
  it.each(VIEWPORTS)('keeps the fire station on screen when the map opens at %o', (vp) => {
    const { home } = mapScales(vp);
    const { tx, ty } = frameOn(HOME_FOCUS.x, HOME_FOCUS.y, home, vp, HOME_FOCUS.ax, HOME_FOCUS.ay);
    const station = MAP_PLACES.find((p) => p.id === 'station');
    expect(station).toBeDefined();
    const x = screenX(station?.x ?? 0, home, tx, vp.w);
    const y = screenY(station?.y ?? 0, home, ty, vp.h);
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(vp.w);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(vp.h);
  });

  it.each(VIEWPORTS)('clamps a framing request that would show empty sky at %o', (vp) => {
    const { home } = mapScales(vp);
    const b = panBounds(home, vp);
    /* ask to centre on the very corner of the plan */
    const { tx, ty } = frameOn(0, 0, home, vp);
    expect(Math.abs(tx)).toBeLessThanOrEqual(b.x + 0.001);
    expect(Math.abs(ty - b.cy)).toBeLessThanOrEqual(b.y + 0.001);
  });
});

describe('pin layout', () => {
  const rowsOf = (boxes: ReturnType<typeof layoutPins>, unitPx: number) => {
    const rows = new Map<number, { left: number; right: number }[]>();
    for (const b of boxes) {
      const band = Math.round(b.place.y / 40);
      const left = b.place.x * unitPx + b.dx;
      const list = rows.get(band) ?? [];
      list.push({ left, right: left + b.width });
      rows.set(band, list);
    }
    return rows;
  };

  it('gives every place a box', () => {
    const boxes = layoutPins(MAP_UNIT, false, allOpen, true);
    expect(boxes).toHaveLength(MAP_PLACES.length);
  });

  it.each(VIEWPORTS)('never overlaps two name pills in a row at %o', (vp) => {
    const { home } = mapScales(vp);
    const unitPx = MAP_UNIT * home * LABEL_RATIO;
    const boxes = layoutPins(unitPx, vp.w < 560, allOpen, true);
    for (const row of rowsOf(boxes, unitPx).values()) {
      const sorted = [...row].sort((a, b) => a.left - b.left);
      for (let i = 1; i < sorted.length; i += 1) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        if (!prev || !cur) continue;
        /* far enough apart that neither pin's tap halo can sit on the other */
        expect(cur.left).toBeGreaterThanOrEqual(prev.right + 2 * LABEL_HALO);
      }
    }
  });

  it.each(VIEWPORTS)('keeps every name pill inside the town at %o', (vp) => {
    const { home } = mapScales(vp);
    const unitPx = MAP_UNIT * home * LABEL_RATIO;
    const townW = MAP_VB.w * unitPx;
    for (const b of layoutPins(unitPx, vp.w < 560, allOpen, true)) {
      const left = b.place.x * unitPx + b.dx;
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left + b.width).toBeLessThanOrEqual(townW);
    }
  });

  it.each(VIEWPORTS)('never overlaps two markers at whole-town range at %o', (vp) => {
    const { min } = mapScales(vp);
    const unitPx = MAP_UNIT * min;
    const boxes = layoutPins(unitPx, vp.w < 560, allOpen, false);
    for (const b of boxes) expect(b.variant).toBe('marker');
    for (const row of rowsOf(boxes, unitPx).values()) {
      const sorted = [...row].sort((a, b) => a.left - b.left);
      for (let i = 1; i < sorted.length; i += 1) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        if (!prev || !cur) continue;
        /* far enough apart that neither pin's tap halo can sit on the other */
        expect(cur.left).toBeGreaterThanOrEqual(prev.right + 2 * LABEL_HALO);
      }
    }
  });

  it('gives a locked place a marker, not a name pill', () => {
    const boxes = layoutPins(MAP_UNIT, false, (id) => id === 'station', true);
    for (const b of boxes) {
      expect(b.variant).toBe(b.place.id === 'station' ? 'pill' : 'marker');
      if (b.variant === 'marker') expect(b.width).toBe(MARKER_PX);
    }
  });

  it('leaves room for a 56 px tap target round the shortest pill', () => {
    /* the compact pill is 34 px tall; the halo has to make up the rest */
    expect(34 + 2 * LABEL_HALO).toBeGreaterThanOrEqual(56);
    expect(MARKER_PX + 2 * LABEL_HALO).toBeGreaterThanOrEqual(56);
  });

  it('draws the whole content box from the plan', () => {
    expect(CONTENT_W).toBe(MAP_VB.w * MAP_UNIT);
    expect(CONTENT_H).toBe(MAP_VB.h * MAP_UNIT);
  });
});
