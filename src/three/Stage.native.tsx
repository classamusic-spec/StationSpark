/**
 * The GL canvas host — NATIVE (iOS / Android).
 *
 * `@react-three/fiber/native` drives an `expo-gl` `GLView` under the hood, so
 * the very same scene graph the web file renders also runs on device. The
 * canvas is transparent and the 2D backdrop behind it shows through.
 *
 * `dpr` is not a native canvas prop (expo-gl already renders at the screen's
 * scale) and pointer capture is done by the caller with gesture-handler, so
 * `pointer` / `touchAction` are accepted and ignored to keep one shared API.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import type { StageProps } from './stageTypes';

export function Stage({ height, camera, children, style, testID }: StageProps) {
  return (
    <View style={[styles.host, { height }, style]} testID={testID}>
      <Canvas
        flat
        gl={{ antialias: true, alpha: true }}
        camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 60 }}
        style={styles.canvas}
      >
        {children}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { width: '100%', backgroundColor: 'transparent' },
  canvas: { backgroundColor: 'transparent' },
});
