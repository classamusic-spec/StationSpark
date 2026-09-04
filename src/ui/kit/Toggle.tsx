import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { hit, palette, radii, shadows, spacing, springs, timings } from '@/theme';
import { useReducedMotion } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '../Text';
import { CheckIcon } from '../icons';

export interface ToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  /** text on the left of the switch */
  label?: string;
  /** small helper line under the label */
  hint?: string;
  /** switch width (min tap height stays ≥ 56) */
  width?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const KNOB_INSET = 5;

/**
 * A big kid-safe switch. The whole row is the tap target, the knob springs
 * across, and "on" shows a white tick so it reads without relying on colour.
 */
export function Toggle({ value, onChange, label, hint, width = 92, disabled = false, style }: ToggleProps) {
  const height = 52;
  const knob = height - KNOB_INSET * 2;
  const t = useSharedValue(value ? 1 : 0);
  const reduced = useReducedMotion();

  useEffect(() => {
    t.value = reduced ? (value ? 1 : 0) : withSpring(value ? 1 : 0, springs.pop);
  }, [reduced, t, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [palette.slateLight, palette.leafGreen]),
  }));
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: t.value * (width - knob - KNOB_INSET * 2) }],
  }));
  const tickStyle = useAnimatedStyle(() => ({ opacity: withTiming(value ? 1 : 0, timings.fast) }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        sfx.play('pop');
        haptics.select();
        onChange(!value);
      }}
      style={[styles.row, disabled && styles.disabled, style]}
      hitSlop={6}
    >
      {label || hint ? (
        <View style={styles.labels}>
          {label ? <Text variant="bodyStrong">{label}</Text> : null}
          {hint ? (
            <Text variant="small" color={palette.navyMuted}>
              {hint}
            </Text>
          ) : null}
        </View>
      ) : null}
      <Animated.View style={[styles.track, { width, height, borderRadius: height / 2 }, trackStyle]}>
        <Animated.View style={[styles.tick, tickStyle]}>
          <CheckIcon size={20} color={palette.white} />
        </Animated.View>
        <Animated.View style={[styles.knob, shadows.soft, { width: knob, height: knob, borderRadius: knob / 2 }, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: hit.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 4,
  },
  disabled: { opacity: 0.5 },
  labels: { flexShrink: 1, gap: 2 },
  track: {
    justifyContent: 'center',
    padding: KNOB_INSET,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: radii.pill,
  },
  tick: { position: 'absolute', left: 14 },
  knob: { backgroundColor: palette.white },
});
