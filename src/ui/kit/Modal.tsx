import React from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '../Text';
import { Button } from '../Button';
import { RoundIconButton } from '../RoundIconButton';
import { BackIcon } from '../icons';

export interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  /** primary action (a green pill at the bottom) */
  ctaLabel?: string;
  onCta?: () => void;
  /** tapping the dim backdrop closes it (default true) */
  dismissable?: boolean;
  /** show the round close button (default true when `onClose` is given) */
  showClose?: boolean;
  /** stretch the sheet to most of the screen */
  tall?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A glass sheet that springs up from the bottom over whatever screen you are on.
 * Used for settings, "are you sure?", the badge detail card and the pause menu.
 */
export function Modal({ visible, onClose, title, subtitle, children, ctaLabel, onCta, dismissable = true, showClose, tall = false, style }: ModalProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const close = () => {
    sfx.play('tap-soft');
    haptics.tap();
    onClose?.();
  };

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={StyleSheet.absoluteFill}>
        <Pressable
          accessible={dismissable}
          accessibilityRole={dismissable ? 'button' : undefined}
          accessibilityLabel={dismissable ? 'Close' : undefined}
          style={styles.scrim}
          onPress={dismissable ? close : undefined}
        />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.springify().damping(18).stiffness(160)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.sheet, shadows.card, tall && styles.tall, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xs }, style]}
      >
        <View style={styles.grabber} />
        {(showClose ?? !!onClose) && onClose ? (
          <View style={styles.close}>
            <RoundIconButton accessibilityLabel="Close" onPress={close} size={hit.min}>
              <BackIcon size={24} />
            </RoundIconButton>
          </View>
        ) : null}
        {title ? (
          <Text variant="h1" center style={styles.title}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="body" color={palette.navySoft} center>
            {subtitle}
          </Text>
        ) : null}
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {ctaLabel ? <Button label={ctaLabel} tone="green" size="lg" block onPress={onCta ?? onClose} /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', zIndex: 90 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(31,42,90,0.42)' },
  sheet: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: radii.panel + 10,
    borderTopRightRadius: radii.panel + 10,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    maxHeight: '88%',
  },
  tall: { minHeight: '62%' },
  grabber: { alignSelf: 'center', width: 56, height: 6, borderRadius: 3, backgroundColor: palette.slateLight, marginBottom: 4 },
  close: { position: 'absolute', right: spacing.md, top: spacing.md, zIndex: 2 },
  title: { marginTop: 2 },
  body: { alignSelf: 'stretch' },
  bodyContent: { gap: spacing.sm, paddingVertical: spacing.xs },
});
