import type { AgeBand, ChallengeGenerator } from '../types';

/**
 * What the crew is waiting for. Every one of these is a thing a child can
 * picture happening at a time — never an abstract "set the clock to 3:15".
 */
const events: Record<AgeBand, string[]> = {
  A: [
    'the station bell rings',
    'story time starts at the library',
    'the bread comes out of the oven',
    'the picnic begins in the park',
    'the pet shop puppies get their walk',
    'the school bus comes back',
    'the garden gets its watering',
    'the crew sits down for lunch',
  ],
  B: [
    'the school fair opens',
    'the parade starts on Market Street',
    'the bakery pulls out the second tray',
    'the museum unlocks the front doors',
    'the swimming lesson starts at the bay',
    'the moving van reaches Maple Street',
    'the seed packets go in the ground',
    'the open day begins at the station',
    'the pizzas go in for the lunch rush',
  ],
  C: [
    'the last train leaves platform two',
    'the festival lights switch on',
    'the caldo has simmered long enough',
    'the tide turns back at the pier',
    'the concrete on the new ramp sets',
    'the library returns trolley goes round',
    'the market stalls have to be packed away',
    'the visiting crew lands at the station',
  ],
};

/**
 * CLOCK WATCH — spin the hands to the time something happens.
 *
 * The target is always LATER than the start, a whole number of `step` minutes
 * away, and never more than three hours ahead (and never wraps past 12).
 *
 *   A  half hours only, and never more than an hour to move
 *   B  quarter hours, and five-minute steps for the sharper ones
 *   C  five-minute steps, up to three hours — real elapsed time
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
    /* whole hours, half hours and the awkward in-between ones in equal measure */
    delta = rng.chance(0.4) ? rng.pick([60, 90, 120, 150, 180]) : 5 * rng.int(4, 36);
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
    event: rng.pick(events[ageBand]),
  };
};
