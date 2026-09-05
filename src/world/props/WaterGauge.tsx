import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import { Canvas, Group, LinearGradient, Path, Skia, rrect, rect, vec } from '@shopify/react-native-skia';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as SvgGradient, Path as SvgPath, Rect, Stop } from 'react-native-svg';
import { idle, palette, radii } from '@/theme';
import { Text } from '@/ui';
import { useLoop } from '@/hooks';
import { HIGHLIGHT, SHADE } from '../tone';

/* ------------------------------------------------------------------ */
/* Water — a Skia sine surface that sloshes and damps after each pump   */
/* ------------------------------------------------------------------ */

export interface WaterSurfaceProps {
  width: number;
  height: number;
  /** 0..1+ fill level */
  level: SharedValue<number>;
  /** 0..1 slosh amount; spike it on a pump and let it damp back to 0 */
  slosh: SharedValue<number>;
  /** free-running seconds clock */
  clock: SharedValue<number>;
  radius?: number;
}

const STEPS = 22;

/** Height of the surface at fraction `f` across the tank. */
function surfaceY(f: number, top: number, amp: number, t: number) {
  'worklet';
  return top + Math.sin(f * Math.PI * 2.6 + t * 4.2) * amp + Math.sin(f * Math.PI * 5.1 - t * 2.7) * amp * 0.45;
}

/** Deterministic bubble lanes: x fraction, phase, size, speed. */
const BUBBLES = [
  { x: 0.22, ph: 0.05, r: 0.9, v: 0.16 },
  { x: 0.48, ph: 0.42, r: 0.65, v: 0.2 },
  { x: 0.7, ph: 0.71, r: 1, v: 0.13 },
  { x: 0.36, ph: 0.88, r: 0.55, v: 0.24 },
  { x: 0.82, ph: 0.3, r: 0.75, v: 0.18 },
] as const;

/**
 * The water inside the tank: a wavy top surface, a lighter band just under
 * it, a white foam line and a few bubbles drifting up from the bottom.
 */
export function WaterSurface({ width, height, level, slosh, clock, radius = 18 }: WaterSurfaceProps) {
  const clip = rrect(rect(0, 0, width, height), radius, radius);

  const body = useDerivedValue(() => {
    'worklet';
    const p = Skia.Path.Make();
    const lv = Math.max(0, Math.min(1.08, level.value));
    if (lv <= 0.001) return p;
    const top = height - lv * height;
    const amp = height * 0.03 * slosh.value + height * 0.006;
    const t = clock.value;
    p.moveTo(0, height + 2);
    p.lineTo(0, surfaceY(0, top, amp, t));
    for (let i = 1; i <= STEPS; i += 1) p.lineTo((i / STEPS) * width, surfaceY(i / STEPS, top, amp, t));
    p.lineTo(width, height + 2);
    p.close();
    return p;
  }, [height, width]);

  /* the lighter band riding just under the surface */
  const band = useDerivedValue(() => {
    'worklet';
    const p = Skia.Path.Make();
    const lv = Math.max(0, Math.min(1.08, level.value));
    if (lv <= 0.03) return p;
    const top = height - lv * height;
    const amp = height * 0.03 * slosh.value + height * 0.006;
    const t = clock.value;
    const depth = Math.max(6, height * 0.05);
    p.moveTo(0, surfaceY(0, top, amp, t));
    for (let i = 1; i <= STEPS; i += 1) p.lineTo((i / STEPS) * width, surfaceY(i / STEPS, top, amp, t));
    for (let i = STEPS; i >= 0; i -= 1) p.lineTo((i / STEPS) * width, surfaceY(i / STEPS, top, amp, t) + depth);
    p.close();
    return p;
  }, [height, width]);

  const foam = useDerivedValue(() => {
    'worklet';
    const p = Skia.Path.Make();
    const lv = Math.max(0, Math.min(1.08, level.value));
    if (lv <= 0.001) return p;
    const top = height - lv * height;
    const amp = height * 0.03 * slosh.value + height * 0.006;
    const t = clock.value;
    p.moveTo(0, surfaceY(0, top, amp, t));
    for (let i = 1; i <= STEPS; i += 1) p.lineTo((i / STEPS) * width, surfaceY(i / STEPS, top, amp, t));
    return p;
  }, [height, width]);

  /* bubbles rise from the floor, wobble a little, and pop at the surface */
  const bubbles = useDerivedValue(() => {
    'worklet';
    const p = Skia.Path.Make();
    const lv = Math.max(0, Math.min(1.08, level.value));
    if (lv <= 0.12) return p;
    const top = height - lv * height;
    const t = clock.value;
    const base = Math.max(2, Math.min(5, width * 0.03));
    for (let i = 0; i < BUBBLES.length; i += 1) {
      const b = BUBBLES[i];
      if (!b) continue;
      const u = (t * b.v + b.ph) % 1;
      const y = height - 6 - u * (height - 6 - top - 10);
      const x = b.x * width + Math.sin(t * 2.4 + i * 1.9) * width * 0.02;
      p.addCircle(x, y, base * b.r * (0.7 + u * 0.4));
    }
    return p;
  }, [height, width]);

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Group clip={clip}>
        <Path path={body}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[palette.waterCyanLight, palette.waterCyan, palette.waterCyanDark]} />
        </Path>
        <Path path={band} color={palette.waterCyanLight} opacity={0.55} />
        <Path path={bubbles} color="#FFFFFF" opacity={0.42} />
        <Path path={bubbles} style="stroke" strokeWidth={1.2} color="#FFFFFF" opacity={0.7} />
        <Path path={foam} style="stroke" strokeWidth={Math.max(3, height * 0.012)} strokeCap="round" color="#FFFFFF" opacity={0.85} />
      </Group>
    </Canvas>
  );
}

/* ------------------------------------------------------------------ */
/* Tank shell — glossy SVG casing drawn over the water                  */
/* ------------------------------------------------------------------ */

export interface TankShellProps {
  width: number;
  height: number;
  radius?: number;
  /** tick fractions 0..1 measured from the bottom (excluding 0 and 1) */
  ticks: number[];
  /** which tick is the goal (0..1) — gets a flag */
  targetAt?: number;
  highlightTarget?: boolean;
  /**
   * Text for each tick (same order as `ticks`) — drawn on cream plaques
   * beside the tick marks. Leave undefined when the host draws its own labels.
   */
  tickLabels?: string[];
}

/** The little target flag on its post — the cloth waves on the flag-wave token. */
function TargetFlag({ x, y, lit }: { x: number; y: number; lit?: boolean }) {
  const wave = useLoop(idle.flagWavePeriodMs);
  const style = useAnimatedStyle(() => {
    const s = Math.sin(wave.value * Math.PI * 2);
    return { transform: [{ scaleX: 0.92 + s * 0.08 }, { skewY: `${s * 6}deg` }] };
  });
  return (
    <>
      <View style={[styles.flagPost, { left: x, top: y }]} pointerEvents="none" />
      <Animated.View style={[styles.flagCloth, { left: x + 4, top: y }, style]} pointerEvents="none">
        <Svg width={26} height={18} viewBox="0 0 26 18">
          <SvgPath d="M0 0h26l-6 9 6 9H0z" fill={lit ? palette.safetyYellow : palette.leafGreen} />
          <SvgPath d="M0 9h20l6 9H0z" fill={SHADE} />
          <Rect x={2} y={2} width={14} height={3} rx={1.5} fill={HIGHLIGHT} />
        </Svg>
      </Animated.View>
    </>
  );
}

/**
 * The glass casing: a glossy rounded tank with two highlights and a shaded
 * right rim, cream tick plaques on the left, the goal line in green and a
 * waving target flag on its post.
 */
export function TankShell({ width, height, radius = 18, ticks, targetAt, highlightTarget, tickLabels }: TankShellProps) {
  const rimW = Math.max(6, width * 0.055);
  const tickW = Math.max(14, width * 0.16);
  const targetY = targetAt !== undefined ? height - targetAt * height : 0;
  return (
    <>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgGradient id="ss-glass" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
            <Stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="0.8" stopColor="#FFFFFF" stopOpacity={0.02} />
            <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0.14} />
          </SvgGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} rx={radius} fill="url(#ss-glass)" />
        {/* tick plaques */}
        {ticks.map((f, i) => {
          const y = height - f * height;
          const isTarget = targetAt !== undefined && Math.abs(f - targetAt) < 0.0001;
          return (
            <G key={i}>
              {isTarget ? <Rect x={rimW} y={y - 3} width={width - rimW * 2} height={6} rx={3} fill={palette.leafGreen} opacity={0.95} /> : null}
              {isTarget ? <Rect x={rimW + 2} y={y - 2} width={width - rimW * 2 - 4} height={2} rx={1} fill={HIGHLIGHT} /> : null}
              <Rect x={rimW * 0.6} y={y - 4} width={tickW} height={8} rx={4} fill={palette.cream} />
              <Rect x={rimW * 0.6} y={y + 1.5} width={tickW} height={2.5} rx={1.25} fill={SHADE} />
              <Rect x={rimW * 0.6 + 2} y={y - 2.5} width={tickW * 0.5} height={2} rx={1} fill={palette.white} opacity={0.7} />
            </G>
          );
        })}
        {/* rim: a thick white glass edge with a shaded right side, no keyline */}
        <Rect x={0} y={0} width={width} height={height} rx={radius} fill="none" stroke={palette.white} strokeWidth={rimW} opacity={0.6} />
        <SvgPath
          d={`M${width - rimW * 0.5} ${radius} v${height - radius * 2}`}
          stroke={palette.navy}
          strokeWidth={rimW * 0.5}
          strokeLinecap="round"
          opacity={0.1}
        />
        {/* two glass highlights: a tall soft stripe and a small bright dab */}
        <Rect x={rimW * 1.4} y={height * 0.1} width={Math.max(5, width * 0.08)} height={height * 0.5} rx={Math.max(2.5, width * 0.04)} fill={palette.white} opacity={0.45} />
        <Ellipse cx={width * 0.2} cy={height * 0.09} rx={width * 0.07} ry={height * 0.025} fill={palette.white} opacity={0.75} />
        <Circle cx={width - rimW * 2.4} cy={height * 0.14} r={Math.max(2, width * 0.02)} fill={palette.white} opacity={0.6} />
      </Svg>
      {tickLabels
        ? ticks.map((f, i) => {
            const label = tickLabels[i];
            if (label === undefined) return null;
            return (
              <View key={`l${i}`} style={[styles.tickPlaque, { top: height - f * height - 11, left: rimW * 0.6 + tickW + 4 }]} pointerEvents="none">
                <Text variant="tiny" color={palette.navy}>
                  {label}
                </Text>
              </View>
            );
          })
        : null}
      {targetAt !== undefined ? <TargetFlag x={width - rimW * 0.9} y={targetY - 34} lit={highlightTarget} /> : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pump lever                                                           */
/* ------------------------------------------------------------------ */

/**
 * The pump the child drags down: a red T-handle with a gold collar on a
 * charcoal arm, riding a brass pivot bolted to the base plate. The host
 * translates the whole thing; the geometry stays put.
 */
export function PumpLever({ width, height }: { width: number; height: number }) {
  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 120 150">
        {/* base plate */}
        <Rect x={16} y={126} width={88} height={22} rx={11} fill={palette.charcoal} />
        <Rect x={16} y={138} width={88} height={10} rx={5} fill={SHADE} />
        <Rect x={22} y={128} width={50} height={4} rx={2} fill={HIGHLIGHT} />
        {/* arm */}
        <Rect x={50} y={34} width={20} height={96} rx={10} fill={palette.charcoal} />
        <SvgPath d="M60 34a10 10 0 0 1 10 10v76a10 10 0 0 1-10 10z" fill={SHADE} />
        <Rect x={53} y={40} width={5} height={84} rx={2.5} fill={HIGHLIGHT} />
        {/* brass pivot bracket + bolt */}
        <Rect x={38} y={100} width={44} height={34} rx={12} fill={palette.gold} />
        <SvgPath d="M60 100h10a12 12 0 0 1 12 12v10a12 12 0 0 1-12 12H60z" fill={SHADE} />
        <Rect x={42} y={103} width={22} height={5} rx={2.5} fill={HIGHLIGHT} />
        <Circle cx={60} cy={117} r={8} fill={palette.goldDark} />
        <Circle cx={60} cy={117} r={4.2} fill={palette.charcoalDark} />
        <Circle cx={57.6} cy={114.6} r={1.6} fill={HIGHLIGHT} />
        {/* gold collar where the handle meets the arm */}
        <Rect x={44} y={40} width={32} height={14} rx={6} fill={palette.gold} />
        <Rect x={44} y={48} width={32} height={6} rx={3} fill={SHADE} />
        <Rect x={48} y={42} width={14} height={3} rx={1.5} fill={HIGHLIGHT} />
        {/* red handle */}
        <Rect x={8} y={4} width={104} height={44} rx={22} fill={palette.engineRed} />
        <SvgPath d="M8 26a22 22 0 0 0 22 22h60a22 22 0 0 0 22-22z" fill={SHADE} />
        <Rect x={22} y={11} width={64} height={11} rx={5.5} fill={HIGHLIGHT} />
        <Circle cx={30} cy={26} r={4} fill={SHADE} />
        <Circle cx={90} cy={26} r={4} fill={SHADE} />
      </Svg>
    </View>
  );
}

/** A filled bar that shows a fraction as visible AREA (¾ = three quarters shaded). */
export function FractionBar({
  width,
  height,
  filled,
  segments,
  tone = palette.waterCyan,
}: {
  width: number;
  height: number;
  /** 0..1 */
  filled: number;
  segments: number;
  tone?: string;
}) {
  const n = Math.max(1, Math.round(segments));
  const segW = width / n;
  const shaded = Math.max(0, Math.min(1, filled)) * width;
  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} rx={height / 2} fill={palette.slateLight} />
      <Rect x={0} y={0} width={shaded} height={height} rx={height / 2} fill={tone} />
      {Array.from({ length: n - 1 }, (_, i) => (
        <Rect key={i} x={(i + 1) * segW - 1.5} y={2} width={3} height={height - 4} rx={1.5} fill={palette.white} opacity={0.9} />
      ))}
      <Rect x={3} y={3} width={Math.max(0, width - 6)} height={height * 0.3} rx={height * 0.15} fill={palette.white} opacity={0.28} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  flagPost: { position: 'absolute', width: 4, height: 36, borderRadius: 2, backgroundColor: palette.leafGreenDark },
  flagCloth: { position: 'absolute', width: 26, height: 18, transformOrigin: 'left center' },
  tickPlaque: {
    position: 'absolute',
    minWidth: 30,
    alignItems: 'center',
    backgroundColor: palette.cream,
    borderRadius: radii.tag,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
