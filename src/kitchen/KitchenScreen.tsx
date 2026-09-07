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
import { useScaledLayout } from '@/screens/shared';
import { KitchenBackdrop } from './KitchenBackdrop';
import { KitchenSign } from './parts/KitchenSign';
import { recipeGlyph } from './food';
import { buildShelf } from './progress';

const WELCOME = 'Welcome to the Firehouse Kitchen! Pick a recipe and we will cook it together.';
export const KITCHEN_SAFETY_LINE =
  'Real kitchens have hot ovens and sharp knives — the crew handles those. Ask a grown-up at home!';

/** A card narrower than this stops being a recipe card and becomes a strip. */
const CARD_MIN = 330;
/** …and wider than this it is a billboard. */
const CARD_MAX = 460;

/**
 * The Firehouse Kitchen hub: the red sign swings in, Captain Bea says hello and
 * the recipe box sits open on the shelf. Every recipe stays playable — the
 * dimmed ones are just "not your next one yet".
 *
 * THE RECIPE BOX IS A BOX, NOT A RIBBON. The list used to take whatever width
 * it was given, which on a tablet meant thirteen 1024 px bands with the drawn
 * room showing through the gaps between them — the cards read as stripes laid
 * over the wall rather than as things standing in the kitchen. So the cards are
 * held to a card's width and wrap into columns, and they stand on a warm sheet
 * of their own: the room is the room, the box is the box, and neither is
 * shredded by the other.
 */
export function KitchenScreen() {
  const router = useRouter();
  const cooked = useGame((s) => s.progress.recipes);
  const badges = useGame((s) => s.progress.badges);
  const { width } = useWindowDimensions();
  const layout = useScaledLayout();
  const spoken = useRef(false);

  const shelf = useMemo(() => buildShelf(recipes, cooked, badges), [badges, cooked]);
  const signWidth = Math.min(320, width - 48);

  /* One column on a phone, as many as fit a real card on anything wider. The
     sheet is then only as wide as the cards actually need. */
  const columns = layout.columns(CARD_MIN, 3);
  const cardWidth = Math.min(CARD_MAX, (Math.min(width, layout.gridWidth) - spacing.md * 2 - spacing.sm * (columns - 1)) / columns);
  const sheetWidth = cardWidth * columns + spacing.sm * (columns - 1) + spacing.md * 2;
  const headWidth = Math.min(width - spacing.md * 2, Math.max(layout.contentWidth, sheetWidth - spacing.md * 2));

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
        <View style={[styles.head, { width: headWidth }]}>
          <View style={styles.signRow}>
            <KitchenSign width={signWidth} />
          </View>

          <Animated.View entering={FadeInDown.delay(200).springify().damping(15)} style={styles.beaRow}>
            <CharacterPortrait id="bea" emotion="happy" size={72} />
            <View style={[styles.bubble, shadows.card]}>
              <Text variant="tiny" color={palette.navyMuted}>
                Captain Bea
              </Text>
              {/* the Spanish line is spoken, not printed: outside a Spanish lesson a
                  second line of text a five-year-old cannot read sits between them and
                  the room. */}
              <Text variant="bodyStrong">Pick a recipe — I will cook it with you.</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(320)} style={[styles.safety, shadows.soft]}>
            <GrownUpChip />
            <Text variant="small" color={palette.navySoft} style={styles.safetyText}>
              {KITCHEN_SAFETY_LINE}
            </Text>
          </Animated.View>
        </View>

        {/* the recipe box: cards on a warm sheet, so the shelf boards read as
            shelves rather than as bars floating on a wall */}
        <View style={[styles.sheet, shadows.soft, { width: sheetWidth }]}>
          <View style={styles.rows}>
            {shelf.map(({ recipe, state, index }) => (
              <View key={recipe.id} style={[styles.shelfSlot, { width: cardWidth }]}>
                <RecipeCard
                  index={index}
                  title={recipe.name}
                  titleEs={recipe.nameEs}
                  blurb={recipe.blurb}
                  subjects={recipe.subjects}
                  cooked={state === 'cooked'}
                  resting={state === 'resting'}
                  meta={`${recipe.steps.length} steps · +${recipe.xp} XP`}
                  art={<VocabIcon id={recipeGlyph[recipe.id] ?? 'soup'} size={56} />}
                  onPress={() => {
                    sfx.play('page');
                    router.push(`/kitchen/${recipe.id}`);
                  }}
                />
                <View style={styles.shelfBoard} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text variant="small" color={palette.navySoft} center style={styles.footerText}>
            Cook one and the whole crew sits down to eat.
          </Text>
        </View>
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.md,
    paddingTop: spacing.xxl + spacing.xs,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  head: { gap: spacing.sm },
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
  /* warm and all but opaque. 0.93 was not enough: the COOK · LEARN · HELP!
     poster is *lettering*, and letters read through a scrim long after shapes
     have gone quiet — a ghosted "LEARN" behind a recipe looks like a bug. */
  sheet: {
    backgroundColor: 'rgba(255,246,229,0.985)',
    borderRadius: radii.panel,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  rows: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
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
