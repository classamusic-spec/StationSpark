import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '../Text';

/**
 * The white instruction pill at the top of every mini-game:
 *   "Put Out 6 Flames!"  /  "Drag the items into the truck."
 */
export function PromptBanner({ title, subtitle, es, compact }: { title: string; subtitle?: string; es?: string; compact?: boolean }) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.wrap, shadows.card, compact && styles.compact]}>
      <Text variant={compact ? 'h3' : 'h2'} center>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="small" color={palette.navySoft} center style={styles.sub}>
          {subtitle}
        </Text>
      ) : null}
      {es ? (
        <View style={styles.esRow}>
          <Text variant="tiny" color={palette.purple}>
            {es}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.panel,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    maxWidth: 520,
    marginHorizontal: spacing.md,
  },
  compact: { paddingVertical: spacing.xs },
  sub: { marginTop: 2 },
  esRow: { alignItems: 'center', marginTop: 2 },
});
