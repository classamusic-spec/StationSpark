/**
 * NAME PATCH — the child's name as a stitched uniform patch: red header band,
 * cream body, a tan stitch line running just inside the edge. The stitches
 * are a value tone, never a black outline.
 */
import React, { useCallback, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { hit, palette, radii, shadows, springs, typeScale } from '@/theme';
import { GlyphIcon, Text } from '@/ui';

const STITCH = palette.tanDark;

export interface NamePatchProps {
  value: string;
  onChange: (v: string) => void;
}

export function NamePatch({ value, onChange }: NamePatchProps) {
  const focus = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + focus.value * 0.02 }] }));
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((b) => (Math.abs(b.w - width) < 1 && Math.abs(b.h - height) < 1 ? b : { w: width, h: height }));
  }, []);

  return (
    <Animated.View style={[styles.patch, shadows.card, style]} onLayout={onLayout}>
      {box.w > 0 ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width={box.w} height={box.h}>
            <Rect x={7} y={7} width={box.w - 14} height={box.h - 14} rx={radii.tile - 4} fill="none" stroke={STITCH} strokeWidth={2.2} strokeDasharray="7 5" strokeLinecap="round" />
          </Svg>
        </View>
      ) : null}
      <View style={styles.band}>
        <GlyphIcon id="flame" size={18} label="" />
        <Text variant="tiny" color={palette.white}>
          STATION SPARK · CREW
        </Text>
      </View>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.slice(0, 12))}
        placeholder="Your name"
        placeholderTextColor={palette.navyMuted}
        maxLength={12}
        autoCorrect={false}
        returnKeyType="done"
        accessibilityLabel="Your name"
        onFocus={() => {
          focus.value = withSpring(1, springs.pop);
        }}
        onBlur={() => {
          focus.value = withSpring(0, springs.gentle);
        }}
        style={[
          styles.input,
          { fontFamily: typeScale.h2.fontFamily, fontSize: typeScale.h2.fontSize, color: palette.navy },
          Platform.OS === 'web' ? styles.noOutline : null,
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  patch: {
    alignSelf: 'center',
    backgroundColor: palette.cream,
    borderRadius: radii.tile,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    minWidth: 240,
    maxWidth: 360,
    width: '100%',
    gap: 6,
  },
  band: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.engineRed,
    borderRadius: radii.tag,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 4,
  },
  input: { minHeight: hit.min - 8, paddingVertical: 4, paddingHorizontal: 6 },
  noOutline: { outlineStyle: 'none' } as object,
});
