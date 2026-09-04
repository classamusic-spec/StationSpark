import React, { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import { Canvas, Group, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import { palette } from '@/theme';

/** Deterministic per-droplet jitter so the stream looks alive but never random-flickers. */
export interface DropletSeeds {
  phase: number[];
  spread: number[];
  size: number[];
  wobble: number[];
  scatter: number[];
}

export function makeDropletSeeds(count: number, seed = 7): DropletSeeds {
  let a = seed >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const phase: number[] = [];
  const spread: number[] = [];
  const size: number[] = [];
  const wobble: number[] = [];
  const scatter: number[] = [];
  for (let i = 0; i < count; i += 1) {
    phase.push(i / count + rnd() * 0.012);
    spread.push((rnd() - 0.5) * 2);
    size.push(0.55 + rnd() * 0.7);
    wobble.push(rnd() * Math.PI * 2);
    scatter.push((rnd() - 0.5) * 2);
  }
  return { phase, spread, size, wobble, scatter };
}

export interface HoseRigProps {
  width: number;
  height: number;
  /** where the brass nozzle sits, in canvas coordinates */
  nozzle: { x: number; y: number };
  /** live aim point (the child's finger) */
  aimX: SharedValue<number>;
  aimY: SharedValue<number>;
  /** 0 = not spraying, 1 = full jet */
  power: SharedValue<number>;
  /** free-running seconds clock */
  clock: SharedValue<number>;
  /** art scale (1 = 390 pt design box) */
  scale?: number;
  /** number of droplets (fewer on low-end / reduced motion) */
  droplets?: number;
}

const LIFE = 0.62; // seconds a droplet is in the air

/**
 * Builds one age-slice of the droplet jet as a single Skia path (worklet).
 * Splitting the stream into slices lets each slice carry its own colour/alpha
 * without paying for 50 separate Skia nodes.
 */
function buildDroplets(
  seeds: DropletSeeds,
  from: number,
  to: number,
  power: number,
  angle: number,
  t: number,
  nx: number,
  ny: number,
  tipLen: number,
  ax: number,
  ay: number,
  height: number,
  scale: number,
) {
  'worklet';
  const p = Skia.Path.Make();
  if (power <= 0.02) return p;
  const sx = nx + Math.cos(angle) * tipLen;
  const sy = ny + Math.sin(angle) * tipLen;
  const d = Math.hypot(ax - sx, ay - sy);
  const arch = Math.min(d * 0.26, height * 0.22);
  const cx = (sx + ax) / 2;
  const cy = (sy + ay) / 2 - arch;
  const px = -(ay - sy) / (d || 1);
  const py = (ax - sx) / (d || 1);
  for (let i = 0; i < seeds.phase.length; i += 1) {
    const ph = seeds.phase[i] ?? 0;
    let age = (t / LIFE + ph) % 1;
    if (age < 0) age += 1;
    if (age < from || age >= to) continue;
    const u = 1 - age;
    const bx = u * u * sx + 2 * u * age * cx + age * age * ax;
    const by = u * u * sy + 2 * u * age * cy + age * age * ay;
    const spread = seeds.spread[i] ?? 0;
    const wob = seeds.wobble[i] ?? 0;
    const sct = seeds.scatter[i] ?? 0;
    const off = spread * 9 * scale * (0.25 + age * 0.9) + Math.sin(t * 9 + wob) * 2.2 * scale;
    const burst = age > 0.86 ? (age - 0.86) * 62 * scale : 0;
    const x = bx + px * off + sct * burst;
    const y = by + py * off + burst * (0.5 + spread * 0.5);
    const r = Math.max(1.2, (seeds.size[i] ?? 1) * 4.4 * scale * (1.15 - age * 0.5) * power);
    p.addCircle(x, y, r);
  }
  return p;
}

/**
 * The thick red hose, its brass nozzle, and the water: a soft stream path plus
 * a particle jet of cyan droplets with white highlights, all evaluated on the
 * UI thread so it stays at 60 fps while the child drags.
 */
export function HoseRig({ width, height, nozzle, aimX, aimY, power, clock, scale = 1, droplets = 54 }: HoseRigProps) {
  const seeds = useMemo(() => makeDropletSeeds(droplets), [droplets]);
  const nx = nozzle.x;
  const ny = nozzle.y;
  const tipLen = 34 * scale;

  const angle = useDerivedValue(() => {
    'worklet';
    return Math.atan2(aimY.value - ny, aimX.value - nx);
  }, [nx, ny]);

  /* ---- hose: a fat quadratic that bends as the nozzle swings ---- */
  const hosePath = useDerivedValue(() => {
    'worklet';
    const a = angle.value;
    const bx = nx - Math.cos(a) * 18 * scale;
    const by = ny - Math.sin(a) * 18 * scale;
    const p = Skia.Path.Make();
    p.moveTo(-width * 0.16, height + height * 0.1);
    p.quadTo(nx - width * 0.42, height * 1.02, bx, by);
    return p;
  }, [height, nx, ny, scale, width]);

  const nozzleTransform = useDerivedValue(() => {
    'worklet';
    return [{ translateX: nx }, { translateY: ny }, { rotate: angle.value }];
  }, [nx, ny]);

  /* ---- water: quad bezier from the tip to the aim, arched upward ---- */
  const streamPath = useDerivedValue(() => {
    'worklet';
    const p = Skia.Path.Make();
    if (power.value <= 0.02) return p;
    const a = angle.value;
    const sx = nx + Math.cos(a) * tipLen;
    const sy = ny + Math.sin(a) * tipLen;
    const ax = aimX.value;
    const ay = aimY.value;
    const d = Math.hypot(ax - sx, ay - sy);
    const arch = Math.min(d * 0.26, height * 0.22);
    p.moveTo(sx, sy);
    p.quadTo((sx + ax) / 2, (sy + ay) / 2 - arch, ax, ay);
    return p;
  }, [height, nx, ny, tipLen]);

  const dropsNear = useDerivedValue(() => {
    'worklet';
    return buildDroplets(seeds, 0, 0.45, power.value, angle.value, clock.value, nx, ny, tipLen, aimX.value, aimY.value, height, scale);
  }, [height, nx, ny, scale, tipLen]);

  const dropsFar = useDerivedValue(() => {
    'worklet';
    return buildDroplets(seeds, 0.45, 1, power.value, angle.value, clock.value, nx, ny, tipLen, aimX.value, aimY.value, height, scale);
  }, [height, nx, ny, scale, tipLen]);

  const splashPath = useDerivedValue(() => {
    'worklet';
    const p = Skia.Path.Make();
    if (power.value <= 0.06) return p;
    const ax = aimX.value;
    const ay = aimY.value;
    const t = clock.value;
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 + t * 2.2;
      const puls = 0.6 + 0.4 * Math.sin(t * 11 + i * 1.7);
      p.addCircle(ax + Math.cos(a) * 15 * scale * puls, ay + Math.sin(a) * 12 * scale * puls, 5.2 * scale * puls * power.value);
    }
    p.addCircle(ax, ay, 11 * scale * power.value);
    return p;
  }, [scale]);

  const streamWidthOuter = useDerivedValue(() => 15 * scale * power.value + 0.01);
  const streamWidthInner = useDerivedValue(() => 6 * scale * power.value + 0.01);
  const waterOpacity = useDerivedValue(() => Math.min(1, power.value * 1.2));

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      {/* hose */}
      <Path path={hosePath} style="stroke" strokeWidth={30 * scale} strokeCap="round" color={palette.engineRedDark} />
      <Path path={hosePath} style="stroke" strokeWidth={24 * scale} strokeCap="round" color={palette.engineRed} />
      <Path path={hosePath} style="stroke" strokeWidth={6 * scale} strokeCap="round" color="#FFFFFF" opacity={0.28} />

      {/* nozzle */}
      <Group transform={nozzleTransform}>
        <RoundedRect x={-24 * scale} y={-13 * scale} width={34 * scale} height={26 * scale} r={11 * scale} color={palette.charcoal} />
        <RoundedRect x={-20 * scale} y={-10 * scale} width={26 * scale} height={7 * scale} r={3.5 * scale} color="#FFFFFF" opacity={0.25} />
        <RoundedRect x={4 * scale} y={-11 * scale} width={13 * scale} height={22 * scale} r={5 * scale} color={palette.gold} />
        <RoundedRect x={15 * scale} y={-8 * scale} width={20 * scale} height={16 * scale} r={7 * scale} color={palette.safetyYellow} />
        <RoundedRect x={30 * scale} y={-6 * scale} width={8 * scale} height={12 * scale} r={4 * scale} color={palette.charcoalDark} />
      </Group>

      {/* water */}
      <Group opacity={waterOpacity}>
        <Path path={streamPath} style="stroke" strokeWidth={streamWidthOuter} strokeCap="round" color={palette.waterCyanLight} opacity={0.55} />
        <Path path={streamPath} style="stroke" strokeWidth={streamWidthInner} strokeCap="round" color="#FFFFFF" opacity={0.75} />
        <Path path={dropsFar} color={palette.waterCyanLight} opacity={0.6} />
        <Path path={dropsNear} color={palette.waterCyan} />
        <Path path={splashPath} color="#FFFFFF" opacity={0.85} />
      </Group>
    </Canvas>
  );
}
