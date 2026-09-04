import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, shadows, spacing } from '@/theme';
import { speech } from '@/services/speech';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { CharacterPortrait } from './CharacterPortrait';
import type { DialogueOverlayProps } from './types';

const names: Record<string, string> = { rookie: 'You', beacon: 'Beacon', bea: 'Captain Bea', pepper: 'Pepper' };

/**
 * STUB — the characters work replaces this with the animated speech-bubble
 * version (portrait slides in, text types on, radio card for Spanish). Keep the props API.
 */
export function DialogueOverlay({ line, onNext, spanishSupport = 'full' }: DialogueOverlayProps) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (line.speak === false) return;
    const lang = line.speakLang ?? 'en';
    speech.say(lang === 'es' && line.es ? line.es : line.text, { speaker: line.speaker, lang });
    return () => speech.stop();
  }, [line]);

  const name = line.speaker === 'npc' ? (line.npcName ?? 'Neighbor') : (names[line.speaker] ?? line.speaker);
  return (
    <Pressable style={[styles.wrap, { paddingBottom: insets.bottom + spacing.md }]} onPress={onNext} accessibilityRole="button" accessibilityLabel="Next">
      <Animated.View entering={FadeInUp.springify().damping(16)} style={styles.row}>
        <CharacterPortrait id={line.speaker} emotion={line.emotion} size={96} />
        <View style={[styles.bubble, shadows.card]}>
          <Text variant="tiny" color={palette.navyMuted}>
            {name}
          </Text>
          <Text variant="bodyStrong">{line.text}</Text>
          {line.es && spanishSupport !== 'min' && line.es !== line.text ? (
            <Text variant="small" color={palette.purple}>
              {line.es}
            </Text>
          ) : null}
          <View style={styles.next}>
            <Button label="Next" size="sm" tone="green" onPress={onNext} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: spacing.md, zIndex: 60 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  bubble: { flex: 1, backgroundColor: palette.white, borderRadius: radii.panel, borderBottomLeftRadius: 8, padding: spacing.md, gap: 4 },
  next: { alignItems: 'flex-end', marginTop: spacing.xs },
});
