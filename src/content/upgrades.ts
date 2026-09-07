/**
 * STATION UPGRADES — what Sparks are for.
 *
 * Sparks only ever buy decorations for the firehouse. Nothing here gates
 * learning, nothing expires, and no upgrade can be lost once it is bought.
 *
 * THE ECONOMY, IN REAL NUMBERS (the comment used to claim "every upgrade stays
 * affordable by playing", which was true of no single figure in the file):
 *
 *   · Sparks come from ONE place — finishing a mission. The Kitchen and the
 *     Training Yard pay XP and badges, never Sparks.
 *   · One full tour of Spark City — all twenty-nine calls, once each — pays
 *     **436 Sparks**.
 *   · The shop is twenty-two upgrades costing **940 Sparks** in total, so the
 *     station fills up over a little more than two tours of the town.
 *   · The dearest single upgrade is 85, which is a fifth of one tour: whatever a
 *     child has their eye on is a handful of missions away, never a season's
 *     grind.
 *   · Missions can be replayed and pay their Sparks again, so the shop always
 *     closes — a child who wants the mural can go and earn it.
 *
 * THE SHOP IS THE ONE THING THE TOWN OUTGREW. Twenty-nine calls now pay for
 * twenty-two decorations, so a child who tours the whole town twice owns the
 * station outright. Adding more would be the honest fix, and it cannot be done
 * from here: `UpgradeArt` in `src/screens/Progress/parts/` draws each upgrade
 * from an exhaustive `switch` over `StationUpgradeId`, so a new id ships as an
 * empty square until that drawing exists.
 *
 * `content.test.ts` recomputes all four of those numbers from the data, so this
 * comment cannot quietly drift away from the game again.
 */
import type { StationUpgradeDef, StationUpgradeId } from './types';

export const upgrades: StationUpgradeDef[] = [
  {
    id: 'bell-brass',
    name: 'Brass Bell',
    description: 'Polish the station bell until it shines. It rings twice as bright.',
    cost: 15,
    room: 'facade',
  },
  {
    id: 'flag-gold',
    name: 'Golden Flag',
    description: 'A sunny gold flag for the roof pole. It waves at everyone.',
    cost: 20,
    room: 'facade',
  },
  {
    id: 'herb-boxes',
    name: 'Herb Boxes',
    description: 'Window boxes of basil and cilantro from Don Nico’s garden, one under every window.',
    cost: 22,
    room: 'yard',
  },
  {
    id: 'library-corner',
    name: 'Reading Corner',
    description: 'A cosy nook of cushions and books beside the classroom window.',
    cost: 25,
    room: 'classroom',
  },
  {
    id: 'spice-rack',
    name: 'Spice Rack',
    description: 'A little shelf of jars beside the pot: sal, comino, orégano. The caldo notices.',
    cost: 26,
    room: 'kitchen',
  },
  {
    id: 'garden',
    name: 'Station Garden',
    description: 'Tomatoes, basil and sunflowers in the side yard. The whole crew picks from it.',
    cost: 28,
    room: 'yard',
  },
  {
    id: 'reading-nook',
    name: 'Reading Nook',
    description: 'Maya lent us a shelf: bean bags, a lamp and a stack of picture books.',
    cost: 30,
    room: 'classroom',
  },
  {
    id: 'pet-area',
    name: 'Pet Corner',
    description: 'A soft bed, two bowls and a squeaky ball for visiting animals.',
    cost: 32,
    room: 'yard',
  },
  {
    id: 'shell-shelf',
    name: 'Shell Shelf',
    description: 'Everything the bay gave back, labelled in two languages by the crew.',
    cost: 34,
    room: 'classroom',
  },
  {
    id: 'community-table',
    name: 'Community Table',
    description: 'A long table where the whole neighbourhood squeezes in for dinner.',
    cost: 36,
    room: 'kitchen',
  },
  {
    id: 'festival-lights',
    name: 'Festival Lights',
    description: 'Papel picado and warm bulbs strung across the front of the station.',
    cost: 40,
    room: 'facade',
  },
  {
    id: 'tool-wall',
    name: 'Tool Wall',
    description: 'Every tool on its own painted outline, so a missing one shows at a glance.',
    cost: 42,
    room: 'garage',
  },
  {
    id: 'map-room-2',
    name: 'Big Map Room',
    description: 'A wall-sized Spark City map with pins, string and a spinny chair.',
    cost: 44,
    room: 'dispatch',
  },
  {
    id: 'roof-garden',
    name: 'Roof Garden',
    description: 'Planters and a little bench on the roof, right under the flag.',
    cost: 48,
    room: 'roof',
  },
  {
    id: 'welcome-arch',
    name: 'Welcome Arch',
    description: 'A painted arch over the gate that says BIENVENIDOS on one side and WELCOME on the other.',
    cost: 50,
    room: 'facade',
  },
  {
    id: 'kitchen-2',
    name: 'Big Kitchen',
    description: 'A second oven, a huge mixing bowl and shelves of shiny pans.',
    cost: 52,
    room: 'kitchen',
  },
  {
    id: 'world-map',
    name: 'World Map',
    description: 'A big map of the world with a pin on every station that writes to us.',
    cost: 55,
    room: 'dispatch',
  },
  {
    id: 'training-tower',
    name: 'Training Tower',
    description: 'A padded practice tower in the yard with rungs at every height.',
    cost: 58,
    room: 'yard',
  },
  {
    id: 'garden-pond',
    name: 'Garden Pond',
    description: 'A little pond behind the garden. Ducklings visit on Tuesdays.',
    cost: 62,
    room: 'yard',
  },
  {
    id: 'weather-vane',
    name: 'Weather Vane',
    description: 'A copper truck that spins on the roof, so the crew always knows which way the wind blew.',
    cost: 66,
    room: 'roof',
  },
  {
    id: 'truck-bay-2',
    name: 'Second Truck Bay',
    description: 'Room for a little rescue van beside the big engine.',
    cost: 70,
    room: 'garage',
  },
  {
    id: 'mural',
    name: 'Neighbourhood Mural',
    description: 'The whole town painted behind the badge wall, with you in it.',
    cost: 85,
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

/** What the whole station costs, for the economy tests and the Grown-Ups screen. */
export const shopTotalCost = upgrades.reduce((sum, u) => sum + u.cost, 0);

/** The dearest single decoration — the longest a child ever saves for one thing. */
export const dearestUpgradeCost = upgrades.reduce((most, u) => Math.max(most, u.cost), 0);
