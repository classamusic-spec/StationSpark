import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette, spacing } from '@/theme';
import { Text } from '../Text';
import { StarIcon } from '../icons';
import { ProgressBar } from './ProgressBar';

export interface XpBarProps {
  /** XP into the current level */
  value: number;
  /** XP needed for the next level */
  max: number;
  /** left label — "Level 4" */
  label?: string;
  /** right label — "Next Level" */
  rightLabel?: string;
  /** show the gold star beside the right label (default true) */
  star?: boolean;
  /** unit shown after the numbers (default "XP") */
  unit?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * The profile XP row from the reference: "Level 4 … Next Level" with a star, a green bar,
 * then "120 / 200 XP" underneath.
 */
export function XpBar({ value, max, label, rightLabel = 'Next Level', star = true, unit = 'XP', color = palette.leafGreen, style }: XpBarProps) {
  const safeMax = Math.max(1, max);
  return (
    <View style={[styles.wrap, style]}>
      {label || rightLabel ? (
        <View style={styles.row}>
          {label ? (
            <Text variant="h2" color={palette.navy}>
              {label}
            </Text>
          ) : (
            <View />
          )}
          <View style={styles.right}>
            {rightLabel ? (
              <Text variant="body" color={palette.navyMuted}>
                {rightLabel}
              </Text>
            ) : null}
            {star ? <StarIcon size={28} /> : null}
          </View>
        </View>
      ) : null}
      <ProgressBar value={value} max={safeMax} height={20} color={color} accessibilityLabel={`${value} of ${safeMax} ${unit}`} />
      <Text variant="bodyStrong" color={palette.navy}>
        {`${value} / ${safeMax} ${unit}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
