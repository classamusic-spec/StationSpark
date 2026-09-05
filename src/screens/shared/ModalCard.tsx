import React from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
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
 * LOCAL FALLBACK for a kit `<Modal/>` — a centred card over a soft navy scrim.
 * Tapping the scrim closes; the close button is always ≥ 56 px.
 */
export function ModalCard({ visible, title, subtitle, onClose, closeLabel = 'Got it!', children }: ModalCardProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(160)} style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} />
        <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.card, shadows.card]}>
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
  scrim: { flex: 1, backgroundColor: 'rgba(31,42,90,0.42)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
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
