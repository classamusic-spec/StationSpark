import type { AnimalId, ChallengeGenerator } from '../types';
import { masteryAdjustment } from '../adaptive';
import { clampInt, sceneOr } from './shared';

/**
 * RESCUE PETS — carry every wriggly friend back to the crate.
 * Nobody is ever hurt: the animals are simply somewhere they cannot get down from.
 */
export const generateRescuePets: ChallengeGenerator<'rescue-pets'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'counting', 'subtraction');
  const animals: AnimalId[] = ['kitten', 'puppy', 'bunny', 'duckling', 'turtle'];

  let total: number;
  let alreadySafe: number;
  if (ageBand === 'A') {
    total = clampInt(rng.int(3, 5) + adj, 2, 6);
    alreadySafe = 0;
  } else if (ageBand === 'B') {
    total = clampInt(rng.int(5, 8) + adj, 3, 10);
    alreadySafe = rng.int(0, 2);
  } else {
    total = clampInt(rng.int(7, 12) + adj * 2, 5, 14);
    alreadySafe = rng.int(1, 4);
  }
  alreadySafe = clampInt(alreadySafe, 0, total - 1);

  return {
    kind: 'rescue-pets',
    animal: rng.pick(animals),
    total,
    alreadySafe,
    scene: sceneOr(ctx, 'park'),
  };
};
