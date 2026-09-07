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

/* ------------------------------------------------------------------ */
/* The fluid stage — the activity fills the room it is given            */
/* ------------------------------------------------------------------ */

export interface FluidBox {
  /** design units → screen pixels */
  s: number;
  /** the play area's width in DESIGN units (never below `unit`) */
  w: number;
  /** the play area's height in DESIGN units (never below `minH`) */
  h: number;
  ready: boolean;
}

export interface FluidStageOptions {
  /**
   * The nominal design width. The box is scaled so it is at least this many
   * design units wide — so a drawing laid out for 390 always spans the play
   * area edge to edge, whatever the screen.
   */
  unit?: number;
  /** never squeeze the drawing below this many design units of height */
  minH?: number;
  /** a tablet gets a bigger activity, not an absurd one */
  maxScale?: number;
}

/**
 * `useStage` letterboxes a fixed design box, which is right for a picture and
 * wrong for a play area: a 390 × 400 box inside a 390 × 620 phone play area
 * left 220 px of nothing, which is exactly the "small object marooned in a tall
 * beige field" the art direction complains about.
 *
 * The fluid stage instead fills the play area completely and hands the caller
 * the room it got, in design units. Games anchor to `w`/`h` (centre, bottom,
 * proportions) rather than to fixed coordinates, so the pot/blender/jug grows
 * with the space instead of sitting at a fixed small size in the middle of it.
 * Drag maths is unchanged: pixels ÷ `s` is still design units.
 */
export function useFluidStage(opts: FluidStageOptions = {}): FluidBox & { onLayout: (e: LayoutChangeEvent) => void } {
  const { unit = 390, minH = 360, maxScale = 1.9 } = opts;
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((b) => (Math.abs(b.w - width) < 0.5 && Math.abs(b.h - height) < 0.5 ? b : { w: width, h: height }));
  }, []);

  if (box.w <= 0 || box.h <= 0) return { onLayout, s: 0, w: unit, h: minH, ready: false };

  const s = Math.min(box.w / unit, box.h / minH, maxScale);
  return { onLayout, s, w: box.w / s, h: box.h / s, ready: true };
}

export interface FluidStageProps extends FluidStageOptions {
  style?: StyleProp<ViewStyle>;
  children: (box: FluidBox) => React.ReactNode;
}

/** Renders `children(box)` across the whole play area, in design units. */
export function FluidStage({ style, children, ...opts }: FluidStageProps) {
  const box = useFluidStage(opts);
  return (
    <View style={[styles.root, style]} onLayout={box.onLayout}>
      {box.ready ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {children(box)}
        </View>
      ) : null}
    </View>
  );
}
