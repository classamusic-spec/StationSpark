import type { RankDef, RankId } from './types';

/** Playful, never military. XP thresholds are tuned for ~40 XP per mission. */
export const ranks: RankDef[] = [
  { id: 'cadet', name: 'Cadet', minXp: 0, cheer: 'Welcome to Station Spark, Cadet!' },
  { id: 'helper', name: 'Helper', minXp: 80, cheer: 'You are a real Helper now!' },
  { id: 'crew-member', name: 'Crew Member', minXp: 200, cheer: 'Officially part of the crew!' },
  { id: 'problem-solver', name: 'Problem Solver', minXp: 380, cheer: 'No puzzle is too tricky for you!' },
  { id: 'rescue-leader', name: 'Rescue Leader', minXp: 620, cheer: 'Leading rescues like a pro!' },
  { id: 'station-captain', name: 'Station Captain', minXp: 920, cheer: 'Captain! The station is yours!' },
  { id: 'community-hero', name: 'Community Hero', minXp: 1300, cheer: 'Spark City cheers for you, Hero!' },
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
