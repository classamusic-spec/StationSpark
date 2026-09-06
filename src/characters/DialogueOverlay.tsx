import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, SlideInLeft, SlideInRight, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import { useTypewriter } from '@/hooks';
import { speech } from '@/services/speech';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/kit/Chip';
import { RadioCard } from '@/ui/kit/RadioCard';
import { CharacterPortrait } from './CharacterPortrait';
import type { DialogueOverlayProps } from './types';

const names: Record<string, string> = { rookie: 'You', bea: 'Captain Bea' };

/** Reading pace for a 5–10 year old following along. */
const CHARS_PER_SECOND = 28;

const PORTRAIT = 104;

/**
 * A line of story. The speaker slides in from their side, the bubble types the
 * line on so a child can read along, and the Spanish version rides underneath
 * on a radio card that can be replayed as many times as they like.
 *
 * Tap anywhere to finish the typing; tap again (or press Next) to continue.
 */
export function DialogueOverlay({ line, index, total, onNext, onSkip, spanishSupport = 'full' }: DialogueOverlayProps) {
  const insets = useSafeAreaInsets();
  const right = line.speaker === 'npc';

  const { shown, done, finish } = useTypewriter(line.text, { cps: CHARS_PER_SECOND });

  useEffect(() => {
    if (line.speak === false) return;
    const lang = line.speakLang ?? 'en';
    speech.say(lang === 'es' && line.es ? line.es : line.text, { speaker: line.speaker, lang });
    return () => speech.stop();
  }, [line]);

  const advance = useCallback(() => {
    if (!done) {
      finish();
      haptics.tap();
      return;
    }
    sfx.play('tap-soft');
    haptics.tap();
    speech.stop();
    onNext();
  }, [done, finish, onNext]);

  const name = line.speaker === 'npc' ? (line.npcName ?? 'Neighbour') : (names[line.speaker] ?? line.speaker);
  const showRadio = !!line.es && line.es !== line.text;
  const dots = useMemo(() => (total && total > 1 ? Array.from({ length: total }, (_, i) => i) : null), [total]);

  return (
    <Pressable
      style={[styles.wrap, { paddingBottom: insets.bottom + spacing.md, paddingTop: insets.top + spacing.md }]}
      onPress={advance}
      accessibilityRole="button"
      accessibilityLabel={`${name} says: ${line.text}. Tap to continue.`}
    >
      <Animated.View entering={FadeIn.duration(180)} style={styles.scrim} pointerEvents="none" />

      {onSkip ? (
        <View style={[styles.skip, { top: insets.top + spacing.xs }]}>
          <Button label="Skip" size="sm" tone="white" sound="tap-soft" onPress={onSkip} />
        </View>
      ) : null}

      <View style={[styles.row, right && styles.rowRight]}>
        <Animated.View entering={(right ? SlideInRight : SlideInLeft).springify().damping(16).stiffness(140)}>
          <CharacterPortrait id={line.speaker} npc={line.npcName?.toLowerCase()} emotion={line.emotion} size={PORTRAIT} />
        </Animated.View>

        <Animated.View entering={FadeInUp.springify().damping(17)} style={styles.bubbleWrap}>
          {/* the tail, pointing back at the speaker */}
          <View style={[styles.tail, right ? styles.tailRight : styles.tailLeft]} pointerEvents="none">
            <Svg width={20} height={22} viewBox="0 0 20 22">
              <Path d={right ? 'M 20 4 L 0 13 L 18 22 Z' : 'M 0 4 L 20 13 L 2 22 Z'} fill={palette.white} />
            </Svg>
          </View>

          <View style={[styles.bubble, shadows.card]}>
            <View style={styles.nameRow}>
              <Chip label={name} tone="cream" />
              {dots ? (
                <View style={styles.dots}>
                  {dots.map((i) => (
                    <View key={i} style={[styles.dot, i === (index ?? 0) && styles.dotOn]} />
                  ))}
                </View>
              ) : null}
            </View>

            <Text variant="bodyStrong" style={styles.line}>
              {shown}
              {!done ? <Text variant="bodyStrong" color={palette.navyMuted}>{'▌'}</Text> : null}
            </Text>

            {showRadio && line.es ? (
              <Animated.View entering={ZoomIn.delay(120).springify().damping(15)}>
                <RadioCard es={line.es} en={line.text} support={spanishSupport} from={name} compact />
              </Animated.View>
            ) : null}

            <View style={styles.actions}>
              <Button label={done ? 'Next' : 'Show all'} size="md" tone="green" onPress={advance} iconRight={<NextChevron />} />
            </View>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const NextChevron = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path d="M 9 5 l 7 7 -7 7" stroke={palette.white} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', padding: spacing.md, zIndex: 60 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(31,42,90,0.18)' },
  skip: { position: 'absolute', right: spacing.md, zIndex: 3 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  rowRight: { flexDirection: 'row-reverse' },
  bubbleWrap: { flex: 1 },
  bubble: {
    backgroundColor: palette.white,
    borderRadius: radii.panel,
    padding: spacing.md,
    gap: spacing.xs,
    maxWidth: 560,
  },
  tail: { position: 'absolute', bottom: 26, zIndex: 2 },
  tailLeft: { left: -14 },
  tailRight: { right: -14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.slateLight },
  dotOn: { backgroundColor: palette.engineRed, width: 20 },
  line: { minHeight: 52 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', minHeight: hit.min },
});
