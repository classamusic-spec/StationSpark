import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import type { AgeBand } from '@/learning/types';
import { palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { AnswerTile, HintBubble, Text } from '@/ui';
import type { AnswerState } from '@/ui/kit/AnswerTile';
import { useHintLadder } from './useHintLadder';

export interface AskQuestionProps {
  visible: boolean;
  prompt: string;
  promptEs?: string;
  options: string[];
  correct: string;
  ageBand?: AgeBand;
  /** Captain Bea's line after two misses — should make the answer obvious */
  hintText?: string;
  hintEs?: string;
  onCorrect?: () => void;
  onWrong?: () => void;
  onHint?: () => void;
  onDone: () => void;
  speakOnShow?: boolean;
  /** extra illustration rendered between the prompt and the answer tiles */
  content?: React.ReactNode;
}

/**
 * The quick multiple-choice beat (the "we already packed 2, how many more?"
 * subtraction moment). Sits over the play area and never blocks progress:
 * after 3 misses the right tile is highlighted.
 */
export function AskQuestion({
  visible,
  prompt,
  promptEs,
  options,
  correct,
  ageBand = 'B',
  hintText,
  hintEs,
  onCorrect,
  onWrong,
  onHint,
  onDone,
  speakOnShow = true,
  content,
}: AskQuestionProps) {
  const [misses, setMisses] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const hint = useHintLadder(misses, onHint);

  useEffect(() => {
    if (!visible || !speakOnShow) return;
    const t = setTimeout(() => speech.say(prompt, { speaker: 'bea' }), 300);
    return () => clearTimeout(t);
  }, [visible, prompt, speakOnShow]);

  const choose = useCallback(
    (option: string) => {
      if (solved) return;
      sfx.play('tap');
      haptics.select();
      setPicked(option);
      if (option === correct) {
        setSolved(true);
        onCorrect?.();
        setTimeout(onDone, 750);
      } else {
        setMisses((m) => m + 1);
        onWrong?.();
        setTimeout(() => setPicked(null), 520);
      }
    },
    [correct, onCorrect, onDone, onWrong, solved],
  );

  if (!visible) return null;

  const tileSize = ageBand === 'A' ? 'lg' : 'md';

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrim} pointerEvents="auto">
      <Animated.View entering={ZoomIn.springify().damping(15)} style={[styles.card, shadows.card]}>
        <Text variant="h2" center>
          {prompt}
        </Text>
        {promptEs ? (
          <Text variant="small" color={palette.purple} center style={styles.es}>
            {promptEs}
          </Text>
        ) : null}
        {content ? <View style={styles.content}>{content}</View> : null}
        <View style={styles.options}>
          {options.map((option, i) => {
            const state: AnswerState =
              solved && option === correct
                ? 'correct'
                : picked === option
                  ? 'wrong'
                  : hint.highlight && option === correct
                    ? 'highlight'
                    : 'idle';
            return (
              <AnswerTile
                key={option}
                label={option}
                index={i}
                size={tileSize}
                state={state}
                onPress={() => choose(option)}
              />
            );
          })}
        </View>
        <Pressable onPress={() => speech.say(prompt, { speaker: 'bea' })} style={styles.replay} accessibilityRole="button" accessibilityLabel="Hear the question again">
          <Text variant="tiny" color={palette.navyMuted}>
            TAP TO HEAR AGAIN
          </Text>
        </Pressable>
      </Animated.View>
      {hintText ? (
        <HintBubble text={hintText} es={hintEs} visible={hint.showBubble} onDismiss={hint.dismiss} />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(31,42,90,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    zIndex: 80,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.panel,
    padding: spacing.lg,
    maxWidth: 460,
    width: '100%',
  },
  es: { marginTop: 2 },
  content: { marginTop: spacing.sm, alignItems: 'center' },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  replay: { alignSelf: 'center', marginTop: spacing.sm, padding: spacing.xs },
});
