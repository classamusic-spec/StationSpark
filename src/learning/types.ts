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
  | 'money'
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
  | 'spelling'
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
  /** how much English support the translation card shows (defaults by age band) */
  support?: 'full' | 'some' | 'min';
}

/* ---- Market, workshop & spelling ----------------------------------- */

export interface MarketMoneyChallenge {
  kind: 'market-money';
  /** what the child is buying at the stall (drawn with VocabIcon) */
  item: VocabWord;
  /** price in whole coins */
  price: number;
  /** the coins lying in the purse, e.g. [1,1,1,5,5,10,10,25] */
  coins: number[];
  /** the distinct coin values in play */
  denominations: number[];
  /** true = the counter total must match the price exactly; false = counting up (paying over is fine) */
  exactChange: boolean;
  /** every distinct set of purse coins that adds up to the price */
  solutions: number[][];
  /** band C follow-up: "she paid with 50 — how much change?" */
  askChange?: { paid: number; change: number };
}

export type ShapePieceKind = 'square' | 'rect' | 'triangle' | 'semicircle' | 'circle' | 'quarter';

/** Only these shapes look different when you turn them, so only these rotate. */
export const rotatableShapes: readonly ShapePieceKind[] = ['triangle', 'semicircle', 'quarter'];

export interface ShapePiece {
  id: string;
  shape: ShapePieceKind;
  /** blueprint units — every blueprint is drawn inside a 100 × 100 box */
  w: number;
  h: number;
  x: number;
  y: number;
  /** the turn the piece must end at (non-rotatable shapes are always 0) */
  rotation: 0 | 90 | 180 | 270;
  color: string;
}

export interface ShapeBuilderChallenge {
  kind: 'shape-builder';
  blueprint: 'house' | 'truck' | 'ladder' | 'hydrant' | 'rocket' | 'tower' | 'boat';
  pieces: ShapePiece[];
  /** band B/C: pieces arrive turned the wrong way and have to be tapped round */
  needsRotation: boolean;
  /** band C: "how many triangles did you use?" */
  askCount?: { shape: ShapePieceKind; count: number };
}

export interface WordBuilderChallenge {
  kind: 'word-builder';
  word: VocabWord;
  /** the language being spelled */
  lang: 'en' | 'es';
  /** the answer, one upper-case letter per slot */
  letters: string[];
  /** tray tiles: the letters still to place plus 0–2 distractors, shuffled */
  tiles: string[];
  /** how many leading letters start already in their slots */
  prefilled: number;
}

/* ---- The training road --------------------------------------------- */

/** The road is always three lanes wide; the child only ever chooses one of them. */
export const truckRunLanes = 3;

/** What one `truck-run` road is asking about. A run keeps to one topic. */
export type TruckRunTopic =
  | 'number-word' // A: "Which gate says seven?"
  | 'count-on' // A: "What comes next? 8, 9, 10"
  | 'add-sub' // B: + and − within 20
  | 'sight-word' // B: "Which word says stop?"
  | 'times-divide' // C: × and ÷
  | 'elapsed' // C: "3:15 to 3:45 — how long?"
  | 'spanish'; // C: Spanish word → meaning

/** Everything that can stand on the road. Nothing here can damage the truck. */
export type TruckRunProp =
  | 'pothole'
  | 'cone'
  | 'hose'
  | 'puddle'
  | 'car'
  | 'ramp' // jump over whatever is next
  | 'boost'; // a burst of speed and siren

export interface TruckRunObstacle {
  kind: TruckRunProp;
  /** 0 = left, 1 = middle, 2 = right */
  lane: number;
  /** distance from the START OF ITS SEGMENT, in road units */
  at: number;
}

export interface TruckRunQuestion {
  /** the task, short enough to live in the TaskBar */
  prompt: string;
  promptEs?: string;
  /** one label per lane, short enough to read at speed (≤ 8 characters) */
  options: string[];
  /** the label that opens the gate — appears in `options` exactly once */
  answer: string;
  /** Captain Bea's hint after the second miss; it should give the answer away */
  hint: string;
  hintEs?: string;
}

/** One stretch of road: hazard rows, then a set of three answer gates. */
export interface TruckRunSegment {
  /** total length of the stretch, gates included */
  length: number;
  obstacles: TruckRunObstacle[];
  /** distance from the segment start to the gates */
  gateAt: number;
}

/**
 * TRUCK RUN — the driving station. The truck drives itself; the child steers
 * between three lanes, dodges what the road throws at them, and answers by
 * driving through one of three gates. Segments repeat until every question has
 * been answered, so a wrong gate costs a moment, never the run.
 */
export interface TruckRunChallenge {
  kind: 'truck-run';
  topic: TruckRunTopic;
  questions: TruckRunQuestion[];
  segments: TruckRunSegment[];
  /** road speed before boosts, in road units per second */
  speed: number;
  /** seconds to move one lane across */
  laneChange: number;
  /** how far apart hazard rows stand — the room a child has to change lane */
  rowGap: number;
  /** the victory straight after the last gate */
  finish: number;
  /** how many hazards a child may clip before Captain Bea offers driving advice */
  bumpBudget: number;
  scene?: SceneId;
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

/**
 * SOUP POT — the pot cooks in an ORDER, not a set.
 *
 * `count-ingredients` asks "is the right stuff in the bowl?" and does not care
 * how you got there. A pot does: the onions go in before the potatoes, and you
 * put in two of them before you move on. So `steps` is a sequence, and the
 * child works through it one entry at a time.
 */
export interface SoupPotChallenge {
  kind: 'soup-pot';
  /** what goes in the pot, in the order the recipe says */
  steps: { item: VocabWord; count: number }[];
  /** food on the counter that belongs to some other dish */
  extras: VocabWord[];
  /** Captain Bea reads the order in Spanish first */
  spokenEs?: boolean;
  /** band C follow-up: "how many pieces went in altogether?" = the sum of the counts */
  askTotal?: number;
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
  | MarketMoneyChallenge
  | ShapeBuilderChallenge
  | WordBuilderChallenge
  | TruckRunChallenge
  | PizzaFractionsChallenge
  | MeasurePourChallenge
  | CountIngredientsChallenge
  | DivideShareChallenge
  | RecipeScaleChallenge
  | SoupPotChallenge;

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
  'market-money': ['money', 'addition', 'subtraction', 'counting'],
  'shape-builder': ['geometry', 'spatial'],
  'word-builder': ['spelling', 'reading-words', 'vocabulary-en', 'vocabulary-es'],
  /* the band's own subject is added per run via `session.complete(topicSkills)` */
  'truck-run': ['spatial', 'number-recognition', 'reading-words'],
  'pizza-fractions': ['fraction-half', 'fraction-quarter', 'division', 'geometry'],
  'measure-pour': ['measurement', 'fraction-quarter'],
  'count-ingredients': ['counting', 'vocabulary-es'],
  'divide-share': ['division'],
  'recipe-scale': ['multiplication', 'fraction-equivalent'],
  'soup-pot': ['sequencing', 'counting', 'addition', 'vocabulary-es'],
};
