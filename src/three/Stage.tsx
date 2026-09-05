/**
 * The GL canvas host — WEB.
 *
 * A transparent `@react-three/fiber` canvas sized to `height`, so whatever is
 * painted behind it (the 2D garage bay, a card, the sky) shows straight
 * through. `Stage.native.tsx` is the expo-gl twin; every module above these two
 * is platform-agnostic.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas } from '@react-three/fiber';
import type { StageProps } from './stageTypes';

export function Stage({ height, camera, children, style, pointer, touchAction = 'pan-y', testID }: StageProps) {
  return (
    <View style={[styles.host, { height }, style]} testID={testID}>
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 60 }}
        style={{ background: 'transparent', touchAction, cursor: 'grab' }}
        {...pointer}
      >
        {children}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { width: '100%', backgroundColor: 'transparent' },
});
