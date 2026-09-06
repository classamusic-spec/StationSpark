import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { PinLabel } from '@/screens/shared';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { CONTENT_H, CONTENT_W, LABEL_HALO, MAP_UNIT, type PinBox } from './mapView';

export interface MapPinProps {
  box: PinBox;
  index: number;
  locked: boolean;
  vpW: number;
  vpH: number;
  scale: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  /** true while a press is really the tail of a drag across the town */
  blocked: () => boolean;
  onPress: () => void;
}

/**
 * A pin rides *above* the town rather than inside it.
 *
 * The camera moves its anchor, but the label itself is never scaled, so the
 * name stays the same readable size and the target stays the same size too —
 * which is what lets zoom stay optional.
 *
 * The invisible halo behind the label is the tap target. A 34 px pill plus
 * `hitSlop` is 62 px on a phone but only 34 px on the web build, because
 * react-native-web drops `hitSlop` — so the halo is a real view instead, and
 * `layoutPins` leaves `2 × LABEL_HALO` between neighbours so one pin's halo
 * can never sit over the next pin's name.
 */
export function MapPin({ box, index, locked, vpW, vpH, scale, tx, ty, blocked, onPress }: MapPinProps) {
  const anchorX = box.place.x * MAP_UNIT;
  const anchorY = box.place.y * MAP_UNIT;
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: vpW / 2 + (anchorX - CONTENT_W / 2) * scale.value + tx.value + box.dx },
      { translateY: vpH / 2 + (anchorY - CONTENT_H / 2) * scale.value + ty.value + box.dy },
    ],
  }));

  const press = useCallback(() => {
    if (blocked()) return;
    sfx.play(locked ? 'tap-soft' : 'tap');
    haptics.tap();
    onPress();
  }, [blocked, locked, onPress]);

  return (
    <Animated.View style={[styles.pin, style]}>
      <Pressable
        testID="pin-hit"
        accessible={false}
        focusable={false}
        importantForAccessibility="no"
        style={styles.halo}
        onPress={press}
      />
      <PinLabel
        name={box.place.name}
        color={box.place.color}
        locked={locked}
        index={index}
        compact={box.compact}
        variant={box.variant}
        onPress={onPress}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pin: { position: 'absolute', left: 0, top: 0 },
  halo: { position: 'absolute', left: -LABEL_HALO, right: -LABEL_HALO, top: -LABEL_HALO, bottom: -LABEL_HALO },
});
