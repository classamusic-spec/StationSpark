/**
 * The public props of `<TruckScene3D/>` — one contract, two platform
 * implementations (`TruckScene3D.tsx` on web, `TruckScene3D.native.tsx` on
 * iOS/Android). Free of `three` so screens can reference the type cheaply.
 */
import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { TruckStyle } from '@/state/store';

export interface TruckScene3DProps {
  /** the child's truck from the store — colour, decal, lights, horn */
  style: TruckStyle;
  /** wheels turn */
  spinning?: boolean;
  /** increment to trigger a squash-and-bounce (wire this to Honk!) */
  honk?: number;
  /** 0..1 wash shine: emissive lift, glossier paint, sparkles */
  shine?: number;
  /** canvas height in px (default 300); width always fills the parent */
  height?: number;
  /** override the 2D fallback; defaults to the SVG `<FireTruck/>` */
  fallback?: React.ReactNode;
  /** render the fallback instead of GL — used by the dev route and QA */
  forceFallback?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}
