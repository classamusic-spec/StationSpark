import type { AgeBand, ChallengeGenerator, GeneratorContext } from '../types';
import { adjustRange, masteryAdjustment } from '../adaptive';
import { numberDistractors, optionsWith } from './shared';
import { numberWordEn } from '../vocabulary';

/**
 * The tag painted on a hydrant, and the number it really means.
 *
 * Every tag either reads as a plain number word or is a single sum written in
 * the form the validator can check for itself — `12 + 7`, `40 − 8`, `6 × 7`,
 * `56 ÷ 8` — so an answer key can never quietly drift away from its label.
 */
export interface HydrantTag {
  label: string;
  correct: number;
}

const plus = (a: number, b: number): HydrantTag => ({ label: `${a} + ${b}`, correct: a + b });
const minus = (a: number, b: number): HydrantTag => ({ label: `${a} − ${b}`, correct: a - b });
const times = (a: number, b: number): HydrantTag => ({ label: `${a} × ${b}`, correct: a * b });
const over = (a: number, b: number): HydrantTag => ({ label: `${a * b} ÷ ${b}`, correct: a });

/**
 * Band A — the tag is a number *word*, a count-on pair or a double. Nothing
 * crosses ten, because a five year old is reading the tag, not calculating it.
 */
function tagForA(ctx: GeneratorContext): HydrantTag {
  const { rng } = ctx;
  const roll = rng.next();
  if (roll < 0.45) {
    const n = rng.int(1, 12);
    return { label: numberWordEn(n), correct: n };
  }
  if (roll < 0.7) {
    const a = rng.int(1, 9);
    return plus(a, rng.int(1, Math.min(3, 10 - a)));
  }
  if (roll < 0.85) {
    const half = rng.int(1, 5);
    return plus(half, half); // doubles: 3 + 3
  }
  const a = rng.int(4, 10);
  return minus(a, rng.int(1, 3));
}

/**
 * Band B — + and − inside 100, with the near-doubles and the friendly tens a
 * seven year old is learning to lean on.
 */
function tagForB(ctx: GeneratorContext): HydrantTag {
  const { rng } = ctx;
  const adj = masteryAdjustment(ctx, 'addition', 'subtraction', 'number-recognition');
  const [lo, hi] = adjustRange([10, 45], adj, 3);
  const roll = rng.next();

  if (roll < 0.3) {
    const a = rng.int(lo, Math.min(hi, 60));
    return plus(a, rng.int(2, 20));
  }
  if (roll < 0.5) {
    const half = rng.int(6, 20);
    return plus(half, half + rng.pick([0, 1])); // doubles and near-doubles
  }
  if (roll < 0.65) {
    const tens = rng.int(2, 7) * 10;
    return plus(tens, rng.int(1, 9)); // 40 + 7 — place value
  }
  if (roll < 0.85) {
    const a = rng.int(Math.max(12, lo), Math.min(Math.max(hi, 20), 80));
    return minus(a, rng.int(2, 9));
  }
  const a = rng.int(4, 9) * 10;
  return minus(a, rng.int(1, 3) * 10); // 60 − 20
}

/**
 * Band C — tables to twelve, the division that undoes them, halves and
 * quarters of a whole number, and the ×10 / ×100 place-value jumps.
 */
function tagForC(ctx: GeneratorContext): HydrantTag {
  const { rng } = ctx;
  const adj = masteryAdjustment(ctx, 'multiplication', 'division');
  const [lo, hi] = adjustRange([3, 9], adj, 2);
  const table = rng.int(Math.min(lo, 9), Math.min(Math.max(hi, lo + 1), 12));
  const roll = rng.next();

  if (roll < 0.4) return times(table, rng.int(2, 12));
  if (roll < 0.68) return over(rng.int(2, 12), Math.max(2, table));
  if (roll < 0.8) {
    /* half of an even number, written as the division it is */
    const half = rng.int(6, 30);
    return over(half, 2);
  }
  if (roll < 0.9) {
    /* a quarter of a multiple of four */
    const quarter = rng.int(3, 15);
    return over(quarter, 4);
  }
  return times(rng.int(2, 9), rng.pick([10, 11]));
}

const tagFor: Record<AgeBand, (ctx: GeneratorContext) => HydrantTag> = {
  A: tagForA,
  B: tagForB,
  C: tagForC,
};

/**
 * HYDRANT MATCH — read the tag on the hydrant, tap the matching number.
 * A reads number words and pairs inside ten, B adds and takes away inside 100,
 * C multiplies, divides, halves and quarters.
 *
 * `options` always holds the answer exactly once: the distractors are built
 * from near misses and then filtered against the answer, so no second hydrant
 * can ever also be right.
 */
export const generateHydrantMatch: ChallengeGenerator<'hydrant-match'> = (ctx) => {
  const { rng, ageBand } = ctx;
  const tag = tagFor[ageBand](ctx);
  const options = optionsWith(rng, tag.correct, numberDistractors(rng, tag.correct, 6), 4, String);
  return { kind: 'hydrant-match', label: tag.label, correct: tag.correct, options };
};

/** A hydrant tag pinned by the story ("the fuse box is on circuit 6 × 4"). */
export function hydrantMatchFor(tag: HydrantTag, ctx: GeneratorContext): ReturnType<typeof generateHydrantMatch> {
  const options = optionsWith(ctx.rng, tag.correct, numberDistractors(ctx.rng, tag.correct, 6), 4, String);
  return { kind: 'hydrant-match', label: tag.label, correct: tag.correct, options };
}
