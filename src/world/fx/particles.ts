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
