import type { ChallengeGenerator } from '../types';

const events = [
  'the station bell rings',
  'story time starts at the library',
  'the bread comes out of the oven',
  'the school fair opens',
  'the parade starts on Market Street',
  'the picnic begins in the park',
  'the pet shop puppies get their walk',
];

/**
 * CLOCK WATCH — spin the hands to the time something happens.
 * The target is always LATER than the start, a whole number of `step` minutes
 * away, and never more than three hours ahead (and never wraps past 12).
 */
export const generateClockWatch: ChallengeGenerator<'clock-watch'> = (ctx) => {
  const { rng, ageBand } = ctx;

  let step: 5 | 15 | 30;
  let delta: number;
  if (ageBand === 'A') {
    step = 30;
    delta = rng.pick([30, 60]);
  } else if (ageBand === 'B') {
    step = rng.chance(0.6) ? 15 : 5;
    delta = step * rng.int(1, step === 15 ? 6 : 12);
  } else {
    step = 5;
    delta = 5 * rng.int(4, 36);
  }
  delta = Math.min(delta, 180);

  const dayEnd = 12 * 60;
  const lo = Math.ceil(60 / step) * step;
  const hi = Math.floor((dayEnd - delta) / step) * step;
  const slots = Math.max(0, Math.floor((hi - lo) / step));
  const startTotal = lo + rng.int(0, slots) * step;
  const targetTotal = startTotal + delta;

  return {
    kind: 'clock-watch',
    start: { h: Math.floor(startTotal / 60), m: startTotal % 60 },
    target: { h: Math.floor(targetTotal / 60), m: targetTotal % 60 },
    step,
    event: rng.pick(events),
  };
};
