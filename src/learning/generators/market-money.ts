import type { AgeBand, ChallengeGenerator, VocabWord } from '../types';
import { masteryAdjustment } from '../adaptive';
import { subsetSolutions } from '../solvers';
import { wordById } from '../vocabulary';
import { byBand, clampInt } from './shared';

/** What the Farmers Market stall sells (all drawn by VocabIcon). */
const stallIds: readonly string[] = [
  'apple',
  'banana',
  'strawberry',
  'tomato',
  'pepper',
  'mushroom',
  'bread',
  'cheese',
  'egg',
  'milk',
  'olive',
  'basil',
];

/** Purses are built from real coin values so counting on transfers to real money. */
const purses: Record<AgeBand, number[][]> = {
  A: [
    [1, 1, 1, 1, 5, 5],
    [1, 1, 1, 5, 5, 5],
  ],
  B: [
    [1, 1, 1, 5, 5, 10, 10, 25],
    [1, 1, 1, 1, 5, 10, 10, 25],
  ],
  C: [
    [1, 1, 1, 5, 5, 10, 10, 25, 25],
    [1, 1, 1, 1, 5, 5, 10, 25, 25],
  ],
};

/** Every total the purse can actually make (so a price is never impossible). */
function achievableSums(coins: readonly number[]): number[] {
  let sums = new Set<number>([0]);
  for (const coin of coins) {
    const next = new Set<number>(sums);
    for (const sum of sums) next.add(sum + coin);
    sums = next;
  }
  return [...sums].filter((s) => s > 0).sort((a, b) => a - b);
}

/** The note the next customer pays with, so the change is a friendly number. */
const noteFor = (price: number): number => (price < 25 ? 25 : price < 50 ? 50 : 100);

/**
 * MARKET MONEY — buy fruit at the Farmers Market stall.
 *
 * A counts up with pennies and nickels (paying a little over is fine — the
 * stallholder hands change back), B and C must lay out the exact price, and C
 * also works out the change from a 25 / 50 / 100 note.
 *
 * The price is always drawn from the sums the purse can really make, so there
 * is always at least one way to pay; `solutions` lists them for the hint ladder.
 */
export const generateMarketMoney: ChallengeGenerator<'market-money'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'money', 'addition', 'counting');

  const coins = rng.pick(purses[ageBand]);
  const denominations = [...new Set(coins)].sort((a, b) => a - b);

  const cap = byBand(ageBand, { A: 10, B: 50, C: 99 });
  const band = byBand(ageBand, { A: [3, 10], B: [8, 45], C: [22, 80] });
  const step = byBand(ageBand, { A: 2, B: 8, C: 14 });
  const lo = clampInt((band[0] ?? 3) + adj * step, 2, cap);
  const hi = clampInt(Math.max(lo, (band[1] ?? 10) + adj * step), lo, cap);

  const sums = achievableSums(coins);
  const inRange = sums.filter((s) => s >= lo && s <= hi);
  const price = inRange.length > 0 ? rng.pick(inRange) : ([...sums].reverse().find((s) => s <= cap) ?? sums[0] ?? 1);

  const item: VocabWord = wordById(rng.pick(stallIds));
  const solutions = subsetSolutions(coins, price, 8).map((s) => [...s.values].sort((a, b) => b - a));

  return {
    kind: 'market-money',
    item,
    price,
    coins,
    denominations,
    exactChange: ageBand !== 'A',
    solutions,
    ...(ageBand === 'C' ? { askChange: { paid: noteFor(price), change: noteFor(price) - price } } : {}),
  };
};
