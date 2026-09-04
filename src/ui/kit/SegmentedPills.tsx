import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '../Text';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  /** second line — "ages 5–6" */
  hint?: string;
  /** a small icon above the label */
  icon?: React.ReactNode;
}

export interface SegmentedPillsProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** colour of the selected pill (default engine red) */
  color?: string;
  /** stack the options vertically */
  column?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A row of big rounded choices — age band, truck colour, Spanish support.
 * The selected pill lifts, fills with colour and keeps a white inner sheen so
 * the choice is obvious without reading.
 */
export function SegmentedPills<T extends string>({ options, value, onChange, color = palette.engineRed, column = false, style }: SegmentedPillsProps<T>) {
  return (
    <View style={[styles.row, column && styles.column, style]} accessibilityRole="radiogroup">
      {options.map((o, i) => {
        const active = o.id === value;
        return (
          <Animated.View key={o.id} entering={FadeIn.delay(i * 50)} style={column ? styles.fullWidth : styles.flexItem}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={o.hint ? `${o.label}, ${o.hint}` : o.label}
              onPress={() => {
                if (active) return;
                sfx.play('pop');
                haptics.select();
                onChange(o.id);
              }}
              style={({ pressed }) => [
                styles.pill,
                active ? [shadows.card, { backgroundColor: color, borderColor: 'rgba(255,255,255,0.45)' }] : styles.inactive,
                pressed && styles.pressed,
              ]}
            >
              {o.icon ? <View style={styles.icon}>{o.icon}</View> : null}
              <Text variant="buttonSmall" center color={active ? palette.white : palette.navy}>
                {o.label}
              </Text>
              {o.hint ? (
                <Text variant="tiny" center color={active ? 'rgba(255,255,255,0.85)' : palette.navyMuted}>
                  {o.hint}
                </Text>
              ) : null}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs, alignItems: 'stretch' },
  column: { flexDirection: 'column' },
  flexItem: { flex: 1 },
  fullWidth: { alignSelf: 'stretch' },
  pill: {
    minHeight: hit.min,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    gap: 2,
  },
  inactive: { backgroundColor: palette.white, borderColor: palette.slateLight },
  pressed: { transform: [{ scale: 0.96 }] },
  icon: { marginBottom: 2 },
});
