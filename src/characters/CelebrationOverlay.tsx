import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { StarRow } from '@/ui/kit/StarRow';
import { SubjectPill } from '@/ui/SubjectPill';
import type { CelebrationOverlayProps } from './types';

/**
 * STUB — the characters work replaces this with confetti, jumping crew and a
 * flipping badge. Keep the props API.
 */
export function CelebrationOverlay({ visible, title, subtitle, stars, badge, xp, sparks, subjects, ctaLabel = 'Continue', onNext }: CelebrationOverlayProps) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn} style={styles.wrap}>
      <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.card, shadows.card]}>
        <Text variant="display" center>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" center color={palette.navySoft}>
            {subtitle}
          </Text>
        ) : null}
        {stars !== undefined ? <StarRow stars={stars} size={44} animate /> : null}
        {badge ? <Text variant="h3" center>{`🏅 ${badge}`}</Text> : null}
        {xp !== undefined || sparks !== undefined ? (
          <Text variant="h3" center color={palette.goldDark}>
            {xp !== undefined ? `+${xp} XP` : ''} {sparks !== undefined ? `✨ +${sparks}` : ''}
          </Text>
        ) : null}
        {subjects && subjects.length ? (
          <View style={styles.pills}>
            {subjects.map((s) => (
              <SubjectPill key={s} subject={s} small />
            ))}
          </View>
        ) : null}
        <Button label={ctaLabel} tone="green" size="lg" onPress={onNext} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(31,42,90,0.35)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, zIndex: 80 },
  card: { backgroundColor: palette.white, borderRadius: radii.panel, padding: spacing.lg, alignItems: 'center', gap: spacing.sm, width: '100%', maxWidth: 420 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
});
