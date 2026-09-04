import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { hit, palette, radii, springs, timings } from '@/theme';
import { haptics } from '@/services/haptics';
import { sfx } from '@/services/audio';
import { Text } from './Text';

export type ButtonTone = 'red' | 'green' | 'yellow' | 'blue' | 'white' | 'navy' | 'purple';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const tones: Record<ButtonTone, { face: string; edge: string; text: string }> = {
  red: { face: palette.engineRed, edge: palette.engineRedDark, text: palette.white },
  green: { face: palette.leafGreen, edge: palette.leafGreenDark, text: palette.white },
  yellow: { face: palette.safetyYellow, edge: palette.goldDark, text: palette.navy },
  blue: { face: palette.waterCyan, edge: palette.waterCyanDark, text: palette.white },
  white: { face: palette.white, edge: palette.slateLight, text: palette.navy },
  navy: { face: palette.navySoft, edge: palette.navy, text: palette.white },
  purple: { face: palette.purple, edge: '#6F52D9', text: palette.white },
};

const sizes: Record<ButtonSize, { h: number; px: number; edge: number; variant: 'buttonSmall' | 'button' }> = {
  sm: { h: 48, px: 18, edge: 4, variant: 'buttonSmall' },
  md: { h: hit.min, px: 24, edge: 5, variant: 'buttonSmall' },
  lg: { h: 66, px: 32, edge: 6, variant: 'button' },
  xl: { h: hit.big + 6, px: 40, edge: 7, variant: 'button' },
};

export interface ButtonProps {
  label?: string;
  onPress?: () => void;
  tone?: ButtonTone;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** stretch to container width */
  block?: boolean;
  sound?: 'tap' | 'tap-soft' | 'pop' | 'none';
  accessibilityLabel?: string;
  children?: React.ReactNode;
}

/**
 * The Station Spark 3D pill button. A darker "edge" sits under the face; on
 * press the face sinks onto the edge (translateY) and squashes slightly.
 */
export function Button({
  label,
  onPress,
  tone = 'red',
  size = 'lg',
  icon,
  iconRight,
  disabled,
  style,
  block,
  sound = 'tap',
  accessibilityLabel,
  children,
}: ButtonProps) {
  const t = tones[tone];
  const s = sizes[size];
  const pressed = useSharedValue(0);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * s.edge }, { scale: 1 - pressed.value * 0.02 }],
  }));

  const onPressIn = useCallback(() => {
    pressed.value = withTiming(1, timings.fast);
  }, [pressed]);
  const onPressOut = useCallback(() => {
    pressed.value = withSpring(0, springs.pop);
  }, [pressed]);
  const handlePress = useCallback(() => {
    if (disabled) return;
    if (sound !== 'none') sfx.play(sound);
    haptics.tap();
    onPress?.();
  }, [disabled, onPress, sound]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[block && styles.block, disabled && styles.disabled, style]}
      hitSlop={6}
    >
      <View style={[styles.edge, { backgroundColor: t.edge, borderRadius: radii.pill, height: s.h + s.edge }]}>
        <Animated.View
          style={[
            styles.face,
            { backgroundColor: t.face, height: s.h, paddingHorizontal: s.px, borderRadius: radii.pill },
            faceStyle,
          ]}
        >
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          {label ? (
            <Text variant={s.variant} color={t.text} center style={styles.label}>
              {label}
            </Text>
          ) : null}
          {children}
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  edge: { alignSelf: 'stretch' },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  label: { includeFontPadding: false },
  icon: { marginRight: 10 },
  iconRight: { marginLeft: 10 },
});
