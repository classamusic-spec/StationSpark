/**
 * MISSIONS — the seventeen calls of Spark City, in the order the station
 * unlocks them.
 *
 * The first two are always available. Everything after that opens as the child
 * plays, and nothing ever locks again once it is open. No mission ever needs
 * more than two others first, so the town fans out instead of forming a queue,
 * and every call is reachable inside five rounds of play:
 *
 *   round 1  clock-tower-cat                    bakery-bell
 *   round 2  park-picnic, library-lights,       pizza-shop-panic,
 *            moving-day                         pet-shop-parade
 *   round 3  museum-mystery, market-morning, school-fair,
 *            garden-grow-day, station-open-day
 *   round 4  community-cleanup, train-timetable, playground-build
 *   round 5  festival-exchange, beach-day
 *
 * The five newest calls fill in the five corners of the town that had no story
 * of their own — the apartments, the community garden, the building site, the
 * bay and the station's own front yard — so every pin on the map is now a
 * place something happened.
 */
import type { MissionDef } from '../types';
import { bakeryBell } from './bakery-bell';
import { clockTowerCat } from './clock-tower-cat';
import { beachDay } from './beach-day';
import { communityCleanup } from './community-cleanup';
import { festivalExchange } from './festival-exchange';
import { gardenGrowDay } from './garden-grow-day';
import { libraryLights } from './library-lights';
import { marketMorning } from './market-morning';
import { movingDay } from './moving-day';
import { museumMystery } from './museum-mystery';
import { parkPicnic } from './park-picnic';
import { petShopParade } from './pet-shop-parade';
import { pizzaShopPanic } from './pizza-shop-panic';
import { playgroundBuild } from './playground-build';
import { schoolFair } from './school-fair';
import { stationOpenDay } from './station-open-day';
import { trainTimetable } from './train-timetable';

export const missions: MissionDef[] = [
  clockTowerCat,
  bakeryBell,
  pizzaShopPanic,
  parkPicnic,
  libraryLights,
  petShopParade,
  movingDay,
  schoolFair,
  marketMorning,
  gardenGrowDay,
  stationOpenDay,
  communityCleanup,
  museumMystery,
  trainTimetable,
  playgroundBuild,
  festivalExchange,
  beachDay,
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
  beachDay,
  clockTowerCat,
  communityCleanup,
  festivalExchange,
  gardenGrowDay,
  libraryLights,
  marketMorning,
  movingDay,
  museumMystery,
  parkPicnic,
  petShopParade,
  pizzaShopPanic,
  playgroundBuild,
  schoolFair,
  stationOpenDay,
  trainTimetable,
};
