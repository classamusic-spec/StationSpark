/**
 * SOUP POT — the kitchen's sequencing station.
 *
 * The generic contract (150 seeds × 3 bands, determinism, band difference) is
 * covered for every kind by `generators.test.ts`. This file pins down the two
 * things that make a pot a pot: the order is a real cooking order, and the
 * numbers on the card are the numbers the pot asks for.
 */
import { createRng } from '@/utils/rng';
import type { AgeBand, ChallengeOf, GeneratorContext } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import { generateSoupPot } from '@/learning/generators';
import { validateChallenge } from '@/learning/validate';

const BANDS: AgeBand[] = ['A', 'B', 'C'];
const ctxFor = (ageBand: AgeBand, seed: number): GeneratorContext => ({ ageBand, rng: createRng(seed) });

const sample = (band: AgeBand, count = 60): ChallengeOf<'soup-pot'>[] =>
  Array.from({ length: count }, (_, i) => generateSoupPot(ctxFor(band, i * 31 + 5)));

/** The cooking order the generator draws from — softening first, lime last. */
const COOKING_ORDER = ['onion', 'carrot', 'potato', 'tomato', 'pepper', 'mushroom', 'lemon'];

const isSubsequence = (ids: readonly string[]): boolean => {
  let at = -1;
  for (const id of ids) {
    const next = COOKING_ORDER.indexOf(id);
    if (next <= at) return false;
    at = next;
  }
  return true;
};

describe('soup pot', () => {
  it('teaches sequencing, counting and adding up', () => {
    expect(challengeSkills['soup-pot']).toEqual(expect.arrayContaining(['sequencing', 'counting', 'addition']));
  });

  it.each(BANDS)('band %s — the pot is always a real cooking order', (band) => {
    for (const c of sample(band)) {
      expect(isSubsequence(c.steps.map((s) => s.item.id))).toBe(true);
      expect(new Set(c.steps.map((s) => s.item.id)).size).toBe(c.steps.length);
    }
  });

  it('gives each band its own length and its own numbers', () => {
    for (const c of sample('A')) {
      expect(c.steps).toHaveLength(3);
      expect(c.steps.every((s) => s.count >= 1 && s.count <= 2)).toBe(true);
    }
    for (const c of sample('B')) {
      expect(c.steps).toHaveLength(4);
      expect(c.steps.every((s) => s.count >= 1 && s.count <= 3)).toBe(true);
    }
    for (const c of sample('C')) {
      expect(c.steps).toHaveLength(5);
      expect(c.steps.every((s) => s.count >= 2 && s.count <= 3)).toBe(true);
    }
  });

  it('only the oldest crew adds the pot up, and the sum is right', () => {
    for (const c of sample('A')) expect(c.askTotal).toBeUndefined();
    for (const c of sample('C')) {
      expect(c.askTotal).toBe(c.steps.reduce((sum, s) => sum + s.count, 0));
    }
  });

  it('Spanish leads for band C and never for band A', () => {
    expect(sample('C').every((c) => c.spokenEs === true)).toBe(true);
    expect(sample('A').every((c) => c.spokenEs === undefined)).toBe(true);
  });

  it('nothing on the counter is also in the soup', () => {
    for (const band of BANDS) {
      for (const c of sample(band)) {
        const inPot = new Set(c.steps.map((s) => s.item.id));
        expect(c.extras.some((e) => inPot.has(e.id))).toBe(false);
        expect(new Set(c.extras.map((e) => e.id)).size).toBe(c.extras.length);
        expect(c.extras.length).toBeGreaterThan(0);
      }
    }
  });

  it('every ingredient carries both languages, so Bea can read the card', () => {
    for (const band of BANDS) {
      for (const c of sample(band, 20)) {
        for (const step of [...c.steps.map((s) => s.item), ...c.extras]) {
          expect(step.en.trim().length).toBeGreaterThan(0);
          expect(step.es.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it.each(BANDS)('band %s — stays cookable when mastery pushes the numbers', (band) => {
    for (const value of [0, 0.25, 0.5, 0.75, 1]) {
      const mastery = Object.fromEntries(challengeSkills['soup-pot'].map((s) => [s, value]));
      const challenge = generateSoupPot({ ageBand: band, rng: createRng(value * 1000 + 7), mastery });
      expect(validateChallenge(challenge)).toEqual([]);
      expect(challenge.steps.every((s) => s.count >= 1)).toBe(true);
    }
  });
});

describe('the pot validator', () => {
  const good = generateSoupPot(ctxFor('C', 42));

  it('accepts a pot the generator built', () => {
    expect(validateChallenge(good)).toEqual([]);
  });

  it('refuses the same ingredient twice, because the order would be ambiguous', () => {
    const first = good.steps[0];
    if (!first) throw new Error('expected a first step');
    const problems = validateChallenge({ ...good, steps: [first, first, ...good.steps.slice(1)], askTotal: undefined });
    expect(problems.join(' ')).toContain('twice');
  });

  it('refuses a step that puts nothing in', () => {
    const problems = validateChallenge({
      ...good,
      steps: good.steps.map((s, i) => (i === 0 ? { ...s, count: 0 } : s)),
      askTotal: undefined,
    });
    expect(problems.join(' ')).toContain('must put something in');
  });

  it('refuses a total that does not match the card', () => {
    expect(validateChallenge({ ...good, askTotal: 99 }).join(' ')).toContain('askTotal');
  });

  it('refuses a counter that offers something already in the soup', () => {
    const first = good.steps[0];
    if (!first) throw new Error('expected a first step');
    expect(validateChallenge({ ...good, extras: [first.item] }).join(' ')).toContain('also in the soup');
  });
});
