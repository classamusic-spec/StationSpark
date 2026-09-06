import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { springs } from '@/theme';
import { sfx, type SfxName } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import type { useMiniGameSession } from '@/minigames/useMiniGameSession';

export type Session = ReturnType<typeof useMiniGameSession>;

/* ------------------------------------------------------------------ */
/* The hint ladder                                                 */
/* ------------------------------------------------------------------ */

export interface CaptainHint {
  text: string;
  es?: string;
  visible: boolean;
  /** number of gentle misses so far in this game */
  misses: number;
  /** after two misses we point at the answer, after three we offer to do it */
  highlight: boolean;
  offerHelp: boolean;
  /** a soft "not quite" — never a failure: wobble + soft sound + Captain Bea speaks */
  nudge: (text: string, es?: string) => void;
  /** Captain Bea says something friendly without counting it as a mistake */
  cheer: (text: string, es?: string) => void;
  dismiss: () => void;
  /** the child asked for help: counts as a hint, not a mistake */
  askedForHelp: () => void;
}

/**
 * The "a child can ALWAYS finish" rule, in one hook.
 *  - miss 1: gentle wobble + Captain Bea says why
 *  - miss 2: the answer is highlighted
 *  - miss 3: a "Show me" button appears that makes the next correct move
 */
export function useCaptainHint(session: Session): CaptainHint {
  const [state, setState] = useState<{ text: string; es?: string; visible: boolean; misses: number }>({
    text: '',
    visible: false,
    misses: 0,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // the auto-hide timer must not outlive the game
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const show = useCallback((text: string, es: string | undefined, countsAsMiss: boolean) => {
    setState((s) => ({ text, es, visible: true, misses: s.misses + (countsAsMiss ? 1 : 0) }));
    speech.say(text, { speaker: 'bea' });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState((s) => ({ ...s, visible: false })), 4200);
  }, []);

  const nudge = useCallback(
    (text: string, es?: string) => {
      session.incorrect(text);
      session.say('bea', text, es);
      sfx.play('wrong-soft');
      haptics.nudge();
      show(text, es, true);
    },
    [session, show],
  );

  const cheer = useCallback(
    (text: string, es?: string) => {
      session.say('bea', text, es);
      show(text, es, false);
    },
    [session, show],
  );

  const askedForHelp = useCallback(() => {
    session.hint();
    sfx.play('robot-beep');
    haptics.select();
  }, [session]);

  const dismiss = useCallback(() => setState((s) => ({ ...s, visible: false })), []);

  return {
    text: state.text,
    es: state.es,
    visible: state.visible,
    misses: state.misses,
    highlight: state.misses >= 2,
    offerHelp: state.misses >= 3,
    nudge,
    cheer,
    dismiss,
    askedForHelp,
  };
}

/* ------------------------------------------------------------------ */
/* Feedback triad helpers                                               */
/* ------------------------------------------------------------------ */

/** motion + sound + haptic, together, every time — see ART_DIRECTION. */
export const kitchenFeel = {
  pick(word?: { en: string; es: string }) {
    sfx.play('tap-soft');
    haptics.select();
    if (word) speech.sayWord(word);
  },
  drop(sound: SfxName = 'drop') {
    sfx.play(sound);
    haptics.drop();
  },
  good(sound: SfxName = 'correct') {
    sfx.play(sound);
    haptics.success();
  },
  finish() {
    sfx.play('success');
    haptics.celebrate();
  },
};

/* ------------------------------------------------------------------ */
/* Design-space dragging                                                */
/* ------------------------------------------------------------------ */

export interface DragSourceOptions {
  /** design-units → pixels factor from <Stage/> */
  scale: number;
  onPickUp?: () => void;
  /** a press that never really moved: treat as "select me" */
  onTap?: () => void;
  /** released this far (in DESIGN units) from where the item sits */
  onDrop: (dx: number, dy: number) => void;
  enabled?: boolean;
  tapSlop?: number;
}

/**
 * A draggable that reports its drop in design units, so drop targets can be
 * plain numbers instead of measured layouts. Springs home on release.
 */
export function useDragSource({ scale, onPickUp, onTap, onDrop, enabled = true, tapSlop = 9 }: DragSourceOptions) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lift = useSharedValue(0);

  const pick = useCallback(() => {
    onPickUp?.();
  }, [onPickUp]);

  const release = useCallback(
    (dx: number, dy: number) => {
      if (Math.hypot(dx, dy) < tapSlop) onTap?.();
      else onDrop(dx / (scale || 1), dy / (scale || 1));
    },
    [onDrop, onTap, scale, tapSlop],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .minDistance(0)
        .onBegin(() => {
          lift.value = withSpring(1, springs.pop);
          runOnJS(pick)();
        })
        .onUpdate((e) => {
          tx.value = e.translationX;
          ty.value = e.translationY;
        })
        .onEnd((e) => {
          runOnJS(release)(e.translationX, e.translationY);
        })
        .onFinalize(() => {
          tx.value = withSpring(0, springs.snap);
          ty.value = withSpring(0, springs.snap);
          lift.value = withSpring(0, springs.gentle);
        }),
    [enabled, lift, pick, release, tx, ty],
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: 1 + lift.value * 0.14 }],
  }));

  return { gesture, style, lift };
}

/** Nearest drop target within `radius` design units, or -1. */
export function nearestTarget(
  point: { x: number; y: number },
  targets: readonly { x: number; y: number }[],
  radius: number,
): number {
  let best = -1;
  let bestD = radius;
  targets.forEach((t, i) => {
    const d = Math.hypot(t.x - point.x, t.y - point.y);
    if (d <= bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
