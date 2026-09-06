/**
 * KITCHEN BEAT — hands a mission's cooking beat to the Firehouse Kitchen.
 *
 * `@/kitchen` owns the runner; we pass `embedded` so it makes no store writes
 * and does not navigate — the mission stays in charge and just takes the
 * results. If anything in there throws, the boundary swaps in the friendly
 * "being built" card and the beat still completes, so the mission continues.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { RecipeId } from '@/content/types';
import type { MiniGameResult } from '@/minigames/types';
import { KitchenRunner } from '@/kitchen';
import { UnderConstructionCard } from './UnderConstructionCard';
import { BeatErrorBoundary } from './BeatErrorBoundary';

export interface KitchenBeatProps {
  recipeId: RecipeId;
  onDone: (results: MiniGameResult[]) => void;
}

export function KitchenBeat({ recipeId, onDone }: KitchenBeatProps) {
  const fallback = (
    <UnderConstructionCard
      title="The kitchen is warming up"
      note="The crew is still setting out the pans. Tap to head back out on the call!"
      ctaLabel="Back to the call ›"
      character="bea"
      onContinue={() => onDone([])}
    />
  );

  return (
    <View style={styles.root}>
      <BeatErrorBoundary resetKey={recipeId} fallback={fallback}>
        <KitchenRunner recipeId={recipeId} embedded onDone={onDone} />
      </BeatErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
