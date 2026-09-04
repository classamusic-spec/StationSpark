import React from 'react';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import Svg from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

export interface RigWindow {
  /** window origin + size, in the rig's viewBox units */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RigPartProps {
  /** px per viewBox unit — `unit = width / VIEWBOX_WIDTH` */
  unit: number;
  win: RigWindow;
  /** pivot point in viewBox units (a shoulder, a tail root, an ear hinge) */
  pivot?: { x: number; y: number };
  /** animated transform for the part (rotate/translate/scale) */
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
  children: React.ReactNode;
}

/**
 * A moving limb.
 *
 * The whole rig is authored in ONE viewBox; a `RigPart` re-renders a *window*
 * of that same coordinate space into its own little `<Svg>` so it can be moved
 * by a Reanimated view transform. Paths keep their absolute rig coordinates,
 * so a tail or an arm can be lifted out of the body art without re-drawing it.
 *
 * View transforms are used (rather than animated SVG props) because they are the
 * only thing that animates identically on iOS, Android and web.
 */
export function RigPart({ unit, win, pivot, style, children }: RigPartProps) {
  const w = win.w * unit;
  const h = win.h * unit;
  const origin: ViewStyle | undefined = pivot
    ? { transformOrigin: [(pivot.x - win.x) * unit, (pivot.y - win.y) * unit, 0] }
    : undefined;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: win.x * unit, top: win.y * unit, width: w, height: h }, origin, style]}
    >
      <Svg width={w} height={h} viewBox={`${win.x} ${win.y} ${win.w} ${win.h}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}
