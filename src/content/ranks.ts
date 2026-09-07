import type { RankDef, RankId } from './types';

/**
 * Playful, never military.
 *
 * Thresholds are tuned to the size of the town, and the town has grown twice.
 * At 40–50 XP a call, one full tour of the twenty-nine missions of Spark City
 * pays **1,324 XP** and the whole recipe book another **647**, so the ladder is
 * stretched to match: Problem Solver lands inside the first tour, Rescue Leader
 * a little past halfway, and Community Hero still needs more than one tour plus
 * the kitchen and the Training Yard on top.
 *
 * `content.test.ts` recomputes those two totals from the data, so the ladder can
 * never quietly become something a child finishes in an afternoon — or
 * something they can never finish at all. Nothing here is ever taken away.
 */
export const ranks: RankDef[] = [
  { id: 'cadet', name: 'Cadet', minXp: 0, cheer: 'Welcome to Station Spark, Cadet!' },
  { id: 'helper', name: 'Helper', minXp: 80, cheer: 'You are a real Helper now!' },
  { id: 'crew-member', name: 'Crew Member', minXp: 200, cheer: 'Officially part of the crew!' },
  { id: 'problem-solver', name: 'Problem Solver', minXp: 420, cheer: 'No puzzle is too tricky for you!' },
  { id: 'rescue-leader', name: 'Rescue Leader', minXp: 780, cheer: 'Leading rescues like a pro!' },
  { id: 'station-captain', name: 'Station Captain', minXp: 1400, cheer: 'Captain! The station is yours!' },
  { id: 'community-hero', name: 'Community Hero', minXp: 2200, cheer: 'Spark City cheers for you, Hero!' },
];

export function rankForXp(xp: number): RankDef {
  let current = ranks[0] as RankDef;
  for (const r of ranks) if (xp >= r.minXp) current = r;
  return current;
}

export function nextRank(xp: number): RankDef | null {
  const idx = ranks.findIndex((r) => r.id === rankForXp(xp).id);
  return ranks[idx + 1] ?? null;
}

export function rankById(id: RankId): RankDef {
  return ranks.find((r) => r.id === id) ?? (ranks[0] as RankDef);
}

/** 0..1 progress toward the next rank (1 when at max rank). */
export function rankProgress(xp: number): { current: RankDef; next: RankDef | null; t: number; into: number; span: number } {
  const current = rankForXp(xp);
  const next = nextRank(xp);
  if (!next) return { current, next: null, t: 1, into: 0, span: 0 };
  const span = next.minXp - current.minXp;
  const into = xp - current.minXp;
  return { current, next, t: Math.min(1, into / span), into, span };
}
