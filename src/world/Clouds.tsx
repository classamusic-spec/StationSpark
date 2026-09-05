import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { idle } from '@/theme';
import { useLoop } from '@/hooks';

/** One soft cloud puff cluster. Static art — memoized so drifting never re-renders it. */
const CloudShape = memo(function CloudShape({ w, opacity }: { w: number; opacity: number }) {
  const h = w * 0.5;
  return (
    <Svg width={w} height={h} viewBox="0 0 120 60" pointerEvents="none">
      <G opacity={opacity}>
        <Ellipse cx={34} cy={38} rx={30} ry={19} fill="#FFFFFF" />
        <Ellipse cx={62} cy={28} rx={26} ry={22} fill="#FFFFFF" />
        <Ellipse cx={88} cy={40} rx={25} ry={17} fill="#FFFFFF" />
        <Ellipse cx={60} cy={46} rx={48} ry={13} fill="#FFFFFF" />
        {/* underside shade — the "one darker tone" of the sticker language */}
        <Ellipse cx={60} cy={52} rx={44} ry={7} fill="#DCEEFF" opacity={0.75} />
      </G>
    </Svg>
  );
});

interface DriftProps {
  w: number;
  top: number;
  opacity: number;
  periodMs: number;
  /** 0..1 starting position across the field */
  phase: number;
  fieldW: number;
}

function DriftingCloud({ w, top, opacity, periodMs, phase, fieldW }: DriftProps) {
  const t = useLoop(periodMs);
  const x0 = phase * fieldW;
  const style = useAnimatedStyle(() => {
    const x = (x0 + t.value * fieldW) % fieldW;
    return { transform: [{ translateX: x - w }] };
  });
  return (
    <Animated.View style={[styles.cloud, { top }, style]} pointerEvents="none">
      <CloudShape w={w} opacity={opacity} />
    </Animated.View>
  );
}

export interface CloudsProps {
  /** how many clouds (3–5 reads best) */
  count?: number;
  /** vertical band the clouds live in */
  top?: number;
  height?: number;
  /** overall opacity multiplier (evening skies want softer clouds) */
  opacity?: number;
}

/**
 * 3–5 soft clouds drifting at different speeds. Bigger clouds are "nearer" and
 * move faster, which reads as parallax against the hills below.
 */
export function Clouds({ count = 4, top = 24, height = 190, opacity = 1 }: CloudsProps) {
  const { width } = useWindowDimensions();
  const n = Math.max(1, Math.min(5, count));
  const specs = React.useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const depth = (i % 3) / 2; // 0 = far, 1 = near
        const w = 92 + depth * 96;
        return {
          key: `cloud-${i}`,
          w,
          top: top + ((i * 47) % Math.max(1, height - 60)),
          opacity: (0.55 + depth * 0.42) * opacity,
          periodMs: idle.cloudDriftMs * (1.55 - depth * 0.75),
          phase: (i * 0.37 + 0.11) % 1,
          fieldW: width + w * 2,
        };
      }),
    [height, n, opacity, top, width],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {specs.map((s) => (
        <DriftingCloud key={s.key} w={s.w} top={s.top} opacity={s.opacity} periodMs={s.periodMs} phase={s.phase} fieldW={s.fieldW} />
      ))}
    </View>
  );
}

/* ── the far haze band ────────────────────────────────────────────── */

/** One tile of the distant ridge. Drawn twice, side by side, so it can loop. */
const HazeTile = memo(function HazeTile({ w, h, tint }: { w: number; h: number; tint: string }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 400 120" preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <LinearGradient id="hazeFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={tint} stopOpacity={0.34} />
          <Stop offset="1" stopColor={tint} stopOpacity={0.72} />
        </LinearGradient>
      </Defs>
      <Path
        d="M 0 78 Q 26 44 58 60 Q 84 72 104 44 Q 128 12 160 46 Q 182 70 206 58 Q 232 44 254 66 Q 276 88 300 56 Q 326 22 352 54 Q 376 82 400 62 L 400 120 L 0 120 Z"
        fill="url(#hazeFade)"
      />
    </Svg>
  );
});

export interface SkyHazeProps {
  /** how tall the band is */
  height?: number;
  /** distance from the bottom of the parent */
  bottom?: number;
  /** one full pass across the sky */
  periodMs?: number;
  tint?: string;
}

/**
 * The far haze band: a pale ridge of distance that creeps sideways about three
 * times slower than the clouds. It is what makes the horizon feel far away
 * rather than painted on.
 */
export function SkyHaze({ height = 96, bottom = 190, periodMs = idle.cloudDriftMs * 3.4, tint = '#BBD8F2' }: SkyHazeProps) {
  const { width } = useWindowDimensions();
  const w = Math.max(360, width);
  const t = useLoop(periodMs);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -t.value * w }] }));

  return (
    <View style={[styles.haze, { height, bottom }]} pointerEvents="none">
      <Animated.View style={[styles.hazeRow, { width: w * 2 }, style]}>
        <HazeTile w={w} h={height} tint={tint} />
        <HazeTile w={w} h={height} tint={tint} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cloud: { position: 'absolute', left: 0 },
  haze: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  hazeRow: { flexDirection: 'row', height: '100%' },
});
