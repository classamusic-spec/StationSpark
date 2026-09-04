/**
 * SOLVERS — pure checks the generators use to guarantee a challenge is solvable,
 * and that the tests use to prove it independently.
 * (Grid/route/hose solvers live in `@/utils/grid`.)
 */

export interface SubsetSolution {
  /** the piece values, in `pieces` order */
  values: number[];
  /** the same pieces as indices into `pieces` */
  indices: number[];
}

/**
 * Every distinct combination of pieces that sums to `target`.
 * Combinations with the same multiset of values count once (a child cannot tell
 * two identical rungs apart), and the list is capped so huge sets stay cheap.
 */
export function subsetSolutions(pieces: readonly number[], target: number, limit = 32): SubsetSolution[] {
  const n = Math.min(pieces.length, 16);
  const out: SubsetSolution[] = [];
  const seen = new Set<string>();
  for (let mask = 1; mask < 1 << n; mask++) {
    let sum = 0;
    const values: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) === 0) continue;
      const value = pieces[i];
      if (value === undefined) continue;
      sum += value;
      values.push(value);
      indices.push(i);
      if (sum > target) break;
    }
    if (sum !== target) continue;
    const key = [...values].sort((a, b) => a - b).join('+');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ values, indices });
    if (out.length >= limit) break;
  }
  return out;
}

export const sumOf = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

/** True when `values` can be taken from the `pieces` multiset. */
export function isSubMultiset(values: readonly number[], pieces: readonly number[]): boolean {
  const bag = new Map<number, number>();
  for (const p of pieces) bag.set(p, (bag.get(p) ?? 0) + 1);
  for (const v of values) {
    const left = bag.get(v) ?? 0;
    if (left === 0) return false;
    bag.set(v, left - 1);
  }
  return true;
}

export interface NumberLadderSpec {
  start: number;
  target: number;
  min: number;
  max: number;
  jumps: readonly number[];
}

/**
 * Shortest list of signed jumps that walks `start` → `target` without leaving
 * [min,max]. Returns null when the ladder is unreachable.
 */
export function solveNumberLadder(spec: NumberLadderSpec): number[] | null {
  const { start, target, min, max, jumps } = spec;
  if (start < min || start > max || target < min || target > max) return null;
  if (start === target) return [];
  const parents = new Map<number, { from: number; jump: number }>();
  const seen = new Set<number>([start]);
  let frontier = [start];
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const value of frontier) {
      for (const jump of jumps) {
        for (const signed of [jump, -jump]) {
          const to = value + signed;
          if (to < min || to > max || seen.has(to)) continue;
          seen.add(to);
          parents.set(to, { from: value, jump: signed });
          if (to === target) {
            const path: number[] = [];
            let cursor = to;
            let edge = parents.get(cursor);
            while (edge) {
              path.push(edge.jump);
              cursor = edge.from;
              edge = parents.get(cursor);
            }
            return path.reverse();
          }
          next.push(to);
        }
      }
    }
    frontier = next;
  }
  return null;
}
