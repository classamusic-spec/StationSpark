import type { ChallengeGenerator } from '../types';
import { masteryAdjustment } from '../adaptive';
import { wordById } from '../vocabulary';
import { clampInt } from './shared';

/**
 * The pot's cooking order — the onions soften first, the herbs and the lime go
 * in last. We take a subsequence of it and keep the relative order, exactly the
 * way `signals` takes the first N steps of the call-out routine, so the order
 * the child is asked for is always a sensible one a cook would recognise.
 *
 * Everything here counts cleanly in BOTH languages ("three carrots" / "tres
 * zanahorias"), which is why corn, rice and salt sit on the counter as extras
 * instead of in the pot: "two corn" is not a sentence.
 */
const potOrder = ['onion', 'carrot', 'potato', 'tomato', 'pepper', 'mushroom', 'lemon'];

/** Food that belongs to another dish — the reason the child has to read, not grab. */
const counterExtras = ['strawberry', 'banana', 'apple', 'grape', 'watermelon', 'corn', 'olive'];

/**
 * SOUP POT — put the ingredients in the pot in the right order.
 *
 * A: three steps, one or two of each.  B: four steps, up to three.
 * C: five steps, and the pot asks how many pieces went in altogether — the
 * addition the kitchen never used to reach.
 */
export const generateSoupPot: ChallengeGenerator<'soup-pot'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'counting', 'sequencing');

  const stepCount = ageBand === 'A' ? 3 : ageBand === 'B' ? 4 : 5;
  const keep = rng
    .shuffle(potOrder.map((_, i) => i))
    .slice(0, stepCount)
    .sort((a, b) => a - b);

  const steps = keep
    .map((i) => potOrder[i])
    .filter((id): id is string => id !== undefined)
    .map((id) => ({
      item: wordById(id),
      count:
        ageBand === 'A'
          ? clampInt(rng.int(1, 2) + adj, 1, 3)
          : ageBand === 'B'
            ? clampInt(rng.int(1, 3) + adj, 1, 4)
            : clampInt(rng.int(2, 3) + adj, 1, 4),
    }));

  const extras = rng.shuffle(counterExtras.filter((id) => !keep.some((i) => potOrder[i] === id)))
    .slice(0, ageBand === 'A' ? 2 : 3)
    .map(wordById);

  const total = steps.reduce((sum, s) => sum + s.count, 0);

  return {
    kind: 'soup-pot',
    steps,
    extras,
    ...(ageBand === 'C' || (ageBand === 'B' && rng.chance(0.4)) ? { spokenEs: true } : {}),
    ...(ageBand === 'C' ? { askTotal: total } : {}),
  };
};
