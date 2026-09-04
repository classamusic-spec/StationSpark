import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { RecipeId } from '@/content/types';
import { badgesForRecipes, recipeById } from '@/content/recipes';
import type { MiniGameResult } from '@/minigames/types';
import { useGame } from '@/state/store';
import { spacing } from '@/theme';
import { ScreenFrame } from '@/ui/ScreenFrame';
import { TopBar } from '@/ui/TopBar';
import { KitchenBackdrop } from './KitchenBackdrop';
import { KitchenRunner } from './KitchenRunner';

/**
 * Standalone recipe: runs the recipe, banks the XP + badge and returns to the
 * kitchen. (Mission kitchen beats use `<KitchenRunner embedded />` instead, so
 * the mission owns the reward.)
 */
export function RecipeScreen({ recipeId }: { recipeId: RecipeId }) {
  const router = useRouter();
  const recipe = recipeById(recipeId);
  const recordMiniGame = useGame((s) => s.recordMiniGame);
  const completeRecipe = useGame((s) => s.completeRecipe);

  const onDone = useCallback(
    (results: MiniGameResult[]) => {
      for (const result of results) recordMiniGame(result);
      const { progress } = useGame.getState();
      const count = progress.recipes.includes(recipeId) ? progress.recipes.length : progress.recipes.length + 1;
      const earned = badgesForRecipes(count).find((b) => !progress.badges.includes(b));
      completeRecipe(recipeId, recipe?.xp ?? 20, recipe?.badge ?? earned);
      if (router.canGoBack()) router.back();
      else router.replace('/kitchen');
    },
    [completeRecipe, recipe?.badge, recipe?.xp, recipeId, recordMiniGame, router],
  );

  return (
    <ScreenFrame mood="kitchen" backdrop={<KitchenBackdrop still />} chrome={<TopBar />} style={styles.body} safeBottom={false}>
      <KitchenRunner recipeId={recipeId} onDone={onDone} />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { paddingTop: spacing.xxl + spacing.sm },
});
