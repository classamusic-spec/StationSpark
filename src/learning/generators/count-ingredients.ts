import type { ChallengeGenerator, VocabWord } from '../types';
import { masteryAdjustment } from '../adaptive';
import { randomWords, wordById } from '../vocabulary';
import { clampInt } from './shared';

const countableFood = ['tomato', 'apple', 'egg', 'strawberry', 'banana', 'mushroom', 'pepper', 'olive'];

/**
 * COUNT INGREDIENTS — put exactly what the recipe card asks for on the board.
 * The extras are real foods too, so the child has to read, not just grab.
 */
export const generateCountIngredients: ChallengeGenerator<'count-ingredients'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'counting');

  const needCount = ageBand === 'A' ? 2 : ageBand === 'B' ? rng.int(2, 3) : 3;
  const chosen = rng.shuffle(countableFood).slice(0, needCount);
  const needs = chosen.map((id) => {
    const word: VocabWord = wordById(id);
    const count =
      ageBand === 'A'
        ? clampInt(rng.int(1, 3) + adj, 1, 4)
        : ageBand === 'B'
          ? clampInt(rng.int(2, 5) + adj, 1, 6)
          : clampInt(rng.int(3, 8) + adj, 2, 9);
    return { item: word, count };
  });

  const extraCount = ageBand === 'A' ? 2 : ageBand === 'B' ? 3 : 4;
  const extras = randomWords(rng, extraCount, 'food', chosen);

  return {
    kind: 'count-ingredients',
    needs,
    extras,
    ...(ageBand === 'C' || (ageBand === 'B' && rng.chance(0.4)) ? { spokenEs: true } : {}),
  };
};
