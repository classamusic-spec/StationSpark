import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { recipes } from '@/content/recipes';
import { useGame } from '@/state/store';
import { palette, radii, shadows, spacing } from '@/theme';
import { speech } from '@/services/speech';
import { sfx } from '@/services/audio';
import { Text } from '@/ui/Text';
import { ScreenFrame } from '@/ui/ScreenFrame';
import { TopBar } from '@/ui/TopBar';
import { GrownUpChip } from '@/ui/kit/Chip';
import { RecipeCard } from '@/ui/kit/RecipeCard';
import { VocabIcon } from '@/ui/kit/VocabIcon';
import { CharacterPortrait } from '@/characters/CharacterPortrait';
import { KitchenBackdrop } from './KitchenBackdrop';
import { KitchenSign } from './parts/KitchenSign';
import { BeggingPepper } from './parts/SceneBits';
import { recipeGlyph } from './food';
import { buildShelf } from './progress';

const WELCOME = 'Welcome to the Firehouse Kitchen! Pick a recipe and we will cook it together.';
export const KITCHEN_SAFETY_LINE =
  'Real kitchens have hot ovens and sharp knives — the crew handles those. Ask a grown-up at home!';

/**
 * The Firehouse Kitchen hub: the red sign swings in, Captain Bea says hello and
 * the recipe box sits open on the shelf. Every recipe stays playable — the
 * dimmed ones are just "not your next one yet".
 */
export function KitchenScreen() {
  const router = useRouter();
  const cooked = useGame((s) => s.progress.recipes);
  const badges = useGame((s) => s.progress.badges);
  const { width } = useWindowDimensions();
  const spoken = useRef(false);

  const shelf = useMemo(() => buildShelf(recipes, cooked, badges), [badges, cooked]);
  const signWidth = Math.min(320, width - 48);

  useEffect(() => {
    if (spoken.current) return;
    spoken.current = true;
    const t = setTimeout(() => speech.say(WELCOME, { speaker: 'bea' }), 500);
    return () => {
      clearTimeout(t);
      speech.stop();
    };
  }, []);

  return (
    <ScreenFrame mood="kitchen" backdrop={<KitchenBackdrop />} chrome={<TopBar />} safeBottom={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.signRow}>
          <KitchenSign width={signWidth} />
        </View>

        <Animated.View entering={FadeInDown.delay(200).springify().damping(15)} style={styles.beaRow}>
          <CharacterPortrait id="bea" emotion="happy" size={72} />
          <View style={[styles.bubble, shadows.card]}>
            <Text variant="tiny" color={palette.navyMuted}>
              Captain Bea
            </Text>
            <Text variant="bodyStrong">Pick a recipe — I will cook it with you.</Text>
            <Text variant="small" color={palette.purple}>
              Elige una receta.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(320)} style={[styles.safety, shadows.soft]}>
          <GrownUpChip />
          <Text variant="small" color={palette.navySoft} style={styles.safetyText}>
            {KITCHEN_SAFETY_LINE}
          </Text>
        </Animated.View>

        {shelf.map(({ recipe, state, index }) => (
          <View key={recipe.id} style={styles.shelfSlot}>
            <RecipeCard
              index={index}
              title={recipe.name}
              titleEs={recipe.nameEs}
              blurb={recipe.blurb}
              subjects={recipe.subjects}
              cooked={state === 'cooked'}
              locked={state === 'resting'}
              meta={`${recipe.steps.length} steps · +${recipe.xp} XP`}
              art={<VocabIcon id={recipeGlyph[recipe.id] ?? 'soup'} size={62} />}
              onPress={() => {
                sfx.play('page');
                router.push(`/kitchen/${recipe.id}`);
              }}
            />
            <View style={styles.shelfBoard} />
          </View>
        ))}

        <View style={styles.footer}>
          <BeggingPepper size={104} />
          <Text variant="small" color={palette.navySoft} style={styles.footerText}>
            Pepper hopes you drop something.
          </Text>
        </View>
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, paddingTop: spacing.xxl + spacing.xs, gap: spacing.sm, paddingBottom: spacing.xxl },
  signRow: { alignItems: 'center', marginBottom: spacing.xs },
  beaRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  bubble: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderBottomLeftRadius: 8,
    padding: spacing.sm,
  },
  safety: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    // opaque: a translucent card let the wall poster read through it
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.sm,
  },
  safetyText: { flex: 1 },
  shelfSlot: { marginTop: spacing.xs },
  shelfBoard: {
    height: 10,
    marginTop: -2,
    marginHorizontal: spacing.sm,
    borderRadius: 5,
    backgroundColor: palette.wood,
    ...shadows.soft,
  },
  footer: { alignItems: 'center', marginTop: spacing.md },
  footerText: { marginTop: -spacing.xs },
});
