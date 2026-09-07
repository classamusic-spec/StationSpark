import type { SceneId } from '@/learning/types';
import { apartments, clockTower, park, school, stationYard } from './places';
import { bakery, library, market, petShop, pizza } from './shops';
import type { SceneDef } from './types';

/** Every place, keyed by the `SceneId` a mission carries. */
export const sceneDefs: Record<SceneId, SceneDef> = {
  bakery,
  pizza,
  school,
  park,
  'clock-tower': clockTower,
  apartments,
  'pet-shop': petShop,
  library,
  market,
  'station-yard': stationYard,
};

export * from './frame';
export * from './layers';
export * from './life';
export type { SceneDef, SwayKind } from './types';
