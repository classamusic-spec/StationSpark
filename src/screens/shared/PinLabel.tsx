import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { palette, radii, shadows, springs, stagger } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { ChevronRightIcon, LockIcon, Text } from '@/ui';

/** The coloured teardrop that marks a place on the map. */
function Pin({ color, size = 26, locked }: { color: string; size?: number; locked?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 1.6c4.1 0 7 2.9 7 7 0 5.1-7 13.2-7 13.2S5 13.7 5 8.6c0-4.1 2.9-7 7-7z" fill={locked ? palette.lockedGrey : color} />
      <Circle cx={12} cy={8.6} r={3} fill={palette.white} />
    </Svg>
  );
}

export interface PinLabelProps {
  name: string;
  color: string;
  onPress: () => void;
  locked?: boolean;
  index?: number;
  /** shrink the pill on dense maps */
  compact?: boolean;
}

/**
 * The white map pin label from the reference art: coloured teardrop, place
 * name, chevron. Pops in on a stagger and squashes on press.
 */
export function PinLabel({ name, color, onPress, locked, index = 0, compact }: PinLabelProps) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={ZoomIn.delay(index * stagger.tile).springify().damping(13)}>
      <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={locked ? `${name}, coming soon` : name}
        onPressIn={() => {
          scale.value = withSpring(0.93, springs.pop);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springs.bounce);
        }}
        onPress={() => {
          sfx.play(locked ? 'tap-soft' : 'tap');
          haptics.tap();
          onPress();
        }}
        style={[styles.pill, shadows.card, compact && styles.compact, locked && styles.locked]}
        hitSlop={10}
      >
        <Pin color={color} size={compact ? 22 : 26} locked={locked} />
        <Text variant={compact ? 'small' : 'bodyStrong'} color={locked ? palette.slate : palette.navy} numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <View style={styles.chev}>
          {locked ? <LockIcon size={16} color={palette.slate} /> : <ChevronRightIcon size={17} color={palette.navySoft} />}
        </View>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingLeft: 6,
    paddingRight: 10,
    height: 40,
    maxWidth: 190,
  },
  compact: { height: 34, paddingRight: 8 },
  locked: { backgroundColor: '#EFF1F7' },
  name: { includeFontPadding: false, flexShrink: 1 },
  chev: { width: 18, alignItems: 'center' },
});
