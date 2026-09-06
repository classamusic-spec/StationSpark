import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { hit, palette, radii, roles, shadows } from '@/theme';
import { useFeedbackAnim } from '@/hooks/useFeedback';
import { CheckIcon, ResetIcon } from '../icons';
import { Text } from '../Text';

export type AnswerState = 'idle' | 'correct' | 'wrong' | 'disabled' | 'highlight';

/**
 * Big tappable multiple-choice tile ("18", "Maple St", a word, an icon).
 * Feedback is built in: set state='correct' → pop, state='wrong' → wobble.
 * `highlight` = the auto-hint glow (gold rim) after repeated misses.
 */
export function AnswerTile({
  label,
  children,
  onPress,
  state = 'idle',
  index = 0,
  size = 'md',
  style,
  accessibilityLabel,
}: {
  label?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  state?: AnswerState;
  index?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { style: anim, pop, wobble, press } = useFeedbackAnim();
  useEffect(() => {
    if (state === 'correct') pop();
    if (state === 'wrong') wobble();
  }, [state, pop, wobble]);

  const dims = size === 'lg' ? { minWidth: 120, minHeight: 100 } : size === 'sm' ? { minWidth: hit.min, minHeight: hit.min } : { minWidth: 92, minHeight: hit.big };
  /*
   * A miss is warm, never grey and never red: grey read as "this button is
   * dead" and red is brand energy in this app. It also never signals by colour
   * alone — `mark` below puts a shape on the tile so the state survives colour
   * blindness and a screen reader.
   */
  const rim =
    state === 'correct'
      ? roles.state.successEdge
      : state === 'highlight'
        ? roles.state.focusRing
        : state === 'wrong'
          ? roles.state.retryEdge
          : 'transparent';
  const mark = state === 'correct' ? 'correct' : state === 'wrong' ? 'retry' : null;

  return (
    // Outer view owns the layout (entering) animation, inner view owns the
    // transform feedback — Reanimated needs them on separate nodes.
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(14)} style={style}>
      <Animated.View style={anim}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled: state === 'disabled', selected: state === 'correct' }}
          accessibilityHint={state === 'wrong' ? 'Not that one — try again' : undefined}
          disabled={state === 'disabled' || state === 'correct'}
          onPressIn={() => press(true)}
          onPressOut={() => press(false)}
          onPress={onPress}
        >
          <View
            style={[
              styles.tile,
              shadows.card,
              dims,
              { borderColor: rim },
              state === 'disabled' && styles.disabled,
              state === 'highlight' && shadows.glowGold,
              state === 'correct' && styles.correct,
              state === 'wrong' && styles.wrong,
            ]}
          >
            {label ? (
              <Text variant={size === 'lg' ? 'h1' : 'h2'} center>
                {label}
              </Text>
            ) : null}
            {children}
            {mark ? (
              <View style={[styles.mark, mark === 'correct' ? styles.markCorrect : styles.markRetry]} pointerEvents="none">
                {mark === 'correct' ? (
                  <CheckIcon size={16} color={palette.white} />
                ) : (
                  <ResetIcon size={16} color={palette.white} />
                )}
              </View>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  /* A disabled tile stays legible: it recedes by fill, not by fading the words. */
  disabled: { backgroundColor: roles.state.disabledFill, borderColor: roles.state.disabledEdge },
  correct: { backgroundColor: roles.state.successFill },
  wrong: { backgroundColor: roles.state.retryFill },
  mark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.white,
  },
  markCorrect: { backgroundColor: roles.state.successEdge },
  markRetry: { backgroundColor: roles.state.retryEdge },
});
