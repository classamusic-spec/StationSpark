import { useCallback, useEffect, useRef } from 'react';

export interface IdleAssistOptions {
  /** only run the clock while the step is actually waiting for the child */
  active: boolean;
  /** quiet time before Captain Bea helps for the first time */
  firstMs?: number;
  /** quiet time between each further helping hand */
  repeatMs?: number;
  /** Captain Bea does one bit of the work. `round` counts from 1. */
  onHelp: (round: number) => void;
}

/**
 * NEVER A DEAD END, WITH A CLOCK.
 *
 * A gesture a child cannot make must never stop the cooking. This watches for
 * quiet — no passes, no stirs, no cuts — and after a few seconds Captain Bea
 * takes a turn herself: she says what to do, the tool moves on screen, and one
 * pass of the work gets done. Keep quiet and she keeps helping until the step
 * is finished, so the child always ends up cooking, never stuck.
 *
 * Any real progress calls `poke()` and the clock starts again from scratch, so
 * a child who *is* doing it never sees the help at all.
 */
export function useIdleAssist({ active, firstMs = 3000, repeatMs = 1200, onHelp }: IdleAssistOptions): {
  poke: () => void;
} {
  const round = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const version = useRef(0);
  const help = useRef(onHelp);
  help.current = onHelp;

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const arm = useCallback(
    (delay: number) => {
      clear();
      const mine = version.current;
      timer.current = setTimeout(() => {
        if (mine !== version.current) return;
        round.current += 1;
        help.current(round.current);
        arm(repeatMs);
      }, delay);
    },
    [clear, repeatMs],
  );

  useEffect(() => {
    if (!active) {
      clear();
      return;
    }
    arm(firstMs);
    return clear;
  }, [active, arm, clear, firstMs]);

  const poke = useCallback(() => {
    if (!active) return;
    version.current += 1;
    round.current = 0;
    arm(firstMs);
  }, [active, arm, firstMs]);

  return { poke };
}
