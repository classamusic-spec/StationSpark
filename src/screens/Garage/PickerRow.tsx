import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { hit, palette, radii, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '@/ui';

export interface PickerOption<T extends string> {
  value: T;
  label: string;
}

export interface PickerRowProps<T extends string> {
  options: readonly PickerOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** colour of the selected pill (default engine red) */
  tone?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The Garage's picker track — the same segmented-pill motif the rest of the app
 * uses, but the pills size to their label and wrap onto a second line instead
 * of truncating ("Fla…"). Consistency rule 10: when a label doesn't fit, the
 * layout changes, never the word.
 */
export function PickerRow<T extends string>({ options, value, onChange, tone = palette.engineRed, style }: PickerRowProps<T>) {
  return (
    <View style={[styles.track, style]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => {
              if (active) return;
              sfx.play('tap');
              haptics.select();
              onChange(o.value);
            }}
            style={({ pressed }) => [styles.pill, active && { backgroundColor: tone }, pressed && styles.pressed]}
            hitSlop={4}
          >
            <Text variant="buttonSmall" center color={active ? palette.white : palette.navySoft}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDF0F7',
    borderRadius: radii.card,
    padding: 4,
    gap: 4,
  },
  pill: {
    minHeight: hit.min - 10,
    flexGrow: 1,
    flexBasis: 'auto',
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
