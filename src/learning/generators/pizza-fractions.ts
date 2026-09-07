import type { AgeBand, ChallengeGenerator, Fraction, ToppingId } from '../types';

const toppingIds: ToppingId[] = ['cheese', 'tomato', 'pepper', 'mushroom', 'olive', 'basil'];

/**
 * One way to dress and cut a pizza.
 *
 * Three promises hold for every row below, and `validateChallenge` re-checks
 * all three on every generated pizza:
 *   1. the topping fractions add up to exactly one whole pizza,
 *   2. each topping lands on a whole number of slices (num × cutInto ÷ den),
 *   3. `cutInto` divides by every `shareAmong`, so nobody gets half a slice.
 */
interface PizzaPlan {
  parts: Fraction[];
  cutInto: number;
  shareAmong: number[];
}

const half: Fraction = { num: 1, den: 2 };
const quarter: Fraction = { num: 1, den: 4 };
const eighth: Fraction = { num: 1, den: 8 };
const third: Fraction = { num: 1, den: 3 };

/**
 * A  halves only, cut into four and shared with one friend.
 * B  a half and two quarters, cut into eight.
 * C  eighths, thirds and the two-thirds/one-third split — the first time a
 *    numerator other than one appears on the pie.
 */
const plans: Record<AgeBand, PizzaPlan[]> = {
  A: [
    { parts: [half, half], cutInto: 4, shareAmong: [2] },
    { parts: [half, half], cutInto: 2, shareAmong: [2] },
    { parts: [half, half], cutInto: 6, shareAmong: [2, 3] },
  ],
  B: [
    { parts: [half, quarter, quarter], cutInto: 8, shareAmong: [2, 4] },
    { parts: [quarter, quarter, quarter, quarter], cutInto: 8, shareAmong: [2, 4] },
    { parts: [half, half], cutInto: 8, shareAmong: [2, 4] },
    { parts: [half, quarter, quarter], cutInto: 4, shareAmong: [2, 4] },
  ],
  C: [
    { parts: [half, quarter, eighth, eighth], cutInto: 8, shareAmong: [2, 4] },
    { parts: [third, third, third], cutInto: 12, shareAmong: [3, 4, 6] },
    { parts: [{ num: 2, den: 3 }, third], cutInto: 12, shareAmong: [3, 4, 6] },
    { parts: [half, eighth, eighth, eighth, eighth], cutInto: 8, shareAmong: [2, 4, 8] },
    { parts: [{ num: 3, den: 4 }, quarter], cutInto: 12, shareAmong: [2, 3, 4, 6] },
    { parts: [quarter, quarter, quarter, eighth, eighth], cutInto: 8, shareAmong: [2, 4] },
  ],
};

/**
 * PIZZA FRACTIONS — dress the pizza, then cut and share it.
 * The topping fractions always add up to exactly one whole pizza, every topping
 * lands on a whole number of slices, and `cutInto` divides by `shareAmong`.
 */
export const generatePizzaFractions: ChallengeGenerator<'pizza-fractions'> = (ctx) => {
  const { rng, ageBand } = ctx;

  const plan = rng.pick(plans[ageBand]);
  const shareAmong = rng.pick(plan.shareAmong);
  const chosen = rng.shuffle(toppingIds).slice(0, plan.parts.length);
  const toppings = plan.parts.map((fraction, i) => ({ topping: chosen[i] ?? 'cheese', fraction }));

  return {
    kind: 'pizza-fractions',
    toppings,
    cutInto: plan.cutInto,
    shareAmong,
    each: plan.cutInto / shareAmong,
  };
};
