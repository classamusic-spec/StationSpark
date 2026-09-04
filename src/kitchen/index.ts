/**
 * THE FIREHOUSE KITCHEN.
 *
 * `KitchenRunner` is the public entry point for mission `{ type: 'kitchen' }`
 * beats — the MissionRunner imports it from `@/kitchen`:
 *
 *   <KitchenRunner recipeId={beat.recipe} embedded onDone={(results) => …} />
 *
 * Kitchen mini-games register themselves through `@/kitchen/games`, which the
 * mini-game registry merges — import that module directly, never through here.
 */
export { KitchenRunner, type KitchenRunnerProps } from './KitchenRunner';
export { KitchenScreen, KITCHEN_SAFETY_LINE } from './KitchenScreen';
export { RecipeScreen } from './RecipeScreen';
export { KitchenBackdrop } from './KitchenBackdrop';
export { recipeCardState, buildShelf, recipeStars, type RecipeCardState } from './progress';
