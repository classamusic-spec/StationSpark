/**
 * GLOSS SWATCH — a chunky, glossy colour button for the gear pickers: a face
 * sitting on a darker edge (the 3D-pressable rule), a toy highlight, and a
 * navy ring with a white tick when it is the one that's on.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { hit, palette, shadows, springs, timings } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { CheckIcon } from '@/ui';
import { mix } from '@/characters/rig/palettes';

export interface GlossSwatchProps {
  color: string;
  active: boolean;
  onPress: () => void;
  label: string;
  size?: number;
}

const EDGE = 4;

export function GlossSwatch({ color, active, onPress, label, size = hit.min }: GlossSwatchProps) {
  const pressed = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: pressed.value * EDGE }] }));
  const ring = size + 10;
  const dark = mix(color, palette.navy, 0.3);
  const light = mix(color, '#FFFFFF', 0.55);
  const tickColor = color === palette.white ? palette.navy : palette.white;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPressIn={() => {
        pressed.value = withTiming(1, timings.fast);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, springs.pop);
      }}
      onPress={() => {
        sfx.play('pop');
        haptics.select();
        onPress();
      }}
      hitSlop={4}
      style={[styles.ring, { width: ring, height: ring, borderRadius: ring / 2 }, active && styles.ringOn]}
    >
      <View style={[styles.edge, shadows.soft, { width: size, height: size + EDGE, borderRadius: size / 2, backgroundColor: dark }]}>
        <Animated.View style={[styles.face, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, faceStyle]}>
          <View style={[styles.gloss, { width: size * 0.46, height: size * 0.26, borderRadius: size * 0.2, backgroundColor: light, top: size * 0.14, left: size * 0.16 }]} />
          {active ? <CheckIcon size={Math.round(size * 0.42)} color={tickColor} /> : null}
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  ringOn: { borderColor: palette.navy, backgroundColor: 'rgba(255,255,255,0.7)' },
  edge: { alignItems: 'center', justifyContent: 'flex-start' },
  face: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  gloss: { position: 'absolute', opacity: 0.75 },
});
