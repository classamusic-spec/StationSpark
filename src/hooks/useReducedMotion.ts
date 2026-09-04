import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useGame } from '@/state/store';

/** True when the child/parent asked for less motion (app setting or OS setting). */
export function useReducedMotion(): boolean {
  const setting = useGame((s) => s.settings.reduceMotion);
  const [os, setOs] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => mounted && setOs(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => setOs(!!v));
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);
  return setting || os;
}
