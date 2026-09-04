/**
 * MISSIONS — the MVP six, in the order the station unlocks them.
 *
 * The first two are always available. Everything after that opens as the child
 * plays, and nothing ever locks again once it is open.
 */
import type { MissionDef } from '../types';
import { bakeryBell } from './bakery-bell';
import { clockTowerCat } from './clock-tower-cat';
import { communityCleanup } from './community-cleanup';
import { parkPicnic } from './park-picnic';
import { pizzaShopPanic } from './pizza-shop-panic';
import { schoolFair } from './school-fair';

export const missions: MissionDef[] = [
  clockTowerCat,
  bakeryBell,
  pizzaShopPanic,
  parkPicnic,
  schoolFair,
  communityCleanup,
];

const missionMap = new Map(missions.map((m) => [m.id, m]));

export function missionById(id: string): MissionDef | undefined {
  return missionMap.get(id);
}

/** Missions whose `requires` are all satisfied by the completed ids. */
export function unlockedMissions(completedIds: readonly string[]): MissionDef[] {
  const done = new Set(completedIds);
  return missions.filter((m) => (m.requires ?? []).every((r) => done.has(r)));
}

export { bakeryBell, clockTowerCat, communityCleanup, parkPicnic, pizzaShopPanic, schoolFair };
