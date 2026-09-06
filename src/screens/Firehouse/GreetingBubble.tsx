import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '@/ui';
import { useReducedMotion } from '@/hooks';

/**
 * Speech bubble with a little tail, cycling through the crew's greetings.
 * `tail` says which shoulder it hangs off, so the bubble can sit beside the
 * speaker instead of over them.
 */
export function GreetingBubble({
  lines,
  maxWidth = 200,
  tail = 'left',
}: {
  lines: readonly string[];
  maxWidth?: number;
  tail?: 'left' | 'right';
}) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (lines.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), reduced ? 9000 : 5200);
    return () => clearInterval(id);
  }, [lines.length, reduced]);

  const text = lines[i] ?? lines[0] ?? '';
  return (
    <View style={[styles.wrap, { maxWidth }, tail === 'right' && styles.wrapRight]} pointerEvents="none">
      <Animated.View key={text} entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={[styles.bubble, shadows.card]}>
        <Text variant="small" color={palette.navy} numberOfLines={2}>
          {text}
        </Text>
      </Animated.View>
      <View style={[styles.tail, tail === 'right' ? styles.tailRight : styles.tailLeft]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-start' },
  wrapRight: { alignItems: 'flex-end' },
  bubble: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: palette.white,
  },
  tailLeft: { marginLeft: 18 },
  tailRight: { marginRight: 18 },
});
