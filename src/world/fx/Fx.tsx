/**
 * SCENE PARTICLE FX
 *
 * Five drawn effects any game can drop into its scene (art critique item #25:
 * "add drawn particle FX: water droplets, steam, sparkles, confetti, dust puffs
 * on drop"). They are deliberately tiny to wire up:
 *
 *   <SteamPuffs x={140} y={210} count={6} />          // ambient, loops forever
 *   <WaterDroplets x={80} y={300} trigger={hits} />   // one burst per change
 *   <DustPuff x={cx} y={cy} trigger={drops} />        // "it landed" puff
 *   <Sparkles x={cx} y={cy} trigger={correct} />      // "you got it" ding
 *   <Confetti trigger={won} />                        // fills its parent
 *
 * Rules they all keep:
 *   · `x`/`y` are px inside the parent; omit them to centre on the parent.
 *   · Passing `trigger` makes it a one-shot that replays whenever the number
 *     changes. Omitting `trigger` makes the ambient ones (steam, water) loop.
 *   · Nothing ever intercepts a touch.
 *   · `useReducedMotion()` is respected everywhere — the loops stop and bursts
 *     become a single soft pop.
 */
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { easings, palette } from '@/theme';
import { useReducedMotion } from '@/hooks';
import {
  confettiColors,
  makeConfetti,
  makeDrops,
  makeDust,
  makePuffs,
  makeSparkles,
  polar,
  type ConfettiParticle,
  type DropParticle,
  type DustParticle,
  type PuffParticle,
  type SparkleParticle,
} from './particles';

/** Every FX component takes the same handful of props. */
export interface FxProps {
  /** burst origin in px inside the parent; omit to centre on the parent */
  x?: number;
  y?: number;
  /** how many particles */
  count?: number;
  /** bump this number to fire another burst; omit for the ambient loop */
  trigger?: number;
  /** overall size multiplier */
  scale?: number;
  /** tint override */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/* ------------------------------------------------------------------ *
 * Shared plumbing                                                      *
 * ------------------------------------------------------------------ */

/** Drives one particle 0 → 1: once per `trigger`, or forever when looping. */
function useParticleClock(delayMs: number, durationMs: number, trigger: number | undefined, loop: boolean, reduced: boolean): SharedValue<number> {
  const t = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(t);
    if (reduced) {
      // one short, gentle pop instead of a loop (motion principle 7)
      t.value = 0;
      t.value = withSequence(withTiming(0.55, { duration: 120 }), withTiming(0, { duration: 120 }));
      return;
    }
    t.value = 0;
    const run = withTiming(1, { duration: durationMs, easing: easings.out });
    t.value = withDelay(delayMs, loop ? withRepeat(run, -1, false) : run);
    return () => cancelAnimation(t);
  }, [delayMs, durationMs, loop, reduced, t, trigger]);
  return t;
}

/** Absolute wrapper: centres on (x, y) when given, otherwise on the parent. */
function FxLayer({ x, y, style, children }: { x?: number; y?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const placed = x !== undefined || y !== undefined;
  return (
    <View pointerEvents="none" style={[placed ? { position: 'absolute', left: x ?? 0, top: y ?? 0 } : styles.centred, style]}>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Steam                                                               *
 * ------------------------------------------------------------------ */

function Puff({ p, trigger, loop, reduced, color, scale }: { p: PuffParticle; trigger?: number; loop: boolean; reduced: boolean; color: string; scale: number }) {
  const t = useParticleClock(p.delayMs, p.durationMs, trigger, loop, reduced);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : Math.sin(t.value * Math.PI) * p.alpha,
    transform: [
      { translateX: (p.x + p.driftX * t.value) * scale },
      { translateY: -p.rise * t.value * scale },
      { scale: (0.6 + t.value * p.swell) * scale },
    ],
  }));
  const s = p.size;
  return (
    <Animated.View pointerEvents="none" style={[styles.particle, style]}>
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Circle cx={9} cy={14} r={7.5} fill={color} />
        <Circle cx={16} cy={12} r={6.5} fill={color} />
        <Circle cx={12.5} cy={8.5} r={6} fill={color} />
      </Svg>
    </Animated.View>
  );
}

/** Rising steam — the pot, the kettle, a warm loaf. Loops unless you `trigger` it. */
export function SteamPuffs({ x, y, count = 6, trigger, scale = 1, color = '#FFFFFF', style }: FxProps) {
  const reduced = useReducedMotion();
  const parts = useMemo(() => makePuffs({ count, seed: 11 + ((trigger ?? 0) % 5) }), [count, trigger]);
  return (
    <FxLayer x={x} y={y} style={style}>
      {parts.map((p) => (
        <Puff key={p.id} p={p} trigger={trigger} loop={trigger === undefined} reduced={reduced} color={color} scale={scale} />
      ))}
    </FxLayer>
  );
}

/* ------------------------------------------------------------------ *
 * Water                                                               *
 * ------------------------------------------------------------------ */

function WaterDrop({ p, trigger, loop, reduced, color, scale }: { p: DropParticle; trigger?: number; loop: boolean; reduced: boolean; color: string; scale: number }) {
  const t = useParticleClock(p.delayMs, p.durationMs, trigger, loop, reduced);
  const target = useMemo(() => polar(p.angle, p.distance), [p.angle, p.distance]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : 1 - Math.max(0, t.value - 0.55) / 0.45,
    transform: [
      { translateX: target.x * t.value * scale },
      // out along the cone, then gravity takes over
      { translateY: (target.y * t.value + p.fall * t.value * t.value) * scale },
      { rotate: `${p.spin * t.value}deg` },
      { scale: (0.7 + t.value * 0.5) * scale },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.particle, style]}>
      <Svg width={p.size} height={p.size * 1.25} viewBox="0 0 16 20">
        <Path d="M 8 1 C 11.5 6.5 14.5 10 14.5 13 A 6.5 6.5 0 0 1 1.5 13 C 1.5 10 4.5 6.5 8 1 Z" fill={color} />
        <Path d="M 4.6 13 A 3.4 3.4 0 0 0 6.8 16.4" stroke="rgba(255,255,255,0.7)" strokeWidth={1.6} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

/** A splash of water — the hose landing, a tank filling, a puddle stomped. */
export function WaterDroplets({ x, y, count = 10, trigger, scale = 1, color = palette.waterCyan, style, aimDeg = 0, radius = 44 }: FxProps & { aimDeg?: number; radius?: number }) {
  const reduced = useReducedMotion();
  const parts = useMemo(() => makeDrops({ count, radius, aimDeg, seed: 5 + ((trigger ?? 0) % 7) }), [aimDeg, count, radius, trigger]);
  return (
    <FxLayer x={x} y={y} style={style}>
      {parts.map((p) => (
        <WaterDrop key={p.id} p={p} trigger={trigger} loop={trigger === undefined} reduced={reduced} color={color} scale={scale} />
      ))}
    </FxLayer>
  );
}

/* ------------------------------------------------------------------ *
 * Sparkles                                                            *
 * ------------------------------------------------------------------ */

function Spark({ p, trigger, reduced, scale }: { p: SparkleParticle; trigger?: number; reduced: boolean; scale: number }) {
  const t = useParticleClock(p.delay, 420, trigger, false, reduced);
  const target = useMemo(() => polar(p.angle, p.distance), [p.angle, p.distance]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : Math.sin(t.value * Math.PI),
    transform: [
      { translateX: target.x * t.value * scale },
      { translateY: target.y * t.value * scale },
      { scale: (0.3 + Math.sin(t.value * Math.PI) * 0.9) * scale },
      { rotate: `${t.value * 90}deg` },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.particle, style]}>
      <Svg width={p.size} height={p.size} viewBox="0 0 24 24">
        <Path d="M 12 0 L 14.6 9.4 L 24 12 L 14.6 14.6 L 12 24 L 9.4 14.6 L 0 12 L 9.4 9.4 Z" fill={p.color} />
      </Svg>
    </Animated.View>
  );
}

/** The little "you did it" ding. Fire it on every correct answer. */
export function Sparkles({ x, y, count = 8, trigger, scale = 1, color, style, radius = 38 }: FxProps & { radius?: number }) {
  const reduced = useReducedMotion();
  const parts = useMemo(
    () => makeSparkles({ count, radius, seed: 3 + ((trigger ?? 0) % 7), colors: color ? [color] : [palette.safetyYellow, palette.white, palette.gold] }),
    [color, count, radius, trigger],
  );
  return (
    <FxLayer x={x} y={y} style={style}>
      {parts.map((p) => (
        <Spark key={p.id} p={p} trigger={trigger} reduced={reduced} scale={scale} />
      ))}
    </FxLayer>
  );
}

/* ------------------------------------------------------------------ *
 * Dust                                                                *
 * ------------------------------------------------------------------ */

function Dust({ p, trigger, reduced, color, scale }: { p: DustParticle; trigger?: number; reduced: boolean; color: string; scale: number }) {
  const t = useParticleClock(p.delayMs, p.durationMs, trigger, false, reduced);
  const target = useMemo(() => polar(p.angle, p.distance), [p.angle, p.distance]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : (1 - t.value) * 0.55,
    transform: [
      { translateX: target.x * t.value * scale },
      // dust hugs the ground: mostly sideways, barely any lift
      { translateY: target.y * 0.34 * t.value * scale },
      { scale: (0.4 + t.value * 1.1) * scale },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.particle, style]}>
      <Svg width={p.size} height={p.size * 0.62} viewBox="0 0 20 12">
        <Ellipse cx={10} cy={7} rx={9} ry={4.6} fill={color} />
        <Ellipse cx={7} cy={5.4} rx={5} ry={3.4} fill={color} />
      </Svg>
    </Animated.View>
  );
}

/** The puff a token kicks up when it lands. One-shot: bump `trigger` on drop. */
export function DustPuff({ x, y, count = 7, trigger, scale = 1, color = '#D9C6A6', style, radius = 26 }: FxProps & { radius?: number }) {
  const reduced = useReducedMotion();
  const parts = useMemo(() => makeDust({ count, radius, seed: 9 + ((trigger ?? 0) % 7) }), [count, radius, trigger]);
  return (
    <FxLayer x={x} y={y} style={style}>
      {parts.map((p) => (
        <Dust key={p.id} p={p} trigger={trigger} reduced={reduced} color={color} scale={scale} />
      ))}
    </FxLayer>
  );
}

/* ------------------------------------------------------------------ *
 * Confetti                                                            *
 * ------------------------------------------------------------------ */

function Fleck({ p, trigger, reduced, w, h, totalMs }: { p: ConfettiParticle; trigger?: number; reduced: boolean; w: number; h: number; totalMs: number }) {
  const t = useParticleClock(p.delay * totalMs, p.duration * totalMs, trigger, false, reduced);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 || t.value >= 1 ? 0 : Math.min(1, (1 - t.value) * 3),
    transform: [
      { translateX: p.driftX * t.value },
      { translateY: p.fall * h * t.value },
      { rotate: `${p.rotation + p.spin * t.value}deg` },
    ],
  }));
  const height = p.shape === 'rect' ? p.size * p.aspect : p.size;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: p.x * w,
          top: p.y * h,
          width: p.size,
          height,
          backgroundColor: p.color,
          borderRadius: p.shape === 'circle' ? p.size / 2 : 2,
        },
        style,
      ]}
    />
  );
}

/**
 * Brand confetti that fills its parent. For the full-screen mission
 * celebration use `<ConfettiBurst/>` from `@/ui/kit`; this one is for a card,
 * a tray or a single scene.
 */
export function Confetti({
  count = 26,
  trigger,
  style,
  width = 320,
  height = 260,
  durationMs = 1800,
  colors = confettiColors,
}: Omit<FxProps, 'x' | 'y' | 'scale' | 'color'> & { width?: number; height?: number; durationMs?: number; colors?: readonly string[] }) {
  const reduced = useReducedMotion();
  const parts = useMemo(() => makeConfetti({ count, seed: 7 + ((trigger ?? 0) % 11), colors, origin: 'rain' }), [colors, count, trigger]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip, style]}>
      {parts.map((p) => (
        <Fleck key={p.id} p={p} trigger={trigger} reduced={reduced} w={width} h={height} totalMs={durationMs} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centred: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute' },
  clip: { overflow: 'hidden' },
});
