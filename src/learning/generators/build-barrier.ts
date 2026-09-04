import type { ChallengeGenerator } from '../types';
import { masteryAdjustment } from '../adaptive';
import { subsetSolutions } from '../solvers';
import { buildSumPieces, clampInt } from './shared';

/**
 * BUILD BARRIER — lay sandbags that exactly fill the gap so the puddle stops.
 * Same solution shape as ladder-builder: values first, indices alongside.
 */
export const generateBuildBarrier: ChallengeGenerator<'build-barrier'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'addition', 'geometry');

  let target: number;
  let pieceCount: number;
  if (ageBand === 'A') {
    target = clampInt(rng.int(6, 10) + adj, 4, 12);
    pieceCount = 4;
  } else if (ageBand === 'B') {
    target = clampInt(rng.int(12, 22) + adj * 3, 8, 26);
    pieceCount = 5;
  } else {
    target = clampInt(rng.int(22, 40) + adj * 4, 16, 46);
    pieceCount = 6;
  }

  const pieces = buildSumPieces(rng, target, pieceCount, Math.max(2, Math.floor(target / 2)));
  const found = subsetSolutions(pieces, target);

  return {
    kind: 'build-barrier',
    target,
    pieces,
    solutions: found.map((s) => s.values),
    solutionIndices: found.map((s) => s.indices),
  };
};
