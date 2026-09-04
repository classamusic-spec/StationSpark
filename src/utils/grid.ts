/**
 * GRID & ROUTE HELPERS — pure, deterministic, no React.
 *
 * Used by the route/hose generators and by their tests to PROVE that every
 * generated challenge is solvable.
 *
 * Route command semantics (shared by RescueRoute the game and these solvers):
 *   forward      move one cell in the current heading (must stay in bounds and
 *                off blocked cells)
 *   left         turn 90° counter-clockwise, stay put
 *   right        turn 90° clockwise, stay put
 *   turn-around  turn 180°, stay put
 * Every command costs 1 toward `maxCommands`.
 */
import type { GridPos, Heading, HosePiece, RouteCommand } from '@/learning/types';

export interface GridSize {
  rows: number;
  cols: number;
}

export const headings: readonly Heading[] = ['N', 'E', 'S', 'W'];

const delta: Record<Heading, GridPos> = {
  N: { row: -1, col: 0 },
  E: { row: 0, col: 1 },
  S: { row: 1, col: 0 },
  W: { row: 0, col: -1 },
};

export const samePos = (a: GridPos, b: GridPos): boolean => a.row === b.row && a.col === b.col;

export const posKey = (p: GridPos): string => `${p.row},${p.col}`;

export const inBounds = (grid: GridSize, p: GridPos): boolean =>
  p.row >= 0 && p.row < grid.rows && p.col >= 0 && p.col < grid.cols;

export const blockedSet = (blocked: readonly GridPos[]): Set<string> => new Set(blocked.map(posKey));

export const cellCount = (grid: GridSize): number => grid.rows * grid.cols;

/** Every cell of the grid, row-major. */
export function allCells(grid: GridSize): GridPos[] {
  const out: GridPos[] = [];
  for (let row = 0; row < grid.rows; row++) for (let col = 0; col < grid.cols; col++) out.push({ row, col });
  return out;
}

export function stepForward(p: GridPos, h: Heading): GridPos {
  const d = delta[h];
  return { row: p.row + d.row, col: p.col + d.col };
}

export function turn(h: Heading, cmd: 'left' | 'right' | 'turn-around'): Heading {
  const i = headings.indexOf(h);
  const shift = cmd === 'right' ? 1 : cmd === 'left' ? 3 : 2;
  return headings[(i + shift) % 4] ?? h;
}

/** Heading that points from `a` to the orthogonally adjacent `b`. */
export function headingBetween(a: GridPos, b: GridPos): Heading | null {
  if (a.row === b.row && b.col === a.col + 1) return 'E';
  if (a.row === b.row && b.col === a.col - 1) return 'W';
  if (a.col === b.col && b.row === a.row + 1) return 'S';
  if (a.col === b.col && b.row === a.row - 1) return 'N';
  return null;
}

export function neighbors(grid: GridSize, p: GridPos, blocked: Set<string>): GridPos[] {
  const out: GridPos[] = [];
  for (const h of headings) {
    const n = stepForward(p, h);
    if (inBounds(grid, n) && !blocked.has(posKey(n))) out.push(n);
  }
  return out;
}

/**
 * Breadth-first shortest cell path from `start` to `goal` avoiding `blocked`.
 * Returns the path INCLUDING both ends, or null when no path exists.
 */
export function bfsPath(
  grid: GridSize,
  start: GridPos,
  goal: GridPos,
  blocked: readonly GridPos[] = [],
): GridPos[] | null {
  const walls = blockedSet(blocked);
  if (!inBounds(grid, start) || !inBounds(grid, goal)) return null;
  if (walls.has(posKey(start)) || walls.has(posKey(goal))) return null;
  if (samePos(start, goal)) return [start];

  const parents = new Map<string, GridPos>();
  const seen = new Set<string>([posKey(start)]);
  let frontier: GridPos[] = [start];

  while (frontier.length > 0) {
    const next: GridPos[] = [];
    for (const cell of frontier) {
      for (const n of neighbors(grid, cell, walls)) {
        const key = posKey(n);
        if (seen.has(key)) continue;
        seen.add(key);
        parents.set(key, cell);
        if (samePos(n, goal)) {
          const path: GridPos[] = [n];
          let cursor: GridPos | undefined = cell;
          while (cursor) {
            path.push(cursor);
            cursor = parents.get(posKey(cursor));
          }
          return path.reverse();
        }
        next.push(n);
      }
    }
    frontier = next;
  }
  return null;
}

/** Number of steps in the shortest path (null when unreachable). */
export function pathDistance(
  grid: GridSize,
  start: GridPos,
  goal: GridPos,
  blocked: readonly GridPos[] = [],
): number | null {
  const path = bfsPath(grid, start, goal, blocked);
  return path ? path.length - 1 : null;
}

/* ------------------------------------------------------------------ */
/* Rescue-route: commands                                              */
/* ------------------------------------------------------------------ */

export interface RouteSpec {
  grid: GridSize;
  start: GridPos;
  startHeading: Heading;
  goal: GridPos;
  blocked: readonly GridPos[];
}

const routeCommands: readonly RouteCommand[] = ['forward', 'left', 'right', 'turn-around'];

/**
 * Shortest command list (forward/left/right/turn-around) that drives the truck
 * from start to goal. BFS over (position, heading) — every command costs 1.
 */
export function solveRoute(spec: RouteSpec): RouteCommand[] | null {
  const walls = blockedSet(spec.blocked);
  if (!inBounds(spec.grid, spec.start) || !inBounds(spec.grid, spec.goal)) return null;
  if (walls.has(posKey(spec.start)) || walls.has(posKey(spec.goal))) return null;
  if (samePos(spec.start, spec.goal)) return [];

  interface Node {
    pos: GridPos;
    heading: Heading;
  }
  const key = (n: Node) => `${n.pos.row},${n.pos.col},${n.heading}`;
  const startNode: Node = { pos: spec.start, heading: spec.startHeading };
  const parents = new Map<string, { from: string; via: RouteCommand }>();
  const nodes = new Map<string, Node>([[key(startNode), startNode]]);
  const seen = new Set<string>([key(startNode)]);
  let frontier: Node[] = [startNode];

  while (frontier.length > 0) {
    const next: Node[] = [];
    for (const node of frontier) {
      for (const cmd of routeCommands) {
        let moved: Node;
        if (cmd === 'forward') {
          const ahead = stepForward(node.pos, node.heading);
          if (!inBounds(spec.grid, ahead) || walls.has(posKey(ahead))) continue;
          moved = { pos: ahead, heading: node.heading };
        } else {
          moved = { pos: node.pos, heading: turn(node.heading, cmd) };
        }
        const k = key(moved);
        if (seen.has(k)) continue;
        seen.add(k);
        nodes.set(k, moved);
        parents.set(k, { from: key(node), via: cmd });
        if (samePos(moved.pos, spec.goal)) {
          const out: RouteCommand[] = [];
          let cursor: string | undefined = k;
          while (cursor) {
            const edge: { from: string; via: RouteCommand } | undefined = parents.get(cursor);
            if (!edge) break;
            out.push(edge.via);
            cursor = edge.from;
          }
          return out.reverse();
        }
        next.push(moved);
      }
    }
    frontier = next;
  }
  return null;
}

export interface RouteRun {
  pos: GridPos;
  heading: Heading;
  /** false when a forward ran into a wall or off the map */
  ok: boolean;
  reachedGoal: boolean;
}

/** Replay a command list; used by the game and by tests. */
export function applyRoute(spec: RouteSpec, commands: readonly RouteCommand[]): RouteRun {
  const walls = blockedSet(spec.blocked);
  let pos = spec.start;
  let heading = spec.startHeading;
  let ok = true;
  for (const cmd of commands) {
    if (cmd === 'forward') {
      const ahead = stepForward(pos, heading);
      if (!inBounds(spec.grid, ahead) || walls.has(posKey(ahead))) {
        ok = false;
        break;
      }
      pos = ahead;
    } else {
      heading = turn(heading, cmd);
    }
  }
  return { pos, heading, ok, reachedGoal: ok && samePos(pos, spec.goal) };
}

/** Turn a cell path into the command list that drives it (turns then forwards). */
export function commandsForPath(path: readonly GridPos[], startHeading: Heading): RouteCommand[] {
  const out: RouteCommand[] = [];
  let heading = startHeading;
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    if (!from || !to) break;
    const want = headingBetween(from, to);
    if (!want) break;
    if (want !== heading) {
      if (turn(heading, 'right') === want) out.push('right');
      else if (turn(heading, 'left') === want) out.push('left');
      else out.push('turn-around');
      heading = want;
    }
    out.push('forward');
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Hose-path: piece budget                                             */
/* ------------------------------------------------------------------ */

export interface PieceCount {
  straight: number;
  corner: number;
}

/** Pieces the interior cells of a path need (start + end are fixed fittings). */
export function pathPieces(path: readonly GridPos[]): PieceCount {
  const count: PieceCount = { straight: 0, corner: 0 };
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const cell = path[i];
    const next = path[i + 1];
    if (!prev || !cell || !next) continue;
    const inDir = headingBetween(prev, cell);
    const outDir = headingBetween(cell, next);
    if (!inDir || !outDir) continue;
    if (inDir === outDir) count.straight += 1;
    else count.corner += 1;
  }
  return count;
}

export const countPieces = (pieces: readonly HosePiece[]): PieceCount => ({
  straight: pieces.filter((p) => p === 'straight').length,
  corner: pieces.filter((p) => p === 'corner').length,
});

export interface HosePathSpec {
  grid: GridSize;
  start: GridPos;
  end: GridPos;
  blocked: readonly GridPos[];
  pieces: readonly HosePiece[];
}

/**
 * Find a simple path from start to end whose interior cells can be built with
 * (at most) the pieces the child was given. Depth-first with a piece budget —
 * grids stay small (≤ 6×6) so this is instant.
 */
export function solveHosePath(spec: HosePathSpec): GridPos[] | null {
  const walls = blockedSet(spec.blocked);
  if (!inBounds(spec.grid, spec.start) || !inBounds(spec.grid, spec.end)) return null;
  if (walls.has(posKey(spec.start)) || walls.has(posKey(spec.end))) return null;
  if (samePos(spec.start, spec.end)) return [spec.start];

  const budget = countPieces(spec.pieces);
  const maxInterior = spec.pieces.length;
  const visited = new Set<string>([posKey(spec.start)]);
  const path: GridPos[] = [spec.start];

  const walk = (cell: GridPos, used: PieceCount): GridPos[] | null => {
    for (const next of neighbors(spec.grid, cell, walls)) {
      if (visited.has(posKey(next))) continue;
      // The cell we are leaving becomes a piece (unless it is the start fitting).
      const nextUsed: PieceCount = { ...used };
      if (path.length > 1) {
        const prev = path[path.length - 2];
        const inDir = prev ? headingBetween(prev, cell) : null;
        const outDir = headingBetween(cell, next);
        if (!inDir || !outDir) continue;
        if (inDir === outDir) nextUsed.straight += 1;
        else nextUsed.corner += 1;
        if (nextUsed.straight > budget.straight || nextUsed.corner > budget.corner) continue;
        if (nextUsed.straight + nextUsed.corner > maxInterior) continue;
      }
      visited.add(posKey(next));
      path.push(next);
      if (samePos(next, spec.end)) return [...path];
      const found = walk(next, nextUsed);
      if (found) return found;
      path.pop();
      visited.delete(posKey(next));
    }
    return null;
  };

  return walk(spec.start, { straight: 0, corner: 0 });
}
