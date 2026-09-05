import React from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { palette, radii, spacing } from '@/theme';
import { Button, Text } from '@/ui';

export interface ModalCardProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  closeLabel?: string;
  children?: React.ReactNode;
}

/**
 * LOCAL FALLBACK for a kit `<Modal/>` — a question card that FLOATS over the
 * scene on a soft shadow, with only a whisper of warm tint behind it
 * (art critique item #24: the old 42 % navy scrim greyed out Rescue Pets and
 * Equipment Check entirely). Tapping outside closes; the button is ≥ 56 px.
 */
export function ModalCard({ visible, title, subtitle, onClose, closeLabel = 'Got it!', children }: ModalCardProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(160)} style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} />
        <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.card, styles.float]}>
          <Text variant="h2" center>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" center color={palette.navySoft}>
              {subtitle}
            </Text>
          ) : null}
          {children}
          <Button label={closeLabel} tone="green" size="md" onPress={onClose} block />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(58,54,74,0.16)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  /** a deeper, softer lift so the card separates from the scene without a sheet */
  float: { shadowColor: '#1F2A5A', shadowOpacity: 0.28, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 14 },
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.panel,
    padding: spacing.lg,
    gap: spacing.sm,
    width: '100%',
    maxWidth: 420,
    alignItems: 'stretch',
  },
});
