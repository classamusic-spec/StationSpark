import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { palette, radii, shadows, springs, stagger } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { ChevronRightIcon, LockIcon, Text } from '@/ui';
import { mix } from '@/characters/rig/palettes';
import { HIGHLIGHT, SHADOW_FILL, SHADOW_OPACITY } from '@/world/tone';

const TEARDROP = 'M12 1.6c4.1 0 7 2.9 7 7 0 5.1-7 13.2-7 13.2S5 13.7 5 8.6c0-4.1 2.9-7 7-7z';

/**
 * The coloured teardrop that marks a place. Drawn in the sticker language:
 * base → one shade → one highlight, standing on its own contact ellipse.
 * A locked place keeps a warm, washed version of its colour (never grey).
 */
function Pin({ color, size = 26, locked }: { color: string; size?: number; locked?: boolean }) {
  const base = locked ? mix(color, palette.tan, 0.62) : color;
  const shade = mix(base, palette.navy, 0.24);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Ellipse cx={12} cy={22.3} rx={5.6} ry={1.3} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      <Path d={TEARDROP} fill={shade} transform="translate(0.7 0.9)" />
      <Path d={TEARDROP} fill={base} />
      <Circle cx={12} cy={8.6} r={3.1} fill={palette.white} />
      <Path d="M 7.4 7.2 C 7.9 5 9.3 3.6 11 3.1" stroke={HIGHLIGHT} strokeWidth={1.7} strokeLinecap="round" fill="none" />
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
  /**
   * `marker` drops the name and draws just the pin. Locked places use it: a
   * map of eleven name pills is unreadable, and the sheet names the place
   * when it is tapped anyway.
   */
  variant?: 'pill' | 'marker';
}

/**
 * The white map pin label from the reference art: coloured teardrop, place
 * name, chevron. Pops in on a stagger and squashes on press. A locked place
 * gets a warm cream "coming soon" pill with a small lock, not a grey one.
 */
export function PinLabel({ name, color, onPress, locked, index = 0, compact, variant = 'pill' }: PinLabelProps) {
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
          style={[
            styles.pill,
            shadows.card,
            compact && styles.compact,
            locked && styles.locked,
            variant === 'marker' && styles.marker,
          ]}
          hitSlop={14}
        >
          <Pin color={color} size={variant === 'marker' ? 24 : compact ? 22 : 26} locked={locked} />
          {variant === 'pill' ? (
            <>
              <Text
                variant={compact ? 'small' : 'bodyStrong'}
                color={locked ? palette.navyMuted : palette.navy}
                numberOfLines={1}
                style={styles.name}
              >
                {name}
              </Text>
              <View style={styles.chev}>
                {locked ? <LockIcon size={16} color={palette.tanDark} /> : <ChevronRightIcon size={17} color={palette.navySoft} />}
              </View>
            </>
          ) : locked ? (
            <View style={styles.markerLock}>
              <LockIcon size={12} color={palette.tanDark} />
            </View>
          ) : null}
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
  /* A tap target is still 56 px: the chip is 40 and hitSlop adds 14 a side. */
  marker: { width: 40, height: 40, paddingLeft: 0, paddingRight: 0, borderRadius: 20, justifyContent: 'center', gap: 0 },
  markerLock: { position: 'absolute', right: 1, bottom: 1, backgroundColor: palette.cream, borderRadius: 8, padding: 1 },
  locked: { backgroundColor: palette.cream },
  name: { includeFontPadding: false, flexShrink: 1 },
  chev: { width: 18, alignItems: 'center' },
});
