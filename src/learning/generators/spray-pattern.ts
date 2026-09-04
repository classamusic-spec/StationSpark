import type { ChallengeGenerator, ChallengeOf } from '../types';
import { optionsWith } from './shared';

type SprayIcon = ChallengeOf<'spray-pattern'>['answer'];

const symbols: SprayIcon[] = ['fire', 'water', 'cone', 'star'];

/** Repeating units. Letters map to distinct symbols, so the rule is unambiguous. */
const units: Record<'A' | 'B' | 'C', { unit: string; repeats: number }[]> = {
  A: [
    { unit: 'AB', repeats: 3 },
    { unit: 'AABB', repeats: 2 },
  ],
  B: [
    { unit: 'AB', repeats: 4 },
    { unit: 'AABB', repeats: 2 },
    { unit: 'ABC', repeats: 3 },
  ],
  C: [
    { unit: 'ABC', repeats: 3 },
    { unit: 'ABB', repeats: 3 },
    { unit: 'AABB', repeats: 3 },
  ],
};

/**
 * SPRAY PATTERN — finish the pattern on the practice wall.
 * `sequence` is the whole row; the LAST cell is drawn as "?" and `answer` is
 * what belongs there (so `sequence[last] === answer`).
 */
export const generateSprayPattern: ChallengeGenerator<'spray-pattern'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const plan = rng.pick(units[ageBand]);
  const letters = [...new Set(plan.unit.split(''))];
  const palette = rng.shuffle(symbols);
  const map = new Map<string, SprayIcon>();
  letters.forEach((letter, i) => map.set(letter, palette[i] ?? 'fire'));

  const sequence: SprayIcon[] = [];
  for (let r = 0; r < plan.repeats; r++) {
    for (const letter of plan.unit) sequence.push(map.get(letter) ?? 'fire');
  }

  const answer = sequence[sequence.length - 1] ?? 'fire';
  const used = [...new Set(sequence)];
  const optionCount = ageBand === 'A' ? Math.max(3, used.length) : 4;
  const options = optionsWith(rng, answer, [...used, ...symbols], optionCount, (s) => s);

  return { kind: 'spray-pattern', sequence, answer, options };
};
