/**
 * Derived reads over the game store.
 *
 * Selectors return primitives or *stable* store slices so `useGame(selector)`
 * never re-renders on identity churn; anything that has to compute a new array
 * or object is exposed as a small hook that memoises over those slices.
 */
import { useMemo } from 'react';
import type { SkillTag } from '@/learning/types';
import type { BadgeDef, BadgeId, StationUpgradeDef, StationUpgradeId } from '@/content/types';
import { badges, earnedSkillBadges } from '@/content/badges';
import { upgrades } from '@/content/upgrades';
import { rankForXp, rankProgress, ranks } from '@/content/ranks';
import { useGame, type Progress } from '@/state/store';

export type GameSnapshot = ReturnType<typeof useGame.getState>;

/* ------------------------------------------------------------------ */
/* Plain selectors (safe to pass straight to useGame)                   */
/* ------------------------------------------------------------------ */

export const selectSparks = (s: GameSnapshot) => s.progress.sparks;
export const selectXpValue = (s: GameSnapshot) => s.progress.xp;
export const selectProgress = (s: GameSnapshot) => s.progress;
export const selectStation = (s: GameSnapshot) => s.station;
export const selectProfile = (s: GameSnapshot) => s.profile;
export const selectShift = (s: GameSnapshot) => s.shift;
export const selectUnlocked = (s: GameSnapshot) => s.station.unlocked;
export const selectTruck = (s: GameSnapshot) => s.station.truck;

/** Total stars collected across every mission the child has played. */
export const selectTotalStars = (s: GameSnapshot) =>
  Object.values(s.progress.missions).reduce((total, m) => total + m.stars, 0);

/* ------------------------------------------------------------------ */
/* Badges                                                               */
/* ------------------------------------------------------------------ */

export interface BadgeWallEntry {
  def: BadgeDef;
  earned: boolean;
}

/** Awarded badges plus any skill badge the child has already qualified for. */
export function earnedBadgeIds(progress: Progress): BadgeId[] {
  const set = new Set<BadgeId>(progress.badges);
  try {
    for (const id of earnedSkillBadges(progress)) set.add(id);
  } catch {
    /* content still landing — the stored badges are always enough */
  }
  return badges.filter((b) => set.has(b.id)).map((b) => b.id);
}

/** The whole badge wall in content order, with earned/locked state. */
export function badgeWall(progress: Progress): BadgeWallEntry[] {
  const earned = new Set(earnedBadgeIds(progress));
  return badges.map((def) => ({ def, earned: earned.has(def.id) }));
}

export function useBadgeWall(): { entries: BadgeWallEntry[]; earnedCount: number; total: number } {
  const progress = useGame(selectProgress);
  return useMemo(() => {
    const entries = badgeWall(progress);
    return { entries, earnedCount: entries.filter((e) => e.earned).length, total: entries.length };
  }, [progress]);
}

/* ------------------------------------------------------------------ */
/* Rank                                                                 */
/* ------------------------------------------------------------------ */

export interface RankInfo {
  name: string;
  id: string;
  /** 1-based position in the ladder — shown as "Level n" */
  level: number;
  levels: number;
  nextName: string | null;
  into: number;
  span: number;
  /** 0..1 toward the next rank */
  t: number;
  xp: number;
}

export function rankInfo(xp: number): RankInfo {
  const { current, next, t, into, span } = rankProgress(xp);
  const level = Math.max(1, ranks.findIndex((r) => r.id === current.id) + 1);
  return { name: current.name, id: current.id, level, levels: ranks.length, nextName: next?.name ?? null, into, span, t, xp };
}

export function useRankInfo(): RankInfo {
  const xp = useGame(selectXpValue);
  return useMemo(() => rankInfo(xp), [xp]);
}

/** The full ladder with the child's current rung marked. */
export function useRankLadder(): { name: string; minXp: number; reached: boolean; current: boolean }[] {
  const xp = useGame(selectXpValue);
  return useMemo(() => {
    const currentId = rankForXp(xp).id;
    return ranks.map((r) => ({ name: r.name, minXp: r.minXp, reached: xp >= r.minXp, current: r.id === currentId }));
  }, [xp]);
}

/* ------------------------------------------------------------------ */
/* Stats                                                                */
/* ------------------------------------------------------------------ */

export interface StatTotals {
  missions: number;
  skills: number;
  recipes: number;
  words: number;
  stars: number;
  sparks: number;
  badges: number;
}

export function useStats(): StatTotals {
  const progress = useGame(selectProgress);
  return useMemo(
    () => ({
      missions: progress.stats.missions,
      skills: progress.stats.skills,
      recipes: progress.stats.recipes,
      words: progress.words.length || progress.stats.words,
      stars: Object.values(progress.missions).reduce((total, m) => total + m.stars, 0),
      sparks: progress.sparks,
      badges: earnedBadgeIds(progress).length,
    }),
    [progress],
  );
}

/* ------------------------------------------------------------------ */
/* Station upgrades                                                     */
/* ------------------------------------------------------------------ */

export interface UpgradeEntry {
  def: StationUpgradeDef;
  owned: boolean;
  affordable: boolean;
}

export function useUpgradeBoard(): { entries: UpgradeEntry[]; sparks: number; ownedCount: number } {
  const sparks = useGame(selectSparks);
  const unlocked = useGame(selectUnlocked);
  return useMemo(() => {
    const owned = new Set<StationUpgradeId>(unlocked);
    const entries = upgrades
      .map((def) => ({ def, owned: owned.has(def.id), affordable: sparks >= def.cost }))
      .sort((a, b) => Number(a.owned) - Number(b.owned) || a.def.cost - b.def.cost);
    return { entries, sparks, ownedCount: owned.size };
  }, [sparks, unlocked]);
}

/* ------------------------------------------------------------------ */
/* Skill mastery (the grown-ups view)                                   */
/* ------------------------------------------------------------------ */

const SKILL_LABELS: Partial<Record<SkillTag, string>> = {
  counting: 'Counting',
  'number-recognition': 'Recognising numbers',
  addition: 'Adding',
  subtraction: 'Subtracting',
  multiplication: 'Multiplying',
  division: 'Dividing',
  'fraction-half': 'Halves',
  'fraction-quarter': 'Quarters',
  'fraction-equivalent': 'Equivalent fractions',
  measurement: 'Measuring',
  time: 'Telling the time',
  patterns: 'Patterns',
  sorting: 'Sorting',
  geometry: 'Shapes',
  spatial: 'Space and direction',
  sequencing: 'Putting things in order',
  comparison: 'Comparing',
  estimation: 'Estimating',
  'reading-words': 'Reading words',
  'reading-sentences': 'Reading sentences',
  'reading-directions': 'Following directions',
  'vocabulary-en': 'English vocabulary',
  'vocabulary-es': 'Spanish vocabulary',
  'listening-es': 'Listening in Spanish',
  teamwork: 'Teamwork',
};

export const skillLabel = (tag: SkillTag): string => SKILL_LABELS[tag] ?? tag;

export interface MasteryRow {
  skill: SkillTag;
  label: string;
  attempts: number;
  correct: number;
  /** 0..1 */
  ratio: number;
}

export function useMastery(): MasteryRow[] {
  const progress = useGame(selectProgress);
  return useMemo(() => {
    const rows: MasteryRow[] = [];
    for (const [skill, m] of Object.entries(progress.mastery)) {
      if (!m || m.attempts <= 0) continue;
      const tag = skill as SkillTag;
      rows.push({ skill: tag, label: skillLabel(tag), attempts: m.attempts, correct: m.correct, ratio: Math.min(1, m.correct / m.attempts) });
    }
    return rows.sort((a, b) => b.attempts - a.attempts);
  }, [progress]);
}

/* ------------------------------------------------------------------ */
/* Shift                                                                */
/* ------------------------------------------------------------------ */

export interface ShiftSummary {
  active: boolean;
  done: number;
  total: number;
  label: string;
}

export function useShiftSummary(): ShiftSummary {
  const shift = useGame(selectShift);
  return useMemo(() => {
    const total = Math.max(shift.board.length, 3);
    const done = Math.min(shift.missionsDone, total);
    return { active: shift.active, done, total, label: `Shift: ${done} / ${total} missions` };
  }, [shift]);
}
