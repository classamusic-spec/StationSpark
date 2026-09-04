import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '../Text';

export type ToastTone = 'gold' | 'green' | 'cyan' | 'white';

const tones: Record<ToastTone, { bg: string; fg: string; edge: string }> = {
  gold: { bg: palette.safetyYellow, fg: palette.navy, edge: palette.goldDark },
  green: { bg: palette.leafGreen, fg: palette.white, edge: palette.leafGreenDark },
  cyan: { bg: palette.waterCyan, fg: palette.navy, edge: palette.waterCyanDark },
  white: { bg: palette.white, fg: palette.navy, edge: palette.slateLight },
};

export interface ToastProps {
  visible: boolean;
  message: string;
  /** second line, e.g. the badge name */
  detail?: string;
  /** something small on the left — a BadgeArt, a StarIcon, a VocabIcon */
  icon?: React.ReactNode;
  tone?: ToastTone;
  /** auto-hide after this long (default 2600 ms; 0 keeps it up) */
  durationMs?: number;
  onHide?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * "Badge earned!" — a soft banner that drops in under the top bar, waits, and
 * slides away. Tapping it dismisses early.
 */
export function Toast({ visible, message, detail, icon, tone = 'gold', durationMs = 2600, onHide, style }: ToastProps) {
  const insets = useSafeAreaInsets();
  const t = tones[tone];

  useEffect(() => {
    if (!visible || !durationMs) return;
    const id = setTimeout(() => onHide?.(), durationMs);
    return () => clearTimeout(id);
  }, [durationMs, onHide, visible]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(16)}
      exiting={SlideOutUp.duration(220)}
      style={[styles.wrap, { top: insets.top + spacing.xs }, style]}
      pointerEvents="box-none"
    >
      <Pressable accessibilityRole="button" accessibilityLabel={`${message}${detail ? `. ${detail}` : ''}`} onPress={onHide}>
        <View style={[styles.pill, shadows.card, { backgroundColor: t.bg, borderColor: t.edge }]}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <View style={styles.text}>
            <Text variant="bodyStrong" color={t.fg}>
              {message}
            </Text>
            {detail ? (
              <Text variant="small" color={t.fg} style={styles.detail}>
                {detail}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.md, right: spacing.md, alignItems: 'center', zIndex: 95 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 2,
    maxWidth: 460,
  },
  icon: { width: 40, alignItems: 'center' },
  text: { flexShrink: 1 },
  detail: { opacity: 0.85 },
});
