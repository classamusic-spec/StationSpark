import type { ChallengeGenerator } from '../types';
import { wordById } from '../vocabulary';

const pantry = ['tomato', 'cheese', 'egg', 'apple', 'mushroom', 'pepper', 'olive', 'strawberry', 'banana'];

/**
 * RECIPE SCALE — more mouths at the table, so grow the recipe.
 * A and B double (serves 2 → 4, serves 3 → 6). C works at one-and-a-half
 * (serves 4 → 6) on even amounts, so every scaled amount is still a whole number.
 */
export const generateRecipeScale: ChallengeGenerator<'recipe-scale'> = (ctx) => {
  const { rng, ageBand } = ctx;

  let serves: number;
  let eating: number;
  let amounts: number[];

  const lineCount = ageBand === 'A' ? 2 : 3;
  if (ageBand === 'C') {
    serves = 4;
    eating = 6;
    amounts = Array.from({ length: lineCount }, () => rng.int(1, 4) * 2);
  } else {
    serves = ageBand === 'A' ? 2 : rng.pick([2, 3]);
    eating = serves * 2;
    amounts = Array.from({ length: lineCount }, () => rng.int(1, ageBand === 'A' ? 3 : 5));
  }

  const items = rng.shuffle(pantry).slice(0, lineCount);
  const lines = amounts.map((amount, i) => ({
    item: wordById(items[i] ?? 'tomato'),
    amount,
    scaled: (amount * eating) / serves,
  }));

  return { kind: 'recipe-scale', serves, eating, lines };
};
