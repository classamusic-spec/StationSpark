/**
 * What the child sees when GL is unavailable: the original SVG fire engine,
 * sized to fill the same slot the canvas would have. No `three` import — this
 * is the path that has to work when three is the thing that failed.
 */
import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { FireTruck, TRUCK_VB } from '@/world';
import type { TruckStyle } from '@/state/store';

export interface TruckFallbackProps {
  style: TruckStyle;
  /** the height the 3D stage would have taken */
  height: number;
  /** wheels spin, matching the scene's `spinning` */
  spinning?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const RATIO = TRUCK_VB.w / TRUCK_VB.h;

export function TruckFallback({ style, height, spinning, containerStyle }: TruckFallbackProps) {
  const [box, setBox] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setBox(e.nativeEvent.layout.width);

  // Fit inside both the measured width and the stage height, never overflowing.
  const byHeight = (height - 24) * RATIO;
  const byWidth = box > 0 ? box - 16 : byHeight;
  const width = Math.max(150, Math.min(340, byHeight, byWidth));

  return (
    <View style={[styles.host, { height }, containerStyle]} pointerEvents="none" onLayout={onLayout}>
      <FireTruck truck={style} width={width} driving={spinning} lightsOn />
    </View>
  );
}

const styles = StyleSheet.create({
  host: { width: '100%', alignItems: 'center', justifyContent: 'center' },
});
