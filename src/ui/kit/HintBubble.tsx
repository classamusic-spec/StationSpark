import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { CharacterPortrait } from '@/characters/CharacterPortrait';
import { Text } from '../Text';

/**
 * Beacon's hint bubble. Appears above the tray after a miss. Tap to dismiss.
 * Optional `es` shows the Spanish line under the English one (radio-card style).
 */
export function HintBubble({ text, es, visible, onDismiss }: { text: string; es?: string; visible: boolean; onDismiss?: () => void }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeInUp.springify().damping(14)} exiting={FadeOutDown} style={styles.wrap} pointerEvents="box-none">
      <Pressable onPress={onDismiss} style={styles.row} accessibilityRole="button" accessibilityLabel={`Hint: ${text}`}>
        <CharacterPortrait id="beacon" emotion="think" size={64} />
        <View style={[styles.bubble, shadows.card]}>
          <Text variant="bodyStrong">{text}</Text>
          {es ? (
            <Text variant="small" color={palette.purple}>
              {es}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, zIndex: 40 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  bubble: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderBottomLeftRadius: 6,
    padding: spacing.md,
  },
});
