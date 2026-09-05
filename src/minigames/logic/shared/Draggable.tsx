import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { palette } from '@/theme';
import { useDragToSlot, type DropOutcome } from './useDragToSlot';

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
}: DraggableProps) {
  const { gesture, animatedStyle, dragging, nodeRef } = useDragToSlot({
    group,
    disabled,
    snapRadius,
    onDrop,
    onPickUp,
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        ref={nodeRef}
        collapsable={false}
        testID={`drag:${id}`}
        accessibilityLabel={accessibilityLabel ?? id}
        accessible={!disabled}
        style={[styles.base, dragging && styles.dragging, style, animatedStyle]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  base: {
    shadowColor: palette.navy,
    shadowOffset: { width: 0, height: 6 },
  },
  dragging: { zIndex: 60, elevation: 14 },
});
