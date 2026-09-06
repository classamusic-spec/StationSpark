/**
 * SPARK CITY, SEEN FROM THE CAB.
 *
 * The drive is not an empty road through open country any more: it runs
 * *through the town the child already knows* — past Rosa's bakery, the Pizza
 * Piazza, the school bell, the clock tower, the market stalls — with pavements,
 * front gardens, street lamps, hydrants, parked cars, crossings and side
 * streets opening off it.
 *
 * This module is the **one description of that street**, and it is pure: given
 * how far the truck has driven it says what is beside the road. Both renderers
 * call it with the same numbers, so the 3D town and the SVG town are the same
 * town — exactly the rule `visibleItems()` already follows for the hazards.
 *
 * Three things keep it honest:
 *
 *  1. **No random state.** Every choice is a hash of the block index, so the
 *     street is stable frame to frame, identical in both renderers, and the
 *     same town on every device. A `seed` (the run's scene) only decides where
 *     in the town the drive starts.
 *  2. **The vocabulary is the town's own.** Shapes, proportions and colours are
 *     copied from `src/world/TownMap.tsx` — tan and cream walls, gable and
 *     hipped roofs, striped awnings, mullioned windows, the navy contact
 *     shadow — so a building here reads as the same building on the map.
 *  3. **Nothing on the pavement is a hazard, and nobody is ever on the road.**
 *     Scenery stands outside the kerb and cannot be hit; there are no
 *     pedestrians and no crossing traffic (ART_DIRECTION safety). Only the
 *     cones, potholes and puddles the sim owns are on the tarmac.
 */
import { ROAD_HALF } from './projection';

/* ------------------------------------------------------------------ */
/* The street plan                                                      */
/* ------------------------------------------------------------------ */

/** Pavement width, from the kerb outwards, in road units. */
export const PAVEMENT_W = 2.4;
/** Where every building's road-facing wall stands. */
export const BUILD_LINE = ROAD_HALF + PAVEMENT_W;
/** One block of Spark City: two plots a side with a gap between them. */
export const BLOCK = 40;
/** Every third block the gap becomes a real crossroads. */
export const JUNCTION_EVERY = 3;

/** The two building plots inside a block: where they start and how long they run. */
const PLOTS = [
  { at: 2, len: 14 },
  { at: 24, len: 14 },
] as const;
/** The gap between the plots — a garden normally, a side street on a junction. */
const GAP_AT = 16;
const GAP_LEN = 8;
/** How far a side street runs away from the main road before the fog takes it. */
export const SIDE_STREET_LENGTH = 24;
/** Stripes in a zebra crossing, and how wide one is. */
export const CROSSING_BARS = 5;
export const CROSSING_BAR_W = 0.86;

/* ------------------------------------------------------------------ */
/* The buildings                                                        */
/* ------------------------------------------------------------------ */

export type BuildingId =
  | 'station'
  | 'house'
  | 'cottage'
  | 'apartments'
  | 'bakery'
  | 'pizza'
  | 'school'
  | 'clock-tower'
  | 'library'
  | 'pet-shop'
  | 'market';

export type RoofKind = 'gable' | 'hip' | 'flat' | 'pyramid';
/** The one drawn motif that makes a building recognisable at 20 units a second. */
export type SignKind = 'loaf' | 'pizza' | 'paw' | 'clock' | 'books' | 'stall' | 'bell' | 'helmet';

export interface BuildingSpec {
  /** how far the building reaches away from the road */
  depth: number;
  /** how much of its 14-unit plot it fills along the road */
  frontage: number;
  /** wall height, in road units (the truck is 2.6 tall, the camera floats at 5) */
  height: number;
  roof: RoofKind;
  roofHeight: number;
  /** flat wall colour, plus the two tones every solid in this world gets */
  wall: string;
  wallShade: string;
  wallLight: string;
  roofColor: string;
  roofDark: string;
  /** awning / signboard colour — the shop's identity stripe */
  trim: string;
  /** rows of windows up the road-facing wall */
  storeys: number;
  sign?: SignKind;
  /** a striped shop awning over the ground floor */
  awning?: boolean;
  /** a brick chimney on the ridge */
  chimney?: boolean;
  /** the name a grown-up would call it, for the accessibility description */
  name: string;
}

/*
 * Tones are lifted straight off `TownMap`: SHADE is navy-ward, HI white-ward,
 * and the light falls from the left exactly as it does on the map, so a wall
 * facing left is the lit one in both renderers.
 */
const shade = (hex: string): string => mix(hex, '#1F2A5A', 0.22);
const light = (hex: string): string => mix(hex, '#FFFFFF', 0.3);

/** Blend two `#rrggbb` colours — used only at module load, never per frame. */
function mix(a: string, b: string, t: number): string {
  const pick = (hex: string, at: number): number => parseInt(hex.slice(at, at + 2), 16);
  const to = (n: number): string => Math.round(n).toString(16).padStart(2, '0');
  const r = pick(a, 1) + (pick(b, 1) - pick(a, 1)) * t;
  const g = pick(a, 3) + (pick(b, 3) - pick(a, 3)) * t;
  const bl = pick(a, 5) + (pick(b, 5) - pick(a, 5)) * t;
  return `#${to(r)}${to(g)}${to(bl)}`;
}

const walls = (hex: string) => ({ wall: hex, wallShade: shade(hex), wallLight: light(hex) });
const roofOf = (hex: string) => ({ roofColor: hex, roofDark: shade(hex) });

/**
 * Every building on the route. The numbers are the *only* place either renderer
 * learns how big a bakery is, so the 3D block and the SVG block are one size.
 */
export const BUILDINGS: Record<BuildingId, BuildingSpec> = {
  station: {
    depth: 9.5,
    frontage: 12.4,
    height: 6.4,
    roof: 'flat',
    roofHeight: 0.9,
    ...walls('#E63B2E'),
    ...roofOf('#B9261C'),
    trim: '#FFF6E5',
    storeys: 2,
    sign: 'helmet',
    name: 'the fire station',
  },
  house: {
    depth: 7.2,
    frontage: 11.0,
    height: 3.9,
    roof: 'gable',
    roofHeight: 2.2,
    ...walls('#FFF6E5'),
    ...roofOf('#3E8FE0'),
    trim: '#8E5A26',
    storeys: 2,
    chimney: true,
    name: 'a house',
  },
  cottage: {
    depth: 6.6,
    frontage: 9.6,
    height: 3.4,
    roof: 'gable',
    roofHeight: 2,
    ...walls('#FFE7C2'),
    ...roofOf('#E63B2E'),
    trim: '#8E5A26',
    storeys: 1,
    chimney: true,
    name: 'a cottage',
  },
  apartments: {
    depth: 8,
    frontage: 12.4,
    height: 10.5,
    roof: 'flat',
    roofHeight: 0.8,
    ...walls('#FDEBCF'),
    ...roofOf('#8C94B3'),
    trim: '#3E8FE0',
    storeys: 5,
    name: 'the homes',
  },
  bakery: {
    depth: 7.8,
    frontage: 11.6,
    height: 4.4,
    roof: 'gable',
    roofHeight: 2.4,
    ...walls('#F5D9A6'),
    ...roofOf('#C44B3F'),
    trim: '#E63B2E',
    storeys: 1,
    sign: 'loaf',
    awning: true,
    chimney: true,
    name: "Rosa's bakery",
  },
  pizza: {
    depth: 7.8,
    frontage: 11.6,
    height: 4.6,
    roof: 'gable',
    roofHeight: 2.3,
    ...walls('#FFF6E5'),
    ...roofOf('#2E9E52'),
    trim: '#2E9E52',
    storeys: 1,
    sign: 'pizza',
    awning: true,
    chimney: true,
    name: 'the Pizza Piazza',
  },
  school: {
    depth: 9,
    frontage: 12.4,
    height: 5.4,
    roof: 'hip',
    roofHeight: 2.4,
    ...walls('#FBD9A5'),
    ...roofOf('#C7473B'),
    trim: '#FFC72C',
    storeys: 2,
    sign: 'bell',
    name: 'the school',
  },
  'clock-tower': {
    depth: 5.4,
    frontage: 5.6,
    height: 11.5,
    roof: 'pyramid',
    roofHeight: 3.4,
    ...walls('#F0E3C6'),
    ...roofOf('#4B6FB5'),
    trim: '#DCC79F',
    storeys: 2,
    sign: 'clock',
    name: 'the clock tower',
  },
  library: {
    depth: 8.4,
    frontage: 12.0,
    height: 6,
    roof: 'flat',
    roofHeight: 1.4,
    ...walls('#FDEBCF'),
    ...roofOf('#9B7BFF'),
    trim: '#9B7BFF',
    storeys: 2,
    sign: 'books',
    name: 'the library',
  },
  'pet-shop': {
    depth: 7,
    frontage: 10.6,
    height: 4.2,
    roof: 'gable',
    roofHeight: 2,
    ...walls('#FFFFFF'),
    ...roofOf('#4FC3F7'),
    trim: '#4FC3F7',
    storeys: 1,
    sign: 'paw',
    awning: true,
    name: 'the pet shop',
  },
  market: {
    depth: 7.4,
    frontage: 11.4,
    height: 3.2,
    roof: 'flat',
    roofHeight: 0.7,
    ...walls('#FDEBCF'),
    ...roofOf('#FF8A3D'),
    trim: '#FF8A3D',
    storeys: 1,
    sign: 'stall',
    awning: true,
    name: 'the market',
  },
};

export const BUILDING_IDS = Object.keys(BUILDINGS) as BuildingId[];

/**
 * The route through town, plot by plot. Two co-prime rows, so the pairing
 * across the street keeps changing while each side stays a street a child can
 * learn: the bakery is always three doors past the station.
 */
const LEFT_ROW: readonly BuildingId[] = [
  'station',
  'house',
  'bakery',
  'cottage',
  'apartments',
  'school',
  'house',
  'library',
  'market',
  'cottage',
  'pizza',
  'apartments',
  'house',
  'clock-tower',
  'cottage',
  'pet-shop',
];

const RIGHT_ROW: readonly BuildingId[] = [
  'house',
  'apartments',
  'cottage',
  'pizza',
  'house',
  'pet-shop',
  'apartments',
  'cottage',
  'bakery',
  'clock-tower',
  'house',
  'market',
  'school',
  'cottage',
  'library',
  'house',
  'apartments',
];

/* ------------------------------------------------------------------ */
/* Street furniture                                                     */
/* ------------------------------------------------------------------ */

export type FurnitureKind = 'lamp' | 'hydrant' | 'tree' | 'bench' | 'planter' | 'car' | 'van' | 'postbox';

export interface StreetProp {
  id: string;
  kind: FurnitureKind;
  /** −1 = left of the road, +1 = right */
  side: -1 | 1;
  /** signed distance from the centre line, in road units */
  x: number;
  /** road units in front of the truck */
  ahead: number;
  /** how far round its own axis it stands, radians (parked cars, benches) */
  turn: number;
}

export interface StreetBuilding {
  id: string;
  kind: BuildingId;
  side: -1 | 1;
  /** the near end of the plot, in road units ahead of the truck */
  ahead: number;
  /** how far along the road it runs */
  length: number;
}

export interface StreetJunction {
  id: string;
  /** the centre of the side street and of its zebra crossing */
  ahead: number;
  width: number;
}

export interface StreetFrame {
  buildings: StreetBuilding[];
  furniture: StreetProp[];
  junctions: StreetJunction[];
  /** where the drive ends, once the last gate is open */
  arrival: { ahead: number } | null;
}

export interface StreetOptions {
  /** which part of town this drive starts in */
  seed?: number;
  /** the building waiting at the end of the run */
  destination?: BuildingId;
  /** road units to the arrival, or null while the run is still going */
  finishAhead?: number | null;
}

/* ------------------------------------------------------------------ */

/** A stable 32-bit hash of two integers — the street's only source of variety. */
function hash(a: number, b: number): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x165667b1, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x27d4eb2f);
  return (h ^ (h >>> 13)) >>> 0;
}

const unit = (a: number, b: number): number => hash(a, b) / 4294967296;

const at = <T,>(row: readonly T[], index: number): T => {
  const n = row.length;
  const value = row[((index % n) + n) % n];
  /* rows are const and never empty; the fallback only satisfies the compiler */
  return value ?? (row[0] as T);
};

/** True when this block carries a crossroads instead of a garden gap. */
export const isJunctionBlock = (block: number): boolean => ((block % JUNCTION_EVERY) + JUNCTION_EVERY) % JUNCTION_EVERY === 2;

/**
 * Everything beside the road between the truck and `depth`.
 *
 * Cheap on purpose: it walks at most three blocks and allocates a few dozen
 * small objects, because both renderers call it once a frame.
 */
export function streetView(distance: number, depth: number, options: StreetOptions = {}): StreetFrame {
  const seed = options.seed ?? 0;
  const buildings: StreetBuilding[] = [];
  const furniture: StreetProp[] = [];
  const junctions: StreetJunction[] = [];

  const finish = options.finishAhead ?? null;
  const arrival = finish !== null && finish <= depth + BLOCK ? { ahead: finish } : null;

  const firstBlock = Math.floor((distance - BLOCK) / BLOCK);
  const lastBlock = Math.floor((distance + depth) / BLOCK);

  for (let block = firstBlock; block <= lastBlock; block += 1) {
    const start = block * BLOCK - distance;
    const junction = isJunctionBlock(block);

    /* ---- the two plots each side --------------------------------- */
    for (let slot = 0; slot < PLOTS.length; slot += 1) {
      const plot = PLOTS[slot];
      if (!plot) continue;
      const ahead = start + plot.at;
      if (ahead + plot.len < -6 || ahead > depth) continue;
      const index = block * PLOTS.length + slot + seed;

      for (const side of [-1, 1] as const) {
        let kind = side < 0 ? at(LEFT_ROW, index) : at(RIGHT_ROW, index);
        /* the call is waiting on the right, just past the arrival banner */
        if (
          options.destination &&
          finish !== null &&
          side > 0 &&
          finish + 3 >= ahead &&
          finish + 3 < ahead + plot.len
        ) {
          kind = options.destination;
        }
        buildings.push({ id: `b${block}:${slot}:${side}`, kind, side, ahead, length: plot.len });

        /* a tree or a planter in the front garden of a home */
        if (kind === 'house' || kind === 'cottage') {
          furniture.push({
            id: `t${block}:${slot}:${side}`,
            kind: 'tree',
            side,
            x: side * (BUILD_LINE - 0.9),
            ahead: ahead + plot.len * (0.3 + unit(index, side + 7) * 0.4),
            turn: unit(index, 3) * Math.PI,
          });
        } else if (unit(index, side + 11) > 0.45) {
          furniture.push({
            id: `p${block}:${slot}:${side}`,
            kind: unit(index, 5) > 0.5 ? 'bench' : 'planter',
            side,
            x: side * (ROAD_HALF + 1.5),
            ahead: ahead + plot.len * 0.5,
            turn: 0,
          });
        }
      }
    }

    /* ---- the gap: a side street, or gardens ----------------------- */
    const gapMid = start + GAP_AT + GAP_LEN / 2;
    if (junction) {
      if (gapMid > -8 && gapMid < depth + 8) {
        junctions.push({ id: `j${block}`, ahead: gapMid, width: GAP_LEN });
        /* a hydrant always stands on a corner, never mid-pavement */
        furniture.push({
          id: `h${block}`,
          kind: 'hydrant',
          side: hash(block, 21) % 2 === 0 ? -1 : 1,
          x: (hash(block, 21) % 2 === 0 ? -1 : 1) * (ROAD_HALF + 1.4),
          ahead: gapMid - GAP_LEN / 2 - 1.6,
          turn: 0,
        });
      }
    }

    /* ---- lamps: one each side, on the same rhythm as the plots ----- */
    for (const offset of [8, 30]) {
      const ahead = start + offset;
      if (ahead < -4 || ahead > depth) continue;
      const side: -1 | 1 = offset === 8 ? -1 : 1;
      furniture.push({
        id: `l${block}:${offset}`,
        kind: 'lamp',
        side,
        x: side * (ROAD_HALF + 1.7),
        ahead,
        turn: 0,
      });
    }

    /* ---- parked at the kerb, clear of every driving lane ---------- */
    if (!junction) {
      for (const offset of [11, 33]) {
        const ahead = start + offset;
        if (ahead < -4 || ahead > depth) continue;
        const roll = hash(block, offset);
        if (roll % 3 === 0) continue;
        const side: -1 | 1 = roll % 2 === 0 ? -1 : 1;
        furniture.push({
          id: `c${block}:${offset}`,
          kind: roll % 5 === 0 ? 'van' : 'car',
          side,
          x: side * (ROAD_HALF + 1.25),
          ahead,
          turn: 0,
        });
      }
      /* one post box per non-junction block, on the quieter side */
      const boxAhead = start + 20;
      if (boxAhead > -4 && boxAhead <= depth && hash(block, 33) % 2 === 0) {
        const side: -1 | 1 = hash(block, 34) % 2 === 0 ? -1 : 1;
        furniture.push({ id: `m${block}`, kind: 'postbox', side, x: side * (ROAD_HALF + 1.6), ahead: boxAhead, turn: 0 });
      }
    }
  }

  buildings.sort((a, b) => b.ahead - a.ahead);
  furniture.sort((a, b) => b.ahead - a.ahead);
  return { buildings, furniture, junctions, arrival };
}

/**
 * Which part of town a run drives through. Keeping this here means the two
 * renderers cannot disagree about it, and a mission to the bakery always
 * starts from the same corner.
 */
export function streetSeed(scene: string | undefined): number {
  if (!scene) return 0;
  let h = 0;
  for (let i = 0; i < scene.length; i += 1) h = (Math.imul(h, 31) + scene.charCodeAt(i)) | 0;
  return ((h % 8) + 8) % 8;
}

/** The scene a run is driving to, as a building on the street. */
export function destinationFor(scene: string | undefined): BuildingId | undefined {
  switch (scene) {
    case 'bakery':
      return 'bakery';
    case 'pizza':
      return 'pizza';
    case 'school':
      return 'school';
    case 'clock-tower':
      return 'clock-tower';
    case 'library':
      return 'library';
    case 'pet-shop':
      return 'pet-shop';
    case 'market':
      return 'market';
    case 'apartments':
      return 'apartments';
    case 'station-yard':
      return 'station';
    default:
      return undefined;
  }
}
