/**
 * Pure helpers shared by the tactile mini-games. No React, no side effects —
 * unit tested in `src/minigames/tactile/__tests__`.
 */
import type { Fraction } from '@/learning/types';
import { createRng } from '@/utils/rng';
import { toNumber } from '@/utils/fractions';

export const sumOf = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

/** "3 + 4 = 7" (or just "0" when nothing is stacked yet). */
export function equationText(parts: readonly number[], showTotal = true): string {
  if (parts.length === 0) return '0';
  const left = parts.join(' + ');
  return showTotal ? `${left} = ${sumOf(parts)}` : left;
}

/** Order-insensitive identity of a combination, so "3+4" and "4+3" are the same answer. */
export const comboKey = (values: readonly number[]): string => [...values].sort((a, b) => a - b).join('+');

export const sameCombo = (a: readonly number[], b: readonly number[]): boolean => comboKey(a) === comboKey(b);

/**
 * Two plausible wrong answers around `correct` (never negative, never equal).
 * Deterministic for a given correct/max pair so a re-render never reshuffles.
 */
export function distractors(correct: number, count = 2, min = 0, max = 99): number[] {
  const rng = createRng(correct * 977 + count * 31 + max);
  const pool: number[] = [];
  for (const d of [1, 2, 3, 4]) {
    if (correct - d >= min) pool.push(correct - d);
    if (correct + d <= max) pool.push(correct + d);
  }
  const unique = Array.from(new Set(pool)).filter((v) => v !== correct);
  const picked: number[] = [];
  const shuffled = rng.shuffle(unique);
  // prefer near misses first (they are the interesting ones), then anything left
  shuffled.sort((a, b) => Math.abs(a - correct) - Math.abs(b - correct));
  for (const v of shuffled) {
    if (picked.length >= count) break;
    picked.push(v);
  }
  let extra = correct + 1;
  while (picked.length < count) {
    if (extra !== correct && !picked.includes(extra)) picked.push(extra);
    extra += 1;
  }
  return picked;
}

/** `correct` plus `count` distractors, in a stable shuffled order. */
export function optionsFor(correct: number, count = 2, min = 0, max = 99): number[] {
  const rng = createRng(correct * 131 + min * 7 + max * 3 + 5);
  return rng.shuffle([correct, ...distractors(correct, count, min, max)]);
}

/**
 * How many flames each fraction beat asks for, e.g. [½, ¼] of 8 → [4, 2, 2].
 * The remainder is always appended so every challenge can be finished.
 */
export function fractionStageTargets(fractions: readonly Fraction[], total: number): number[] {
  const out: number[] = [];
  let remaining = Math.max(0, Math.round(total));
  for (const f of fractions) {
    if (remaining <= 0) break;
    const want = Math.max(1, Math.round(toNumber(f) * total));
    const stage = Math.min(want, remaining);
    out.push(stage);
    remaining -= stage;
  }
  if (remaining > 0) out.push(remaining);
  return out.length > 0 ? out : [Math.max(0, Math.round(total))];
}

/**
 * Fewest button presses from `start` to `target` using `jumps`, staying inside
 * [min, max]. Returns null when the target is unreachable.
 */
export function minJumps(
  start: number,
  target: number,
  jumps: readonly number[],
  min: number,
  max: number,
): number | null {
  if (start === target) return 0;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  if (target < lo || target > hi) return null;
  const seen = new Set<number>([start]);
  let frontier = [start];
  let depth = 0;
  const steps = jumps.filter((j) => j !== 0);
  while (frontier.length > 0 && depth < 40) {
    depth += 1;
    const next: number[] = [];
    for (const pos of frontier) {
      for (const j of steps) {
        const n = pos + j;
        if (n < lo || n > hi || seen.has(n)) continue;
        if (n === target) return depth;
        seen.add(n);
        next.push(n);
      }
    }
    frontier = next;
  }
  return null;
}

/** All the ways a multiset of pieces adds up to `target` (as value combos). */
export function combosForTarget(pieces: readonly number[], target: number, limit = 24): number[][] {
  const out: number[][] = [];
  const seen = new Set<string>();
  const walk = (from: number, acc: number[], total: number) => {
    if (out.length >= limit) return;
    if (total === target && acc.length > 0) {
      const key = comboKey(acc);
      if (!seen.has(key)) {
        seen.add(key);
        out.push([...acc]);
      }
      return;
    }
    if (total > target) return;
    for (let i = from; i < pieces.length; i += 1) {
      const v = pieces[i];
      if (v === undefined) continue;
      acc.push(v);
      walk(i + 1, acc, total + v);
      acc.pop();
    }
  };
  walk(0, [], 0);
  return out;
}

/** True when adding `next` keeps the stack at or under `target`. */
export const fits = (placed: readonly number[], next: number, target: number): boolean => sumOf(placed) + next <= target;

/**
 * The shortest piece that can still be added without overshooting — Captain Bea's
 * "try a shorter one" suggestion. Returns null when nothing fits.
 */
export function bestNextPiece(available: readonly number[], placed: readonly number[], target: number): number | null {
  const room = target - sumOf(placed);
  let best: number | null = null;
  for (const v of available) {
    if (v <= room && (best === null || v > best)) best = v;
  }
  return best;
}

/** Clamp helper used by the gauges and ladders. */
export const clampNum = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
