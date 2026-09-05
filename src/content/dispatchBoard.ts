/**
 * DISPATCH BOARD — the two or three slips pinned up for today's shift.
 *
 * Rules, in order:
 *   1. only missions whose `requires` are satisfied (never a locked slip),
 *   2. never the same mission twice,
 *   3. never two slips at the same location — a board is a tour of the town,
 *   4. brand-new missions first, then the ones with the fewest stars,
 *   5. lead with the subject the child has practised least (from `progress.mastery`),
 *   6. spread the subjects so a board is never three maths calls in a row.
 * Deterministic for a given seed, so a child sees the same board all day.
 */
import type { AgeBand, SkillTag, Subject } from '@/learning/types';
import { masteryFor, subjectForSkill, subjectOrder, type MasteryMap } from '@/learning/adaptive';
import { createRng, type Rng } from '@/utils/rng';
import { missions } from './missions';
import type { LocationId, MissionDef } from './types';

/** Structurally compatible with `Progress` in the game store. */
export interface BoardProgress {
  missions: Record<string, { stars: number }>;
  /** attempts/correct per skill — the board leans toward the rustiest subject */
  mastery?: MasteryMap;
}

export interface DispatchBoardOptions {
  /** the child's progress (mission id → stars). */
  progress?: BoardProgress;
  /** alternative to `progress`: just the ids already completed. */
  completed?: readonly string[];
  ageBand: AgeBand;
  /** seeded rng — pass one built from `daySeed()` for a stable daily board. */
  rng?: Rng;
  /** used when `rng` is not supplied. */
  seed?: number;
  size?: number;
}

/** A stable number for one calendar day, so the board only changes at midnight. */
export function daySeed(date: Date | string = new Date()): number {
  const iso = typeof date === 'string' ? date : date.toISOString();
  const day = iso.slice(0, 10); // YYYY-MM-DD
  let hash = 2166136261;
  for (let i = 0; i < day.length; i++) {
    hash ^= day.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const starsFor = (progress: BoardProgress | undefined, id: string): number => progress?.missions[id]?.stars ?? 0;
const isDone = (progress: BoardProgress | undefined, id: string): boolean => progress?.missions[id] !== undefined;

/**
 * How much practice each subject has had, 0 (rusty / never seen) … 1 (solid).
 * Subjects with no evidence read 0.5 — "we don't know yet" — exactly like
 * `masteryFor`, so a brand-new child gets a neutral, varied board.
 */
export function subjectPractice(mastery: MasteryMap | undefined): Record<Subject, number> {
  const totals = new Map<Subject, { sum: number; n: number }>();
  for (const key of Object.keys(mastery ?? {}) as SkillTag[]) {
    const subject = subjectForSkill(key);
    const entry = totals.get(subject) ?? { sum: 0, n: 0 };
    entry.sum += masteryFor(mastery, key);
    entry.n += 1;
    totals.set(subject, entry);
  }
  const out = {} as Record<Subject, number>;
  for (const subject of subjectOrder) {
    const entry = totals.get(subject);
    out[subject] = entry && entry.n > 0 ? entry.sum / entry.n : 0.5;
  }
  return out;
}

/** The subject the child has practised least (ties broken by display order). */
export function rustiestSubject(mastery: MasteryMap | undefined): Subject | undefined {
  if (!mastery || Object.keys(mastery).length === 0) return undefined;
  const practice = subjectPractice(mastery);
  let best: Subject | undefined;
  for (const subject of subjectOrder) {
    if (best === undefined || (practice[subject] ?? 1) < (practice[best] ?? 1)) best = subject;
  }
  return best;
}

/**
 * Today's board as mission ids. Never returns a locked mission, never repeats,
 * never sends the crew to the same building twice, and always returns at least
 * one slip while any mission is unlocked.
 */
export function buildDispatchBoard(options: DispatchBoardOptions): string[] {
  const size = Math.max(1, options.size ?? 3);
  const rng = options.rng ?? createRng(options.seed ?? daySeed());
  const progress: BoardProgress | undefined =
    options.progress ??
    (options.completed
      ? { missions: Object.fromEntries(options.completed.map((id) => [id, { stars: 3 }])) }
      : undefined);

  const done = new Set(Object.keys(progress?.missions ?? {}));
  const available = missions.filter((m) => (m.requires ?? []).every((r) => done.has(r)));
  if (available.length === 0) return [];

  // The subject that has had the least practice leads the board (when we know).
  const rusty = rustiestSubject(progress?.mastery);

  // Shuffle first so equal-priority missions rotate day to day.
  const shuffled = rng.shuffle(available);
  const ranked = [...shuffled].sort((a, b) => {
    const freshness = Number(isDone(progress, a.id)) - Number(isDone(progress, b.id));
    if (freshness !== 0) return freshness;
    if (rusty) {
      const practice = Number(!a.subjects.includes(rusty)) - Number(!b.subjects.includes(rusty));
      if (practice !== 0) return practice;
    }
    const stars = starsFor(progress, a.id) - starsFor(progress, b.id);
    if (stars !== 0) return stars;
    // Younger crews get the shorter calls first.
    return options.ageBand === 'A' ? a.minutes - b.minutes : 0;
  });

  const board: MissionDef[] = [];
  const usedSubjects = new Set<Subject>();
  const usedLocations = new Set<LocationId>();

  const take = (mission: MissionDef) => {
    board.push(mission);
    usedLocations.add(mission.location);
    mission.subjects.forEach((s) => usedSubjects.add(s));
  };

  // Pass 1: the best mission that brings a subject we do not have yet, at a
  // building we have not visited on this board.
  for (const mission of ranked) {
    if (board.length >= size) break;
    if (usedLocations.has(mission.location)) continue;
    if (mission.subjects.some((s) => !usedSubjects.has(s))) take(mission);
  }
  // Pass 2: fill remaining slots in rank order, still one slip per building.
  for (const mission of ranked) {
    if (board.length >= size) break;
    if (board.includes(mission) || usedLocations.has(mission.location)) continue;
    take(mission);
  }
  // Pass 3: only if the town cannot fill the board with distinct buildings do we
  // allow a repeat location — a board is never short when work is available.
  for (const mission of ranked) {
    if (board.length >= size) break;
    if (!board.includes(mission)) take(mission);
  }

  return board.map((m) => m.id);
}

/** The same board, resolved to definitions (in board order). */
export function dispatchBoardMissions(options: DispatchBoardOptions): MissionDef[] {
  const ids = buildDispatchBoard(options);
  return ids.flatMap((id) => {
    const mission = missions.find((m) => m.id === id);
    return mission ? [mission] : [];
  });
}
