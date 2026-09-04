import type { ChallengeGenerator } from '../types';
import { masteryAdjustment } from '../adaptive';
import { solveNumberLadder } from '../solvers';
import { clampInt } from './shared';

/**
 * NUMBER LADDER — hop up and down the ladder to reach the rescue rung.
 * Guaranteed reachable: we BFS the ladder before handing it over.
 */
export const generateNumberLadder: ChallengeGenerator<'number-ladder'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'addition', 'subtraction', 'number-recognition');

  let min = 1;
  let max = 20;
  let jumps = [1, 2];
  let start = rng.int(1, 12);
  let distance = clampInt(rng.int(2, 8) + adj * 2, 2, 12);

  if (ageBand === 'B') {
    min = 0;
    max = 100;
    jumps = [1, 5, 10];
    start = rng.int(5, 60);
    distance = clampInt(rng.int(6, 30) + adj * 5, 4, 45);
  } else if (ageBand === 'C') {
    min = 0;
    max = 100;
    jumps = rng.chance(0.5) ? [2, 5, 10] : [3, 5, 10];
    start = rng.int(4, 60);
    distance = clampInt(rng.int(14, 45) + adj * 6, 8, 60);
  }

  const up = rng.chance(0.6);
  const smallestJump = Math.min(...jumps);
  let target = clampInt(start + (up ? distance : -distance), min, max);
  if (target === start) {
    target = start + smallestJump <= max ? start + smallestJump : start - smallestJump;
  }
  target = clampInt(target, min, max);

  let ladder = { kind: 'number-ladder' as const, start, target, min, max, jumps };
  if (!solveNumberLadder(ladder)) {
    // Safety net: a ladder with a rung of 1 can always be climbed.
    ladder = { ...ladder, jumps: [1, ...jumps.filter((j) => j !== 1)] };
  }
  return ladder;
};
