import type { ChallengeGenerator, Fraction } from '../types';
import { wordById } from '../vocabulary';

const cupIngredients = ['flour', 'milk', 'water', 'sugar'];
const spoonIngredients = ['sugar', 'butter', 'basil'];

/**
 * MEASURE & POUR — fill the cup to the line.
 * `target` is always a whole number of `step` pours, and `step` is 1/`ticks`,
 * so the marks on the jug are exactly the pours the child can make.
 */
export const generateMeasurePour: ChallengeGenerator<'measure-pour'> = (ctx) => {
  const { rng, ageBand } = ctx;

  const unit: 'cup' | 'spoon' = ageBand === 'A' ? 'cup' : rng.chance(0.7) ? 'cup' : 'spoon';
  const ingredient = wordById(rng.pick(unit === 'cup' ? cupIngredients : spoonIngredients));

  let ticks: 2 | 4;
  let target: Fraction;
  if (ageBand === 'A') {
    ticks = 2;
    target = { num: rng.int(1, 3), den: 2 };
  } else if (ageBand === 'B') {
    ticks = 4;
    target = { num: rng.int(1, 6), den: 4 };
  } else {
    ticks = 4;
    target = { num: rng.int(3, 8), den: 4 };
  }
  const step: Fraction = { num: 1, den: ticks };

  return { kind: 'measure-pour', ingredient, target, unit, ticks, step };
};
