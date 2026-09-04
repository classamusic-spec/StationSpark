/**
 * ADAPTIVITY — how the station decides what to give the child next.
 *
 * Nothing here punishes: mastery only nudges numbers up or down INSIDE the age
 * band. A child never leaves their band because of a wobbly day.
 */
import type { GeneratorContext, SkillTag, Subject } from './types';

/** Structurally compatible with `Progress['mastery']` in the game store. */
export interface MasteryEntry {
  attempts: number;
  correct: number;
}
export type MasteryMap = Partial<Record<SkillTag, MasteryEntry>>;

/** Anything with skills — `MiniGameResult` satisfies this. */
export interface SkillResultLike {
  skills: SkillTag[];
}

/** How many attempts before we trust the number (below this we lean neutral). */
const CONFIDENCE = 6;
const NEUTRAL = 0.5;

/**
 * 0..1 mastery for one skill. Unseen skills read 0.5 ("we don't know yet") and
 * thin evidence is pulled toward neutral so two lucky taps never spike difficulty.
 */
export function masteryFor(progressMastery: MasteryMap | undefined, skill: SkillTag): number {
  const entry = progressMastery?.[skill];
  if (!entry || entry.attempts <= 0) return NEUTRAL;
  const raw = Math.max(0, Math.min(1, entry.correct / entry.attempts));
  const trust = Math.min(1, entry.attempts / CONFIDENCE);
  return clamp01(NEUTRAL + (raw - NEUTRAL) * trust);
}

export const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Whole-map version, ready to drop into `GeneratorContext.mastery`. */
export function masteryVector(progressMastery: MasteryMap | undefined): Partial<Record<SkillTag, number>> {
  const out: Partial<Record<SkillTag, number>> = {};
  for (const key of Object.keys(progressMastery ?? {}) as SkillTag[]) {
    out[key] = masteryFor(progressMastery, key);
  }
  return out;
}

/** −1 = gentler numbers, 0 = as written, +1 = a little stretchier. */
export type BandAdjustment = -1 | 0 | 1;

export function pickBandAdjustment(mastery: number): BandAdjustment {
  if (mastery < 0.4) return -1;
  if (mastery > 0.8) return 1;
  return 0;
}

/** Average the given skills from a generator context, then nudge. */
export function masteryAdjustment(ctx: GeneratorContext, ...skills: SkillTag[]): BandAdjustment {
  if (skills.length === 0 || !ctx.mastery) return 0;
  let sum = 0;
  let seen = 0;
  for (const skill of skills) {
    const value = ctx.mastery[skill];
    if (typeof value === 'number') {
      sum += clamp01(value);
      seen += 1;
    }
  }
  if (seen === 0) return 0;
  return pickBandAdjustment(sum / seen);
}

/** Shift an inclusive [min,max] range without ever inverting or going below `floor`. */
export function adjustRange(range: readonly [number, number], adj: BandAdjustment, floor = 1): [number, number] {
  const [lo, hi] = range;
  if (adj === 0) return [Math.max(floor, lo), Math.max(Math.max(floor, lo), hi)];
  const span = Math.max(1, Math.round((hi - lo) / 2));
  const nextLo = Math.max(floor, lo + adj * span);
  const nextHi = Math.max(nextLo, hi + adj * span);
  return [nextLo, nextHi];
}

/* ------------------------------------------------------------------ */
/* Skill → subject → kid-facing label                                  */
/* ------------------------------------------------------------------ */

const skillSubjects: Record<SkillTag, Subject> = {
  counting: 'math',
  'number-recognition': 'math',
  addition: 'math',
  subtraction: 'math',
  multiplication: 'math',
  division: 'math',
  'fraction-half': 'math',
  'fraction-quarter': 'math',
  'fraction-equivalent': 'math',
  measurement: 'math',
  time: 'math',
  comparison: 'math',
  estimation: 'math',
  geometry: 'math',
  patterns: 'logic',
  sorting: 'logic',
  spatial: 'logic',
  sequencing: 'logic',
  'reading-words': 'reading',
  'reading-sentences': 'reading',
  'reading-directions': 'reading',
  'vocabulary-en': 'english',
  'vocabulary-es': 'spanish',
  'listening-es': 'spanish',
  teamwork: 'teamwork',
};

export function subjectForSkill(skill: SkillTag): Subject {
  return skillSubjects[skill];
}

/** Stable display order for recap chips. */
export const subjectOrder: readonly Subject[] = ['math', 'reading', 'english', 'spanish', 'logic', 'teamwork', 'cooking'];

/** The subjects a child actually practised, in a stable order. */
export function recapSubjects(results: readonly SkillResultLike[]): Subject[] {
  const found = new Set<Subject>();
  for (const result of results) for (const skill of result.skills) found.add(subjectForSkill(skill));
  return subjectOrder.filter((s) => found.has(s));
}

const labels: Record<SkillTag, { en: string; es: string }> = {
  counting: { en: 'Counting', es: 'Contar' },
  'number-recognition': { en: 'Spotting numbers', es: 'Reconocer números' },
  addition: { en: 'Adding up', es: 'Sumar' },
  subtraction: { en: 'Taking away', es: 'Restar' },
  multiplication: { en: 'Groups of', es: 'Multiplicar' },
  division: { en: 'Sharing fairly', es: 'Repartir' },
  'fraction-half': { en: 'Halves', es: 'Mitades' },
  'fraction-quarter': { en: 'Quarters', es: 'Cuartos' },
  'fraction-equivalent': { en: 'Matching fractions', es: 'Fracciones iguales' },
  measurement: { en: 'Measuring', es: 'Medir' },
  time: { en: 'Telling time', es: 'La hora' },
  patterns: { en: 'Patterns', es: 'Patrones' },
  sorting: { en: 'Sorting', es: 'Clasificar' },
  geometry: { en: 'Shapes', es: 'Formas' },
  spatial: { en: 'Space smarts', es: 'Ubicarse' },
  sequencing: { en: 'Order of steps', es: 'Poner en orden' },
  comparison: { en: 'Comparing', es: 'Comparar' },
  estimation: { en: 'Good guessing', es: 'Estimar' },
  'reading-words': { en: 'Reading words', es: 'Leer palabras' },
  'reading-sentences': { en: 'Reading sentences', es: 'Leer oraciones' },
  'reading-directions': { en: 'Following directions', es: 'Seguir instrucciones' },
  'vocabulary-en': { en: 'English words', es: 'Palabras en inglés' },
  'vocabulary-es': { en: 'Spanish words', es: 'Palabras en español' },
  'listening-es': { en: 'Listening in Spanish', es: 'Escuchar en español' },
  teamwork: { en: 'Teamwork', es: 'Trabajo en equipo' },
};

/** Kid-friendly name for a skill, in both languages. */
export function skillLabel(skill: SkillTag): { en: string; es: string } {
  return labels[skill];
}

/** Skills the child practised, most-used first — for the Grown-Ups screen. */
export function skillTally(results: readonly SkillResultLike[]): { skill: SkillTag; count: number }[] {
  const counts = new Map<SkillTag, number>();
  for (const result of results) {
    for (const skill of result.skills) counts.set(skill, (counts.get(skill) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
}
