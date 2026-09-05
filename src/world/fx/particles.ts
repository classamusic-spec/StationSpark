/**
 * Pure particle maths for the celebration FX. No React, no Reanimated — the
 * components in `@/ui/kit` turn these descriptors into animated views so the
 * same numbers can be reused by Skia scenes later.
 */
import { palette } from '@/theme';

export type ConfettiShape = 'rect' | 'circle';

export interface ConfettiParticle {
  /** stable key */
  id: number;
  /** start x as a 0..1 fraction of the burst width */
  x: number;
  /** start y as a 0..1 fraction of the burst height (usually negative → above the frame) */
  y: number;
  /** horizontal drift in px over the life of the particle */
  driftX: number;
  /** how far down the particle falls, as a fraction of the burst height */
  fall: number;
  size: number;
  /** rect particles are this much taller than wide */
  aspect: number;
  shape: ConfettiShape;
  color: string;
  /** total spin in degrees */
  spin: number;
  /** 0..1 of the total burst duration */
  delay: number;
  /** 0..1 of the total burst duration */
  duration: number;
  /** starting rotation in degrees */
  rotation: number;
}

/** Brand confetti colours — red / yellow / cyan / green / white. */
export const confettiColors: readonly string[] = [
  palette.engineRed,
  palette.safetyYellow,
  palette.waterCyan,
  palette.leafGreen,
  palette.white,
  palette.engineRedLight,
  palette.gold,
  palette.waterCyanLight,
];

/** Tiny deterministic PRNG so a burst looks the same on every platform. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(list: readonly T[], r: number, fallback: T): T => list[Math.floor(r * list.length)] ?? fallback;

export interface ConfettiOptions {
  count?: number;
  seed?: number;
  colors?: readonly string[];
  /** 'burst' fires up from the middle, 'rain' falls from above the frame */
  origin?: 'burst' | 'rain';
}

/** Build a full confetti burst. Call once (in a `useMemo`) per celebration. */
export function makeConfetti({ count = 44, seed = 7, colors = confettiColors, origin = 'rain' }: ConfettiOptions = {}): ConfettiParticle[] {
  const rnd = mulberry32(seed);
  const out: ConfettiParticle[] = [];
  for (let i = 0; i < count; i++) {
    const r = [rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd()];
    const spread = (r[0] ?? 0.5) - 0.5;
    out.push({
      id: i,
      x: origin === 'rain' ? (r[0] ?? 0.5) : 0.5 + spread * 0.5,
      y: origin === 'rain' ? -0.12 - (r[1] ?? 0) * 0.35 : 0.42,
      driftX: spread * (origin === 'rain' ? 90 : 320),
      fall: origin === 'rain' ? 1.15 + (r[2] ?? 0) * 0.25 : 0.75 + (r[2] ?? 0) * 0.4,
      size: 8 + (r[3] ?? 0) * 8,
      aspect: 1.4 + (r[4] ?? 0) * 0.9,
      shape: (r[5] ?? 0) > 0.62 ? 'circle' : 'rect',
      color: pick(colors, r[6] ?? 0, palette.safetyYellow),
      spin: (((r[7] ?? 0) > 0.5 ? 1 : -1) * (240 + (r[7] ?? 0) * 620)),
      delay: (r[1] ?? 0) * 0.35,
      duration: 0.55 + (r[2] ?? 0) * 0.4,
      rotation: (r[4] ?? 0) * 360,
    });
  }
  return out;
}

export interface SparkleParticle {
  id: number;
  /** direction in degrees, 0 = up */
  angle: number;
  /** travel distance in px */
  distance: number;
  size: number;
  color: string;
  delay: number;
}

export interface SparkleOptions {
  count?: number;
  radius?: number;
  seed?: number;
  colors?: readonly string[];
}

/** Small radial "ding!" burst used on every correct answer. */
export function makeSparkles({ count = 8, radius = 34, seed = 3, colors = [palette.safetyYellow, palette.white, palette.gold] }: SparkleOptions = {}): SparkleParticle[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const jitter = rnd();
    return {
      id: i,
      angle: (360 / count) * i + (jitter - 0.5) * 14,
      distance: radius * (0.75 + jitter * 0.5),
      size: 6 + jitter * 6,
      color: pick(colors, rnd(), palette.safetyYellow),
      delay: jitter * 90,
    };
  });
}

/** Degrees → {x, y} offset (0° points up, like a compass). */
export function polar(angleDeg: number, distance: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: Math.cos(rad) * distance, y: Math.sin(rad) * distance };
}

/* ------------------------------------------------------------------ *
 * Scene FX: water, steam and dust                                     *
 * ------------------------------------------------------------------ */

export interface PuffParticle {
  id: number;
  /** horizontal offset at birth, in px */
  x: number;
  /** how far it drifts sideways over its life, in px */
  driftX: number;
  /** how far it rises, in px */
  rise: number;
  /** diameter in px at full size */
  size: number;
  /** how much it swells as it rises (1 = no swell) */
  swell: number;
  delayMs: number;
  durationMs: number;
  /** peak opacity */
  alpha: number;
}

export interface PuffOptions {
  count?: number;
  seed?: number;
  /** how wide the puffs are born, in px */
  spread?: number;
  /** how far they travel up, in px */
  rise?: number;
  /** base puff diameter, in px */
  size?: number;
}

/** Rising steam / smoke: soft rounded puffs that swell and fade as they climb. */
export function makePuffs({ count = 6, seed = 11, spread = 22, rise = 64, size = 18 }: PuffOptions = {}): PuffParticle[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const a = rnd();
    const b = rnd();
    const c = rnd();
    return {
      id: i,
      x: (a - 0.5) * spread,
      driftX: (b - 0.5) * spread * 1.4,
      rise: rise * (0.75 + c * 0.5),
      size: size * (0.7 + a * 0.7),
      swell: 1.5 + b * 0.9,
      delayMs: Math.round((i / count) * 900 + a * 160),
      durationMs: Math.round(1500 + c * 900),
      alpha: 0.36 + b * 0.3,
    };
  });
}

export interface DropParticle {
  id: number;
  /** launch direction in degrees, 0 = straight up */
  angle: number;
  /** how far it flies before gravity wins, in px */
  distance: number;
  /** how far it then falls, in px */
  fall: number;
  size: number;
  delayMs: number;
  durationMs: number;
  spin: number;
}

export interface DropOptions {
  count?: number;
  seed?: number;
  /** how far the drops fly, in px */
  radius?: number;
  /** spray cone half-width in degrees (180 = all round) */
  spreadDeg?: number;
  /** centre of the cone in degrees, 0 = up */
  aimDeg?: number;
}

/** A splash of water: drops fly out along a cone, then fall. */
export function makeDrops({ count = 10, seed = 5, radius = 44, spreadDeg = 70, aimDeg = 0 }: DropOptions = {}): DropParticle[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const a = rnd();
    const b = rnd();
    const c = rnd();
    return {
      id: i,
      angle: aimDeg + (((i + a) / count) * 2 - 1) * spreadDeg,
      distance: radius * (0.6 + b * 0.6),
      fall: radius * (0.5 + c * 0.8),
      size: 6 + a * 7,
      delayMs: Math.round(a * 160),
      durationMs: Math.round(560 + c * 320),
      spin: (b > 0.5 ? 1 : -1) * (60 + c * 160),
    };
  });
}

export interface DustParticle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delayMs: number;
  durationMs: number;
}

/** The little ring of dust a dropped token kicks up when it lands. */
export function makeDust({ count = 7, seed = 9, radius = 26 }: { count?: number; seed?: number; radius?: number } = {}): DustParticle[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const a = rnd();
    return {
      id: i,
      angle: (360 / count) * i + (a - 0.5) * 26,
      distance: radius * (0.6 + a * 0.7),
      size: 7 + a * 8,
      delayMs: Math.round(a * 70),
      durationMs: Math.round(420 + a * 220),
    };
  });
}
