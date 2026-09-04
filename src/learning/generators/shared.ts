/** Small helpers shared by the challenge generators. Pure, rng-driven. */
import type { Rng } from '@/utils/rng';
import type { AgeBand, GeneratorContext, SceneId } from '../types';

/** Pick a per-band value: `byBand(ctx.ageBand, { A: 3, B: 5, C: 8 })`. */
export function byBand<T>(band: AgeBand, values: { A: T; B: T; C: T }): T {
  return values[band];
}

export const sceneOr = (ctx: GeneratorContext, fallback: SceneId): SceneId => ctx.scene ?? fallback;

export const times = (n: number): number[] => Array.from({ length: Math.max(0, n) }, (_, i) => i);

export const clampInt = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, Math.round(n)));

/** `count` distinct integers in [min,max], never any of `exclude`. */
export function uniqueInts(
  rng: Rng,
  count: number,
  min: number,
  max: number,
  exclude: readonly number[] = [],
): number[] {
  const skip = new Set(exclude);
  const pool: number[] = [];
  for (let n = min; n <= max; n++) if (!skip.has(n)) pool.push(n);
  return rng.shuffle(pool).slice(0, Math.min(count, pool.length));
}

/**
 * Believable near-miss numbers for a multiple-choice answer: digit swaps first
 * (24 → 42), then neighbours (24 → 23, 25), then the loose digits (24 → 4, 2).
 */
export function numberDistractors(rng: Rng, correct: number, count: number): number[] {
  const candidates: number[] = [];
  const digits = String(Math.abs(correct));
  if (digits.length === 2) {
    const swapped = Number(`${digits[1]}${digits[0]}`);
    if (swapped !== correct && swapped > 0) candidates.push(swapped);
    const tens = Number(digits[0]);
    const ones = Number(digits[1]);
    if (ones > 0) candidates.push(ones);
    if (tens > 0) candidates.push(tens);
  }
  for (const d of [1, 2, 10, 3]) {
    candidates.push(correct + d);
    candidates.push(correct - d);
  }
  const seen = new Set<number>([correct]);
  const out: number[] = [];
  for (const value of candidates) {
    if (value <= 0 || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
    if (out.length >= count + 2) break;
  }
  let filler = correct + 4;
  while (out.length < count) {
    if (!seen.has(filler) && filler > 0) {
      seen.add(filler);
      out.push(filler);
    }
    filler += 1;
  }
  return rng.shuffle(out).slice(0, count);
}

/** Shuffled options containing `correct` exactly once, `size` long. */
export function optionsWith<T>(
  rng: Rng,
  correct: T,
  pool: readonly T[],
  size: number,
  key: (value: T) => string,
): T[] {
  const correctKey = key(correct);
  const seen = new Set<string>([correctKey]);
  const extras: T[] = [];
  for (const candidate of rng.shuffle(pool)) {
    const k = key(candidate);
    if (seen.has(k)) continue;
    seen.add(k);
    extras.push(candidate);
    if (extras.length >= size - 1) break;
  }
  return rng.shuffle([correct, ...extras]);
}

/**
 * Split `total` into `parts` positive whole numbers (kid-sized: nothing is 0).
 * Deterministic given the rng.
 */
export function splitInto(rng: Rng, total: number, parts: number): number[] {
  const safeParts = Math.max(1, Math.min(parts, total));
  const out: number[] = [];
  let left = total;
  for (let i = 0; i < safeParts - 1; i++) {
    const remainingSlots = safeParts - 1 - i;
    const value = rng.int(1, Math.max(1, left - remainingSlots));
    out.push(value);
    left -= value;
  }
  out.push(left);
  return out;
}

/**
 * Pieces that can be combined into `target` in at least two different ways:
 *   S1 = p + (target − p)          S2 = q + (p − q) + (target − p)
 * plus a few harmless fillers. Every piece is a positive whole number.
 */
export function buildSumPieces(rng: Rng, target: number, pieceCount: number, maxFiller: number): number[] {
  const goal = Math.max(4, target);
  const p = rng.int(2, goal - 2);
  const q = rng.int(1, p - 1);
  const core = [p, goal - p, q, p - q];
  const fillers = times(Math.max(0, pieceCount - core.length)).map(() => rng.int(1, Math.max(1, maxFiller)));
  return rng.shuffle([...core, ...fillers]);
}
