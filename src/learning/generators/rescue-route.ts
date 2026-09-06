import type {
  ChallengeGenerator,
  GridPos,
  Heading,
  RescueRouteChallenge,
  RouteCommand,
  RouteLandmark,
  SceneId,
} from '../types';
import type { GridSize, RouteSpec } from '@/utils/grid';
import { allCells, headings, inBounds, posKey, samePos, solveRoute, stepForward } from '@/utils/grid';
import type { Rng } from '@/utils/rng';
import { sceneOr } from './shared';

/**
 * RESCUE ROUTE — programme the truck through a town, on the ROADS.
 *
 * The board is a street plan, not a field of buildings. Every even row and
 * every even column is tarmac, so the road cells form a connected lattice of
 * avenues and cross-streets; what is left over (odd row × odd column) is a
 * **city block** — a building, a park, a row of houses — and those are the
 * cells the truck may not enter. A block is sometimes widened over one
 * neighbouring road cell, which closes a street and is what makes the older
 * bands' routes interesting.
 *
 * Two promises are structural rather than hopeful:
 *   1. the road network is connected — no street is walled off from the
 *      station, so there are never orphan roads drawn on the board;
 *   2. the goal is a road cell standing *beside* the destination building
 *      (`goalSide` points at it), and `drivableRoute` proves the truck can
 *      reach it without ever leaving the tarmac.
 *
 * Commands are forward / left / right / turn-around (see `@/utils/grid`).
 */

const streetNamePool = ['Bell Avenue', 'Market Street', 'Maple Street', 'Spark Street', 'Garden Road', 'Willow Way'];
const scenePool: SceneId[] = ['bakery', 'pizza', 'school', 'park', 'clock-tower', 'library', 'market', 'pet-shop', 'apartments'];
/** what fills the blocks the child is not driving to */
const fillerScenes: SceneId[] = ['apartments', 'park', 'library', 'market', 'school', 'pet-shop', 'bakery', 'pizza', 'clock-tower'];

/** A cell is tarmac when it sits on an avenue (even row) or a street (even col). */
export const isStreetCell = (p: GridPos): boolean => p.row % 2 === 0 || p.col % 2 === 0;

const key = posKey;

/* ------------------------------------------------------------------ */
/* Street plan                                                          */
/* ------------------------------------------------------------------ */

interface Plan {
  grid: GridSize;
  /** keys of every cell the truck may drive on */
  road: Set<string>;
  /** rectangular groups of block cells */
  regions: GridPos[][];
}

const neighbourCells = (grid: GridSize, p: GridPos): GridPos[] =>
  headings.map((h) => stepForward(p, h)).filter((n) => inBounds(grid, n));

/** Every road cell reachable from `start` by driving. */
function reachableRoads(grid: GridSize, road: Set<string>, start: GridPos): Set<string> {
  const seen = new Set<string>([key(start)]);
  let frontier = [start];
  while (frontier.length > 0) {
    const next: GridPos[] = [];
    for (const cell of frontier) {
      for (const n of neighbourCells(grid, cell)) {
        const k = key(n);
        if (seen.has(k) || !road.has(k)) continue;
        seen.add(k);
        next.push(n);
      }
    }
    frontier = next;
  }
  return seen;
}

/** Group block cells into rectangles (each block is one landmark's footprint). */
function blockRegions(grid: GridSize, road: Set<string>): GridPos[][] {
  const seen = new Set<string>();
  const regions: GridPos[][] = [];
  for (const cell of allCells(grid)) {
    const k = key(cell);
    if (road.has(k) || seen.has(k)) continue;
    const group: GridPos[] = [];
    let frontier = [cell];
    seen.add(k);
    while (frontier.length > 0) {
      const next: GridPos[] = [];
      for (const c of frontier) {
        group.push(c);
        for (const n of neighbourCells(grid, c)) {
          const nk = key(n);
          if (seen.has(nk) || road.has(nk)) continue;
          seen.add(nk);
          next.push(n);
        }
      }
      frontier = next;
    }
    regions.push(group.sort((a, b) => key(a).localeCompare(key(b))));
  }
  return regions;
}

/** A footprint has to be a clean rectangle, so it can be drawn as one slab. */
function isRectangle(cells: readonly GridPos[]): boolean {
  const rows = cells.map((c) => c.row);
  const cols = cells.map((c) => c.col);
  const height = Math.max(...rows) - Math.min(...rows) + 1;
  const width = Math.max(...cols) - Math.min(...cols) + 1;
  return height * width === cells.length;
}

/** The biggest block we will ever build: three cells, never a superblock. */
const MAX_BLOCK_CELLS = 3;

/**
 * The lattice, then `merges` blocks widened over one neighbouring road cell.
 * A merge is only kept when every remaining street is still reachable from the
 * station and every block is still a rectangle, so the plan never grows an
 * island or a shape the board cannot draw as one building plot.
 */
function streetPlan(grid: GridSize, start: GridPos, merges: number, rng: Rng): Plan {
  const road = new Set<string>(allCells(grid).filter(isStreetCell).map(key));
  const roadCount = road.size;

  let done = 0;
  const blocks = rng.shuffle(allCells(grid).filter((c) => !isStreetCell(c)));
  for (const block of blocks) {
    if (done >= merges) break;
    const options = rng.shuffle(neighbourCells(grid, block).filter((n) => road.has(key(n)) && !samePos(n, start)));
    for (const cell of options) {
      road.delete(key(cell));
      const regions = blockRegions(grid, road);
      const tidy =
        reachableRoads(grid, road, start).size === road.size &&
        regions.every((r) => r.length <= MAX_BLOCK_CELLS && isRectangle(r));
      if (tidy) {
        done += 1;
        break;
      }
      road.add(key(cell));
    }
  }

  // paranoia: a merge must never cost us the whole network
  if (road.size < roadCount / 2) return streetPlan(grid, start, 0, rng);

  return { grid, road, regions: blockRegions(grid, road) };
}

/* ------------------------------------------------------------------ */
/* Solver — used by the tests, the validator and the hint ladder         */
/* ------------------------------------------------------------------ */

export interface RouteDrive {
  /** the shortest programme that drives it */
  program: RouteCommand[];
  /** every cell the truck stands on, start → goal */
  cells: GridPos[];
}

/**
 * Prove a rescue-route board is drivable ON THE ROADS: solve it, then replay
 * the solution cell by cell and check the truck never leaves the tarmac, never
 * leaves the map, and finishes on the goal. Returns null if any of that fails.
 */
export function drivableRoute(challenge: RescueRouteChallenge): RouteDrive | null {
  const spec: RouteSpec = {
    grid: challenge.grid,
    start: challenge.start,
    startHeading: challenge.startHeading,
    goal: challenge.goal,
    blocked: challenge.blocked,
  };
  const program = solveRoute(spec);
  if (!program) return null;

  const walls = new Set(challenge.blocked.map(key));
  const cells: GridPos[] = [challenge.start];
  let pos = challenge.start;
  let heading = challenge.startHeading;
  if (walls.has(key(pos)) || !inBounds(challenge.grid, pos)) return null;

  for (const command of program) {
    if (command === 'forward') {
      const ahead = stepForward(pos, heading);
      if (!inBounds(challenge.grid, ahead) || walls.has(key(ahead))) return null;
      pos = ahead;
      cells.push(pos);
    } else {
      const shift = command === 'right' ? 1 : command === 'left' ? 3 : 2;
      const at = headings.indexOf(heading);
      heading = headings[(at + shift) % 4] ?? heading;
    }
  }
  if (!samePos(pos, challenge.goal)) return null;
  return { program, cells };
}

/** The block cell the destination building stands in, or null. */
export function destinationCell(challenge: RescueRouteChallenge): GridPos | null {
  if (!challenge.goalSide) return null;
  const cell = stepForward(challenge.goal, challenge.goalSide);
  return inBounds(challenge.grid, cell) ? cell : null;
}

/* ------------------------------------------------------------------ */
/* Generator                                                            */
/* ------------------------------------------------------------------ */

/** How long a drive should be before it is worth programming, per band. */
const driveLength = { A: { min: 4, max: 7 }, B: { min: 6, max: 10 }, C: { min: 8, max: 12 } } as const;

export const generateRescueRoute: ChallengeGenerator<'rescue-route'> = (ctx) => {
  const { rng, ageBand } = ctx;

  const grid =
    ageBand === 'A'
      ? rng.pick([
          { rows: 3, cols: 3 },
          { rows: 3, cols: 4 },
        ])
      : ageBand === 'B'
        ? rng.pick([
            { rows: 4, cols: 4 },
            { rows: 4, cols: 5 },
          ])
        : rng.pick([
            { rows: 5, cols: 5 },
            { rows: 5, cols: 6 },
          ]);

  /* the station stands at the bottom-left corner, nose up the avenue */
  const start: GridPos = { row: grid.rows - 1, col: 0 };
  const startHeading: Heading = 'N';

  const merges = ageBand === 'A' ? 0 : ageBand === 'B' ? rng.int(0, 1) : rng.int(1, 2);
  const plan = streetPlan(grid, start, merges, rng);
  const blocked = allCells(grid)
    .filter((c) => !plan.road.has(key(c)))
    .sort((a, b) => key(a).localeCompare(key(b)));

  /* ---- where the call is: a road cell that pulls up beside a block ---- */
  const wants = driveLength[ageBand];
  const candidates = allCells(grid)
    .filter((c) => plan.road.has(key(c)) && !samePos(c, start))
    .filter((c) => neighbourCells(grid, c).some((n) => !plan.road.has(key(n))))
    .map((c) => ({ pos: c, program: solveRoute({ grid, start, startHeading, goal: c, blocked }) }))
    .filter((c): c is { pos: GridPos; program: RouteCommand[] } => !!c.program)
    /* a drive with no turn in it is not a route, it is a straight line */
    .filter((c) => c.program.some((cmd) => cmd !== 'forward'));

  const inBand = candidates.filter((c) => c.program.length >= wants.min && c.program.length <= wants.max);
  const longest = candidates.length > 0 ? Math.max(...candidates.map((c) => c.program.length)) : 0;
  const pool = inBand.length > 0 ? inBand : candidates.filter((c) => c.program.length === longest);
  const chosen = pool.length > 0 ? rng.pick(pool) : (candidates[0] ?? null);

  const goal = chosen?.pos ?? { row: 0, col: grid.cols - 1 };
  const solution = chosen?.program ?? solveRoute({ grid, start, startHeading, goal, blocked }) ?? [];

  /* ---- which block the call came from ---- */
  const beside = rng.shuffle(neighbourCells(grid, goal).filter((n) => !plan.road.has(key(n))));
  const doorCell = beside[0] ?? null;
  const goalSide: Heading | undefined = doorCell
    ? headings.find((h) => samePos(stepForward(goal, h), doorCell))
    : undefined;

  /* ---- dress every block ---- */
  const goalScene = sceneOr(ctx, rng.pick(scenePool));
  const destinationIndex = doorCell ? plan.regions.findIndex((cells) => cells.some((c) => samePos(c, doorCell))) : -1;
  /* the station block, when the plan happens to put one beside the truck */
  const stationIndex =
    goalScene === 'station-yard'
      ? -1
      : plan.regions.findIndex(
          (cells, i) => i !== destinationIndex && cells.some((c) => neighbourCells(grid, c).some((n) => samePos(n, start))),
        );
  const spare = rng.shuffle(fillerScenes.filter((s) => s !== goalScene));
  let spareAt = 0;
  const landmarks: RouteLandmark[] = plan.regions.map((cells, i) => {
    if (i === destinationIndex) return { cells, scene: goalScene, destination: true };
    if (i === stationIndex) return { cells, scene: 'station-yard' as SceneId };
    const scene = spare[spareAt % Math.max(1, spare.length)] ?? 'apartments';
    spareAt += 1;
    return { cells, scene };
  });

  const slack = ageBand === 'A' ? 3 : ageBand === 'B' ? 3 : 2;
  const maxCommands = Math.max(solution.length + slack, 4);

  /* streets are named on the avenues the truck can actually drive */
  const streetNames =
    ageBand === 'A'
      ? undefined
      : Array.from({ length: grid.rows }, (_, row) => row)
          .filter((row) => row % 2 === 0)
          .map((row) => ({ row, name: streetNamePool[(row / 2) % streetNamePool.length] ?? 'Spark Street' }));

  let compareRoutes: { a: number; b: number; shorter: 'a' | 'b' } | undefined;
  if (ageBand === 'C' || (ageBand === 'B' && rng.chance(0.5))) {
    const shortLen = Math.max(2, solution.length);
    const longLen = shortLen + rng.int(2, 5);
    compareRoutes = rng.chance(0.5) ? { a: shortLen, b: longLen, shorter: 'a' } : { a: longLen, b: shortLen, shorter: 'b' };
  }

  return {
    kind: 'rescue-route',
    grid,
    start,
    startHeading,
    goal,
    goalScene,
    blocked,
    maxCommands,
    landmarks,
    ...(goalSide ? { goalSide } : {}),
    ...(compareRoutes ? { compareRoutes } : {}),
    ...(streetNames ? { streetNames } : {}),
  };
};
