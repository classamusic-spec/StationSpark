import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { springs, timings } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { pickDropSlot, snapDelta, type Rect } from './dragGeometry';
import { useArenaMeasure, useDragArena } from './DragArena';

/** What the game decides should happen when a token is released over a slot. */
export interface DropOutcome {
  accept: boolean;
  /** spring into this slot instead of the one under the finger (e.g. "next empty ghost") */
  snapToSlotId?: string;
  /** commit your state here — runs once the snap / bounce-back has landed */
  onSettled?: () => void;
  /** suppress the built-in drop / wobble sfx + haptic */
  silent?: boolean;
}

export interface UseDragToSlotOptions {
  /** only slots with the same group (or no group) accept this token */
  group?: string;
  disabled?: boolean;
  /** forgiving radius (px) used when the finger is released just outside a slot */
  snapRadius?: number;
  liftScale?: number;
  onDrop: (slotId: string | null) => DropOutcome;
  onPickUp?: () => void;
}

const SETTLE_ACCEPT_MS = 280;
const SETTLE_REJECT_MS = 300;

/**
 * The Station Spark drag: press → the token lifts (scale 1.1 + shadow) and
 * follows the finger; release → the nearest slot under the finger wins, the
 * token spring-snaps into it ('drop' + haptics.drop) or bounces home with a
 * gentle wobble. Hit-testing happens on the UI thread against the arena's
 * measured slot rectangles.
 */
export function useDragToSlot(opts: UseDragToSlotOptions) {
  const arena = useDragArena();
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const nodeRef = useRef<React.ComponentRef<typeof View>>(null);
  const home = useRef<Rect | null>(null);
  const remeasure = useArenaMeasure(nodeRef, (r) => {
    home.current = r;
  });

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lift = useSharedValue(0);
  const wobble = useSharedValue(0);
  const fade = useSharedValue(1);
  const [dragging, setDragging] = useState(false);

  const alive = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => {
      alive.current = false;
      for (const t of list) clearTimeout(t);
    };
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(() => alive.current && fn(), ms));
  }, []);

  const pickUp = useCallback(() => {
    setDragging(true);
    sfx.play('tap-soft');
    haptics.select();
    optsRef.current.onPickUp?.();
  }, []);

  const settle = useCallback(
    (slotId: string | null) => {
      setDragging(false);
      const outcome = optsRef.current.onDrop(slotId);
      lift.value = withTiming(0, timings.fast);
      if (outcome.accept) {
        const targetId = outcome.snapToSlotId ?? slotId;
        const target = targetId ? arena.getSlot(targetId) : undefined;
        const from = home.current;
        if (from && target) {
          const d = snapDelta(from, target);
          tx.value = withSpring(d.x, springs.snap);
          ty.value = withSpring(d.y, springs.snap);
        } else {
          tx.value = withSpring(0, springs.snap);
          ty.value = withSpring(0, springs.snap);
        }
        if (!outcome.silent) {
          sfx.play('drop');
          haptics.drop();
        }
        fade.value = withDelay(150, withTiming(0, { duration: 110 }));
        later(() => {
          outcome.onSettled?.();
          tx.value = 0;
          ty.value = 0;
          fade.value = withTiming(1, timings.fast);
        }, SETTLE_ACCEPT_MS);
      } else {
        tx.value = withSpring(0, springs.gentle);
        ty.value = withSpring(0, springs.gentle);
        wobble.value = withSequence(
          withTiming(-6, { duration: 60 }),
          withTiming(6, { duration: 60 }),
          withTiming(-4, { duration: 60 }),
          withTiming(0, { duration: 60 }),
        );
        if (!outcome.silent) {
          sfx.play('wrong-soft');
          haptics.nudge();
        }
        later(() => outcome.onSettled?.(), SETTLE_REJECT_MS);
      }
    },
    [arena, fade, later, lift, tx, ty, wobble],
  );

  const { group, disabled, snapRadius = 44, liftScale = 1.1 } = opts;

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .minDistance(4)
        .onStart(() => {
          lift.value = withSpring(1, springs.pop);
          runOnJS(pickUp)();
        })
        .onUpdate((e) => {
          tx.value = e.translationX;
          ty.value = e.translationY;
          const o = arena.origin.value;
          const hit = pickDropSlot(arena.slots.value, e.absoluteX - o.x, e.absoluteY - o.y, group, 0);
          arena.hovered.value = hit ? hit.id : null;
        })
        .onEnd((e) => {
          const o = arena.origin.value;
          const hit = pickDropSlot(arena.slots.value, e.absoluteX - o.x, e.absoluteY - o.y, group, snapRadius);
          arena.hovered.value = null;
          runOnJS(settle)(hit ? hit.id : null);
        })
        .onFinalize(() => {
          arena.hovered.value = null;
        }),
    [arena, disabled, group, lift, pickUp, settle, snapRadius, tx, ty],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateX: tx.value + wobble.value },
      { translateY: ty.value },
      { scale: 1 + lift.value * (liftScale - 1) },
    ],
    shadowOpacity: 0.12 + lift.value * 0.22,
    shadowRadius: 8 + lift.value * 14,
  }));

  return { gesture, animatedStyle, dragging, nodeRef, remeasure, lift };
}
