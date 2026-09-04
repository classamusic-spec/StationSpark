/**
 * BADGES — shield-shaped keepsakes. Every badge is earnable by playing; none of
 * them can be bought, and none of them are ever taken away.
 *
 * `color` is a palette token from src/theme/colors.ts, `icon` is drawn by <BadgeArt/>:
 *   flame star chef-hat ladder hose book speech-bubble map pattern hands heart
 *   cat bread pizza picnic school broom clock numbers
 */
import { palette } from '@/theme/colors';
import { vocabulary } from '@/learning/vocabulary';
import type { BadgeDef, BadgeId } from './types';

// Every word in the bank is bilingual, so learning a word is learning Spanish too.
const spanishWordIds = new Set(vocabulary.filter((w) => w.es.length > 0).map((w) => w.id));

export const badges: BadgeDef[] = [
  {
    id: 'first-shift',
    name: 'First Shift',
    nameEs: 'Primer turno',
    description: 'You finished your very first call. Welcome to the crew!',
    color: palette.engineRed,
    icon: 'flame',
  },
  {
    id: 'number-navigator',
    name: 'Number Navigator',
    nameEs: 'Navegante de números',
    description: 'Five number games solved. Numbers do not stand a chance.',
    color: palette.safetyYellow,
    icon: 'numbers',
  },
  {
    id: 'fraction-firefighter',
    name: 'Fraction Firefighter',
    nameEs: 'Bombero de fracciones',
    description: 'Halves, quarters, eighths — you split them all fairly.',
    color: palette.orange,
    icon: 'pizza',
  },
  {
    id: 'hose-hero',
    name: 'Hose Hero',
    nameEs: 'Héroe de la manguera',
    description: 'Three careful sprays, three happy buildings.',
    color: palette.waterCyan,
    icon: 'hose',
  },
  {
    id: 'word-watcher',
    name: 'Word Watcher',
    nameEs: 'Guardián de palabras',
    description: 'Twenty new words spotted, read and remembered.',
    color: palette.pink,
    icon: 'book',
  },
  {
    id: 'spanish-speaker',
    name: 'Spanish Speaker',
    nameEs: 'Hablante de español',
    description: 'Ten Spanish words learned. ¡Muy bien!',
    color: palette.purple,
    icon: 'speech-bubble',
  },
  {
    id: 'recipe-rescuer',
    name: 'Recipe Rescuer',
    nameEs: 'Rescatador de recetas',
    description: 'Three recipes cooked with the crew.',
    color: palette.orangeDark,
    icon: 'chef-hat',
  },
  {
    id: 'kitchen-pro',
    name: 'Kitchen Pro',
    nameEs: 'Chef del cuartel',
    description: 'Five recipes! The station eats well because of you.',
    color: palette.gold,
    icon: 'chef-hat',
  },
  {
    id: 'map-master',
    name: 'Map Master',
    nameEs: 'Maestro del mapa',
    description: 'Three routes planned without one wrong turn.',
    color: palette.leafGreen,
    icon: 'map',
  },
  {
    id: 'pattern-pro',
    name: 'Pattern Pro',
    nameEs: 'Experto en patrones',
    description: 'You can see what comes next. Every time.',
    color: palette.grass,
    icon: 'pattern',
  },
  {
    id: 'team-player',
    name: 'Team Player',
    nameEs: 'Buen compañero',
    description: 'Three whole shifts with the crew. Teamwork!',
    color: palette.waterCyanDark,
    icon: 'hands',
  },
  {
    id: 'community-helper',
    name: 'Community Helper',
    nameEs: 'Ayudante de la comunidad',
    description: 'Every neighbourhood call answered. Spark City thanks you.',
    color: palette.engineRedDark,
    icon: 'heart',
  },
  {
    id: 'ladder-legend',
    name: 'Ladder Legend',
    nameEs: 'Leyenda de la escalera',
    description: 'Three ladders built rung by rung, all the way up.',
    color: palette.goldDark,
    icon: 'ladder',
  },
  {
    id: 'time-keeper',
    name: 'Time Keeper',
    nameEs: 'Guardián del tiempo',
    description: 'Three clocks read right. The crew is never late.',
    color: palette.skyTop,
    icon: 'clock',
  },
  {
    id: 'clock-tower-cat',
    name: 'Clock Tower Cat',
    nameEs: 'Gato de la torre',
    description: 'Luna the library cat is home safe, thanks to you.',
    color: palette.gold,
    icon: 'cat',
  },
  {
    id: 'bakery-bell',
    name: 'Bakery Bell',
    nameEs: 'Campana de la panadería',
    description: 'Rosa opened on time and the bread was perfect.',
    color: palette.wood,
    icon: 'bread',
  },
  {
    id: 'pizza-rescue',
    name: 'Pizza Rescue',
    nameEs: 'Rescate de pizza',
    description: 'Gino served every pizza — and you cut them fairly.',
    color: palette.engineRed,
    icon: 'pizza',
  },
  {
    id: 'park-picnic',
    name: 'Park Picnic',
    nameEs: 'Picnic en el parque',
    description: 'The picnic was saved, sorted and very tasty.',
    color: palette.grassDark,
    icon: 'picnic',
  },
  {
    id: 'school-fair',
    name: 'School Fair',
    nameEs: 'Feria escolar',
    description: 'You got the crew to the fair right on time.',
    color: palette.waterCyanDark,
    icon: 'school',
  },
  {
    id: 'clean-up-crew',
    name: 'Clean-Up Crew',
    nameEs: 'Equipo de limpieza',
    description: 'The pond sparkles and the ducklings are back home.',
    color: palette.leafGreenDark,
    icon: 'broom',
  },
];

const badgeMap = new Map(badges.map((b) => [b.id, b]));

export function badgeById(id: BadgeId): BadgeDef {
  return badgeMap.get(id) ?? (badges[0] as BadgeDef);
}

/* ------------------------------------------------------------------ */
/* Skill badges — earned by playing, checked after every game          */
/* ------------------------------------------------------------------ */

/** Structurally compatible with `Progress` in the game store. */
export interface BadgeProgressLike {
  missions: Record<string, { stars: number }>;
  badges: readonly BadgeId[];
  words: readonly string[];
  recipes: readonly string[];
  gamesPlayed: Partial<Record<string, number>>;
  shiftDays: readonly string[];
}

/** Games that count as "number games" for Number Navigator. */
export const numberGameKinds = ['number-ladder', 'hydrant-match', 'ladder-builder', 'build-barrier', 'equipment-check'];
/** Games that count as "fraction games" for Fraction Firefighter. */
export const fractionGameKinds = ['water-tank', 'pizza-fractions', 'measure-pour'];
/** Games that count as "ladder games" for Ladder Legend. */
export const ladderGameKinds = ['ladder-builder', 'number-ladder'];

const played = (progress: BadgeProgressLike, kinds: readonly string[]): number =>
  kinds.reduce((total, kind) => total + (progress.gamesPlayed[kind] ?? 0), 0);

/** Total missions in the MVP; community-helper needs all of them. */
export const TOTAL_MISSIONS = 6;

/**
 * Every skill badge the child has earned right now. Pure — call it after
 * recordMiniGame / completeMission and award whatever is new.
 */
export function earnedSkillBadges(progress: BadgeProgressLike): BadgeId[] {
  const out: BadgeId[] = [];
  const missionCount = Object.keys(progress.missions).length;
  const spanishWords = progress.words.filter((id) => spanishWordIds.has(id)).length;

  if (missionCount >= 1) out.push('first-shift');
  if (missionCount >= TOTAL_MISSIONS) out.push('community-helper');
  if (played(progress, numberGameKinds) >= 5) out.push('number-navigator');
  if (played(progress, fractionGameKinds) >= 3) out.push('fraction-firefighter');
  if (played(progress, ladderGameKinds) >= 3) out.push('ladder-legend');
  if ((progress.gamesPlayed['hose-hero'] ?? 0) >= 3) out.push('hose-hero');
  if ((progress.gamesPlayed['rescue-route'] ?? 0) >= 3) out.push('map-master');
  if ((progress.gamesPlayed['spray-pattern'] ?? 0) >= 3) out.push('pattern-pro');
  if ((progress.gamesPlayed['clock-watch'] ?? 0) >= 3) out.push('time-keeper');
  if (progress.words.length >= 20) out.push('word-watcher');
  if (spanishWords >= 10) out.push('spanish-speaker');
  if (progress.shiftDays.length >= 3) out.push('team-player');
  if (progress.recipes.length >= 3) out.push('recipe-rescuer');
  if (progress.recipes.length >= 5) out.push('kitchen-pro');

  return out;
}

/** Badges earned now that were not held before — what the reward screen shows. */
export function newlyEarnedBadges(progress: BadgeProgressLike): BadgeId[] {
  const held = new Set(progress.badges);
  return earnedSkillBadges(progress).filter((id) => !held.has(id));
}
