/**
 * MINI-GAME REGISTRY
 * Each group file exports a Partial<Record<ChallengeKind, Entry>>; this file merges them.
 * Groups:
 *   ./tactile/index.ts  — Skia tactile games (hose-hero, water-tank, ladder-builder, number-ladder, rescue-pets, build-barrier)
 *   ./logic/index.ts    — drag/tap logic & reading games
 *   @/kitchen/games     — kitchen games
 */
import type { ChallengeKind } from '@/learning/types';
import type { MiniGameComponent, MiniGameMeta } from './types';
import { tactileGames } from './tactile';
import { logicGames } from './logic';
import { kitchenGames } from '@/kitchen/games';

export interface RegistryEntry<K extends ChallengeKind = ChallengeKind> {
  component: MiniGameComponent<K>;
  meta: MiniGameMeta;
}

export type Registry = { [K in ChallengeKind]?: RegistryEntry<K> };

export const registry: Registry = {
  ...tactileGames,
  ...logicGames,
  ...kitchenGames,
};

export function getMiniGame<K extends ChallengeKind>(kind: K): RegistryEntry<K> | undefined {
  return registry[kind] as RegistryEntry<K> | undefined;
}

export function listMiniGames(yard?: MiniGameMeta['yard']): RegistryEntry[] {
  return (Object.values(registry) as RegistryEntry[]).filter((e) => !yard || e.meta.yard === yard);
}
