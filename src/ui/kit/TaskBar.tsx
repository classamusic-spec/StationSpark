import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { palette, radii, roles, spacing } from '@/theme';
import { useShowTranslation } from '@/hooks';
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
  /** hear the task again; omit when the activity has nothing to say */
  onReplay?: () => void;
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
  const replay = onReplay ?? chrome.onReplay;
  const steps = progress ?? chrome.progress;
  const translated = showEs && es && es !== task ? es : undefined;

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
