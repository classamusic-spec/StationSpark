/**
 * LEARNING CONTRACT
 * -----------------
 * Pure data. No React here. Every mini-game receives one `Challenge` and the
 * learning engine (src/learning/generators) produces them per AgeBand.
 *
 * AgeBand:  A = 5–6   B = 7–8   C = 9–10
 */
import type { Rng } from '@/utils/rng';

export type AgeBand = 'A' | 'B' | 'C';

export type SkillTag =
  | 'counting'
  | 'number-recognition'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'fraction-half'
  | 'fraction-quarter'
  | 'fraction-equivalent'
  | 'measurement'
  | 'time'
  | 'patterns'
  | 'sorting'
  | 'geometry'
  | 'spatial'
  | 'sequencing'
  | 'comparison'
  | 'estimation'
  | 'reading-words'
  | 'reading-sentences'
  | 'reading-directions'
  | 'vocabulary-en'
  | 'vocabulary-es'
  | 'listening-es'
  | 'teamwork';

export type Subject = 'math' | 'reading' | 'english' | 'spanish' | 'logic' | 'teamwork' | 'cooking';

export interface Fraction {
  num: number;
  den: number;
}

export interface GridPos {
  row: number;
  col: number;
}

/** Location facades a mini-game can be dressed in. */
export type SceneId =
  | 'bakery'
  | 'pizza'
  | 'school'
  | 'park'
  | 'clock-tower'
  | 'apartments'
  | 'pet-shop'
  | 'library'
  | 'market'
  | 'station-yard';

export type EquipmentId =
  | 'hose'
  | 'cone'
  | 'first-aid'
  | 'flashlight'
  | 'ladder'
  | 'axe'
  | 'bucket'
  | 'helmet'
  | 'radio'
  | 'boots'
  | 'extinguisher'
  | 'rope';

export type AnimalId = 'kitten' | 'puppy' | 'bunny' | 'duckling' | 'turtle';

export type SignalId = 'bell' | 'truck' | 'water' | 'check' | 'ladder' | 'hose' | 'map' | 'radio';

export type RouteCommand = 'forward' | 'left' | 'right' | 'turn-around';

export type Heading = 'N' | 'E' | 'S' | 'W';

export interface VocabWord {
  id: string;
  en: string;
  es: string;
  /** emoji-ish fallback glyph; real art comes from the VocabIcon component */
  icon: string;
  category: 'equipment' | 'food' | 'colors' | 'numbers' | 'places' | 'actions' | 'people' | 'animals';
}

/* ------------------------------------------------------------------ */
/* Challenge union — one variant per mini-game                          */
/* ------------------------------------------------------------------ */

export interface HoseHeroChallenge {
  kind: 'hose-hero';
  scene: SceneId;
  totalFlames: number;
  /** flames already out at start (subtraction framing: "3 out, how many remain?") */
  alreadyOut: number;
  /** Optional fraction framing for older kids: extinguish ½ of the windows, then ¼ */
  fractionTargets?: Fraction[];
  /** Window grid: rows x cols; flames are placed by index */
  grid: { rows: number; cols: number };
  flameSlots: number[];
  /** Ask the child a quick count question mid-game ("how many remain?") */
  askRemainingAt?: number;
}

export interface WaterTankChallenge {
  kind: 'water-tank';
  target: Fraction;
  /** gauge tick labels shown, e.g. quarters or halves */
  ticks: 2 | 4 | 8;
  /** each pump press adds this much */
  pumpStep: Fraction;
  /** can overflow? if false, we clamp and gently wobble */
  allowOverflow: boolean;
}

export interface LadderBuilderChallenge {
  kind: 'ladder-builder';
  target: number;
  pieces: number[];
  /** All valid combos (subsets of pieces indices that sum to target) */
  solutions: number[][];
  /** Same combos expressed as indices into `pieces` (generators fill both). */
  solutionIndices?: number[][];
  /** For band C: ask for two different combos */
  requiredSolutions: 1 | 2;
  animal: AnimalId;
}

export interface NumberLadderChallenge {
  kind: 'number-ladder';
  start: number;
  target: number;
  min: number;
  max: number;
  /** allowed jump sizes on the buttons */
  jumps: number[];
}

export interface DispatchDecoderChallenge {
  kind: 'dispatch-decoder';
  mode: 'address' | 'location' | 'sentence';
  /** Radio message shown/spoken */
  message: string;
  messageEs?: string;
  correct: string;
  options: string[];
  /** For 'location' mode: which map building matches */
  scene?: SceneId;
}

export interface EquipmentCheckChallenge {
  kind: 'equipment-check';
  items: { id: EquipmentId; need: number; alreadyPacked: number }[];
  /** decoy items on the table that should NOT be packed */
  decoys: EquipmentId[];
}

export interface GearSortChallenge {
  kind: 'gear-sort';
  by: 'color' | 'shape' | 'size' | 'category';
  bins: { id: string; label: string; labelEs?: string; color?: string }[];
  items: {
    id: string;
    bin: string;
    equipment: EquipmentId;
    color?: string;
    size?: 'S' | 'M' | 'L';
    /** Display overrides for themed sorts (e.g. recycling day); fall back to `equipment`. */
    label?: string;
    labelEs?: string;
    icon?: string;
  }[];
}

export type HosePiece = 'straight' | 'corner';

export interface HosePathChallenge {
  kind: 'hose-path';
  grid: { rows: number; cols: number };
  start: GridPos;
  end: GridPos;
  blocked: GridPos[];
  /** pieces given to the player (rotation is the player's job) */
  pieces: HosePiece[];
}

export interface RescueRouteChallenge {
  kind: 'rescue-route';
  grid: { rows: number; cols: number };
  start: GridPos;
  startHeading: Heading;
  goal: GridPos;
  goalScene: SceneId;
  blocked: GridPos[];
  maxCommands: number;
  /** For band B/C: optional two-route comparison ("which is shorter?") */
  compareRoutes?: { a: number; b: number; shorter: 'a' | 'b' };
  streetNames?: { row: number; name: string }[];
}

export interface HydrantMatchChallenge {
  kind: 'hydrant-match';
  /** e.g. "12" or "3 × 4" */
  label: string;
  correct: number;
  options: number[];
}

export interface SprayPatternChallenge {
  kind: 'spray-pattern';
  /** visible sequence, last one hidden as '?' */
  sequence: ('fire' | 'water' | 'cone' | 'star')[];
  answer: 'fire' | 'water' | 'cone' | 'star';
  options: ('fire' | 'water' | 'cone' | 'star')[];
}

export interface ClockWatchChallenge {
  kind: 'clock-watch';
  start: { h: number; m: number };
  target: { h: number; m: number };
  /** minute step the child can rotate by */
  step: 5 | 15 | 30;
  event: string;
}

export interface RescuePetsChallenge {
  kind: 'rescue-pets';
  animal: AnimalId;
  total: number;
  alreadySafe: number;
  scene: SceneId;
}

export interface BuildBarrierChallenge {
  kind: 'build-barrier';
  target: number;
  pieces: number[];
  /** Combos of piece VALUES that sum to `target` (see also `solutionIndices`). */
  solutions: number[][];
  /** Same combos expressed as indices into `pieces` (generators fill both). */
  solutionIndices?: number[][];
}

export interface SignalsChallenge {
  kind: 'signals';
  /** correct order */
  steps: SignalId[];
  /** shuffled presentation */
  shuffled: SignalId[];
}

export interface VocabTapChallenge {
  kind: 'vocab-tap';
  /** language the prompt is spoken in */
  promptLang: 'en' | 'es';
  word: VocabWord;
  options: VocabWord[];
  /** how much translation support to show */
  support: 'full' | 'some' | 'min';
}

export interface ListenCountChallenge {
  kind: 'listen-count';
  phraseEs: string;
  phraseEn: string;
  count: number;
  item: VocabWord;
  maxOnScreen: number;
}

/* ---- Kitchen ------------------------------------------------------- */

export type ToppingId = 'cheese' | 'tomato' | 'pepper' | 'mushroom' | 'olive' | 'basil';

export interface PizzaFractionsChallenge {
  kind: 'pizza-fractions';
  /** e.g. [{cheese, 1/2}, {mushroom, 1/4}, {pepper, 1/4}] */
  toppings: { topping: ToppingId; fraction: Fraction }[];
  cutInto: number;
  shareAmong: number;
  /** slices each person gets = cutInto / shareAmong */
  each: number;
}

export interface MeasurePourChallenge {
  kind: 'measure-pour';
  ingredient: VocabWord;
  target: Fraction;
  unit: 'cup' | 'spoon';
  ticks: 2 | 4;
  step: Fraction;
}

export interface CountIngredientsChallenge {
  kind: 'count-ingredients';
  /** "3 strawberries, 2 bananas" */
  needs: { item: VocabWord; count: number }[];
  extras: VocabWord[];
  spokenEs?: boolean;
}

export interface DivideShareChallenge {
  kind: 'divide-share';
  item: VocabWord;
  total: number;
  among: number;
  each: number;
}

export interface RecipeScaleChallenge {
  kind: 'recipe-scale';
  serves: number;
  eating: number;
  lines: { item: VocabWord; amount: number; scaled: number }[];
}

export type Challenge =
  | HoseHeroChallenge
  | WaterTankChallenge
  | LadderBuilderChallenge
  | NumberLadderChallenge
  | DispatchDecoderChallenge
  | EquipmentCheckChallenge
  | GearSortChallenge
  | HosePathChallenge
  | RescueRouteChallenge
  | HydrantMatchChallenge
  | SprayPatternChallenge
  | ClockWatchChallenge
  | RescuePetsChallenge
  | BuildBarrierChallenge
  | SignalsChallenge
  | VocabTapChallenge
  | ListenCountChallenge
  | PizzaFractionsChallenge
  | MeasurePourChallenge
  | CountIngredientsChallenge
  | DivideShareChallenge
  | RecipeScaleChallenge;

export type ChallengeKind = Challenge['kind'];
export type ChallengeOf<K extends ChallengeKind> = Extract<Challenge, { kind: K }>;

export interface GeneratorContext {
  ageBand: AgeBand;
  rng: Rng;
  /** Optional per-skill mastery 0..1 so generators can nudge difficulty */
  mastery?: Partial<Record<SkillTag, number>>;
  /** Preferred scene dressing (mission location) */
  scene?: SceneId;
}

export type ChallengeGenerator<K extends ChallengeKind> = (ctx: GeneratorContext) => ChallengeOf<K>;

/** Which skills a challenge exercises, for mastery tracking & recap. */
export const challengeSkills: Record<ChallengeKind, SkillTag[]> = {
  'hose-hero': ['counting', 'subtraction', 'fraction-half'],
  'water-tank': ['fraction-quarter', 'measurement'],
  'ladder-builder': ['addition'],
  'number-ladder': ['addition', 'subtraction', 'number-recognition'],
  'dispatch-decoder': ['reading-words', 'number-recognition', 'reading-sentences'],
  'equipment-check': ['counting', 'subtraction'],
  'gear-sort': ['sorting', 'comparison'],
  'hose-path': ['spatial', 'geometry'],
  'rescue-route': ['sequencing', 'reading-directions', 'spatial', 'comparison'],
  'hydrant-match': ['number-recognition', 'multiplication'],
  'spray-pattern': ['patterns'],
  'clock-watch': ['time'],
  'rescue-pets': ['counting', 'subtraction'],
  'build-barrier': ['addition', 'geometry'],
  signals: ['sequencing'],
  'vocab-tap': ['vocabulary-en', 'vocabulary-es'],
  'listen-count': ['listening-es', 'counting'],
  'pizza-fractions': ['fraction-half', 'fraction-quarter', 'division', 'geometry'],
  'measure-pour': ['measurement', 'fraction-quarter'],
  'count-ingredients': ['counting', 'vocabulary-es'],
  'divide-share': ['division'],
  'recipe-scale': ['multiplication', 'fraction-equivalent'],
};
