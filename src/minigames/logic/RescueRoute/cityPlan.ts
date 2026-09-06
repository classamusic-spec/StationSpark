/**
 * CITY PLAN — how a rescue-route challenge is read as a town. Pure, no React.
 *
 * The spatial rule the whole game rests on:
 *
 *   • every cell the truck can enter is **road** — the streets join up, so a
 *     junction is a junction and a corner is a corner;
 *   • every `blocked` cell is a **city block** standing between those roads —
 *     a shop, a house, a park. The truck drives past them, never over them;
 *   • the goal is the road cell *outside* the destination, and `goalSide`
 *     points from that cell at the building the call came from.
 *
 * Challenges made before the town had landmarks (or hand-written in a mission
 * beat) still draw correctly: the plots are recovered from `blocked` and
 * dressed deterministically, so nothing ever renders as bare tarmac.
 */
import type { GridPos, Heading, RescueRouteChallenge, SceneId } from '@/learning/types';
import { headings, inBounds, posKey, samePos, stepForward } from '@/utils/grid';

/** One city block: a rectangle of cells with something standing on it. */
export interface BlockPlot {
  scene: SceneId;
  destination: boolean;
  /** bounding box, in cells */
  row: number;
  col: number;
  rows: number;
  cols: number;
  cells: GridPos[];
}

export interface CityPlan {
  rows: number;
  cols: number;
  /** true when the truck may stand here */
  isRoad: (p: GridPos) => boolean;
  /** the directions in which this road cell continues into another road cell */
  exits: (p: GridPos) => Heading[];
  plots: BlockPlot[];
  destination: BlockPlot | null;
  /** from the goal road cell toward the destination building */
  goalSide: Heading | null;
}

/** Dressing for a block nobody told us about (old challenge shapes). */
const fallbackScenes: SceneId[] = ['apartments', 'park', 'library', 'market', 'school', 'pet-shop', 'pizza', 'bakery'];

const boundsOf = (cells: readonly GridPos[]) => {
  const rows = cells.map((c) => c.row);
  const cols = cells.map((c) => c.col);
  const row = Math.min(...rows);
  const col = Math.min(...cols);
  return { row, col, rows: Math.max(...rows) - row + 1, cols: Math.max(...cols) - col + 1 };
};

/** Connected groups of blocked cells, in a stable order. */
function components(blocked: readonly GridPos[]): GridPos[][] {
  const left = new Map(blocked.map((c) => [posKey(c), c]));
  const groups: GridPos[][] = [];
  const ordered = [...blocked].sort((a, b) => posKey(a).localeCompare(posKey(b)));
  for (const seed of ordered) {
    if (!left.has(posKey(seed))) continue;
    const group: GridPos[] = [];
    let frontier = [seed];
    left.delete(posKey(seed));
    while (frontier.length > 0) {
      const next: GridPos[] = [];
      for (const cell of frontier) {
        group.push(cell);
        for (const h of headings) {
          const n = stepForward(cell, h);
          const found = left.get(posKey(n));
          if (!found) continue;
          left.delete(posKey(n));
          next.push(found);
        }
      }
      frontier = next;
    }
    groups.push(group);
  }
  return groups;
}

export function cityPlan(challenge: RescueRouteChallenge): CityPlan {
  const { grid, blocked, goal } = challenge;
  const walls = new Set(blocked.map(posKey));
  const isRoad = (p: GridPos) => inBounds(grid, p) && !walls.has(posKey(p));

  const groups = challenge.landmarks?.map((l) => l.cells) ?? components(blocked);

  /* which block the call came from: named by goalSide, else the one next door */
  const doorCell = challenge.goalSide
    ? stepForward(goal, challenge.goalSide)
    : (headings.map((h) => stepForward(goal, h)).find((n) => inBounds(grid, n) && walls.has(posKey(n))) ?? null);

  const plots: BlockPlot[] = groups.map((cells, i) => {
    const named = challenge.landmarks?.[i];
    const isDestination = named
      ? !!named.destination
      : !!doorCell && cells.some((c) => samePos(c, doorCell));
    return {
      scene: isDestination
        ? challenge.goalScene
        : (named?.scene ?? fallbackScenes[i % fallbackScenes.length] ?? 'apartments'),
      destination: isDestination,
      cells,
      ...boundsOf(cells),
    };
  });

  const destination = plots.find((p) => p.destination) ?? null;
  const goalSide =
    challenge.goalSide ??
    (destination ? (headings.find((h) => destination.cells.some((c) => samePos(c, stepForward(goal, h)))) ?? null) : null);

  return {
    rows: grid.rows,
    cols: grid.cols,
    isRoad,
    exits: (p) => headings.filter((h) => isRoad(stepForward(p, h))),
    plots,
    destination,
    goalSide,
  };
}
