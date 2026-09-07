/**
 * MISSIONS — the twenty-nine calls of Spark City, in the order the station
 * unlocks them.
 *
 * The first two are always available. Everything after that opens as the child
 * plays, and nothing ever locks again once it is open. No mission ever needs
 * more than two others first, so the town fans out instead of forming a queue,
 * and every call is reachable inside five rounds of play:
 *
 *   round 1  clock-tower-cat                    bakery-bell
 *   round 2  park-picnic, library-lights,       pizza-shop-panic,
 *            moving-day, snow-day-shift         pet-shop-parade, bakery-birthday
 *   round 3  museum-mystery, market-morning, school-fair, garden-grow-day,
 *            station-open-day, library-book-sale, park-bandstand,
 *            pizzeria-blackout, apartment-alarm-check
 *   round 4  community-cleanup, train-timetable, playground-build,
 *            market-delivery-run, festival-lantern-parade, garden-harvest,
 *            school-sports-day
 *   round 5  festival-exchange, beach-day, freight-yard-count,
 *            harbour-boat-rescue
 *
 * TWO CALLS PER PLACE, AND WHY
 * ----------------------------
 * Spark City has sixteen places on the map and no room for a seventeenth, so
 * the town grew by giving twelve of them a SECOND call rather than by inventing
 * new streets. Each pair is deliberately opposite in shape, because "the same
 * building again" is the one thing that would make the town feel padded:
 *
 *   bakery        a stuck bell          ↔ an order that does not add up
 *   pizza         a fire                ↔ a blackout with a queue out the door
 *   park          a lost picnic         ↔ a concert where nothing goes wrong
 *   library       a fuse in the dark    ↔ a loud book sale on the steps
 *   market        what is on the stall  ↔ getting it across town
 *   garden        planting              ↔ harvesting and sharing out
 *   apartments    a removal van         ↔ the annual alarm round
 *   school        a fair in a crowd     ↔ a timetable that must be kept
 *   station       an open day           ↔ a storm night with no power
 *   train-station a platform and a clock↔ the freight yard up the line
 *   beach         a tide and a turtle   ↔ a boat adrift off the pier
 *   festival      a Spanish radio drill ↔ the lantern parade after dark
 */
import type { MissionDef } from '../types';
import { apartmentAlarmCheck } from './apartment-alarm-check';
import { bakeryBell } from './bakery-bell';
import { bakeryBirthday } from './bakery-birthday';
import { clockTowerCat } from './clock-tower-cat';
import { beachDay } from './beach-day';
import { communityCleanup } from './community-cleanup';
import { festivalExchange } from './festival-exchange';
import { festivalLanternParade } from './festival-lantern-parade';
import { freightYardCount } from './freight-yard-count';
import { gardenGrowDay } from './garden-grow-day';
import { gardenHarvest } from './garden-harvest';
import { harbourBoatRescue } from './harbour-boat-rescue';
import { libraryBookSale } from './library-book-sale';
import { libraryLights } from './library-lights';
import { marketDeliveryRun } from './market-delivery-run';
import { marketMorning } from './market-morning';
import { movingDay } from './moving-day';
import { museumMystery } from './museum-mystery';
import { parkBandstand } from './park-bandstand';
import { parkPicnic } from './park-picnic';
import { petShopParade } from './pet-shop-parade';
import { pizzaShopPanic } from './pizza-shop-panic';
import { pizzeriaBlackout } from './pizzeria-blackout';
import { playgroundBuild } from './playground-build';
import { schoolFair } from './school-fair';
import { schoolSportsDay } from './school-sports-day';
import { snowDayShift } from './snow-day-shift';
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
  snowDayShift,
  bakeryBirthday,
  schoolFair,
  marketMorning,
  gardenGrowDay,
  stationOpenDay,
  libraryBookSale,
  parkBandstand,
  pizzeriaBlackout,
  apartmentAlarmCheck,
  communityCleanup,
  museumMystery,
  trainTimetable,
  playgroundBuild,
  marketDeliveryRun,
  festivalLanternParade,
  gardenHarvest,
  schoolSportsDay,
  festivalExchange,
  beachDay,
  freightYardCount,
  harbourBoatRescue,
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

/** Every call at one place on the map, in unlock order. */
export function missionsAtLocation(location: MissionDef['location']): MissionDef[] {
  return missions.filter((m) => m.location === location);
}

export {
  apartmentAlarmCheck,
  bakeryBell,
  bakeryBirthday,
  beachDay,
  clockTowerCat,
  communityCleanup,
  festivalExchange,
  festivalLanternParade,
  freightYardCount,
  gardenGrowDay,
  gardenHarvest,
  harbourBoatRescue,
  libraryBookSale,
  libraryLights,
  marketDeliveryRun,
  marketMorning,
  movingDay,
  museumMystery,
  parkBandstand,
  parkPicnic,
  petShopParade,
  pizzaShopPanic,
  pizzeriaBlackout,
  playgroundBuild,
  schoolFair,
  schoolSportsDay,
  snowDayShift,
  stationOpenDay,
  trainTimetable,
};
