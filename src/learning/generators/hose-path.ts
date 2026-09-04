import type { ChallengeGenerator, GridPos, HosePiece } from '../types';
import { allCells, bfsPath, pathPieces, samePos } from '@/utils/grid';

/**
 * HOSE PATH — lay pipe from the hydrant to the fire.
 * The pieces handed to the child are exactly the pieces one real path needs,
 * so the puzzle always closes. Start and end never share a row or column, so
 * there is always at least one corner to turn.
 */
export const generateHosePath: ChallengeGenerator<'hose-path'> = (ctx) => {
  const { rng, ageBand } = ctx;

  const grid = ageBand === 'A' ? { rows: 3, cols: 3 } : ageBand === 'B' ? { rows: 4, cols: 4 } : rng.pick([{ rows: 4, cols: 5 }, { rows: 5, cols: 5 }]);
  const cells = allCells(grid);
  const start = rng.pick(cells.filter((c) => c.row === grid.rows - 1));
  const endCandidates = cells.filter((c) => c.row !== start.row && c.col !== start.col);
  const end = endCandidates.length > 0 ? rng.pick(endCandidates) : { row: 0, col: grid.cols - 1 };

  const wantBlocked = ageBand === 'A' ? 0 : ageBand === 'B' ? rng.int(1, 2) : rng.int(2, 4);
  const free = rng.shuffle(cells.filter((c) => !samePos(c, start) && !samePos(c, end)));
  const blocked: GridPos[] = [];
  for (const cell of free) {
    if (blocked.length >= wantBlocked) break;
    const trial = [...blocked, cell];
    if (bfsPath(grid, start, end, trial)) blocked.push(cell);
  }

  const path = bfsPath(grid, start, end, blocked) ?? [start, end];
  const need = pathPieces(path);
  const pieces: HosePiece[] = rng.shuffle([
    ...Array.from({ length: need.straight }, () => 'straight' as const),
    ...Array.from({ length: need.corner }, () => 'corner' as const),
  ]);

  return { kind: 'hose-path', grid, start, end, blocked, pieces };
};
