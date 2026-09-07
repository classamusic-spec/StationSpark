import type { ChallengeGenerator, VocabWord } from '../types';
import { masteryAdjustment } from '../adaptive';
import { wordById, wordsByCategory } from '../vocabulary';
import { clampInt, distinctIcons } from './shared';

/**
 * Food the child can count in both languages and pick out of a crowded shelf.
 * Words that borrow another word's picture (pera and durazno both use the
 * apple) are welcome here — `distinctIcons` makes sure only one of each
 * picture reaches any one shelf.
 */
const countableFood = [
  'tomato', 'apple', 'egg', 'strawberry', 'banana', 'mushroom', 'pepper', 'olive',
  'lemon', 'onion', 'carrot', 'potato', 'grape', 'tortilla', 'pear', 'chili', 'garlic', 'cookie',
];

/**
 * COUNT INGREDIENTS — put exactly what the recipe card asks for on the board.
 * The extras are real foods too, so the child has to read, not just grab —
 * and every one of them looks different from everything on the list.
 */
export const generateCountIngredients: ChallengeGenerator<'count-ingredients'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'counting');

  const needCount = ageBand === 'A' ? 2 : ageBand === 'B' ? rng.int(2, 3) : 3;
  const chosen = distinctIcons(rng.shuffle(countableFood).map(wordById)).slice(0, needCount);
  const needs = chosen.map((word: VocabWord) => {
    const count =
      ageBand === 'A'
        ? clampInt(rng.int(1, 3) + adj, 1, 4)
        : ageBand === 'B'
          ? clampInt(rng.int(2, 5) + adj, 1, 6)
          : clampInt(rng.int(3, 8) + adj, 2, 9);
    return { item: word, count };
  });

  const extraCount = ageBand === 'A' ? 2 : ageBand === 'B' ? 3 : 4;
  const extras = distinctIcons(rng.shuffle(wordsByCategory('food')), chosen).slice(0, extraCount);

  return {
    kind: 'count-ingredients',
    needs,
    extras,
    ...(ageBand === 'C' || (ageBand === 'B' && rng.chance(0.4)) ? { spokenEs: true } : {}),
  };
};
