/**
 * RESCUE ROUTE — the board is a town with streets, and every route is proved
 * drivable ON those streets before a child ever sees it.
 */
import { createRng } from '@/utils/rng';
import type { AgeBand, GridPos, RescueRouteChallenge } from '@/learning/types';
import { drivableRoute, generateRescueRoute, isStreetCell } from '@/learning/generators/rescue-route';
import { validateChallenge } from '@/learning/validate';
import { headings, inBounds, posKey, samePos, stepForward } from '@/utils/grid';

const BANDS: AgeBand[] = ['A', 'B', 'C'];
const SEEDS = 150;

const boards = (band: AgeBand, count = SEEDS): RescueRouteChallenge[] =>
  Array.from({ length: count }, (_, i) => generateRescueRoute({ ageBand: band, rng: createRng(i * 733 + 17) }));

/** Every road cell you can reach from the station by driving. */
function reachable(c: RescueRouteChallenge): Set<string> {
  const walls = new Set(c.blocked.map(posKey));
  const seen = new Set<string>([posKey(c.start)]);
  let frontier = [c.start];
  while (frontier.length > 0) {
    const next: GridPos[] = [];
    for (const cell of frontier) {
      for (const h of headings) {
        const n = stepForward(cell, h);
        if (!inBounds(c.grid, n) || walls.has(posKey(n)) || seen.has(posKey(n))) continue;
        seen.add(posKey(n));
        next.push(n);
      }
    }
    frontier = next;
  }
  return seen;
}

const roadCells = (c: RescueRouteChallenge): GridPos[] => {
  const walls = new Set(c.blocked.map(posKey));
  const out: GridPos[] = [];
  for (let row = 0; row < c.grid.rows; row++) {
    for (let col = 0; col < c.grid.cols; col++) if (!walls.has(posKey({ row, col }))) out.push({ row, col });
  }
  return out;
};

describe.each(BANDS)('rescue-route band %s', (band) => {
  it('drives to the call without ever leaving the road', () => {
    const failures: string[] = [];
    boards(band).forEach((c, seed) => {
      const walls = new Set(c.blocked.map(posKey));
      const drive = drivableRoute(c);
      if (!drive) {
        failures.push(`seed ${seed}: no drivable route`);
        return;
      }
      for (const cell of drive.cells) {
        if (!inBounds(c.grid, cell)) failures.push(`seed ${seed}: the route leaves the map at ${posKey(cell)}`);
        if (walls.has(posKey(cell))) failures.push(`seed ${seed}: the route drives over the block at ${posKey(cell)}`);
      }
      const last = drive.cells[drive.cells.length - 1];
      if (!last || !samePos(last, c.goal)) failures.push(`seed ${seed}: the route does not end at the call`);
      if (drive.program.length > c.maxCommands) failures.push(`seed ${seed}: needs more commands than allowed`);
      if (!drive.program.some((cmd) => cmd !== 'forward')) failures.push(`seed ${seed}: a route with no turn in it`);
    });
    expect(failures).toEqual([]);
  });

  it('lays out a connected street network with the station on it', () => {
    const failures: string[] = [];
    boards(band).forEach((c, seed) => {
      const walls = new Set(c.blocked.map(posKey));
      if (walls.has(posKey(c.start))) failures.push(`seed ${seed}: the station is inside a block`);
      if (walls.has(posKey(c.goal))) failures.push(`seed ${seed}: the call's bay is inside a block`);
      const open = roadCells(c);
      const reach = reachable(c);
      if (reach.size !== open.length) failures.push(`seed ${seed}: ${open.length - reach.size} streets are walled off`);
      if (open.length < c.grid.rows * c.grid.cols * 0.5) failures.push(`seed ${seed}: more block than town`);
    });
    expect(failures).toEqual([]);
  });

  it('parks the truck outside a building, never on one', () => {
    const failures: string[] = [];
    boards(band).forEach((c, seed) => {
      if (!c.goalSide) {
        failures.push(`seed ${seed}: nothing says which building the call is at`);
        return;
      }
      const door = stepForward(c.goal, c.goalSide);
      if (!inBounds(c.grid, door)) failures.push(`seed ${seed}: the destination is off the map`);
      if (!c.blocked.some((b) => samePos(b, door))) failures.push(`seed ${seed}: the destination is standing on the road`);
      const home = c.landmarks?.find((l) => l.cells.some((cell) => samePos(cell, door)));
      if (!home) failures.push(`seed ${seed}: no landmark where the call came from`);
      else if (!home.destination) failures.push(`seed ${seed}: the truck pulls up beside the wrong building`);
      else if (home.scene !== c.goalScene) failures.push(`seed ${seed}: the address is dressed as the wrong place`);
    });
    expect(failures).toEqual([]);
  });

  it('stands something in every block, and only in blocks', () => {
    const failures: string[] = [];
    boards(band).forEach((c, seed) => {
      const walls = new Set(c.blocked.map(posKey));
      const seen = new Set<string>();
      let destinations = 0;
      for (const landmark of c.landmarks ?? []) {
        if (landmark.destination) destinations += 1;
        if (landmark.cells.length > 3) failures.push(`seed ${seed}: a block swallowed half the town`);
        const rows = landmark.cells.map((p) => p.row);
        const cols = landmark.cells.map((p) => p.col);
        const box = (Math.max(...rows) - Math.min(...rows) + 1) * (Math.max(...cols) - Math.min(...cols) + 1);
        if (box !== landmark.cells.length) failures.push(`seed ${seed}: a block is not a rectangle`);
        for (const cell of landmark.cells) {
          if (!walls.has(posKey(cell))) failures.push(`seed ${seed}: a landmark stands on the road`);
          if (seen.has(posKey(cell))) failures.push(`seed ${seed}: two landmarks share a block`);
          seen.add(posKey(cell));
        }
      }
      if (seen.size !== c.blocked.length) failures.push(`seed ${seed}: a block has nothing standing in it`);
      if (destinations !== 1) failures.push(`seed ${seed}: ${destinations} destinations`);
    });
    expect(failures).toEqual([]);
  });

  it('is accepted by the validator', () => {
    for (const c of boards(band, 40)) expect(validateChallenge(c)).toEqual([]);
  });
});

describe('rescue-route difficulty', () => {
  const avgLength = (band: AgeBand) => {
    const lengths = boards(band, 40).map((c) => drivableRoute(c)?.program.length ?? 0);
    return lengths.reduce((a, b) => a + b, 0) / lengths.length;
  };

  it('asks older children for longer drives', () => {
    expect(avgLength('A')).toBeLessThan(avgLength('B'));
    expect(avgLength('B')).toBeLessThan(avgLength('C'));
  });

  it('always leaves slack for a wrong step or two', () => {
    for (const band of BANDS) {
      for (const c of boards(band, 40)) {
        expect(c.maxCommands).toBeGreaterThan(drivableRoute(c)?.program.length ?? 99);
      }
    }
  });

  it('keeps the youngest band on a plain lattice of streets', () => {
    for (const c of boards('A', 40)) {
      for (const cell of c.blocked) expect(isStreetCell(cell)).toBe(false);
      expect(c.landmarks?.every((l) => l.cells.length === 1)).toBe(true);
    }
  });
});

describe('the validator catches a town that makes no sense', () => {
  const base = () => generateRescueRoute({ ageBand: 'B', rng: createRng(21) });

  it('refuses a call the truck would have to park on', () => {
    const c = base();
    const broken: RescueRouteChallenge = { ...c, goal: c.blocked[0] ?? c.goal };
    expect(validateChallenge(broken).join(' ')).toContain('blocked');
  });

  it('refuses a landmark standing in the middle of the road', () => {
    const c = base();
    const broken: RescueRouteChallenge = {
      ...c,
      landmarks: [...(c.landmarks ?? []), { cells: [c.goal], scene: 'market' }],
    };
    expect(validateChallenge(broken).join(' ')).toContain('stands on the road');
  });

  it('refuses a destination the road never reaches', () => {
    const c = base();
    const away = headings.find((h) => {
      const cell = stepForward(c.goal, h);
      return inBounds(c.grid, cell) && !c.blocked.some((b) => samePos(b, cell));
    });
    expect(away).toBeDefined();
    const broken: RescueRouteChallenge = { ...c, goalSide: away };
    expect(validateChallenge(broken).join(' ')).toContain('stands on the road');
  });
});
