import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '@/ui';
import { useReducedMotion } from '@/hooks';

/** Speech bubble with a little tail, cycling through the crew's greetings. */
export function GreetingBubble({ lines, maxWidth = 200 }: { lines: readonly string[]; maxWidth?: number }) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (lines.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), reduced ? 9000 : 5200);
    return () => clearInterval(id);
  }, [lines.length, reduced]);

  const text = lines[i] ?? lines[0] ?? '';
  return (
    <View style={[styles.wrap, { maxWidth }]} pointerEvents="none">
      <Animated.View key={text} entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={[styles.bubble, shadows.card]}>
        <Text variant="small" color={palette.navy} numberOfLines={2}>
          {text}
        </Text>
      </Animated.View>
      <View style={styles.tail} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start' },
  bubble: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tail: {
    width: 0,
    height: 0,
    marginLeft: 18,
    marginTop: -1,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: palette.white,
  },
});
