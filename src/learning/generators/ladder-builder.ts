import type { AnimalId, ChallengeGenerator } from '../types';
import { masteryAdjustment } from '../adaptive';
import { subsetSolutions } from '../solvers';
import { buildSumPieces, clampInt } from './shared';

/**
 * LADDER BUILDER — pick rungs that add up to the height the animal is stuck at.
 * `solutions` holds combinations of piece VALUES that sum to `target`;
 * `solutionIndices` is the same list as indices into `pieces`.
 */
export const generateLadderBuilder: ChallengeGenerator<'ladder-builder'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'addition');

  const animals: AnimalId[] = ageBand === 'A' ? ['kitten', 'puppy', 'bunny'] : ['kitten', 'puppy', 'bunny', 'turtle', 'duckling'];
  const animal = rng.pick(animals);

  let target: number;
  let pieceCount: number;
  if (ageBand === 'A') {
    target = clampInt(rng.int(5, 10) + adj, 4, 12);
    pieceCount = 4;
  } else if (ageBand === 'B') {
    target = clampInt(rng.int(11, 20) + adj * 3, 8, 24);
    pieceCount = 5;
  } else {
    target = clampInt(rng.int(18, 30) + adj * 4, 14, 36);
    pieceCount = 6;
  }

  const pieces = buildSumPieces(rng, target, pieceCount, Math.max(2, Math.floor(target / 2)));
  const found = subsetSolutions(pieces, target);
  const requiredSolutions: 1 | 2 = ageBand === 'C' && found.length >= 2 ? 2 : 1;

  return {
    kind: 'ladder-builder',
    target,
    pieces,
    solutions: found.map((s) => s.values),
    solutionIndices: found.map((s) => s.indices),
    requiredSolutions,
    animal,
  };
};
