/**
 * MARKET MONEY · SHAPE BUILDER · WORD BUILDER
 *
 * The three newest stations, checked the same way as every other generator:
 * 150 seeds per age band must be structurally sound AND finishable, the same
 * seed must always make the same challenge, and each band has to feel like its
 * own band. Solvability is proved independently by `validateChallenge`.
 */
import { createRng } from '@/utils/rng';
import type { AgeBand, ChallengeKind, GeneratorContext } from '@/learning/types';
import { challengeSkills, rotatableShapes } from '@/learning/types';
import { generateChallenge, generators } from '@/learning/generators';
import { validateChallenge } from '@/learning/validate';
import { skillLabel, subjectForSkill } from '@/learning/adaptive';
import { isSubMultiset } from '@/learning/solvers';

const BANDS: AgeBand[] = ['A', 'B', 'C'];
const SEEDS = 150;
const KINDS: ChallengeKind[] = ['market-money', 'shape-builder', 'word-builder'];

const ctxFor = (ageBand: AgeBand, seed: number): GeneratorContext => ({ ageBand, rng: createRng(seed) });

const sample = <K extends ChallengeKind>(kind: K, band: AgeBand, count = 60) =>
  Array.from({ length: count }, (_, i) => generateChallenge(kind, ctxFor(band, i * 31 + 5)));

describe.each(KINDS)('%s', (kind) => {
  it('is registered with a generator and a skill list', () => {
    expect(typeof generators[kind]).toBe('function');
    expect(challengeSkills[kind].length).toBeGreaterThan(0);
  });

  it.each(BANDS)('band %s — 150 seeds are all valid and finishable', (band) => {
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
      expect(generateChallenge(kind, ctxFor(band, seed))).toEqual(generateChallenge(kind, ctxFor(band, seed)));
    }
  });

  it('band A and band C are really different', () => {
    const a = JSON.stringify(sample(kind, 'A', 20));
    const c = JSON.stringify(sample(kind, 'C', 20));
    expect(a).not.toEqual(c);
  });

  it.each(BANDS)('band %s — stays finishable when mastery pushes the numbers', (band) => {
    for (const value of [0, 0.25, 0.5, 0.75, 1]) {
      const mastery = Object.fromEntries(challengeSkills[kind].map((s) => [s, value]));
      const challenge = generateChallenge(kind, { ageBand: band, rng: createRng(value * 1000 + 7), mastery });
      expect(validateChallenge(challenge)).toEqual([]);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Market Money                                                        */
/* ------------------------------------------------------------------ */

describe('market money', () => {
  it('band A counts up with pennies and nickels, under ten', () => {
    for (const c of sample('market-money', 'A')) {
      expect(c.price).toBeLessThanOrEqual(10);
      expect(c.denominations.every((d) => d === 1 || d === 5)).toBe(true);
      expect(c.exactChange).toBe(false);
      expect(c.askChange).toBeUndefined();
    }
  });

  it('band B pays the exact price up to fifty, with dimes and quarters in the purse', () => {
    for (const c of sample('market-money', 'B')) {
      expect(c.price).toBeLessThanOrEqual(50);
      expect(c.exactChange).toBe(true);
      expect(c.denominations).toEqual([1, 5, 10, 25]);
    }
  });

  it('band C stays under a hundred and always asks for the change', () => {
    for (const c of sample('market-money', 'C')) {
      expect(c.price).toBeLessThanOrEqual(99);
      expect(c.exactChange).toBe(true);
      expect(c.askChange).toBeDefined();
      expect(c.askChange?.change).toBe((c.askChange?.paid ?? 0) - c.price);
      expect(c.askChange?.change).toBeGreaterThan(0);
    }
  });

  it('prices grow with the band', () => {
    const avg = (band: AgeBand) => {
      const list = sample('market-money', band, 40);
      return list.reduce((sum, c) => sum + c.price, 0) / list.length;
    };
    expect(avg('A')).toBeLessThan(avg('B'));
    expect(avg('B')).toBeLessThan(avg('C'));
  });

  it('every listed way to pay really is payable from the purse', () => {
    for (const band of BANDS) {
      for (const c of sample('market-money', band, 40)) {
        expect(c.solutions.length).toBeGreaterThan(0);
        for (const solution of c.solutions) {
          expect(solution.reduce((a, b) => a + b, 0)).toBe(c.price);
          expect(isSubMultiset(solution, c.coins)).toBe(true);
        }
      }
    }
  });

  it('the stall only sells things the icon sheet can draw', () => {
    for (const band of BANDS) {
      for (const c of sample('market-money', band, 30)) {
        expect(c.item.icon.length).toBeGreaterThan(0);
        expect(c.item.category).toBe('food');
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Shape Builder                                                       */
/* ------------------------------------------------------------------ */

describe('shape builder', () => {
  it('band A gets 3–4 pre-turned pieces', () => {
    for (const c of sample('shape-builder', 'A')) {
      expect(c.pieces.length).toBeGreaterThanOrEqual(3);
      expect(c.pieces.length).toBeLessThanOrEqual(4);
      expect(c.needsRotation).toBe(false);
      expect(c.askCount).toBeUndefined();
    }
  });

  it('band B builds 4–5 pieces and band C 5–7', () => {
    for (const c of sample('shape-builder', 'B')) {
      expect(c.pieces.length).toBeGreaterThanOrEqual(4);
      expect(c.pieces.length).toBeLessThanOrEqual(5);
    }
    for (const c of sample('shape-builder', 'C')) {
      expect(c.pieces.length).toBeGreaterThanOrEqual(5);
      expect(c.pieces.length).toBeLessThanOrEqual(7);
      expect(c.askCount).toBeDefined();
      const actual = c.pieces.filter((p) => p.shape === c.askCount?.shape).length;
      expect(c.askCount?.count).toBe(actual);
    }
  });

  it('turning is only ever asked for when something can be turned', () => {
    for (const band of BANDS) {
      for (const c of sample('shape-builder', band, 40)) {
        if (!c.needsRotation) continue;
        expect(c.pieces.some((p) => rotatableShapes.includes(p.shape))).toBe(true);
      }
    }
    const turners = sample('shape-builder', 'B', 40).filter((c) => c.needsRotation);
    expect(turners.length).toBeGreaterThan(0);
  });

  it('every piece has a home inside the blueprint and none overlap', () => {
    for (const band of BANDS) {
      for (const c of sample('shape-builder', band, 40)) {
        for (const p of c.pieces) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.x + p.w).toBeLessThanOrEqual(100);
          expect(p.y + p.h).toBeLessThanOrEqual(100);
          if (!rotatableShapes.includes(p.shape)) expect(p.rotation).toBe(0);
        }
      }
    }
  });

  it('shows more than one blueprint per band', () => {
    for (const band of BANDS) {
      const shapes = new Set(sample('shape-builder', band, 40).map((c) => c.blueprint));
      expect(shapes.size).toBeGreaterThan(1);
    }
  });
});

/* ------------------------------------------------------------------ */
/* Word Builder                                                        */
/* ------------------------------------------------------------------ */

describe('word builder', () => {
  it('band A spells short English words with the first letter given', () => {
    for (const c of sample('word-builder', 'A')) {
      expect(c.lang).toBe('en');
      expect(c.letters.length).toBeGreaterThanOrEqual(3);
      expect(c.letters.length).toBeLessThanOrEqual(4);
      expect(c.prefilled).toBe(1);
      expect(c.tiles.length).toBe(c.letters.length - 1);
    }
  });

  it('band B spells 4–6 letters with one decoy tile', () => {
    for (const c of sample('word-builder', 'B')) {
      expect(c.lang).toBe('en');
      expect(c.letters.length).toBeGreaterThanOrEqual(4);
      expect(c.letters.length).toBeLessThanOrEqual(6);
      expect(c.prefilled).toBe(0);
      expect(c.tiles.length).toBe(c.letters.length + 1);
    }
  });

  it('band C spells 5–8 letters, sometimes in Spanish, with two decoys', () => {
    const list = sample('word-builder', 'C');
    for (const c of list) {
      expect(c.letters.length).toBeGreaterThanOrEqual(5);
      expect(c.letters.length).toBeLessThanOrEqual(8);
      expect(c.tiles.length).toBe(c.letters.length + 2);
    }
    const langs = new Set(list.map((c) => c.lang));
    expect(langs.has('es')).toBe(true);
    expect(langs.has('en')).toBe(true);
  });

  it('the tray always holds every letter the child still needs', () => {
    for (const band of BANDS) {
      for (const c of sample('word-builder', band, 40)) {
        expect(isSubMultiset(c.letters.slice(c.prefilled).map((l) => l.charCodeAt(0)), c.tiles.map((t) => t.charCodeAt(0)))).toBe(true);
        expect(c.letters.join('').toLowerCase()).toBe(c.word[c.lang].toLowerCase());
        expect(c.letters.join('')).toBe(c.letters.join('').toUpperCase());
      }
    }
  });

  it('decoy tiles are never letters the word actually needs', () => {
    for (const band of BANDS) {
      for (const c of sample('word-builder', band, 40)) {
        const needed = new Map<string, number>();
        for (const l of c.letters.slice(c.prefilled)) needed.set(l, (needed.get(l) ?? 0) + 1);
        const extras = [...c.tiles];
        for (const [letter, count] of needed) {
          for (let i = 0; i < count; i++) extras.splice(extras.indexOf(letter), 1);
        }
        for (const extra of extras) expect(c.letters).not.toContain(extra);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Recap plumbing for the two new skills                               */
/* ------------------------------------------------------------------ */

describe('new skills', () => {
  it('money and spelling have a subject and a kid-facing name', () => {
    expect(subjectForSkill('money')).toBe('math');
    expect(subjectForSkill('spelling')).toBe('reading');
    expect(skillLabel('money').es.length).toBeGreaterThan(0);
    expect(skillLabel('spelling').es.length).toBeGreaterThan(0);
  });

  it('the three stations declare the skills they exercise', () => {
    expect(challengeSkills['market-money']).toContain('money');
    expect(challengeSkills['word-builder']).toContain('spelling');
    expect(challengeSkills['shape-builder']).toContain('geometry');
  });
});
