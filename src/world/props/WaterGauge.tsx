import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import { Canvas, Group, LinearGradient, Path, Skia, rrect, rect, vec } from '@shopify/react-native-skia';
import Svg, { Defs, Ellipse, LinearGradient as SvgGradient, Path as SvgPath, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';

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

/** The water inside the tank: a wavy top surface with a lighter highlight band. */
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
    const steps = 22;
    p.moveTo(0, height + 2);
    p.lineTo(0, top + Math.sin(t * 4.2) * amp);
    for (let i = 1; i <= steps; i += 1) {
      const f = i / steps;
      const y = top + Math.sin(f * Math.PI * 2.6 + t * 4.2) * amp + Math.sin(f * Math.PI * 5.1 - t * 2.7) * amp * 0.45;
      p.lineTo(f * width, y);
    }
    p.lineTo(width, height + 2);
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
    const steps = 22;
    p.moveTo(0, top + Math.sin(t * 4.2) * amp);
    for (let i = 1; i <= steps; i += 1) {
      const f = i / steps;
      const y = top + Math.sin(f * Math.PI * 2.6 + t * 4.2) * amp + Math.sin(f * Math.PI * 5.1 - t * 2.7) * amp * 0.45;
      p.lineTo(f * width, y);
    }
    return p;
  }, [height, width]);

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Group clip={clip}>
        <Path path={body}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={[palette.waterCyanLight, palette.waterCyan, palette.waterCyanDark]} />
        </Path>
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
}

/** The glass casing: rim, gloss, tick marks and the little target flag post. */
export function TankShell({ width, height, radius = 18, ticks, targetAt, highlightTarget }: TankShellProps) {
  const rimW = Math.max(6, width * 0.055);
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgGradient id="ss-glass" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
          <Stop offset="0.28" stopColor="#FFFFFF" stopOpacity={0.05} />
          <Stop offset="0.82" stopColor="#FFFFFF" stopOpacity={0.02} />
          <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0.12} />
        </SvgGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} rx={radius} fill="url(#ss-glass)" />
      {ticks.map((f, i) => {
        const y = height - f * height;
        const isTarget = targetAt !== undefined && Math.abs(f - targetAt) < 0.0001;
        return (
          <Rect
            key={i}
            x={width * 0.06}
            y={y - 2}
            width={isTarget ? width * 0.88 : width * 0.3}
            height={isTarget ? 6 : 4}
            rx={3}
            fill={isTarget ? palette.leafGreen : palette.white}
            opacity={isTarget ? 0.95 : 0.75}
          />
        );
      })}
      {targetAt !== undefined ? (
        <>
          <Rect x={width - rimW * 0.9} y={height - targetAt * height - 34} width={4} height={36} rx={2} fill={palette.leafGreenDark} />
          <SvgPath
            d={`M${width - rimW * 0.9 + 4} ${height - targetAt * height - 34} h22 l-6 8 6 8 h-22 z`}
            fill={highlightTarget ? palette.safetyYellow : palette.leafGreen}
          />
        </>
      ) : null}
      <Rect x={0} y={0} width={width} height={height} rx={radius} fill="none" stroke={palette.white} strokeWidth={rimW} opacity={0.55} />
      <Rect x={0} y={0} width={width} height={height} rx={radius} fill="none" stroke={palette.slateLight} strokeWidth={3} />
      <Ellipse cx={width * 0.2} cy={height * 0.18} rx={width * 0.08} ry={height * 0.1} fill={palette.white} opacity={0.5} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Pump lever                                                           */
/* ------------------------------------------------------------------ */

/** The brass pump lever the child drags down. `press` is 0 (up) → 1 (down). */
export function PumpLever({ width, height }: { width: number; height: number }) {
  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 120 150">
        <Rect x={46} y={40} width={28} height={102} rx={12} fill={palette.slate} />
        <Rect x={52} y={44} width={8} height={94} rx={4} fill={palette.white} opacity={0.4} />
        <Rect x={20} y={128} width={80} height={20} rx={10} fill={palette.charcoal} />
        <Rect x={8} y={8} width={104} height={44} rx={22} fill={palette.engineRed} />
        <Rect x={16} y={14} width={88} height={14} rx={7} fill={palette.white} opacity={0.32} />
        <Rect x={8} y={44} width={104} height={12} rx={6} fill={palette.engineRedDark} />
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
