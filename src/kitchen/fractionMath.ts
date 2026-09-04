/**
 * PIZZA GEOMETRY & FRACTION REGION MATH — pure, no React, fully testable.
 *
 * Angle convention: 0 rad points at 12 o'clock and angles increase CLOCKWISE
 * (which is what you get on screen where +y points down). Region `i` of a pizza
 * cut into `n` equal regions spans [i·τ/n, (i+1)·τ/n).
 */
import type { Fraction, ToppingId } from '@/learning/types';

export const TAU = Math.PI * 2;

export interface Pt {
  x: number;
  y: number;
}

export interface Wedge {
  index: number;
  /** radians, clockwise from 12 o'clock */
  start: number;
  end: number;
  mid: number;
}

export interface ToppingNeed {
  topping: ToppingId;
  /** how many of the `count` regions this topping must cover */
  need: number;
}

export interface ToppingProgress extends ToppingNeed {
  have: number;
  done: boolean;
}

export interface PlanStatus {
  perTopping: ToppingProgress[];
  /** every topping has exactly its needed number of regions */
  complete: boolean;
  /** toppings placed on more regions than they need */
  over: ToppingId[];
  placed: number;
  needed: number;
}

const gcd2 = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd2(b, Math.abs(a % b)));

export function lcm(a: number, b: number): number {
  const g = gcd2(a, b);
  return g === 0 ? 0 : Math.abs(a * b) / g;
}

/** Smallest number of equal regions that can express every topping fraction. */
export function regionCount(toppings: { fraction: Fraction }[]): number {
  const dens = toppings.map((t) => Math.max(1, Math.round(t.fraction.den)));
  const n = dens.reduce((acc, d) => lcm(acc, d), 1);
  return Math.max(2, Math.min(12, n));
}

/** How many of `count` regions a fraction covers (rounded — fractions are kid-clean). */
export function regionsFor(fraction: Fraction, count: number): number {
  if (!fraction.den) return 0;
  return Math.max(0, Math.round((count * fraction.num) / fraction.den));
}

export function buildWedges(count: number): Wedge[] {
  const n = Math.max(1, Math.round(count));
  const step = TAU / n;
  return Array.from({ length: n }, (_, index) => {
    const start = index * step;
    const end = start + step;
    return { index, start, end, mid: start + step / 2 };
  });
}

/** Point on a circle at `angle` (0 = up, clockwise). */
export function polar(center: Pt, radius: number, angle: number): Pt {
  return { x: center.x + radius * Math.sin(angle), y: center.y - radius * Math.cos(angle) };
}

export function normalizeAngle(a: number): number {
  const m = a % TAU;
  return m < 0 ? m + TAU : m;
}

/** Angle of `p` seen from `center`, 0 = up, clockwise, in [0, τ). */
export function angleOf(center: Pt, p: Pt): number {
  return normalizeAngle(Math.atan2(p.x - center.x, center.y - p.y));
}

export function distance(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Which region a point lands in, or null when it missed the pizza. */
export function regionAtPoint(p: Pt, center: Pt, radius: number, count: number): number | null {
  if (distance(p, center) > radius) return null;
  const n = Math.max(1, Math.round(count));
  const idx = Math.floor((angleOf(center, p) / TAU) * n);
  return Math.min(n - 1, Math.max(0, idx));
}

/** SVG path for one wedge of the pie (used for regions and the pie indicator). */
export function wedgePath(center: Pt, radius: number, start: number, end: number): string {
  const sweep = end - start;
  if (sweep >= TAU - 1e-6) {
    // Full circle: two arcs (a single arc can't close a circle).
    const top = polar(center, radius, 0);
    const bottom = polar(center, radius, Math.PI);
    return `M ${top.x} ${top.y} A ${radius} ${radius} 0 1 1 ${bottom.x} ${bottom.y} A ${radius} ${radius} 0 1 1 ${top.x} ${top.y} Z`;
  }
  const a = polar(center, radius, start);
  const b = polar(center, radius, end);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${center.x} ${center.y} L ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

/** How many regions each topping needs, in prompt order. */
export function toppingPlan(toppings: { topping: ToppingId; fraction: Fraction }[], count: number): ToppingNeed[] {
  return toppings.map((t) => ({ topping: t.topping, need: regionsFor(t.fraction, count) }));
}

export function countAssigned(assigned: readonly (ToppingId | null)[], topping: ToppingId): number {
  let n = 0;
  for (const a of assigned) if (a === topping) n += 1;
  return n;
}

export function planStatus(plan: readonly ToppingNeed[], assigned: readonly (ToppingId | null)[]): PlanStatus {
  const perTopping = plan.map((p) => {
    const have = countAssigned(assigned, p.topping);
    return { ...p, have, done: have === p.need };
  });
  let placed = 0;
  for (const a of assigned) if (a !== null) placed += 1;
  return {
    perTopping,
    complete: perTopping.every((p) => p.done),
    over: perTopping.filter((p) => p.have > p.need).map((p) => p.topping),
    placed,
    needed: plan.reduce((acc, p) => acc + p.need, 0),
  };
}

/** True when this topping still has room for one more region. */
export function canPlace(plan: readonly ToppingNeed[], assigned: readonly (ToppingId | null)[], topping: ToppingId): boolean {
  const need = plan.find((p) => p.topping === topping)?.need ?? 0;
  return countAssigned(assigned, topping) < need;
}

/* ------------------------------------------------------------------ */
/* Cutting                                                              */
/* ------------------------------------------------------------------ */

/** Diameters to drag the cutter along: `cutInto` slices need cutInto/2 cuts. */
export function cutAngles(cutInto: number): number[] {
  const cuts = Math.max(1, Math.round(cutInto / 2));
  return Array.from({ length: cuts }, (_, i) => (i * Math.PI) / cuts);
}

/** Slices on the board after `made` of the `cutInto/2` cuts have been drawn. */
export function slicesFromCuts(made: number, cutInto: number): number {
  if (made <= 0) return 1;
  const total = Math.max(1, Math.round(cutInto / 2));
  return Math.min(cutInto, Math.round((cutInto / total) * made));
}

/**
 * Which pending cut line a drag stroke traced, or null.
 * Forgiving on purpose: the stroke only has to run roughly end-to-end along a
 * diameter (either direction) and be at least the pizza radius long.
 */
export function matchCutLine(
  from: Pt,
  to: Pt,
  center: Pt,
  radius: number,
  angles: readonly number[],
  tolerance = radius * 0.8,
): number | null {
  if (distance(from, to) < radius * 0.9) return null;
  let best: { index: number; score: number } | null = null;
  angles.forEach((angle, index) => {
    const p1 = polar(center, radius, angle);
    const p2 = polar(center, radius, angle + Math.PI);
    const forward = distance(from, p1) + distance(to, p2);
    const backward = distance(from, p2) + distance(to, p1);
    const score = Math.min(forward, backward);
    if (!best || score < best.score) best = { index, score };
  });
  const winner = best as { index: number; score: number } | null;
  if (!winner || winner.score > tolerance * 2) return null;
  return winner.index;
}

/**
 * Deterministic scatter of topping pieces inside one wedge — same challenge
 * always sprinkles the same way, so a re-render never reshuffles the cheese.
 */
export function scatterPoints(center: Pt, radius: number, wedge: Wedge, count: number): Pt[] {
  const pts: Pt[] = [];
  const spread = wedge.end - wedge.start;
  for (let i = 0; i < count; i += 1) {
    const ring = i % 3;
    const rr = radius * (0.3 + ring * 0.23);
    const raw = Math.sin((i + 1) * 12.9898 + (wedge.index + 1) * 78.233) * 43758.5453;
    const jitter = raw - Math.floor(raw);
    const t = ((i + 0.5) / count + jitter * 0.35) % 1;
    pts.push(polar(center, rr, wedge.start + spread * (0.12 + 0.76 * t)));
  }
  return pts;
}
