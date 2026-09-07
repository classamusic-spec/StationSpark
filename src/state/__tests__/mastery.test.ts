/**
 * The number a parent reads.
 *
 * `recordMiniGame` used to compute
 *   `correct: m.correct + Math.max(1, r.attempts - (r.attempts - 1))`
 * which is `Math.max(1, 1)` — the constant 1 — while `attempts` grew by the
 * game's full count. So a perfect six-item Gear Sort recorded six attempts and
 * one correct, and the Grown-Ups report card told a parent their child was
 * **17% on Sorting** after getting every single item right.
 *
 * The session always knew the real split; it simply never sent it.
 */
import { useGame } from '../store';
import type { MiniGameResult } from '@/minigames/types';

const play = (over: Partial<MiniGameResult> = {}): MiniGameResult => ({
  kind: 'gear-sort',
  success: true,
  attempts: 6,
  correct: 6,
  hintsUsed: 0,
  durationMs: 1000,
  stars: 3,
  skills: ['sorting'],
  ...over,
});

const masteryOf = (skill: string) => {
  const m = useGame.getState().progress.mastery[skill as never] as { attempts: number; correct: number } | undefined;
  return m ? Math.round((m.correct / m.attempts) * 100) : null;
};

beforeEach(() => {
  useGame.setState((s) => ({ progress: { ...s.progress, mastery: {} } }));
});

describe('mastery reflects what actually happened', () => {
  it('reports 100% for a flawless run', () => {
    useGame.getState().recordMiniGame(play());
    expect(masteryOf('sorting')).toBe(100);
  });

  it('reports the real share when the child missed some', () => {
    // eight answers given, six of them right
    useGame.getState().recordMiniGame(play({ attempts: 8, correct: 6 }));
    expect(masteryOf('sorting')).toBe(75);
  });

  it('accumulates across plays instead of resetting', () => {
    useGame.getState().recordMiniGame(play({ attempts: 4, correct: 4 }));
    useGame.getState().recordMiniGame(play({ attempts: 4, correct: 2 }));
    expect(masteryOf('sorting')).toBe(75); // 6 of 8
  });

  it('credits every skill a game practises', () => {
    useGame.getState().recordMiniGame(play({ skills: ['sorting', 'counting'] }));
    expect(masteryOf('sorting')).toBe(100);
    expect(masteryOf('counting')).toBe(100);
  });

  it('leaves mastery alone for a synthesised result that was never played', () => {
    // a skipped beat, or a game that could not render, carries no count —
    // recording it as a miss would punish a child for our bug
    useGame.getState().recordMiniGame(play({ correct: undefined }));
    expect(masteryOf('sorting')).toBeNull();
  });

  it('never reports more than 100%, whatever a game claims', () => {
    useGame.getState().recordMiniGame(play({ attempts: 3, correct: 99 }));
    expect(masteryOf('sorting')).toBe(100);
  });
});
