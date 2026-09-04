/**
 * Every generator, every age band, 150 seeds: structurally sound AND solvable.
 * Solvability is proved independently by `validateChallenge`, which runs the
 * BFS/DFS solvers in @/utils/grid and the subset maths in @/learning/solvers.
 */
import { createRng } from '@/utils/rng';
import type { AgeBand, ChallengeKind, GeneratorContext } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import { challengeKinds, generateChallenge, generators } from '@/learning/generators';
import { validateChallenge } from '@/learning/validate';

const BANDS: AgeBand[] = ['A', 'B', 'C'];
const SEEDS = 150;

const ctxFor = (ageBand: AgeBand, seed: number): GeneratorContext => ({ ageBand, rng: createRng(seed) });

describe('generator registry', () => {
  it('has exactly one generator per challenge kind', () => {
    expect([...challengeKinds].sort()).toEqual(Object.keys(challengeSkills).sort());
  });

  it('every generator returns its own kind', () => {
    for (const kind of challengeKinds) {
      expect(generateChallenge(kind, ctxFor('B', 1)).kind).toBe(kind);
    }
  });
});

describe.each(challengeKinds)('%s', (kind: ChallengeKind) => {
  it.each(BANDS)('band %s — 150 seeds are all valid and solvable', (band) => {
    const failures: string[] = [];
    for (let seed = 1; seed <= SEEDS; seed++) {
      const challenge = generateChallenge(kind, ctxFor(band, seed * 977 + 13));
      if (challenge.kind !== kind) failures.push(`seed ${seed}: wrong kind ${challenge.kind}`);
      const problems = validateChallenge(challenge);
      if (problems.length > 0) failures.push(`seed ${seed}: ${problems.join(' | ')}`);
    }
    expect(failures).toEqual([]);
  });

  it.each(BANDS)('band %s — the same seed always makes the same challenge', (band) => {
    for (const seed of [3, 42, 1234]) {
      const first = generateChallenge(kind, ctxFor(band, seed));
      const second = generateChallenge(kind, ctxFor(band, seed));
      expect(second).toEqual(first);
    }
  });

  it('different bands really do produce different challenges', () => {
    const a = JSON.stringify(Array.from({ length: 20 }, (_, i) => generateChallenge(kind, ctxFor('A', i + 1))));
    const c = JSON.stringify(Array.from({ length: 20 }, (_, i) => generateChallenge(kind, ctxFor('C', i + 1))));
    expect(a).not.toEqual(c);
  });
});

/* ------------------------------------------------------------------ */
/* Band-appropriate difficulty                                          */
/* ------------------------------------------------------------------ */

const sample = <K extends ChallengeKind>(kind: K, band: AgeBand, count = 60) =>
  Array.from({ length: count }, (_, i) => generateChallenge(kind, ctxFor(band, i * 31 + 5)));

describe('age-band difficulty', () => {
  it('band A keeps numbers inside 1–20', () => {
    for (const c of sample('number-ladder', 'A')) {
      expect(c.max).toBeLessThanOrEqual(20);
      expect(c.start).toBeLessThanOrEqual(20);
      expect(c.target).toBeLessThanOrEqual(20);
    }
    for (const c of sample('hydrant-match', 'A')) expect(c.correct).toBeLessThanOrEqual(20);
    for (const c of sample('ladder-builder', 'A')) expect(c.target).toBeLessThanOrEqual(12);
  });

  it('band A never has to read a whole sentence off the radio', () => {
    const modes = new Set(sample('dispatch-decoder', 'A').map((c) => c.mode));
    expect(modes.has('sentence')).toBe(false);
  });

  it('band A pours in halves; band B and C in quarters or smaller', () => {
    for (const c of sample('water-tank', 'A')) expect(c.ticks).toBe(2);
    for (const c of sample('water-tank', 'B')) expect(c.ticks).toBe(4);
    for (const c of sample('water-tank', 'C')) expect([4, 8]).toContain(c.ticks);
  });

  it('band A reads the clock in half hours', () => {
    for (const c of sample('clock-watch', 'A')) {
      expect(c.step).toBe(30);
      expect((c.target.h * 60 + c.target.m) - (c.start.h * 60 + c.start.m)).toBeLessThanOrEqual(60);
    }
  });

  it('band C multiplies and divides on the hydrants', () => {
    const labels = sample('hydrant-match', 'C').map((c) => c.label);
    expect(labels.some((l) => l.includes('×'))).toBe(true);
    expect(labels.some((l) => l.includes('÷'))).toBe(true);
  });

  it('band C is asked for two ladder combinations', () => {
    const required = sample('ladder-builder', 'C').map((c) => c.requiredSolutions);
    expect(required.every((r) => r === 2)).toBe(true);
    expect(sample('ladder-builder', 'A').every((c) => c.requiredSolutions === 1)).toBe(true);
  });

  it('band C scales a recipe by one and a half', () => {
    for (const c of sample('recipe-scale', 'C')) {
      expect(c.serves).toBe(4);
      expect(c.eating).toBe(6);
    }
  });

  it('translation support fades as the child grows', () => {
    expect(sample('vocab-tap', 'A').every((c) => c.support === 'full')).toBe(true);
    expect(sample('vocab-tap', 'B').every((c) => c.support === 'some')).toBe(true);
    expect(sample('vocab-tap', 'C').every((c) => c.support === 'min')).toBe(true);
    expect(sample('listen-count', 'A').every((c) => c.support === 'full')).toBe(true);
    expect(sample('listen-count', 'C').every((c) => c.support === 'min')).toBe(true);
  });

  it('routes and boards grow with the band', () => {
    const cells = (band: AgeBand) => sample('rescue-route', band, 30).map((c) => c.grid.rows * c.grid.cols);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(cells('A'))).toBeLessThan(avg(cells('B')));
    expect(avg(cells('B'))).toBeLessThan(avg(cells('C')));
  });

  it('band A always gets a route it can finish with room to spare', () => {
    for (const c of sample('rescue-route', 'A', 40)) expect(c.maxCommands).toBeGreaterThanOrEqual(4);
  });
});

/* ------------------------------------------------------------------ */
/* Mastery nudges                                                       */
/* ------------------------------------------------------------------ */

describe('mastery nudges numbers inside the band', () => {
  const withMastery = (value: number) =>
    Array.from({ length: 40 }, (_, i) => {
      const ctx: GeneratorContext = {
        ageBand: 'B',
        rng: createRng(i * 13 + 7),
        mastery: { counting: value, subtraction: value, addition: value, division: value },
      };
      return generateChallenge('equipment-check', ctx);
    });

  const totalNeed = (list: ReturnType<typeof withMastery>) =>
    list.reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.need, 0), 0);

  it('asks for more when a child is flying, less when they are wobbling', () => {
    expect(totalNeed(withMastery(0.95))).toBeGreaterThan(totalNeed(withMastery(0.5)));
    expect(totalNeed(withMastery(0.1))).toBeLessThan(totalNeed(withMastery(0.5)));
  });

  it('stays solvable with mastery applied', () => {
    for (const value of [0, 0.25, 0.5, 0.75, 1]) {
      for (const kind of challengeKinds) {
        for (const band of BANDS) {
          const ctx: GeneratorContext = {
            ageBand: band,
            rng: createRng(value * 1000 + kind.length),
            mastery: Object.fromEntries(Object.keys(challengeSkills).flatMap((k) => challengeSkills[k as ChallengeKind].map((s) => [s, value]))),
          };
          expect(validateChallenge(generateChallenge(kind, ctx))).toEqual([]);
        }
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Scene dressing                                                       */
/* ------------------------------------------------------------------ */

describe('scene dressing', () => {
  it('honours ctx.scene where a mini-game shows a building', () => {
    const ctx: GeneratorContext = { ageBand: 'B', rng: createRng(9), scene: 'bakery' };
    expect(generateChallenge('hose-hero', ctx).scene).toBe('bakery');
    expect(generateChallenge('rescue-pets', ctx).scene).toBe('bakery');
    expect(generateChallenge('rescue-route', ctx).goalScene).toBe('bakery');
    expect(generateChallenge('dispatch-decoder', { ...ctx, rng: createRng(4) }).kind).toBe('dispatch-decoder');
  });
});

describe('generators object', () => {
  it('exposes each generator directly', () => {
    for (const kind of challengeKinds) {
      expect(typeof generators[kind]).toBe('function');
    }
  });
});
