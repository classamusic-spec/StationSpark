import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { palette, roles } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { useSwing } from '../parts/motion';

/**
 * WHAT THIS FOOD WANTS YOU TO DO.
 *
 * A gesture nobody can see is a gesture nobody makes. Every swipe, stir and cut
 * in the kitchen carries one of these: a soft ghost of the movement, drawn over
 * the food itself, big enough to read from a metre away.
 *
 * When the child has asked for less motion the ghost holds still — the arrows
 * are all still there, they simply stop travelling — and the tap path is always
 * live underneath, so the hint is a suggestion, never a requirement.
 */

const ARROW = 'M0 0 l-13 -10 v20 z';

export function SweepHint({
  width,
  height,
  visible = true,
  style,
}: {
  width: number;
  height: number;
  visible?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const swing = useSwing(1, 2000);
  const glow = useAnimatedStyle(() => ({ opacity: reduced ? 0.95 : 0.7 + swing.value * 0.3 }));

  if (!visible) return null;
  const midY = height / 2;
  return (
    <Animated.View style={[styles.fill, { width, height }, glow, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={`M ${width * 0.18} ${midY} H ${width * 0.82}`}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray="2 18"
        />
        <Path d={ARROW} fill={palette.safetyYellow} transform={`translate(${width * 0.15} ${midY}) rotate(180)`} />
        <Path d={ARROW} fill={palette.safetyYellow} transform={`translate(${width * 0.85} ${midY})`} />
      </Svg>
    </Animated.View>
  );
}

export function SwirlHint({ size, visible = true, style }: { size: number; visible?: boolean; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const swing = useSwing(1, 2600);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${reduced ? 0 : swing.value * 40}deg` }] }));

  if (!visible) return null;
  const r = size * 0.32;
  const c = size / 2;
  return (
    <Animated.View style={[styles.centredBox, { width: size, height: size }, spin, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${r * 2.6} ${r * 1.4}`}
        />
        <Path d={ARROW} fill={palette.safetyYellow} transform={`translate(${c + r} ${c}) rotate(90)`} />
      </Svg>
    </Animated.View>
  );
}

/** A knife stroke waiting to happen: a dashed line with a blade at one end. */
export function CutHint({
  x1,
  y1,
  x2,
  y2,
  width,
  height,
  visible = true,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  height: number;
  visible?: boolean;
}) {
  const reduced = useReducedMotion();
  const swing = useSwing(1, 1800);
  const slide = useAnimatedStyle(() => ({ opacity: reduced ? 0.9 : 0.55 + swing.value * 0.35 }));
  if (!visible) return null;
  return (
    <Animated.View style={[styles.fill, { width, height }, slide]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path
          d={`M ${x1} ${y1} L ${x2} ${y2}`}
          stroke={palette.safetyYellow}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray="14 12"
        />
        <Circle cx={x1} cy={y1} r={9} fill={roles.state.focusRing} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center' },
  centredBox: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
