import type { ChallengeGenerator, Fraction } from '../types';
import { masteryAdjustment } from '../adaptive';
import { clampInt, sceneOr, uniqueInts } from './shared';

/**
 * HOSE HERO — put out the friendly window flames.
 * A: count them all.  B: some are already out (take-away).  C: fraction targets
 * ("put out half, then a quarter") on a flame count that divides cleanly.
 */
export const generateHoseHero: ChallengeGenerator<'hose-hero'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const adj = masteryAdjustment(ctx, 'counting', 'subtraction');
  const scene = sceneOr(ctx, 'apartments');

  let grid = { rows: 2, cols: 3 };
  let totalFlames = 4;
  let alreadyOut = 0;
  let fractionTargets: Fraction[] | undefined;

  if (ageBand === 'A') {
    grid = { rows: 2, cols: 3 };
    totalFlames = clampInt(rng.int(3, 5) + adj, 3, 6);
  } else if (ageBand === 'B') {
    grid = rng.chance(0.5) ? { rows: 2, cols: 4 } : { rows: 3, cols: 3 };
    totalFlames = clampInt(rng.int(5, 7) + adj, 4, grid.rows * grid.cols);
    alreadyOut = rng.int(0, Math.min(2, totalFlames - 2));
  } else {
    grid = { rows: 3, cols: 4 };
    totalFlames = rng.pick([8, 10, 12]);
    if (totalFlames % 4 === 0 && rng.chance(0.6)) {
      // "Half of the windows, then a quarter" — both land on whole flames.
      fractionTargets = [
        { num: 1, den: 2 },
        { num: 1, den: 4 },
      ];
    } else {
      alreadyOut = rng.int(0, 3);
    }
  }

  const capacity = grid.rows * grid.cols;
  totalFlames = clampInt(totalFlames, 2, capacity);
  alreadyOut = clampInt(alreadyOut, 0, totalFlames - 1);
  const flameSlots = uniqueInts(rng, totalFlames, 0, capacity - 1).sort((a, b) => a - b);

  const remaining = totalFlames - alreadyOut;
  const askRemainingAt = ageBand !== 'A' && remaining >= 3 ? rng.int(1, remaining - 1) : undefined;

  return {
    kind: 'hose-hero',
    scene,
    totalFlames,
    alreadyOut,
    grid,
    flameSlots,
    ...(fractionTargets ? { fractionTargets } : {}),
    ...(askRemainingAt !== undefined ? { askRemainingAt } : {}),
  };
};

/** Rebuild a hose-hero with an exact flame count (missions pin the story number). */
export function hoseHeroWithFlames(
  base: ReturnType<typeof generateHoseHero>,
  totalFlames: number,
  grid: { rows: number; cols: number },
): ReturnType<typeof generateHoseHero> {
  const capacity = grid.rows * grid.cols;
  const flames = clampInt(totalFlames, 1, capacity);
  const alreadyOut = clampInt(base.alreadyOut, 0, flames - 1);
  const remaining = flames - alreadyOut;
  return {
    kind: 'hose-hero',
    scene: base.scene,
    totalFlames: flames,
    alreadyOut,
    grid,
    flameSlots: Array.from({ length: flames }, (_, i) => i),
    ...(base.askRemainingAt !== undefined && remaining >= 3
      ? { askRemainingAt: Math.min(base.askRemainingAt, remaining - 1) }
      : {}),
  };
}
