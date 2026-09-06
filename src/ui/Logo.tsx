import React, { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { logoParts, logoViewBox, type LogoPartName } from '@/characters/art/logoArt';
import { useReducedMotion } from '@/hooks';

export interface LogoProps {
  /** total width in px */
  size?: number;
  /** show "Learn. Help. Rescue. Grow." underneath (default true) */
  tagline?: boolean;
  /** let the flame breathe (default true) */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The STATION SPARK lock-up, drawn from the authored artwork in
 * `SVG ART/LOGOMAIN.svg` — every path verbatim, so the mark on screen is the
 * mark that was designed. `tools/art/build-characters.mjs` regenerates the
 * path data; nothing here redraws it.
 *
 * The only liberty the app takes is motion: the flame in the crest breathes,
 * because a static flame on a children's home screen reads as a sticker. It
 * is the flame group alone that moves, scaled about its own base, so the
 * plaque, the gold sweeps and both words never shift by a pixel.
 */
export function Logo({ size = 240, tagline = true, animate = true, style }: LogoProps) {
  const reduced = useReducedMotion();
  const live = animate && !reduced;

  /* Without the tagline the mark is cropped to the plaque, not scaled down. */
  const vb = tagline
    ? { x: 0, y: 0, w: logoViewBox.w, h: logoViewBox.h }
    : { x: 0, y: 0, w: logoViewBox.w, h: 99 };
  const height = (size * vb.h) / vb.w;

  const parts = useMemo(() => {
    const map = new Map<LogoPartName, (typeof logoParts)[number]>();
    for (const p of logoParts) map.set(p.name, p);
    return map;
  }, []);

  const flicker = useSharedValue(0);
  React.useEffect(() => {
    if (!live) {
      flicker.value = 0;
      return;
    }
    flicker.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [flicker, live]);

  /* Scaled about the flame's base so it grows upward out of its cradle. */
  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 1 + flicker.value * 0.05 }, { scaleX: 1 - flicker.value * 0.018 }],
  }));

  const draw = (name: LogoPartName) => {
    const part = parts.get(name);
    if (!part) return null;
    return part.shapes.map((s, i) => <Path key={`${name}-${i}`} d={s.d} fill={s.fill} />);
  };

  const layer = (names: LogoPartName[]) => (
    <Svg
      width={size}
      height={height}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {names.map(draw)}
    </Svg>
  );

  /* The flame's own base, measured off the artwork: it grows out of its cradle. */
  const flameOrigin: ViewStyle = {
    transformOrigin: [(74.6 / vb.w) * size, (36.6 / vb.h) * height, 0],
  };

  return (
    <View style={[{ width: size, height }, style]} pointerEvents="none">
      {layer(['plate'])}
      <Animated.View style={[StyleSheet.absoluteFill, flameOrigin, flameStyle]}>{layer(['flame'])}</Animated.View>
      {layer(tagline ? ['wordTop', 'wordBottom', 'tagline'] : ['wordTop', 'wordBottom'])}
    </View>
  );
}
