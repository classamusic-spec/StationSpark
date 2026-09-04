import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, shadows, spacing } from '@/theme';

/**
 * Bottom tray that holds draggable items / answer tiles / action buttons.
 * White with big rounded top corners; safe-area aware.
 */
export function Tray({ children, style, tone = 'white' }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: 'white' | 'glass' | 'cream' }) {
  const insets = useSafeAreaInsets();
  const bg = tone === 'white' ? palette.white : tone === 'cream' ? palette.panel : 'rgba(255,255,255,0.86)';
  return (
    <Animated.View entering={FadeInUp.springify().damping(18)} style={[styles.tray, shadows.card, { backgroundColor: bg, paddingBottom: Math.max(insets.bottom, spacing.md) }, style]}>
      {children}
    </Animated.View>
  );
}

/** Horizontal row of equal-width cells for tray content. */
export function TrayRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  tray: {
    borderTopLeftRadius: radii.panel + 8,
    borderTopRightRadius: radii.panel + 8,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
});
