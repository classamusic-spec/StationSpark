import type { ChallengeGenerator, SignalId } from '../types';

/**
 * SIGNALS — put the crew's call-out steps in the right order.
 * The order below is the station's routine; we take the first N of it so the
 * sequence always tells a sensible story.
 */
const routine: SignalId[] = ['bell', 'radio', 'truck', 'map', 'water', 'hose', 'ladder', 'check'];

export const generateSignals: ChallengeGenerator<'signals'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const count = ageBand === 'A' ? 3 : ageBand === 'B' ? 4 : 5;

  // Keep the routine's relative order, then drop a couple of steps for variety.
  const keep = rng.shuffle(routine.map((_, i) => i)).slice(0, count).sort((a, b) => a - b);
  const steps = keep.map((i) => routine[i]).filter((s): s is SignalId => s !== undefined);

  let shuffled = rng.shuffle(steps);
  for (let tries = 0; tries < 8 && shuffled.join() === steps.join(); tries++) shuffled = rng.shuffle(steps);
  if (shuffled.join() === steps.join()) shuffled = [...steps.slice(1), ...steps.slice(0, 1)];

  return { kind: 'signals', steps, shuffled };
};
