import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { recipes } from '@/content/recipes';
import { RecipeScreen } from '@/kitchen';

/** /kitchen/[recipe] — cook one recipe end to end. */
export default function RecipeRoute() {
  const { recipe } = useLocalSearchParams<{ recipe?: string }>();
  const found = recipes.find((r) => r.id === recipe);
  if (!found) return <Redirect href="/kitchen" />;
  return <RecipeScreen recipeId={found.id} />;
}
