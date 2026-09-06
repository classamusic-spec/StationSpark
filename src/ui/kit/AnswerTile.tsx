import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { hit, palette, radii, shadows } from '@/theme';
import { useFeedbackAnim } from '@/hooks/useFeedback';
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
  const rim =
    state === 'correct' ? palette.leafGreen : state === 'highlight' ? palette.safetyYellow : state === 'wrong' ? palette.slateLight : 'transparent';

  return (
    // Outer view owns the layout (entering) animation, inner view owns the
    // transform feedback — Reanimated needs them on separate nodes.
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(14)} style={style}>
      <Animated.View style={anim}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
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
            ]}
          >
            {label ? (
              <Text variant={size === 'lg' ? 'h1' : 'h2'} center>
                {label}
              </Text>
            ) : null}
            {children}
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
  disabled: { opacity: 0.45 },
  correct: { backgroundColor: palette.mint },
});
