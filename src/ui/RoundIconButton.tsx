import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { hit, palette, shadows, springs } from '@/theme';
import { haptics } from '@/services/haptics';
import { sfx } from '@/services/audio';

/** White circular button used for back / settings / pause in the top corners. */
export function RoundIconButton({
  onPress,
  children,
  size = hit.min,
  accessibilityLabel,
  tone = 'white',
}: {
  onPress?: () => void;
  children: React.ReactNode;
  size?: number;
  accessibilityLabel: string;
  tone?: 'white' | 'navy' | 'green';
}) {
  const scale = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const bg = tone === 'white' ? palette.white : tone === 'navy' ? palette.navy : palette.leafGreen;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        scale.value = withSpring(0.88, springs.pop);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.bounce);
      }}
      onPress={() => {
        sfx.play('tap-soft');
        haptics.tap();
        onPress?.();
      }}
      hitSlop={8}
    >
      <Animated.View style={[styles.btn, shadows.soft, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, a]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
});
