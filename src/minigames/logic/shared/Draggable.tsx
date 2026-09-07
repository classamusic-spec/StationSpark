import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { palette, radii, roles, shadows } from '@/theme';
import { useDragArena } from './DragArena';
import { useDragToSlot, type DropOutcome } from './useDragToSlot';

/**
 * THE "YOU CAN PICK THIS UP" LOOK.
 *
 * A sorting screen is full of gear: some of it is scenery (the pegboard, the
 * crates, the shelf) and some of it is the thing the child is meant to move.
 * Painting the movable ones a different colour is not enough — colour alone is
 * never allowed to carry meaning here, and a five-year-old cannot learn a
 * colour key mid-game anyway. So a token says "lift me" three ways at once:
 *
 *   1. LIFT   — it floats (`roles.lift.interactive`); scenery lies flat.
 *   2. EDGE   — a chunky bottom edge under a white face, the same 3D lip every
 *               button in the app has. Scenery has no lip.
 *   3. GRIP   — two drawn grab-bars across the top. This is the part that is
 *               not colour, not depth and not size: a mark that appears on
 *               movable objects and on nothing else.
 */
const LIFT_EDGE = 'rgba(31,42,90,0.22)';

/** The grab-bars that mark every liftable object. */
export function DragGrip({ width = 22, color = palette.navyMuted }: { width?: number; color?: string }) {
  return (
    <View style={styles.grip} pointerEvents="none">
      <View style={[styles.gripBar, { width, backgroundColor: color }]} />
      <View style={[styles.gripBar, { width: Math.round(width * 0.62), backgroundColor: color }]} />
    </View>
  );
}

export interface DraggableProps {
  /** stable id (used for keys + debugging) */
  id: string;
  /** only slots with a matching group accept this token */
  group?: string;
  disabled?: boolean;
  snapRadius?: number;
  onDrop: (slotId: string | null) => DropOutcome;
  onPickUp?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityLabel?: string;
  /**
   * `token` paints the shared liftable chrome (face + edge + grip + shadow).
   * `none` (the default) leaves the look entirely to `style`, for games whose
   * token *is* the artwork.
   */
  chrome?: 'none' | 'token';
}

/**
 * A token the child can pick up and drop into a <SlotZone>. Minimum size is
 * enforced by the caller's style (≥ 64 px per the design rules).
 */
export function Draggable({
  id,
  group,
  disabled,
  snapRadius,
  onDrop,
  onPickUp,
  style,
  children,
  accessibilityLabel,
  chrome = 'none',
}: DraggableProps) {
  const arena = useDragArena();
  const { gesture, animatedStyle, dragging, nodeRef, placeAt } = useDragToSlot({
    group,
    disabled,
    snapRadius,
    onDrop,
    onPickUp,
  });

  const label = accessibilityLabel ?? id;
  const picked = arena.selected?.id === id;

  /*
   * THE TAP TWIN. Dragging is the fast path; tapping is the one a child using
   * VoiceOver, TalkBack or a switch has. Tap once to pick the token up, then
   * tap the place it goes — the landing runs through the same `placeAt`, so
   * both paths sound, feel and animate identically.
   */
  const toggle = useCallback(() => {
    if (disabled) return;
    if (picked) {
      arena.select(null);
      return;
    }
    onPickUp?.();
    arena.select({
      id,
      label,
      group,
      place: (slotId: string) => {
        arena.select(null);
        placeAt(slotId);
      },
    });
  }, [arena, disabled, group, id, label, onPickUp, picked, placeAt]);

  const composed = useMemo(
    () =>
      Gesture.Race(
        gesture,
        Gesture.Tap()
          .enabled(!disabled)
          .maxDistance(12)
          .onEnd((_e, ok) => {
            if (ok) runOnJS(toggle)();
          }),
      ),
    [disabled, gesture, toggle],
  );

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        ref={nodeRef}
        collapsable={false}
        testID={`drag:${id}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={picked ? 'Now tap where it goes' : 'Tap to pick up, then tap where it goes'}
        accessibilityState={{ disabled: !!disabled, selected: picked }}
        accessible={!disabled}
        focusable={!disabled}
        style={[
          styles.base,
          chrome === 'token' && styles.token,
          chrome === 'token' && disabled && styles.tokenDone,
          picked && styles.picked,
          dragging && styles.dragging,
          style,
          animatedStyle,
        ]}
      >
        {chrome === 'token' ? <DragGrip /> : null}
        {children}
        {/* picked up by tap: a gold rim so a sighted child sees the same state
            the screen reader is announcing */}
        {picked ? <View style={styles.pickedRing} pointerEvents="none" /> : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  base: {
    shadowColor: palette.navy,
    shadowOffset: { width: 0, height: 6 },
  },
  token: {
    backgroundColor: roles.surface.card,
    borderRadius: radii.card,
    borderWidth: 2,
    borderColor: roles.border.draggable,
    /* the 3D lip: the token sits on an edge, the way every pressable does */
    borderBottomWidth: 6,
    borderBottomColor: LIFT_EDGE,
    alignItems: 'center',
    /* room for the grab-bars */
    paddingTop: 14,
    paddingBottom: 6,
    paddingHorizontal: 6,
    ...roles.lift.interactive,
  },
  tokenDone: { opacity: 0.55 },
  picked: { zIndex: 55, ...shadows.glowGold },
  pickedRing: {
    position: 'absolute',
    left: -3,
    right: -3,
    top: -3,
    bottom: -3,
    borderRadius: radii.card,
    borderWidth: 4,
    borderColor: palette.safetyYellow,
  },
  grip: { position: 'absolute', top: 5, left: 0, right: 0, alignItems: 'center', gap: 2 },
  gripBar: { height: 3, borderRadius: 2, opacity: 0.55 },
  dragging: { zIndex: 60, elevation: 14 },
});
