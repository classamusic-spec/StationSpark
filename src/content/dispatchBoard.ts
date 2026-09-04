/**
 * DISPATCH BOARD — the two or three slips pinned up for today's shift.
 *
 * Rules, in order:
 *   1. only missions whose `requires` are satisfied (never a locked slip),
 *   2. never the same mission twice,
 *   3. brand-new missions first, then the ones with the fewest stars,
 *   4. spread the subjects so a board is never three maths calls in a row.
 * Deterministic for a given seed, so a child sees the same board all day.
 */
import type { AgeBand, Subject } from '@/learning/types';
import { createRng, type Rng } from '@/utils/rng';
import { missions } from './missions';
import type { MissionDef } from './types';

/** Structurally compatible with `Progress` in the game store. */
export interface BoardProgress {
  missions: Record<string, { stars: number }>;
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
 * Today's board as mission ids. Never returns a locked mission, never repeats,
 * and always returns at least one slip while any mission is unlocked.
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

  // Shuffle first so equal-priority missions rotate day to day.
  const shuffled = rng.shuffle(available);
  const ranked = [...shuffled].sort((a, b) => {
    const freshness = Number(isDone(progress, a.id)) - Number(isDone(progress, b.id));
    if (freshness !== 0) return freshness;
    const stars = starsFor(progress, a.id) - starsFor(progress, b.id);
    if (stars !== 0) return stars;
    // Younger crews get the shorter calls first.
    return options.ageBand === 'A' ? a.minutes - b.minutes : 0;
  });

  const board: MissionDef[] = [];
  const usedSubjects = new Set<Subject>();

  // Pass 1: take the best mission that brings a subject we do not have yet.
  for (const mission of ranked) {
    if (board.length >= size) break;
    if (mission.subjects.some((s) => !usedSubjects.has(s))) {
      board.push(mission);
      mission.subjects.forEach((s) => usedSubjects.add(s));
    }
  }
  // Pass 2: fill any remaining slots in rank order.
  for (const mission of ranked) {
    if (board.length >= size) break;
    if (!board.includes(mission)) board.push(mission);
  }

  return board.map((m) => m.id);
}

/** The same board, resolved to definitions. */
export function dispatchBoardMissions(options: DispatchBoardOptions): MissionDef[] {
  const ids = new Set(buildDispatchBoard(options));
  return missions.filter((m) => ids.has(m.id));
}
