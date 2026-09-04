import type { ChallengeGenerator } from '../types';
import { numberDistractors, optionsWith } from './shared';
import { numberWordEn } from '../vocabulary';

/**
 * HYDRANT MATCH — read the tag on the hydrant, tap the matching number.
 * A reads number words, B adds and takes away, C multiplies and divides.
 */
export const generateHydrantMatch: ChallengeGenerator<'hydrant-match'> = (ctx) => {
  const { rng, ageBand } = ctx;

  let label: string;
  let correct: number;

  if (ageBand === 'A') {
    correct = rng.int(1, 12);
    label = numberWordEn(correct);
  } else if (ageBand === 'B') {
    if (rng.chance(0.5)) {
      const a = rng.int(3, 40);
      const b = rng.int(2, 20);
      correct = a + b;
      label = `${a} + ${b}`;
    } else {
      const a = rng.int(10, 60);
      const b = rng.int(2, Math.min(9, a - 1));
      correct = a - b;
      label = `${a} − ${b}`;
    }
  } else {
    if (rng.chance(0.6)) {
      const a = rng.int(2, 9);
      const b = rng.int(2, 9);
      correct = a * b;
      label = `${a} × ${b}`;
    } else {
      const b = rng.int(2, 9);
      const each = rng.int(2, 9);
      correct = each;
      label = `${b * each} ÷ ${b}`;
    }
  }

  const options = optionsWith(rng, correct, numberDistractors(rng, correct, 6), 4, String);
  return { kind: 'hydrant-match', label, correct, options };
};
