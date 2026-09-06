/**
 * HOSE PATH CONNECTIVITY — pure, no React.
 *
 * The board is row-major. `start` holds the hydrant fitting and `end` holds the
 * target (the flame); both accept water from any side. Every other cell on the
 * path must contain a piece whose two openings line up with its neighbours.
 *
 * Rotations are quarter-turns clockwise:
 *   straight @0 = N–S,  @1 = E–W
 *   corner   @0 = N–E,  @1 = E–S,  @2 = S–W,  @3 = W–N
 */
import type { GridPos, Heading, HosePiece } from '@/learning/types';
import { headingBetween, headings, inBounds, posKey, samePos, stepForward, type GridSize } from '@/utils/grid';

export type Rotation = 0 | 1 | 2 | 3;

export interface PlacedPiece {
  piece: HosePiece;
  rotation: Rotation;
}

/** Row-major board; `null` = empty cell. */
export type HoseBoard = readonly (PlacedPiece | null)[];

export interface HoseBoardSpec {
  grid: GridSize;
  start: GridPos;
  end: GridPos;
  blocked: readonly GridPos[];
  board: HoseBoard;
}

export const cellIndex = (grid: GridSize, p: GridPos): number => p.row * grid.cols + p.col;

export function rotateHeading(h: Heading, quarterTurns: number): Heading {
  const i = headings.indexOf(h);
  const next = headings[(i + ((quarterTurns % 4) + 4)) % 4];
  return next ?? h;
}

export const oppositeHeading = (h: Heading): Heading => rotateHeading(h, 2);

const BASE: Record<HosePiece, [Heading, Heading]> = {
  straight: ['N', 'S'],
  corner: ['N', 'E'],
};

/** The two directions a piece is open in. */
export function openings(p: PlacedPiece): [Heading, Heading] {
  const base = BASE[p.piece];
  return [rotateHeading(base[0], p.rotation), rotateHeading(base[1], p.rotation)];
}

export function hasOpening(p: PlacedPiece, dir: Heading): boolean {
  const [a, b] = openings(p);
  return a === dir || b === dir;
}

/** Given the opening water came in through, where it leaves (pieces have 2 ends). */
export function exitOpening(p: PlacedPiece, entry: Heading): Heading | null {
  const [a, b] = openings(p);
  if (a === entry) return b;
  if (b === entry) return a;
  return null;
}

export function pieceAt(spec: HoseBoardSpec, p: GridPos): PlacedPiece | null {
  if (!inBounds(spec.grid, p)) return null;
  return spec.board[cellIndex(spec.grid, p)] ?? null;
}

/**
 * Follow the water from the hydrant. Returns the ordered list of cells the
 * water fills (start … end) or null when the line is not connected yet.
 */
export function traceWater(spec: HoseBoardSpec): GridPos[] | null {
  const walls = new Set(spec.blocked.map(posKey));
  if (!inBounds(spec.grid, spec.start) || !inBounds(spec.grid, spec.end)) return null;
  if (samePos(spec.start, spec.end)) return [spec.start];

  for (const dir of headings) {
    const path: GridPos[] = [spec.start];
    const seen = new Set<string>([posKey(spec.start)]);
    let heading: Heading = dir;
    let cell = stepForward(spec.start, heading);
    let ok = true;

    while (ok) {
      if (!inBounds(spec.grid, cell) || walls.has(posKey(cell)) || seen.has(posKey(cell))) {
        ok = false;
        break;
      }
      if (samePos(cell, spec.end)) {
        path.push(cell);
        return path;
      }
      const piece = pieceAt(spec, cell);
      if (!piece) {
        ok = false;
        break;
      }
      const entry = oppositeHeading(heading); // the side the water arrives on
      const exit = exitOpening(piece, entry);
      if (!exit) {
        ok = false;
        break;
      }
      seen.add(posKey(cell));
      path.push(cell);
      heading = exit;
      cell = stepForward(cell, heading);
    }
  }
  return null;
}

export const isConnected = (spec: HoseBoardSpec): boolean => traceWater(spec) !== null;

/** The piece + rotation whose two ends point in exactly these directions. */
export function placementFor(a: Heading, b: Heading): PlacedPiece | null {
  const wanted = [a, b].sort().join('');
  for (const piece of ['straight', 'corner'] as const) {
    for (const rotation of [0, 1, 2, 3] as const) {
      const [x, y] = openings({ piece, rotation });
      if ([x, y].sort().join('') === wanted) return { piece, rotation };
    }
  }
  return null;
}

/**
 * The piece each interior cell of `path` needs, keyed by "row,col".
 * Powers the "put a corner here" hint.
 */
export function solutionPlacements(path: readonly GridPos[]): Map<string, PlacedPiece> {
  const out = new Map<string, PlacedPiece>();
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const cell = path[i];
    const next = path[i + 1];
    if (!prev || !cell || !next) continue;
    const inDir = headingBetween(prev, cell);
    const outDir = headingBetween(cell, next);
    if (!inDir || !outDir) continue;
    const placement = placementFor(oppositeHeading(inDir), outDir);
    if (placement) out.set(posKey(cell), placement);
  }
  return out;
}

/** Cells that carry water right now (for the "already flowing" preview). */
export function waterCells(spec: HoseBoardSpec): GridPos[] {
  return traceWater(spec) ?? [];
}
