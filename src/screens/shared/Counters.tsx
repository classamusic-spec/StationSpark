import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { palette, radii, shadows } from '@/theme';
import { GlyphIcon, Text } from '@/ui';
import { useGame } from '@/state/store';
import { selectSparks, selectTotalStars } from '@/state/selectors';

function CounterPill({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeIn} style={[styles.pill, shadows.soft]}>
      {children}
    </Animated.View>
  );
}

/** Star + n — total stars earned, for the right side of a TopBar. */
export function StarCounter({ count, label }: { count?: number; label?: string }) {
  const stored = useGame(selectTotalStars);
  const value = count ?? stored;
  return (
    <CounterPill>
      <GlyphIcon id="star" size={24} label="stars" />
      <Text variant="buttonSmall" color={palette.navy} style={styles.value}>
        {label ?? value}
      </Text>
    </CounterPill>
  );
}

/** Sparks — the decoration currency. Only ever earned by playing. Drawn mark, never an emoji. */
export function SparksCounter({ count }: { count?: number }) {
  const stored = useGame(selectSparks);
  const value = count ?? stored;
  return (
    <CounterPill>
      <View style={styles.spark}>
        <GlyphIcon id="spark" size={22} label="sparks" />
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
