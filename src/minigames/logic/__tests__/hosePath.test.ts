import type { GridPos } from '@/learning/types';
import { bfsPath } from '@/utils/grid';
import {
  cellIndex,
  exitOpening,
  hasOpening,
  isConnected,
  openings,
  oppositeHeading,
  placementFor,
  solutionPlacements,
  rotateHeading,
  traceWater,
  type HoseBoard,
  type PlacedPiece,
} from '../shared/hosePath';

const grid = { rows: 3, cols: 3 };
const empty = (): (PlacedPiece | null)[] => Array.from({ length: grid.rows * grid.cols }, () => null);

const put = (board: (PlacedPiece | null)[], p: GridPos, piece: PlacedPiece) => {
  board[cellIndex(grid, p)] = piece;
  return board;
};

const spec = (board: HoseBoard, start: GridPos, end: GridPos, blocked: GridPos[] = []) => ({
  grid,
  start,
  end,
  blocked,
  board,
});

describe('hose piece geometry', () => {
  it('rotates headings clockwise', () => {
    expect(rotateHeading('N', 1)).toBe('E');
    expect(rotateHeading('N', 3)).toBe('W');
    expect(rotateHeading('W', 1)).toBe('N');
    expect(oppositeHeading('N')).toBe('S');
  });

  it('knows the openings of each piece + rotation', () => {
    expect(openings({ piece: 'straight', rotation: 0 })).toEqual(['N', 'S']);
    expect(openings({ piece: 'straight', rotation: 1 })).toEqual(['E', 'W']);
    expect(openings({ piece: 'corner', rotation: 0 })).toEqual(['N', 'E']);
    expect(openings({ piece: 'corner', rotation: 2 })).toEqual(['S', 'W']);
    expect(hasOpening({ piece: 'corner', rotation: 2 }, 'W')).toBe(true);
    expect(hasOpening({ piece: 'corner', rotation: 2 }, 'N')).toBe(false);
    expect(exitOpening({ piece: 'corner', rotation: 2 }, 'W')).toBe('S');
    expect(exitOpening({ piece: 'corner', rotation: 2 }, 'N')).toBeNull();
  });
});

describe('traceWater', () => {
  it('connects a straight run when the piece is turned the right way', () => {
    const board = put(empty(), { row: 0, col: 1 }, { piece: 'straight', rotation: 1 });
    const path = traceWater(spec(board, { row: 0, col: 0 }, { row: 0, col: 2 }));
    expect(path).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
  });

  it('does not connect while the piece is turned the wrong way', () => {
    const board = put(empty(), { row: 0, col: 1 }, { piece: 'straight', rotation: 0 });
    expect(isConnected(spec(board, { row: 0, col: 0 }, { row: 0, col: 2 }))).toBe(false);
  });

  it('follows a corner around a bend', () => {
    const board = empty();
    put(board, { row: 0, col: 1 }, { piece: 'corner', rotation: 2 }); // open S + W
    put(board, { row: 1, col: 1 }, { piece: 'straight', rotation: 0 }); // open N + S
    const path = traceWater(spec(board, { row: 0, col: 0 }, { row: 2, col: 1 }));
    expect(path).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
    ]);
  });

  it('stops at a gap, a blocked cell or a dead end', () => {
    expect(isConnected(spec(empty(), { row: 0, col: 0 }, { row: 0, col: 2 }))).toBe(false);

    const blockedBoard = put(empty(), { row: 0, col: 1 }, { piece: 'straight', rotation: 1 });
    expect(isConnected(spec(blockedBoard, { row: 0, col: 0 }, { row: 0, col: 2 }, [{ row: 0, col: 1 }]))).toBe(false);

    // corner that turns straight back into the wall → dead end, and no infinite loop
    const deadEnd = put(empty(), { row: 0, col: 1 }, { piece: 'corner', rotation: 3 }); // open W + N
    expect(isConnected(spec(deadEnd, { row: 0, col: 0 }, { row: 0, col: 2 }))).toBe(false);
  });

  it('derives the piece each cell of a solution path needs', () => {
    expect(placementFor('N', 'S')).toEqual({ piece: 'straight', rotation: 0 });
    expect(placementFor('E', 'W')).toEqual({ piece: 'straight', rotation: 1 });
    expect(placementFor('S', 'W')).toEqual({ piece: 'corner', rotation: 2 });
    expect(placementFor('N', 'N')).toBeNull();

    const path = bfsPath(grid, { row: 0, col: 0 }, { row: 2, col: 1 }, [{ row: 1, col: 0 }]);
    expect(path).not.toBeNull();
    const placements = solutionPlacements(path ?? []);
    // rebuilding the board from the derived placements must connect
    const board = empty();
    for (const [key, placement] of placements) {
      const [row, col] = key.split(',').map(Number);
      board[cellIndex(grid, { row: row ?? 0, col: col ?? 0 })] = placement;
    }
    expect(isConnected(spec(board, { row: 0, col: 0 }, { row: 2, col: 1 }, [{ row: 1, col: 0 }]))).toBe(true);
  });

  it('handles start next to end', () => {
    expect(traceWater(spec(empty(), { row: 1, col: 0 }, { row: 1, col: 1 }))).toEqual([
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ]);
  });
});
