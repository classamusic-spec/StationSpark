import { useCallback, useEffect, useRef, useState } from 'react';
import { speech } from '@/services/speech';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';

export interface HintText {
  text: string;
  es?: string;
}

export interface HintLadder {
  /** how many soft misses so far */
  misses: number;
  /** 0 = fine · 1 = Beacon is helping · 2 = auto-assist (highlight the answer) */
  level: 0 | 1 | 2;
  /** true once we should just show the child the answer */
  assist: boolean;
  bubble: HintText | null;
  /** record a miss; from the 2nd one on, Beacon's bubble appears */
  miss: (hint?: HintText) => void;
  /** show a hint without counting a mistake (idle nudges) */
  nudge: (hint: HintText, opts?: { assist?: boolean }) => void;
  dismiss: () => void;
  reset: () => void;
}

/**
 * The "never dead-end" rule, in one hook.
 *
 *   1st miss  → gentle wobble only (the game does that)
 *   2nd miss  → Beacon's hint bubble, spoken aloud
 *   3rd miss  → auto-assist: the game highlights / snaps the answer
 *
 * `onHint` should be the session's `hint()` so the star maths stays honest.
 */
export function useHintLadder(onHint?: () => void): HintLadder {
  const [misses, setMisses] = useState(0);
  const [assist, setAssist] = useState(false);
  const [bubble, setBubble] = useState<HintText | null>(null);
  const counted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const raise = useCallback(
    (hint: HintText) => {
      setBubble(hint);
      sfx.play('robot-beep', { volume: 0.6 });
      speech.say(hint.text, { speaker: 'beacon' });
      if (!counted.current) {
        counted.current = true;
        onHint?.();
      }
    },
    [onHint],
  );

  const miss = useCallback(
    (hint?: HintText) => {
      setMisses((m) => {
        const next = m + 1;
        if (next >= 3) setAssist(true);
        if (next >= 2 && hint) raise(hint);
        return next;
      });
      haptics.nudge();
    },
    [raise],
  );

  const nudge = useCallback(
    (hint: HintText, opts?: { assist?: boolean }) => {
      raise(hint);
      if (opts?.assist) setAssist(true);
    },
    [raise],
  );

  const dismiss = useCallback(() => setBubble(null), []);

  const reset = useCallback(() => {
    setMisses(0);
    setAssist(false);
    setBubble(null);
  }, []);

  const level: 0 | 1 | 2 = assist ? 2 : bubble ? 1 : 0;
  return { misses, level, assist, bubble, miss, nudge, dismiss, reset };
}
