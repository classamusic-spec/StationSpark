import type { ChallengeGenerator, Fraction } from '../types';

/**
 * WATER TANK — pump the tank to the marked line.
 * The target is always a whole number of pumps: `target / pumpStep` is an integer.
 * A: halves.  B: quarters.  C: eighths (and the odd overflow-able tank).
 */
export const generateWaterTank: ChallengeGenerator<'water-tank'> = (ctx) => {
  const { rng, ageBand } = ctx;

  let ticks: 2 | 4 | 8 = 2;
  let pumpStep: Fraction = { num: 1, den: 2 };
  let target: Fraction = { num: 1, den: 2 };
  let allowOverflow = false;

  if (ageBand === 'A') {
    ticks = 2;
    pumpStep = { num: 1, den: 2 };
    target = { num: rng.int(1, 2), den: 2 };
  } else if (ageBand === 'B') {
    ticks = 4;
    pumpStep = { num: 1, den: 4 };
    target = { num: rng.int(1, 4), den: 4 };
  } else {
    if (rng.chance(0.5)) {
      ticks = 8;
      pumpStep = { num: 1, den: 8 };
      target = { num: rng.pick([3, 5, 6, 7]), den: 8 };
    } else {
      ticks = 4;
      pumpStep = { num: 1, den: 4 };
      target = { num: rng.pick([3, 4]), den: 4 };
    }
    allowOverflow = rng.chance(0.5);
  }

  return { kind: 'water-tank', target, ticks, pumpStep, allowOverflow };
};
