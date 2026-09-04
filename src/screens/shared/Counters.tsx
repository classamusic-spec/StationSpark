import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { palette, radii, shadows } from '@/theme';
import { StarIcon, Text } from '@/ui';
import { useGame } from '@/state/store';
import { selectSparks, selectTotalStars } from '@/state/selectors';

function CounterPill({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeIn} style={[styles.pill, shadows.soft]}>
      {children}
    </Animated.View>
  );
}

/** ⭐ n — total stars earned, for the right side of a TopBar. */
export function StarCounter({ count, label }: { count?: number; label?: string }) {
  const stored = useGame(selectTotalStars);
  const value = count ?? stored;
  return (
    <CounterPill>
      <StarIcon size={22} />
      <Text variant="buttonSmall" color={palette.navy} style={styles.value}>
        {label ?? value}
      </Text>
    </CounterPill>
  );
}

/** ✨ n — Sparks, the decoration currency. Only ever earned by playing. */
export function SparksCounter({ count }: { count?: number }) {
  const stored = useGame(selectSparks);
  const value = count ?? stored;
  return (
    <CounterPill>
      <View style={styles.spark}>
        <Text variant="small">✨</Text>
      </View>
      <Text variant="buttonSmall" color={palette.navy} style={styles.value}>
        {value}
      </Text>
    </CounterPill>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    height: 44,
    minWidth: 68,
    justifyContent: 'center',
  },
  value: { includeFontPadding: false },
  spark: { width: 22, alignItems: 'center' },
});
