import React, { useCallback } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, radii, roles, spacing } from '@/theme';
import { useShowTranslation } from '@/hooks';
import { speech } from '@/services/speech';
import { useActivityChrome } from './activityChrome';
import { BackIcon, SpeakerIcon } from '../icons';
import { RoundIconButton } from '../RoundIconButton';
import { Text } from '../Text';

export interface TaskBarProps {
  /** the one short instruction for this activity — an imperative, not a sentence */
  task: string;
  /** the same instruction in Spanish; shown only when the child asked for full support */
  es?: string;
  /**
   * One quiet line of scaffolding under the task — *how* to do it. Kept in the
   * same surface on purpose: the brief is to consolidate instructions, not to
   * delete the help a younger child needs.
   */
  detail?: string;
  /** leaving the activity */
  onBack?: () => void;
  /**
   * Hear the task again. Omit it and the bar reads the task itself — a game
   * should not have to opt in to being understood. Pass one only to say
   * something the bar cannot see (a number to count out, a word to sound out),
   * or `null` to remove the button where the activity really is silent.
   */
  onReplay?: (() => void) | null;
  /** how far through — drawn as a quiet dot row, not a second scoreboard */
  progress?: { done: number; total: number };
  /** shrink for short screens */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * THE ONE INSTRUCTION AREA.
 *
 * Every activity used to say the same thing three times: a banner at the top, a
 * speech bubble under it, and the voice track. This bar is the single place the
 * task lives — back out of it on the left, hear it again on the right, and how
 * far through you are underneath.
 *
 * Nothing else on an activity screen may restate the task. Captain Bea's bubble
 * is reserved for *hints and reactions*, which is what makes it worth reading
 * when it does appear.
 */
export function TaskBar({ task, es, detail, onBack, onReplay, progress, compact, style }: TaskBarProps) {
  const showEs = useShowTranslation();
  /* The host supplies back / replay / progress so there is only ever one bar. */
  const chrome = useActivityChrome();
  const back = onBack ?? chrome.onBack;
  const steps = progress ?? chrome.progress;
  const translated = showEs && es && es !== task ? es : undefined;

  /**
   * Reading the task back is the default, not a feature a game opts into.
   * Only 7 of the 25 activities ever passed a handler, which left a child who
   * missed the spoken line — or who cannot read it — with no way to get it
   * back in the other 18.
   */
  const sayTask = useCallback(() => {
    /* `speech.say` interrupts, so the Spanish waits its turn rather than
       cutting the English off mid-word. */
    speech.say(task, {
      speaker: 'bea',
      onDone: translated ? () => setTimeout(() => speech.say(translated, { speaker: 'bea', lang: 'es' }), 250) : undefined,
    });
  }, [task, translated]);
  const replay = onReplay === null ? undefined : (onReplay ?? chrome.onReplay ?? sayTask);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(17)}
      style={[styles.wrap, roles.lift.surface, compact && styles.compact, style]}
    >
      <View style={styles.row}>
        {back ? (
          <RoundIconButton onPress={back} accessibilityLabel="Back" size={compact ? 44 : 48}>
            <BackIcon size={compact ? 20 : 22} color={palette.navy} />
          </RoundIconButton>
        ) : (
          <View style={styles.spacer} />
        )}

        <View style={styles.middle}>
          <Text variant={compact ? 'h3' : 'h2'} center numberOfLines={2} accessibilityRole="header">
            {task}
          </Text>
          {detail ? (
            <Text variant="small" color={roles.ink.secondary} center numberOfLines={2} style={styles.es}>
              {detail}
            </Text>
          ) : null}
          {translated ? (
            <Text variant="small" color={roles.ink.translation} center numberOfLines={1} style={styles.es}>
              {translated}
            </Text>
          ) : null}
        </View>

        {replay ? (
          <RoundIconButton onPress={replay} accessibilityLabel="Hear it again" size={compact ? 44 : 48} tone="white">
            <SpeakerIcon size={compact ? 20 : 22} color={palette.waterCyanDark} />
          </RoundIconButton>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {steps && steps.total > 1 ? (
        <View
          style={styles.dots}
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${Math.min(steps.done + 1, steps.total)} of ${steps.total}`}
        >
          {Array.from({ length: steps.total }, (_, i) => (
            <View key={i} style={[styles.dot, i < steps.done && styles.dotDone, i === steps.done && styles.dotNow]} />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    backgroundColor: roles.surface.card,
    borderRadius: radii.panel,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  compact: { paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  /* keeps the task optically centred when only one side has a button */
  spacer: { width: 48 },
  middle: { flex: 1, justifyContent: 'center' },
  es: { marginTop: 2 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: roles.state.disabledFill },
  dotDone: { backgroundColor: palette.leafGreen },
  dotNow: { backgroundColor: palette.safetyYellow, width: 20 },
});
