import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useGame } from '@/state/store';

/* ------------------------------------------------------------------ *
 * One listener for the whole process
 * ------------------------------------------------------------------ */

/**
 * `useReducedMotion` is called 102 times across 55 components — directly, and
 * through `usePulse`, `useIdleBob` and `useBlink`, which each call it. The
 * Firehouse alone mounts clouds, birds, the flag, the bell, the sun, trees,
 * both crew figures and every glowing button.
 *
 * When the OS query and the subscription lived inside the hook, that was dozens
 * of simultaneous native listeners and dozens of bridge round-trips on every
 * screen mount. It never leaked — each one unsubscribed — but it was
 * O(components) where O(1) is available, and it is precisely the "listeners
 * that accumulate" shape that goes wrong later.
 *
 * So the OS value lives here instead: one listener, one cached answer, a set of
 * subscribers, read through `useSyncExternalStore`. Behaviour is identical.
 */
let osReduced = false;
let started = false;
const subscribers = new Set<() => void>();

const publish = (value: boolean) => {
  if (value === osReduced) return;
  osReduced = value;
  for (const fn of subscribers) fn();
};

function start() {
  if (started) return;
  started = true;
  AccessibilityInfo.isReduceMotionEnabled?.()
    .then((v) => publish(!!v))
    .catch(() => {
      /* a platform without the API is simply "no preference" */
    });
  /*
   * Deliberately never removed. There is exactly one of these for the life of
   * the process, and the alternative — tearing it down when the last component
   * unmounts — would mean re-querying the OS on the next mount for no benefit.
   */
  AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => publish(!!v));
}

const subscribe = (onChange: () => void) => {
  start();
  subscribers.add(onChange);
  return () => {
    subscribers.delete(onChange);
  };
};

const getSnapshot = () => osReduced;

/** True when the child/parent asked for less motion (app setting or OS setting). */
export function useReducedMotion(): boolean {
  const setting = useGame((s) => s.settings.reduceMotion);
  const os = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return setting || os;
}
