import type { Fraction, ToppingId } from '@/learning/types';
import {
  TAU,
  angleOf,
  buildWedges,
  canPlace,
  countAssigned,
  cutAngles,
  lcm,
  matchCutLine,
  planStatus,
  polar,
  regionAtPoint,
  regionCount,
  regionsFor,
  scatterPoints,
  slicesFromCuts,
  toppingPlan,
  wedgePath,
} from '../fractionMath';

const fr = (num: number, den: number): Fraction => ({ num, den });
const half = fr(1, 2);
const quarter = fr(1, 4);
const CENTER = { x: 100, y: 100 };

describe('region maths', () => {
  it('lcm handles the fraction denominators we use', () => {
    expect(lcm(2, 4)).toBe(4);
    expect(lcm(4, 8)).toBe(8);
    expect(lcm(2, 3)).toBe(6);
    expect(lcm(0, 4)).toBe(0);
  });

  it('picks the smallest number of equal regions that fits every fraction', () => {
    expect(regionCount([{ fraction: half }, { fraction: half }])).toBe(2);
    expect(regionCount([{ fraction: half }, { fraction: quarter }, { fraction: quarter }])).toBe(4);
    expect(regionCount([{ fraction: fr(1, 8) }, { fraction: half }])).toBe(8);
  });

  it('never returns fewer than two or more than twelve regions', () => {
    expect(regionCount([{ fraction: fr(1, 1) }])).toBe(2);
    expect(regionCount([{ fraction: fr(1, 100) }])).toBeLessThanOrEqual(12);
  });

  it('converts a fraction into a whole number of regions', () => {
    expect(regionsFor(half, 8)).toBe(4);
    expect(regionsFor(quarter, 8)).toBe(2);
    expect(regionsFor(fr(3, 4), 4)).toBe(3);
    expect(regionsFor(fr(0, 4), 4)).toBe(0);
  });

  it('builds wedges that tile the whole pizza exactly once', () => {
    const wedges = buildWedges(8);
    expect(wedges).toHaveLength(8);
    expect(wedges[0]?.start).toBeCloseTo(0);
    expect(wedges[7]?.end).toBeCloseTo(TAU);
    wedges.forEach((w, i) => {
      expect(w.index).toBe(i);
      expect(w.mid).toBeGreaterThan(w.start);
      expect(w.mid).toBeLessThan(w.end);
    });
  });
});

describe('hit testing', () => {
  it('measures angles clockwise from twelve o clock', () => {
    expect(angleOf(CENTER, { x: 100, y: 40 })).toBeCloseTo(0); // up
    expect(angleOf(CENTER, { x: 160, y: 100 })).toBeCloseTo(Math.PI / 2); // right
    expect(angleOf(CENTER, { x: 100, y: 160 })).toBeCloseTo(Math.PI); // down
    expect(angleOf(CENTER, { x: 40, y: 100 })).toBeCloseTo((3 * Math.PI) / 2); // left
  });

  it('polar and angleOf are inverses', () => {
    for (const a of [0, 0.4, 1.9, 3.3, 5.9]) {
      const p = polar(CENTER, 50, a);
      expect(angleOf(CENTER, p)).toBeCloseTo(a);
    }
  });

  it('maps a point to the region it landed in', () => {
    expect(regionAtPoint({ x: 130, y: 70 }, CENTER, 60, 4)).toBe(0); // top-right quadrant
    expect(regionAtPoint({ x: 130, y: 130 }, CENTER, 60, 4)).toBe(1);
    expect(regionAtPoint({ x: 70, y: 130 }, CENTER, 60, 4)).toBe(2);
    expect(regionAtPoint({ x: 70, y: 70 }, CENTER, 60, 4)).toBe(3);
  });

  it('returns null outside the pizza', () => {
    expect(regionAtPoint({ x: 300, y: 300 }, CENTER, 60, 4)).toBeNull();
    expect(regionAtPoint({ x: 100, y: 161 }, CENTER, 60, 4)).toBeNull();
  });

  // A press whose coordinates never arrived used to slip past `NaN > radius`
  // and hand back a NaN index, which the game then wrote into `assigned[NaN]`.
  it('treats a point with no coordinates as a miss, never a NaN region', () => {
    for (const bad of [
      { x: NaN, y: 100 },
      { x: 100, y: NaN },
      { x: NaN, y: NaN },
      { x: Infinity, y: 100 },
      { x: undefined as unknown as number, y: 100 },
    ]) {
      expect(regionAtPoint(bad, CENTER, 60, 4)).toBeNull();
    }
  });

  it('always returns a region inside the circle, for every angle', () => {
    for (let a = 0; a < TAU; a += 0.05) {
      const p = polar(CENTER, 40, a);
      const region = regionAtPoint(p, CENTER, 60, 8);
      expect(region).not.toBeNull();
      expect(region).toBeGreaterThanOrEqual(0);
      expect(region).toBeLessThan(8);
    }
  });

  it('draws a closed wedge path, and a full circle without a seam', () => {
    expect(wedgePath(CENTER, 50, 0, Math.PI / 2)).toMatch(/^M 100 100 L .* A 50 50 0 0 1 .* Z$/);
    expect(wedgePath(CENTER, 50, 0, TAU)).toContain('A 50 50 0 1 1');
  });
});

describe('topping plan', () => {
  const toppings: { topping: ToppingId; fraction: Fraction }[] = [
    { topping: 'cheese', fraction: half },
    { topping: 'mushroom', fraction: quarter },
    { topping: 'pepper', fraction: quarter },
  ];
  const count = regionCount(toppings);
  const plan = toppingPlan(toppings, count);

  it('shares the regions out exactly', () => {
    expect(count).toBe(4);
    expect(plan).toEqual([
      { topping: 'cheese', need: 2 },
      { topping: 'mushroom', need: 1 },
      { topping: 'pepper', need: 1 },
    ]);
    expect(plan.reduce((a, p) => a + p.need, 0)).toBe(count);
  });

  it('counts what is on the pizza so far', () => {
    const assigned: (ToppingId | null)[] = ['cheese', 'cheese', null, 'pepper'];
    expect(countAssigned(assigned, 'cheese')).toBe(2);
    expect(countAssigned(assigned, 'mushroom')).toBe(0);
  });

  it('is only complete when every topping has exactly its share', () => {
    expect(planStatus(plan, [null, null, null, null]).complete).toBe(false);
    expect(planStatus(plan, ['cheese', 'cheese', 'mushroom', 'pepper']).complete).toBe(true);
    const tooMuchCheese = planStatus(plan, ['cheese', 'cheese', 'cheese', 'pepper']);
    expect(tooMuchCheese.complete).toBe(false);
    expect(tooMuchCheese.over).toEqual(['cheese']);
    expect(tooMuchCheese.placed).toBe(4);
    expect(tooMuchCheese.needed).toBe(4);
  });

  it('stops a topping once it has filled its fraction', () => {
    expect(canPlace(plan, [null, null, null, null], 'cheese')).toBe(true);
    expect(canPlace(plan, ['cheese', 'cheese', null, null], 'cheese')).toBe(false);
    expect(canPlace(plan, ['cheese', 'cheese', null, null], 'mushroom')).toBe(true);
    expect(canPlace(plan, [null, null, null, null], 'olive')).toBe(false);
  });
});

describe('cutting', () => {
  it('needs half as many strokes as slices', () => {
    expect(cutAngles(8)).toHaveLength(4);
    expect(cutAngles(4)).toHaveLength(2);
    expect(cutAngles(2)).toHaveLength(1);
    expect(cutAngles(2)[0]).toBeCloseTo(0);
    expect(cutAngles(4)[1]).toBeCloseTo(Math.PI / 2);
  });

  it('counts the slices as the cuts land', () => {
    expect(slicesFromCuts(0, 8)).toBe(1);
    expect(slicesFromCuts(1, 8)).toBe(2);
    expect(slicesFromCuts(2, 8)).toBe(4);
    expect(slicesFromCuts(4, 8)).toBe(8);
    expect(slicesFromCuts(9, 8)).toBe(8);
  });

  it('matches a stroke drawn along a cut line, in either direction', () => {
    const angles = cutAngles(8);
    const r = 60;
    angles.forEach((a, i) => {
      const p1 = polar(CENTER, r, a);
      const p2 = polar(CENTER, r, a + Math.PI);
      expect(matchCutLine(p1, p2, CENTER, r, angles)).toBe(i);
      expect(matchCutLine(p2, p1, CENTER, r, angles)).toBe(i);
    });
  });

  it('is forgiving about wobbly little hands', () => {
    const angles = cutAngles(4);
    const r = 60;
    const from = { x: 104, y: 44 }; // near the top, a bit off
    const to = { x: 96, y: 158 };
    expect(matchCutLine(from, to, CENTER, r, angles)).toBe(0);
  });

  it('ignores a tap or a tiny scribble', () => {
    const angles = cutAngles(8);
    expect(matchCutLine({ x: 100, y: 100 }, { x: 104, y: 103 }, CENTER, 60, angles)).toBeNull();
  });

  it('ignores a stroke nowhere near the pizza', () => {
    const angles = cutAngles(8);
    expect(matchCutLine({ x: 400, y: 400 }, { x: 480, y: 480 }, CENTER, 60, angles)).toBeNull();
  });
});

describe('topping scatter', () => {
  const wedge = buildWedges(4)[1]!;

  it('is deterministic', () => {
    expect(scatterPoints(CENTER, 60, wedge, 7)).toEqual(scatterPoints(CENTER, 60, wedge, 7));
  });

  it('keeps every piece inside its own wedge', () => {
    for (const p of scatterPoints(CENTER, 60, wedge, 12)) {
      const a = angleOf(CENTER, p);
      expect(a).toBeGreaterThanOrEqual(wedge.start);
      expect(a).toBeLessThanOrEqual(wedge.end);
      expect(Math.hypot(p.x - CENTER.x, p.y - CENTER.y)).toBeLessThan(60);
    }
  });
});
