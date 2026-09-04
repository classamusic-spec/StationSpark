import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { palette, type TypeVariant } from '@/theme';
import { useCountUp } from '@/hooks';
import { Text } from '../Text';

export interface CounterProps {
  /** the number to land on */
  value: number;
  /** start counting from here (default 0) */
  from?: number;
  variant?: TypeVariant;
  color?: string;
  /** e.g. "+" or "✨ +" */
  prefix?: string;
  /** e.g. " XP" */
  suffix?: string;
  durationMs?: number;
  delayMs?: number;
  /** hold at `from` until this flips true (celebrations stage their reveals) */
  enabled?: boolean;
  /** small pop when it appears */
  animateIn?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A number that counts up. Used for "+40 XP", "✨ +12", "12 Missions Completed".
 * Reduced motion shows the final value straight away.
 */
export function Counter({
  value,
  from = 0,
  variant = 'numeral',
  color = palette.navy,
  prefix = '',
  suffix = '',
  durationMs,
  delayMs,
  enabled = true,
  animateIn = false,
  style,
}: CounterProps) {
  const shown = useCountUp(value, { durationMs, delayMs, from, enabled });
  const body = (
    <Text variant={variant} color={color} center>
      {`${prefix}${shown}${suffix}`}
    </Text>
  );
  if (!animateIn) return <View style={[styles.wrap, style]}>{body}</View>;
  return (
    <Animated.View entering={ZoomIn.springify().damping(11)} style={[styles.wrap, style]}>
      {body}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center' } });
