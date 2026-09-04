import type { ChallengeGenerator, GridPos, SceneId } from '../types';
import { allCells, bfsPath, posKey, samePos, solveRoute } from '@/utils/grid';
import { sceneOr } from './shared';

const streetNamePool = ['Bell Avenue', 'Market Street', 'Maple Street', 'Spark Street', 'Garden Road', 'Willow Way'];
const scenePool: SceneId[] = ['bakery', 'pizza', 'school', 'park', 'clock-tower', 'library', 'market', 'pet-shop', 'apartments'];

/**
 * RESCUE ROUTE — programme the truck across town.
 * Commands are forward / left / right / turn-around (see `@/utils/grid`).
 * We BFS the finished board, so `maxCommands` is always enough — with slack.
 */
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

  const start: GridPos = { row: grid.rows - 1, col: 0 };
  const startHeading = 'N' as const;

  // Goal is never on the start row/col, so the route always needs a turn.
  const goalCandidates = allCells(grid).filter((c) => c.row !== start.row && c.col !== start.col);
  const goal = goalCandidates.length > 0 ? rng.pick(goalCandidates) : { row: 0, col: grid.cols - 1 };

  const wantBlocked = ageBand === 'A' ? rng.int(0, 1) : ageBand === 'B' ? rng.int(2, 3) : rng.int(3, 5);
  const free = rng.shuffle(allCells(grid).filter((c) => !samePos(c, start) && !samePos(c, goal)));
  const blocked: GridPos[] = [];
  for (const cell of free) {
    if (blocked.length >= wantBlocked) break;
    const trial = [...blocked, cell];
    if (bfsPath(grid, start, goal, trial)) blocked.push(cell);
  }

  const solution = solveRoute({ grid, start, startHeading, goal, blocked }) ?? [];
  const slack = ageBand === 'A' ? 4 : ageBand === 'B' ? 3 : 2;
  const maxCommands = Math.max(solution.length + slack, solution.length + 1);

  const streetNames =
    ageBand === 'A'
      ? undefined
      : Array.from({ length: grid.rows }, (_, row) => ({ row, name: streetNamePool[row % streetNamePool.length] ?? 'Spark Street' }));

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
    goalScene: sceneOr(ctx, rng.pick(scenePool)),
    blocked: blocked.sort((x, y) => posKey(x).localeCompare(posKey(y))),
    maxCommands,
    ...(compareRoutes ? { compareRoutes } : {}),
    ...(streetNames ? { streetNames } : {}),
  };
};
