/**
 * StarCounter — the white star pill that lives in the top-right corner of every
 * play screen (see the reference art's star counter, "0/8").
 *
 * Lives here because the Mission runner is its main home; the Dispatch board
 * and the Training Yard import it from '@/screens/Mission'.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { hit, palette, radii, shadows, springs } from '@/theme';
import { StarIcon } from '@/ui/icons';
import { Text } from '@/ui/Text';

export interface StarCounterProps {
  stars: number;
  /** when given, renders "3 / 9" */
  total?: number;
  /** pops the pill whenever `stars` grows */
  animate?: boolean;
}

export function StarCounter({ stars, total, animate = true }: StarCounterProps) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!animate || stars <= 0) return;
    scale.value = withSequence(withSpring(1.18, springs.pop), withSpring(1, springs.bounce));
  }, [animate, scale, stars]);

  const a = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.pill, shadows.soft, a]} accessibilityLabel={`${stars} stars`}>
      <StarIcon size={26} />
      <View style={styles.gap} />
      <Text variant="h3" color={palette.navy}>
        {total === undefined ? stars : `${stars}/${total}`}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    height: hit.min - 8,
    minWidth: 76,
    justifyContent: 'center',
  },
  gap: { width: 6 },
});
