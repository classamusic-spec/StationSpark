import type { ChallengeGenerator, Fraction, ToppingId } from '../types';

const toppingIds: ToppingId[] = ['cheese', 'tomato', 'pepper', 'mushroom', 'olive', 'basil'];

/**
 * PIZZA FRACTIONS — dress the pizza, then cut and share it.
 * The topping fractions always add up to exactly one whole pizza, every topping
 * lands on a whole number of slices, and `cutInto` divides by `shareAmong`.
 */
export const generatePizzaFractions: ChallengeGenerator<'pizza-fractions'> = (ctx) => {
  const { rng, ageBand } = ctx;

  let parts: Fraction[];
  let cutInto: number;
  let shareAmong: number;

  if (ageBand === 'A') {
    parts = [
      { num: 1, den: 2 },
      { num: 1, den: 2 },
    ];
    cutInto = 4;
    shareAmong = 2;
  } else if (ageBand === 'B') {
    parts = [
      { num: 1, den: 2 },
      { num: 1, den: 4 },
      { num: 1, den: 4 },
    ];
    cutInto = 8;
    shareAmong = rng.pick([2, 4]);
  } else if (rng.chance(0.5)) {
    parts = [
      { num: 1, den: 2 },
      { num: 1, den: 4 },
      { num: 1, den: 8 },
      { num: 1, den: 8 },
    ];
    cutInto = 8;
    shareAmong = rng.pick([2, 4]);
  } else {
    parts = [
      { num: 1, den: 3 },
      { num: 1, den: 3 },
      { num: 1, den: 3 },
    ];
    cutInto = 12;
    shareAmong = rng.pick([3, 4, 6]);
  }

  const chosen = rng.shuffle(toppingIds).slice(0, parts.length);
  const toppings = parts.map((fraction, i) => ({ topping: chosen[i] ?? 'cheese', fraction }));

  return { kind: 'pizza-fractions', toppings, cutInto, shareAmong, each: cutInto / shareAmong };
};
