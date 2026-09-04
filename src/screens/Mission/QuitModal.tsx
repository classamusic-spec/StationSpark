/**
 * "Leave this mission?" — the only confirm dialog in the game.
 *
 * Leaving is always allowed and never punished; the wording makes that clear,
 * and "Keep helping" is the bigger, friendlier button.
 */
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Button, Panel, Text } from '@/ui';
import { CharacterPortrait } from '@/characters';

export interface QuitModalProps {
  visible: boolean;
  onKeepGoing: () => void;
  onLeave: () => void;
}

export function QuitModal({ visible, onKeepGoing, onLeave }: QuitModalProps) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)} style={styles.scrim}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Keep helping" onPress={onKeepGoing} />
      <Animated.View entering={ZoomIn.springify().damping(13)}>
        <Panel tone="white" radius="panel" style={[styles.card, shadows.card]}>
          <CharacterPortrait id="bea" emotion="calm" size={80} />
          <Text variant="h1" center>
            Leave this mission?
          </Text>
          <Text variant="body" color={palette.navySoft} center>
            You can come back any time — the crew will wait for you.
          </Text>
          <Button label="Keep helping" tone="green" size="lg" block onPress={onKeepGoing} />
          <Button label="Leave for now" tone="white" size="md" block onPress={onLeave} sound="tap-soft" />
        </Panel>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(31,42,90,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 90,
  },
  card: { width: '100%', maxWidth: 400, alignItems: 'center', gap: spacing.sm, borderRadius: radii.panel },
});
