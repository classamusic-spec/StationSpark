import React, { useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

export interface StageBox {
  /** scale factor from design units to screen pixels */
  s: number;
  width: number;
  height: number;
  left: number;
  top: number;
  ready: boolean;
}

/**
 * Every kitchen scene is drawn in a fixed "design box" (390 × N, the same box
 * the reference art was painted in) and then scaled to whatever room it is
 * given. That keeps drag maths trivial: a finger delta in pixels divided by `s`
 * is a delta in design units, so drop targets can be plain numbers.
 */
export function useStage(designW: number, designH: number, fit: 'cover' | 'contain' = 'contain'): StageBox & {
  onLayout: (e: LayoutChangeEvent) => void;
} {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((b) => (Math.abs(b.w - width) < 0.5 && Math.abs(b.h - height) < 0.5 ? b : { w: width, h: height }));
  }, []);

  const raw = box.w > 0 && box.h > 0 ? (fit === 'cover' ? Math.max(box.w / designW, box.h / designH) : Math.min(box.w / designW, box.h / designH)) : 0;
  const s = raw;
  const width = designW * s;
  const height = designH * s;
  return { onLayout, s, width, height, left: (box.w - width) / 2, top: (box.h - height) / 2, ready: s > 0 };
}

export interface StageProps {
  design: { w: number; h: number };
  fit?: 'cover' | 'contain';
  style?: StyleProp<ViewStyle>;
  /** children receive the scale factor so they can size design units */
  children: (s: number) => React.ReactNode;
}

/** Renders `children(s)` inside a centred, scaled design box. */
export function Stage({ design, fit = 'contain', style, children }: StageProps) {
  const stage = useStage(design.w, design.h, fit);
  return (
    <View style={[styles.root, style]} onLayout={stage.onLayout}>
      {stage.ready ? (
        <View
          style={{ position: 'absolute', left: stage.left, top: stage.top, width: stage.width, height: stage.height }}
          pointerEvents="box-none"
        >
          {children(stage.s)}
        </View>
      ) : null}
    </View>
  );
}

/** Absolute placement helper in DESIGN units → scaled pixels. */
export function at(s: number, x: number, y: number, w?: number, h?: number): ViewStyle {
  return {
    position: 'absolute',
    left: x * s,
    top: y * s,
    ...(w === undefined ? null : { width: w * s }),
    ...(h === undefined ? null : { height: h * s }),
  };
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
});
