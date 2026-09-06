import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ChallengeKind, SkillTag } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import { speech } from '@/services/speech';
import type { MiniGameEvent, MiniGameResult, Stars } from './types';

/**
 * Tracks attempts / hints / time and builds the MiniGameResult.
 * Stars: 3 = no mistakes, 2 = one mistake or one hint, 1 = otherwise (never 0 on completion).
 */
export function useMiniGameSession(
  kind: ChallengeKind,
  onComplete: (r: MiniGameResult) => void,
  onEvent?: (e: MiniGameEvent) => void,
) {
  const startedAt = useRef(0);
  const attempts = useRef(0);
  const mistakes = useRef(0);
  const hints = useRef(0);
  const words = useRef<Set<string>>(new Set());
  const done = useRef(false);
  /** false once the game is off screen — nearly every game finishes on a timer */
  const mounted = useRef(true);

  useEffect(() => {
    startedAt.current = Date.now();
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * Every mini-game speaks. When one is torn down (the child quits, the mission
   * moves to the next beat, "Play again" reseeds the stage) the voice has to go
   * with it — otherwise Captain Bea keeps talking over the next screen.
   */
  useEffect(() => () => speech.stop(), []);

  const correct = useCallback(
    (detail?: string) => {
      attempts.current += 1;
      onEvent?.({ type: 'correct', detail });
    },
    [onEvent],
  );

  const incorrect = useCallback(
    (detail?: string) => {
      attempts.current += 1;
      mistakes.current += 1;
      onEvent?.({ type: 'incorrect', detail });
    },
    [onEvent],
  );

  const hint = useCallback(() => {
    hints.current += 1;
    onEvent?.({ type: 'hint' });
  }, [onEvent]);

  const progress = useCallback(
    (current: number, total: number) => onEvent?.({ type: 'progress', current, total }),
    [onEvent],
  );

  const say = useCallback(
    (speaker: Extract<MiniGameEvent, { type: 'say' }>['speaker'], text: string, es?: string) =>
      onEvent?.({ type: 'say', speaker, text, es }),
    [onEvent],
  );

  const learnedWord = useCallback((w: string) => {
    words.current.add(w);
  }, []);

  const complete = useCallback(
    (extraSkills: SkillTag[] = []) => {
      // Every game calls complete() from a celebration timer. If the child left
      // first, that timer must not report a result into a screen that has gone
      // (a store write and a MINIGAME_DONE into a stopped mission actor).
      if (done.current || !mounted.current) return;
      done.current = true;
      const penalty = mistakes.current + hints.current;
      const stars: Stars = penalty === 0 ? 3 : penalty === 1 ? 2 : 1;
      onComplete({
        kind,
        success: true,
        attempts: Math.max(1, attempts.current),
        hintsUsed: hints.current,
        durationMs: Date.now() - startedAt.current,
        stars,
        skills: Array.from(new Set([...(challengeSkills[kind] ?? []), ...extraSkills])),
        wordsLearned: Array.from(words.current),
      });
    },
    [kind, onComplete],
  );

  return useMemo(
    () => ({ correct, incorrect, hint, progress, say, learnedWord, complete }),
    [correct, incorrect, hint, progress, say, learnedWord, complete],
  );
}
