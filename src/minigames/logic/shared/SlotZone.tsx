import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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
  /**
   * What this place IS, spoken to a screen reader ("the Tools bin", "hydrant
   * 46", "letter space 2"). A drop target with no name is unusable without
   * sight, so give every slot one.
   */
  label?: string;
  /**
   * Set false when the slot already CONTAINS something a child can touch (a
   * card they can pull back out, a piece they can turn). Marking the slot
   * itself accessible would collapse that control out of the reader's tree.
   */
  announce?: boolean;
}

/**
 * A drop target. Measures itself into arena coordinates and reacts while a
 * dragged token hovers above it — and, when a token has been picked up by tap
 * rather than dragged, becomes the button that lands it.
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
  label,
  announce = true,
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

  /*
   * A slot is a named button whenever it can actually take something. When it
   * cannot (already filled, wrong phase) it drops out of the accessibility
   * tree entirely rather than announcing itself as an option that does nothing.
   */
  const sel = arena.selected;
  const accepts = !!sel && enabled && (sel.group === undefined || group === undefined || sel.group === group);
  const name = label ?? 'Drop here';
  const speaks = enabled && announce;

  return (
    <Animated.View
      ref={ref}
      collapsable={false}
      testID={`slot:${id}`}
      accessible={speaks}
      focusable={speaks}
      accessibilityRole={speaks ? 'button' : undefined}
      accessibilityLabel={speaks ? (accepts ? `Put the ${sel?.label} in ${name}` : name) : undefined}
      accessibilityHint={speaks && !accepts ? 'Pick up a piece first, then tap here' : undefined}
      style={[styles.slot, style, hoverStyle]}
    >
      {children}
      {/*
       * The landing button for the tap path. It is only mounted while a token
       * is actually waiting to be placed, so it can never sit on top of an
       * interactive child (a piece the child rotates, a card they pull back).
       */}
      {accepts ? (
        <Pressable
          style={styles.tapTarget}
          accessibilityRole="button"
          accessibilityLabel={`Put the ${sel?.label} in ${name}`}
          onPress={() => sel?.place(id)}
        >
          <View style={styles.tapRing} pointerEvents="none" />
        </Pressable>
      ) : null}
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
  tapTarget: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  /* while a token waits to be placed, every place it could go says so */
  tapRing: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 2,
    bottom: 2,
    borderRadius: radii.tile,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: palette.leafGreen,
    opacity: 0.85,
  },
});
