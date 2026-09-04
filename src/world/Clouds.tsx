import React, { memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Ellipse, G } from 'react-native-svg';
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

const styles = StyleSheet.create({
  cloud: { position: 'absolute', left: 0 },
});
