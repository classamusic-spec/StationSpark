/** The BFS/DFS that proves every route and hose puzzle can be finished. */
import type { GridPos } from '@/learning/types';
import {
  applyRoute,
  bfsPath,
  commandsForPath,
  countPieces,
  headingBetween,
  pathDistance,
  pathPieces,
  solveHosePath,
  solveRoute,
  turn,
} from '@/utils/grid';

const grid = { rows: 4, cols: 4 };
const p = (row: number, col: number): GridPos => ({ row, col });

describe('turning', () => {
  it('goes round the compass', () => {
    expect(turn('N', 'right')).toBe('E');
    expect(turn('N', 'left')).toBe('W');
    expect(turn('N', 'turn-around')).toBe('S');
    expect(turn(turn('E', 'right'), 'right')).toBe('W');
  });
  it('knows which way one cell is from another', () => {
    expect(headingBetween(p(1, 1), p(0, 1))).toBe('N');
    expect(headingBetween(p(1, 1), p(1, 2))).toBe('E');
    expect(headingBetween(p(1, 1), p(3, 3))).toBeNull();
  });
});

describe('bfsPath', () => {
  it('finds the shortest way', () => {
    expect(pathDistance(grid, p(3, 0), p(0, 3))).toBe(6);
  });
  it('goes around walls', () => {
    const blocked = [p(2, 0), p(2, 1), p(2, 2)];
    const path = bfsPath(grid, p(3, 0), p(0, 0), blocked);
    expect(path).not.toBeNull();
    expect(path?.some((c) => c.row === 2 && c.col === 3)).toBe(true);
  });
  it('says so when there is no way through', () => {
    const blocked = [p(2, 0), p(2, 1), p(2, 2), p(2, 3)];
    expect(bfsPath(grid, p(3, 0), p(0, 0), blocked)).toBeNull();
  });
  it('handles start === goal', () => {
    expect(bfsPath(grid, p(1, 1), p(1, 1))).toEqual([p(1, 1)]);
  });
});

describe('solveRoute', () => {
  const spec = { grid, start: p(3, 0), startHeading: 'N' as const, goal: p(0, 3), blocked: [] };

  it('produces a program that really arrives', () => {
    const program = solveRoute(spec);
    expect(program).not.toBeNull();
    expect(applyRoute(spec, program ?? []).reachedGoal).toBe(true);
  });

  it('is at least as short as turning then driving by hand', () => {
    const path = bfsPath(grid, spec.start, spec.goal, spec.blocked) ?? [];
    const byHand = commandsForPath(path, spec.startHeading);
    expect((solveRoute(spec) ?? []).length).toBeLessThanOrEqual(byHand.length);
    expect(applyRoute(spec, byHand).reachedGoal).toBe(true);
  });

  it('reports a bump instead of driving through a wall', () => {
    const walled = { ...spec, blocked: [p(2, 0)] };
    const run = applyRoute(walled, ['forward', 'forward']);
    expect(run.ok).toBe(false);
    expect(run.reachedGoal).toBe(false);
  });

  it('uses turn-around when the goal is behind the truck', () => {
    const behind = { grid, start: p(0, 0), startHeading: 'S' as const, goal: p(0, 3), blocked: [] };
    const program = solveRoute(behind) ?? [];
    expect(applyRoute(behind, program).reachedGoal).toBe(true);
    expect(program.length).toBe(4); // one turn + three forwards
  });

  it('returns null when the goal is walled in', () => {
    expect(solveRoute({ ...spec, goal: p(0, 0), blocked: [p(0, 1), p(1, 0)] })).toBeNull();
  });
});

describe('hose pieces', () => {
  it('counts straights and corners along a path', () => {
    const straightLine = [p(3, 0), p(2, 0), p(1, 0), p(0, 0)];
    expect(pathPieces(straightLine)).toEqual({ straight: 2, corner: 0 });
    const elbow = [p(3, 0), p(2, 0), p(2, 1), p(2, 2)];
    expect(pathPieces(elbow)).toEqual({ straight: 1, corner: 1 });
  });

  it('solves a board when the pieces are exactly enough', () => {
    const path = bfsPath(grid, p(3, 0), p(0, 3)) ?? [];
    const need = pathPieces(path);
    const pieces = [
      ...Array.from({ length: need.straight }, () => 'straight' as const),
      ...Array.from({ length: need.corner }, () => 'corner' as const),
    ];
    const solution = solveHosePath({ grid, start: p(3, 0), end: p(0, 3), blocked: [], pieces });
    expect(solution).not.toBeNull();
    const used = pathPieces(solution ?? []);
    expect(used.straight).toBeLessThanOrEqual(need.straight);
    expect(used.corner).toBeLessThanOrEqual(need.corner);
  });

  it('says no when there are not enough pieces', () => {
    expect(solveHosePath({ grid, start: p(3, 0), end: p(0, 3), blocked: [], pieces: ['straight'] })).toBeNull();
  });

  it('counts a bag of pieces', () => {
    expect(countPieces(['straight', 'corner', 'corner'])).toEqual({ straight: 1, corner: 2 });
  });
});
