import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { palette, radii, springs, timings } from '@/theme';
import { useArenaMeasure, useDragArena } from './DragArena';

export interface SlotZoneProps {
  id: string;
  /** only draggables of this group may land here */
  group?: string;
  enabled?: boolean;
  /** gold hint glow (the auto-highlight after repeated misses) */
  highlight?: boolean;
  /** grow + tint while a token hovers over it */
  reactive?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** extra padding added to the measured hit rectangle (kinder for small hands) */
  hitPad?: number;
}

/**
 * A drop target. Measures itself into arena coordinates and reacts while a
 * dragged token hovers above it.
 */
export function SlotZone({
  id,
  group,
  enabled = true,
  highlight,
  reactive = true,
  style,
  children,
  hitPad = 8,
}: SlotZoneProps) {
  const arena = useDragArena();
  const ref = useRef<React.ComponentRef<typeof View>>(null);
  const glow = useSharedValue(0);

  useArenaMeasure(
    ref,
    (r) => {
      arena.putSlot({
        id,
        group,
        enabled,
        x: r.x - hitPad,
        y: r.y - hitPad,
        width: r.width + hitPad * 2,
        height: r.height + hitPad * 2,
      });
    },
    `${id}|${group ?? ''}|${enabled}|${hitPad}`,
  );

  useEffect(() => () => arena.dropSlot(id), [arena, id]);

  useEffect(() => {
    glow.value = withTiming(highlight ? 1 : 0, timings.base);
  }, [glow, highlight]);

  const hoverStyle = useAnimatedStyle(() => {
    const hot = reactive && enabled && arena.hovered.value === id;
    return {
      transform: [{ scale: withSpring(hot ? 1.08 : 1, springs.pop) }],
      borderColor: hot ? palette.leafGreen : glow.value > 0.5 ? palette.safetyYellow : 'transparent',
      shadowOpacity: hot ? 0.35 : glow.value * 0.6,
    };
  });

  return (
    <Animated.View ref={ref} collapsable={false} testID={`slot:${id}`} style={[styles.slot, style, hoverStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    borderRadius: radii.tile,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.safetyYellow,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
});
