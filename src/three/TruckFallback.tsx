/**
 * What the child sees when GL is unavailable: the original SVG fire engine,
 * sized to fill the same slot the canvas would have. No `three` import — this
 * is the path that has to work when three is the thing that failed.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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

export function TruckFallback({ style, height, spinning, containerStyle }: TruckFallbackProps) {
  // The SVG truck is 220×112; fill the stage without ever overflowing it.
  const width = Math.min(340, (height - 24) * (TRUCK_VB.w / TRUCK_VB.h));
  return (
    <View style={[styles.host, { height }, containerStyle]} pointerEvents="none">
      <FireTruck truck={style} width={Math.max(180, width)} driving={spinning} lightsOn />
    </View>
  );
}

const styles = StyleSheet.create({
  host: { width: '100%', alignItems: 'center', justifyContent: 'center' },
});
