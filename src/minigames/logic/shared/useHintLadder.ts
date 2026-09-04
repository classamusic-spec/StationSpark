import { useCallback, useEffect, useRef, useState } from 'react';

export type HintLevel = 0 | 1 | 2;

export interface HintLadder {
  /** 0 = nothing, 1 = Beacon bubble, 2 = bubble + auto-highlight the answer */
  level: HintLevel;
  /** the Beacon bubble is on screen right now */
  showBubble: boolean;
  /** the answer should be visually given away (AnswerTile state 'highlight') */
  highlight: boolean;
  dismiss: () => void;
  /** show the bubble again without counting another hint */
  reopen: () => void;
  /** hide everything (e.g. moving on to the next item) */
  reset: () => void;
}

/**
 * NEVER DEAD-END. After 2 misses Beacon explains; after 3 the answer is
 * highlighted so the child can always move on. `onHintShown` fires once per
 * level so the session records the hint exactly once.
 */
export function useHintLadder(misses: number, onHintShown?: () => void): HintLadder {
  const [dismissed, setDismissed] = useState(false);
  const [cleared, setCleared] = useState(0);
  const reported = useRef(0);
  const cb = useRef(onHintShown);
  cb.current = onHintShown;

  const effective = Math.max(0, misses - cleared);
  const level: HintLevel = effective >= 3 ? 2 : effective >= 2 ? 1 : 0;

  useEffect(() => {
    if (level > reported.current) {
      reported.current = level;
      setDismissed(false);
      cb.current?.();
    }
  }, [level]);

  const dismiss = useCallback(() => setDismissed(true), []);
  const reopen = useCallback(() => setDismissed(false), []);
  const reset = useCallback(() => {
    setCleared(misses);
    reported.current = 0;
    setDismissed(false);
  }, [misses]);

  return { level, showBubble: level > 0 && !dismissed, highlight: level >= 2, dismiss, reopen, reset };
}
