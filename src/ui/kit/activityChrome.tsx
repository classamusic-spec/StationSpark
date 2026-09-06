import React, { createContext, useContext, useMemo } from 'react';

export interface ActivityChrome {
  /** leaving the activity */
  onBack?: () => void;
  /** hear the task again */
  onReplay?: () => void;
  /** how far through the activity is */
  progress?: { done: number; total: number };
}

const Ctx = createContext<ActivityChrome>({});

/**
 * Lets the screen that *hosts* an activity supply the chrome the activity's
 * TaskBar draws — back, replay, progress — without every mini-game having to
 * accept and forward three more props.
 *
 * This is what allows one bar instead of two. The host used to draw its own
 * TopBar with the back button and the star count while the game drew a second
 * bar with the task underneath it, costing a fifth of the screen before the
 * child saw anything to play with.
 */
export function ActivityChromeProvider({ value, children }: { value: ActivityChrome; children: React.ReactNode }) {
  /* Hosts pass a memoised object; this only guards against an inline literal. */
  const { onBack, onReplay, progress } = value;
  const done = progress?.done;
  const total = progress?.total;
  const memo = useMemo<ActivityChrome>(
    () => ({ onBack, onReplay, progress: total === undefined ? undefined : { done: done ?? 0, total } }),
    [onBack, onReplay, done, total],
  );
  return <Ctx.Provider value={memo}>{children}</Ctx.Provider>;
}

export function useActivityChrome(): ActivityChrome {
  return useContext(Ctx);
}
