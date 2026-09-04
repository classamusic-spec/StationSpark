import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { palette } from '@/theme';
import { StarIcon } from '../icons';

/** Three stars, filled up to `stars`. Animates in with a stagger when `animate`. */
export function StarRow({ stars, size = 36, animate }: { stars: 0 | 1 | 2 | 3; size?: number; animate?: boolean }) {
  return (
    <View style={styles.row}>
      {[0, 1, 2].map((i) => {
        const on = i < stars;
        return (
          <Animated.View key={i} entering={animate ? ZoomIn.delay(200 + i * 220).springify().damping(9) : undefined}>
            <StarIcon size={size} color={on ? palette.safetyYellow : palette.lockedGrey} stroke={on ? palette.goldDark : palette.slate} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 6, alignItems: 'center' } });
