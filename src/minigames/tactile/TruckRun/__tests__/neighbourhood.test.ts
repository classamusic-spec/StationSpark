/**
 * The street beside the road.
 *
 * Two promises here matter more than how pretty it is:
 *   1. **nothing the town puts down is ever on the tarmac** — if a shop or a
 *      parked car crossed the kerb it would read as a hazard, and the child
 *      would swerve for scenery that cannot be hit;
 *   2. **the two renderers get the same town** — the 3D street looks further
 *      down the road than the SVG one, so the shallow list has to be exactly
 *      the near part of the deep one, never a different street.
 */
import {
  BLOCK,
  BUILDINGS,
  BUILD_LINE,
  JUNCTION_EVERY,
  destinationFor,
  isJunctionBlock,
  streetSeed,
  streetView,
  type BuildingId,
} from '../neighbourhood';
import { ROAD_HALF } from '../projection';

const DEEP = 62;
const SHALLOW = 46;

describe('streetView', () => {
  it('is a pure function of the distance — the same street every time', () => {
    for (const distance of [0, 17.5, 123.25, 999]) {
      const a = streetView(distance, DEEP, { seed: 3 });
      const b = streetView(distance, DEEP, { seed: 3 });
      expect(a).toEqual(b);
    }
  });

  it('never puts a building, a lamp or a parked car on the tarmac', () => {
    for (let distance = 0; distance < 600; distance += 7) {
      const street = streetView(distance, DEEP, { seed: distance % 8 });
      for (const b of street.buildings) {
        expect(Math.abs(b.side * BUILD_LINE)).toBeGreaterThan(ROAD_HALF);
      }
      for (const f of street.furniture) {
        /* the widest thing on the pavement is a parked car, 1.9 across */
        expect(Math.abs(f.x) - 0.95).toBeGreaterThan(ROAD_HALF - 0.01);
      }
    }
  });

  it('keeps every building inside its own plot, so two never overlap', () => {
    const street = streetView(240, DEEP, { seed: 0 });
    for (const b of street.buildings) {
      expect(BUILDINGS[b.kind].frontage).toBeLessThanOrEqual(b.length);
    }
    for (const side of [-1, 1] as const) {
      const spans = street.buildings
        .filter((b) => b.side === side)
        .map((b) => [b.ahead, b.ahead + b.length] as const)
        .sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < spans.length; i += 1) {
        expect(spans[i]?.[0] ?? 0).toBeGreaterThanOrEqual((spans[i - 1]?.[1] ?? 0) - 0.001);
      }
    }
  });

  it('gives the 2D road the near half of the 3D road, not a different town', () => {
    for (const distance of [0, 44, 137.5]) {
      const deep = streetView(distance, DEEP, { seed: 2 });
      const shallow = streetView(distance, SHALLOW, { seed: 2 });
      const deepIds = new Set(deep.buildings.map((b) => b.id));
      for (const b of shallow.buildings) {
        expect(deepIds.has(b.id)).toBe(true);
        const twin = deep.buildings.find((d) => d.id === b.id);
        expect(twin?.kind).toBe(b.kind);
        expect(twin?.ahead).toBeCloseTo(b.ahead, 6);
      }
      expect(shallow.buildings.length).toBeLessThanOrEqual(deep.buildings.length);
    }
  });

  it('scrolls smoothly: a building keeps its id and slides towards the truck', () => {
    const before = streetView(100, DEEP, { seed: 1 });
    const after = streetView(104, DEEP, { seed: 1 });
    const shared = before.buildings.filter((b) => after.buildings.some((a) => a.id === b.id));
    expect(shared.length).toBeGreaterThan(4);
    for (const b of shared) {
      const now = after.buildings.find((a) => a.id === b.id);
      expect(now?.kind).toBe(b.kind);
      expect(now?.ahead).toBeCloseTo(b.ahead - 4, 6);
    }
  });

  it('opens a side street every third block, with a crossing on it', () => {
    const street = streetView(0, BLOCK * JUNCTION_EVERY * 2, { seed: 0 });
    expect(street.junctions.length).toBeGreaterThanOrEqual(2);
    for (const j of street.junctions) expect(j.width).toBeGreaterThan(4);
    expect(isJunctionBlock(2)).toBe(true);
    expect(isJunctionBlock(3)).toBe(false);
    expect(isJunctionBlock(5)).toBe(true);
  });

  it('never blocks the road with a junction: the gap has no buildings in it', () => {
    for (let block = 0; block < 12; block += 1) {
      const street = streetView(block * BLOCK, BLOCK, { seed: 0 });
      for (const j of street.junctions) {
        for (const b of street.buildings) {
          const overlaps = b.ahead < j.ahead + j.width / 2 && b.ahead + b.length > j.ahead - j.width / 2;
          expect(overlaps).toBe(false);
        }
      }
    }
  });

  it('has no arrival until the last gate is open, then puts the call at the end of it', () => {
    expect(streetView(0, DEEP, {}).arrival).toBeNull();
    const arriving = streetView(200, DEEP, { seed: 0, destination: 'bakery', finishAhead: 30 });
    expect(arriving.arrival).toEqual({ ahead: 30 });
    const waiting = arriving.buildings.filter((b) => b.kind === 'bakery' && b.side > 0);
    expect(waiting.some((b) => b.ahead <= 33 && b.ahead + b.length > 33)).toBe(true);
  });

  it('dresses the street from the scene the run was generated for', () => {
    expect(destinationFor('bakery')).toBe('bakery');
    expect(destinationFor('station-yard')).toBe('station');
    expect(destinationFor('park')).toBeUndefined();
    expect(destinationFor(undefined)).toBeUndefined();
    /* every destination it can name is a building the kit can actually build */
    for (const scene of ['bakery', 'pizza', 'school', 'clock-tower', 'library', 'pet-shop', 'market', 'apartments', 'station-yard']) {
      const id = destinationFor(scene) as BuildingId;
      expect(BUILDINGS[id]).toBeDefined();
    }
  });

  it('starts a drive in a different corner of town per scene, but always the same one', () => {
    expect(streetSeed('bakery')).toBe(streetSeed('bakery'));
    expect(streetSeed(undefined)).toBe(0);
    const seeds = ['bakery', 'pizza', 'school', 'clock-tower', 'market'].map(streetSeed);
    for (const seed of seeds) {
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(8);
    }
    expect(new Set(seeds).size).toBeGreaterThan(1);
  });
});
