import type { ChallengeGenerator } from '../types';
import { masteryAdjustment } from '../adaptive';
import { wordById } from '../vocabulary';
import { clampInt } from './shared';

const shareables = ['taco', 'pizza', 'apple', 'strawberry', 'banana', 'bread'];

/**
 * DIVIDE & SHARE — everybody gets the same. `total` always divides by `among`,
 * so nobody is left holding half a taco.
 */
export const generateDivideShare: ChallengeGenerator<'divide-share'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'division');
  const item = wordById(rng.pick(shareables));

  let among: number;
  let each: number;
  if (ageBand === 'A') {
    among = 2;
    each = clampInt(rng.int(2, 5) + adj, 1, 6);
  } else if (ageBand === 'B') {
    among = rng.int(2, 4);
    each = clampInt(rng.int(2, 6) + adj, 1, 7);
  } else {
    among = rng.int(3, 6);
    each = clampInt(rng.int(3, 8) + adj, 2, 9);
  }

  return { kind: 'divide-share', item, total: among * each, among, each };
};
