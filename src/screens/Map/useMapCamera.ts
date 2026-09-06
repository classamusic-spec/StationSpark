import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gesture, type ComposedGesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDecay,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { springs } from '@/theme';
import { useReducedMotion } from '@/hooks';
import {
  HOME_FOCUS,
  clampTo,
  frameOn,
  mapScales,
  panBounds,
  wholeTown,
  type MapFrame,
  type MapScales,
} from './mapView';

/**
 * How long a glide lasts. 0.994 stops a flick in about half a second, which
 * is enough for the map to feel like a thing with weight without a child
 * losing track of where the town went.
 */
const DECELERATION = 0.994;
/** A double tap this far in is treated as "already close" and zooms back out. */
const NEAR_ENOUGH = 1.2;
/** How much closer a double tap takes us. */
const DOUBLE_TAP_STEP = 1.7;

export interface MapCamera {
  scale: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  scales: MapScales;
  /** pan + pinch + double tap, ready for a `GestureDetector` */
  gesture: ComposedGesture;
  /** true while the camera is far enough out that name pills would collide */
  far: boolean;
  /** true while the whole town is in the frame — the toggle reads from this */
  framedWhole: boolean;
  /** frame a plan point, coming closer if we are further out than `atLeast` */
  focus: (ux: number, uy: number, atLeast?: number, ay?: number) => void;
  /** pull all the way back so the whole town is in the frame */
  showAll: () => void;
  /** the opening view: working scale, fire station in sight */
  showHome: () => void;
  /**
   * True just after the town was dragged or pinched. A pin travels with the
   * finger, so on the web build the press over it never leaves its own box and
   * a swipe would otherwise open a place the child was only sliding past.
   */
  wasDragged: () => boolean;
}

/** How long after a drag a press over a pin is still treated as part of it. */
const DRAG_GRACE_MS = 260;

/**
 * The camera over Spark City.
 *
 * One finger drags the town and it glides to a stop; two fingers pinch about
 * whatever is between them; a double tap steps in and out again. Every one of
 * those ends clamped by `panBounds`, so however hard a child throws the map
 * the town itself never leaves the frame — there is nothing to get lost in.
 *
 * Zoom is a bonus, never a requirement: at the opening scale everything is
 * reachable by dragging alone, which is what small hands can actually do.
 */
export function useMapCamera(vpW: number, vpH: number, foot: number): MapCamera {
  const reduced = useReducedMotion();
  const frame = useMemo((): MapFrame => ({ w: vpW, h: vpH, foot }), [foot, vpH, vpW]);
  const scales = useMemo(() => mapScales(frame), [frame]);
  const { min: minScale, home: homeScale, max: maxScale, label: labelScale } = scales;

  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const dragging = useSharedValue(0);

  const [far, setFar] = useState(false);
  const [framedWhole, setFramedWhole] = useState(false);
  const farSv = useSharedValue(0);
  const wholeSv = useSharedValue(0);
  const framed = useRef(false);

  /* ── keeping the JS side told how far out we are ─────────────────── */
  useAnimatedReaction(
    () => scale.value,
    (s) => {
      /* a little hysteresis, or the labels flicker on the threshold */
      const next = farSv.value === 1 ? (s > labelScale * 1.08 ? 0 : 1) : s < labelScale ? 1 : 0;
      if (next !== farSv.value) {
        farSv.value = next;
        runOnJS(setFar)(next === 1);
      }
      const whole = s <= minScale * 1.04 ? 1 : 0;
      if (whole !== wholeSv.value) {
        wholeSv.value = whole;
        runOnJS(setFramedWhole)(whole === 1);
      }
    },
    [labelScale, minScale],
  );

  /* ── framing ─────────────────────────────────────────────────────── */

  const settle = useCallback(
    (s: number, nx: number, ny: number) => {
      cancelAnimation(scale);
      cancelAnimation(tx);
      cancelAnimation(ty);
      if (reduced) {
        scale.value = withTiming(s, { duration: 140 });
        tx.value = withTiming(nx, { duration: 140 });
        ty.value = withTiming(ny, { duration: 140 });
        return;
      }
      /*
       * The scale arrives first on purpose: it is what widens the clamp, so
       * letting the travel trail it means no sliver of empty sky is ever
       * exposed part-way through a zoom.
       */
      scale.value = withTiming(s, { duration: 220 });
      tx.value = withSpring(nx, springs.gentle);
      ty.value = withSpring(ny, springs.gentle);
    },
    [reduced, scale, tx, ty],
  );

  const focus = useCallback(
    (ux: number, uy: number, atLeast = homeScale, ay = 0.42) => {
      if (frame.w <= 0 || frame.h <= 0) return;
      const s = clampTo(Math.max(scale.value, atLeast), minScale, maxScale);
      const { tx: nx, ty: ny } = frameOn(ux, uy, s, frame, 0.5, ay);
      settle(s, nx, ny);
    },
    [frame, homeScale, maxScale, minScale, scale, settle],
  );

  const showAll = useCallback(() => {
    if (frame.w <= 0 || frame.h <= 0) return;
    const { tx: nx, ty: ny } = wholeTown(minScale, frame);
    settle(minScale, nx, ny);
  }, [frame, minScale, settle]);

  const showHome = useCallback(() => {
    if (frame.w <= 0 || frame.h <= 0) return;
    const { tx: nx, ty: ny } = frameOn(HOME_FOCUS.x, HOME_FOCUS.y, homeScale, frame, HOME_FOCUS.ax, HOME_FOCUS.ay);
    settle(homeScale, nx, ny);
  }, [frame, homeScale, settle]);

  /* First measure frames the town; later ones (rotation, a resized window)
     keep where we were looking but re-clamp it into the new frame. */
  useEffect(() => {
    if (frame.w <= 0 || frame.h <= 0) return;
    if (!framed.current) {
      framed.current = true;
      const { tx: nx, ty: ny } = frameOn(HOME_FOCUS.x, HOME_FOCUS.y, homeScale, frame, HOME_FOCUS.ax, HOME_FOCUS.ay);
      scale.value = homeScale;
      tx.value = nx;
      ty.value = ny;
      return;
    }
    const s = clampTo(scale.value, minScale, maxScale);
    const b = panBounds(s, frame);
    scale.value = s;
    tx.value = clampTo(tx.value, -b.x, b.x);
    ty.value = clampTo(ty.value, b.cy - b.y, b.cy + b.y);
  }, [frame, homeScale, maxScale, minScale, scale, tx, ty]);

  /* ── gestures ────────────────────────────────────────────────────── */

  const gesture = useMemo(() => {
    /* one finger drags the town */
    const pan = Gesture.Pan()
      .minDistance(6)
      .maxPointers(1)
      .onStart(() => {
        cancelAnimation(tx);
        cancelAnimation(ty);
        startX.value = tx.value;
        startY.value = ty.value;
      })
      .onUpdate((e) => {
        dragging.value = 1;
        const b = panBounds(scale.value, frame);
        tx.value = clampTo(startX.value + e.translationX, -b.x, b.x);
        ty.value = clampTo(startY.value + e.translationY, b.cy - b.y, b.cy + b.y);
      })
      .onEnd((e) => {
        const b = panBounds(scale.value, frame);
        if (reduced) {
          /* still movable, just without the drift */
          tx.value = withTiming(clampTo(tx.value, -b.x, b.x), { duration: 120 });
          ty.value = withTiming(clampTo(ty.value, b.cy - b.y, b.cy + b.y), { duration: 120 });
          return;
        }
        tx.value =
          b.x > 0
            ? withDecay({ velocity: e.velocityX, clamp: [-b.x, b.x], deceleration: DECELERATION })
            : withSpring(0, springs.gentle);
        ty.value =
          b.y > 0
            ? withDecay({ velocity: e.velocityY, clamp: [b.cy - b.y, b.cy + b.y], deceleration: DECELERATION })
            : withSpring(b.cy, springs.gentle);
      })
      .onFinalize(() => {
        /*
         * A pin travels with the finger, so the press over it never leaves its
         * own box and the web build would read a swipe as a tap. `dragging`
         * stays up for a beat after the drag so `wasDragged` can say no.
         */
        dragging.value = withDelay(DRAG_GRACE_MS, withTiming(0, { duration: 1 }));
      });

    /* two fingers zoom about whatever is between them */
    const pinch = Gesture.Pinch()
      .onStart((e) => {
        cancelAnimation(scale);
        cancelAnimation(tx);
        cancelAnimation(ty);
        startScale.value = scale.value;
        startX.value = tx.value;
        startY.value = ty.value;
        focalX.value = e.focalX;
        focalY.value = e.focalY;
      })
      .onUpdate((e) => {
        dragging.value = 1;
        const s = clampTo(startScale.value * e.scale, minScale, maxScale);
        const k = s / startScale.value;
        const ax = focalX.value - frame.w / 2;
        const ay = focalY.value - frame.h / 2;
        const b = panBounds(s, frame);
        scale.value = s;
        tx.value = clampTo(ax - (ax - startX.value) * k, -b.x, b.x);
        ty.value = clampTo(ay - (ay - startY.value) * k, b.cy - b.y, b.cy + b.y);
      })
      .onEnd(() => {
        const b = panBounds(scale.value, frame);
        tx.value = withSpring(clampTo(tx.value, -b.x, b.x), springs.gentle);
        ty.value = withSpring(clampTo(ty.value, b.cy - b.y, b.cy + b.y), springs.gentle);
      })
      .onFinalize(() => {
        dragging.value = withDelay(DRAG_GRACE_MS, withTiming(0, { duration: 1 }));
      });

    /* the pinch a child can actually do: tap twice on what you want to see */
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(320)
      .maxDelay(320)
      .onEnd((e) => {
        const from = scale.value;
        const to =
          from > homeScale * NEAR_ENOUGH ? homeScale : clampTo(homeScale * DOUBLE_TAP_STEP, minScale, maxScale);
        const k = to / from;
        const ax = e.x - frame.w / 2;
        const ay = e.y - frame.h / 2;
        const b = panBounds(to, frame);
        cancelAnimation(tx);
        cancelAnimation(ty);
        scale.value = withTiming(to, { duration: reduced ? 140 : 220 });
        tx.value = withSpring(clampTo(ax - (ax - tx.value) * k, -b.x, b.x), springs.gentle);
        ty.value = withSpring(clampTo(ay - (ay - ty.value) * k, b.cy - b.y, b.cy + b.y), springs.gentle);
      });

    return Gesture.Race(doubleTap, Gesture.Simultaneous(pan, pinch));
  }, [dragging, focalX, focalY, frame, homeScale, maxScale, minScale, reduced, scale, startScale, startX, startY, tx, ty]);

  const wasDragged = useCallback(() => dragging.value > 0.5, [dragging]);

  return { scale, tx, ty, scales, gesture, far, framedWhole, focus, showAll, showHome, wasDragged };
}
