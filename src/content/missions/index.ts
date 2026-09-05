/**
 * MISSIONS — the twelve calls of Spark City, in the order the station unlocks them.
 *
 * The first two are always available. Everything after that opens as the child
 * plays, and nothing ever locks again once it is open. No mission ever needs
 * more than two others first, so the town fans out instead of forming a queue:
 *
 *   clock-tower-cat ─┬─ park-picnic ────┬─ community-cleanup ─┐
 *                    └─ library-lights ─┼─ museum-mystery ─┐  │
 *   bakery-bell ─────┬─ pizza-shop-panic ─ school-fair ────┼──┼─ train-timetable
 *                    ├─ pet-shop-parade                    │  │
 *                    └─ market-morning ──────────────────────┴─ festival-exchange
 */
import type { MissionDef } from '../types';
import { bakeryBell } from './bakery-bell';
import { clockTowerCat } from './clock-tower-cat';
import { communityCleanup } from './community-cleanup';
import { festivalExchange } from './festival-exchange';
import { libraryLights } from './library-lights';
import { marketMorning } from './market-morning';
import { museumMystery } from './museum-mystery';
import { parkPicnic } from './park-picnic';
import { petShopParade } from './pet-shop-parade';
import { pizzaShopPanic } from './pizza-shop-panic';
import { schoolFair } from './school-fair';
import { trainTimetable } from './train-timetable';

export const missions: MissionDef[] = [
  clockTowerCat,
  bakeryBell,
  pizzaShopPanic,
  parkPicnic,
  libraryLights,
  petShopParade,
  schoolFair,
  marketMorning,
  communityCleanup,
  museumMystery,
  trainTimetable,
  festivalExchange,
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

export {
  bakeryBell,
  clockTowerCat,
  communityCleanup,
  festivalExchange,
  libraryLights,
  marketMorning,
  museumMystery,
  parkPicnic,
  petShopParade,
  pizzaShopPanic,
  schoolFair,
  trainTimetable,
};
