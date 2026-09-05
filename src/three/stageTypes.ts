/**
 * The shared contract between the two GL canvas hosts (`Stage.tsx` on web,
 * `Stage.native.tsx` on native). Kept in its own module so neither platform
 * file has to import the other, and so nothing here pulls `three` in.
 */
import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface StageCamera {
  position: [number, number, number];
  fov: number;
}

/** Pointer callbacks handed to the canvas element. Web only — native ignores them. */
export interface StagePointerProps {
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export interface StageProps {
  /** canvas height in px; the width always fills the parent */
  height: number;
  camera: StageCamera;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pointer?: StagePointerProps;
  /**
   * CSS `touch-action` for the canvas (web only). `pan-y` — the default — keeps
   * the page scrollable under a finger while a sideways drag turns the model.
   */
  touchAction?: 'none' | 'pan-y' | 'auto';
  testID?: string;
}
