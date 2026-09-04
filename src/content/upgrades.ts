/**
 * STATION UPGRADES — what Sparks are for.
 *
 * Sparks only ever buy decorations for the firehouse: nothing here gates
 * learning, nothing expires, and every upgrade stays affordable by playing.
 */
import type { StationUpgradeDef, StationUpgradeId } from './types';

export const upgrades: StationUpgradeDef[] = [
  {
    id: 'bell-brass',
    name: 'Brass Bell',
    description: 'Polish the station bell until it shines. It rings twice as bright.',
    cost: 20,
    room: 'facade',
  },
  {
    id: 'flag-gold',
    name: 'Golden Flag',
    description: 'A sunny gold flag for the roof pole. It waves at everyone.',
    cost: 30,
    room: 'facade',
  },
  {
    id: 'library-corner',
    name: 'Reading Corner',
    description: 'A cosy nook of cushions and books beside the classroom window.',
    cost: 40,
    room: 'classroom',
  },
  {
    id: 'garden',
    name: 'Station Garden',
    description: 'Tomatoes, basil and sunflowers in the side yard. Pepper loves it.',
    cost: 45,
    room: 'yard',
  },
  {
    id: 'pet-area',
    name: 'Pet Corner',
    description: 'A soft bed, two bowls and a squeaky ball for visiting animals.',
    cost: 55,
    room: 'yard',
  },
  {
    id: 'community-table',
    name: 'Community Table',
    description: 'A long table where the whole neighbourhood squeezes in for dinner.',
    cost: 60,
    room: 'kitchen',
  },
  {
    id: 'map-room-2',
    name: 'Big Map Room',
    description: 'A wall-sized Spark City map with pins, string and a spinny chair.',
    cost: 70,
    room: 'dispatch',
  },
  {
    id: 'roof-garden',
    name: 'Roof Garden',
    description: 'Planters and a little bench on the roof, right under the flag.',
    cost: 75,
    room: 'roof',
  },
  {
    id: 'kitchen-2',
    name: 'Big Kitchen',
    description: 'A second oven, a huge mixing bowl and shelves of shiny pans.',
    cost: 80,
    room: 'kitchen',
  },
  {
    id: 'training-tower',
    name: 'Training Tower',
    description: 'A padded practice tower in the yard with rungs at every height.',
    cost: 90,
    room: 'yard',
  },
  {
    id: 'truck-bay-2',
    name: 'Second Truck Bay',
    description: 'Room for a little rescue van beside the big engine.',
    cost: 100,
    room: 'garage',
  },
  {
    id: 'mural',
    name: 'Neighbourhood Mural',
    description: 'The whole town painted behind the badge wall, with you in it.',
    cost: 120,
    room: 'badge-wall',
  },
];

const upgradeMap = new Map(upgrades.map((u) => [u.id, u]));

export function upgradeById(id: StationUpgradeId): StationUpgradeDef {
  return upgradeMap.get(id) ?? (upgrades[0] as StationUpgradeDef);
}

/** Upgrades grouped by the room they change, cheapest first. */
export function upgradesForRoom(room: StationUpgradeDef['room']): StationUpgradeDef[] {
  return upgrades.filter((u) => u.room === room).sort((a, b) => a.cost - b.cost);
}

/** What the child can afford right now (and does not already own). */
export function affordableUpgrades(sparks: number, owned: readonly StationUpgradeId[]): StationUpgradeDef[] {
  const have = new Set(owned);
  return upgrades.filter((u) => !have.has(u.id) && u.cost <= sparks);
}
