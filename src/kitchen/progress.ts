/**
 * Which recipe cards look "fresh", "next up" or "resting" on the kitchen shelf.
 * Cosmetic only: EVERY recipe stays tappable and playable — the look is a gentle
 * "here's where you were", never a gate. Pure, testable.
 */
import type { BadgeId, RecipeDef } from '@/content/types';

export type RecipeCardState = 'cooked' | 'open' | 'resting';

export interface RecipeShelfEntry {
  recipe: RecipeDef;
  state: RecipeCardState;
  index: number;
}

/**
 * A recipe is `cooked` once it is in progress.recipes, `open` when it is the
 * next one up the ladder (or its badge is already earned), and `resting`
 * otherwise — dimmed with a soft lock, but still playable.
 */
export function recipeCardState(
  recipe: RecipeDef,
  index: number,
  cookedIds: readonly string[],
  badges: readonly BadgeId[],
): RecipeCardState {
  if (cookedIds.includes(recipe.id)) return 'cooked';
  if (recipe.badge && badges.includes(recipe.badge)) return 'open';
  const cookedCount = cookedIds.length;
  return index <= cookedCount + 1 ? 'open' : 'resting';
}

export function buildShelf(
  recipes: readonly RecipeDef[],
  cookedIds: readonly string[],
  badges: readonly BadgeId[],
): RecipeShelfEntry[] {
  return recipes.map((recipe, index) => ({ recipe, index, state: recipeCardState(recipe, index, cookedIds, badges) }));
}

/** Stars for a whole recipe = the average of its steps', rounded, never 0. */
export function recipeStars(stepStars: readonly number[]): 1 | 2 | 3 {
  if (stepStars.length === 0) return 3;
  const avg = stepStars.reduce((a, b) => a + b, 0) / stepStars.length;
  const rounded = Math.round(avg);
  return (rounded < 1 ? 1 : rounded > 3 ? 3 : rounded) as 1 | 2 | 3;
}

/** Tiny stable string hash — seeds a recipe's challenge generation. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 1000000);
}
