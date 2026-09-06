/**
 * TrainingStationTile — one practice station on the yard grid.
 *
 * Deliberately the same card as a dispatch slip: a picture, a name, one line,
 * and a green GO. Nothing here is a leaderboard, and nothing here is a spec
 * sheet — the "≈120 s" chip and the play counter were metadata competing with
 * the two things a child chooses by. Stars stay, because the child earned them,
 * and they are always paired with a word ("New!" / "×3"), never colour alone.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import type { MiniGameMeta, Stars } from '@/minigames/types';
import { palette, radii, roles, spacing, springs, stagger, subjectColors, type SubjectId } from '@/theme';
import { StarIcon } from '@/ui/icons';
import { GlyphIcon, hasGlyph, type GlyphId } from '@/ui/kit/GlyphIcon';
import { VocabIcon, vocabIconIds, type VocabIconId } from '@/ui/kit/VocabIcon';
import { subjectSentence } from '@/ui/SubjectPill';
import { Text } from '@/ui/Text';

type StationMark = { kind: 'glyph'; id: GlyphId } | { kind: 'vocab'; id: VocabIconId };

/** Resolve a registry icon id to a drawn mark: the glyph kit first, then the vocabulary sheet, never a fallback star. */
function resolveMark(icon: string): StationMark {
  const mapped = ICON_GLYPHS[icon];
  if (mapped) return { kind: 'glyph', id: mapped };
  if (hasGlyph(icon)) return { kind: 'glyph', id: icon as GlyphId };
  if ((vocabIconIds as readonly string[]).includes(icon)) return { kind: 'vocab', id: icon as VocabIconId };
  return { kind: 'glyph', id: 'star' };
}

/** A big drawn station mark on a soft tile in the game's subject colour. */
function StationGlyph({ subject, mark, size }: { subject: SubjectId; mark: StationMark; size: number }) {
  return (
    <View style={[styles.glyph, { width: size, height: size, backgroundColor: subjectColors[subject].soft }]}>
      {mark.kind === 'glyph' ? <GlyphIcon id={mark.id} size={size * 0.72} /> : <VocabIcon id={mark.id} size={size * 0.72} noShadow />}
    </View>
  );
}

/** The same green GO the dispatch slips use, so "touch here" is one shape. */
function GoChevron({ size }: { size: number }) {
  return (
    <View style={[styles.chevron, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 54 54">
        <Circle cx={27} cy={29} r={25} fill={palette.leafGreenDark} />
        <Circle cx={27} cy={26} r={25} fill={palette.leafGreen} />
        <Circle cx={27} cy={26} r={25} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2.5} />
        <Path d="M 22 15 L 34 26 L 22 37" stroke={palette.white} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}

/**
 * Icon ids from `MiniGameMeta.icon` mapped to a drawn glyph (art critique
 * item #21 — the yard used to carry an emoji map).
 */
const ICON_GLYPHS: Record<string, GlyphId> = {
  hose: 'hose',
  water: 'water',
  tank: 'tank',
  ladder: 'ladder',
  numbers: 'numbers',
  radio: 'radio',
  equipment: 'equipment',
  gear: 'gear',
  path: 'path',
  route: 'route',
  hydrant: 'hydrant',
  spray: 'spray',
  clock: 'clock',
  pets: 'pets',
  barrier: 'barrier',
  signals: 'signals',
  vocab: 'vocab',
  listen: 'listen',
  pizza: 'pizza',
  measure: 'measure',
  count: 'count',
  share: 'share',
  scale: 'scale',
  money: 'numbers',
  shape: 'path',
  word: 'vocab',
  market: 'numbers',
  truck: 'truck',
  cone: 'cone',
  map: 'route',
};

export interface TrainingStationTileProps {
  meta: MiniGameMeta;
  index?: number;
  /** how many times the child has played this station */
  plays?: number;
  /** how it is going, 0 = not played yet */
  stars?: Stars;
  /** roomier art and type once the card has a board's worth of width */
  roomy?: boolean;
  onPress?: () => void;
}

export function TrainingStationTile({ meta, index = 0, plays = 0, stars = 0, roomy, onPress }: TrainingStationTileProps) {
  const press = useSharedValue(0);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.03 }] }));
  const subject: SubjectId = meta.subjects[0] ?? 'logic';
  const mark = resolveMark(meta.icon);

  return (
    /* grow to the height of the tallest tile in the row */
    <Animated.View
      style={styles.grow}
      entering={FadeInDown.delay(index * stagger.tile)
        .springify()
        .damping(15)}
    >
      <Animated.View style={[a, styles.grow]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${meta.title}. ${meta.blurb} Practises ${subjectSentence(meta.subjects)}. ${plays > 0 ? `Played ${plays} times.` : 'Not played yet.'}`}
          onPressIn={() => {
            press.value = withSpring(1, springs.pop);
          }}
          onPressOut={() => {
            press.value = withSpring(0, springs.pop);
          }}
          onPress={onPress}
          style={[styles.card, roles.lift.interactive]}
        >
          <StationGlyph subject={subject} mark={mark} size={roomy ? 74 : 62} />

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text variant={roomy ? 'h2' : 'h3'} numberOfLines={2} style={styles.title}>
                {meta.title}
              </Text>
              {/* the subject is the sign this tile stands under, so it is not
                  reprinted here; only the child's own record is */}
              {plays > 0 ? (
                <View style={styles.stars}>
                  {[0, 1, 2].map((i) => (
                    <StarIcon
                      key={i}
                      size={15}
                      color={i < stars ? palette.safetyYellow : palette.lockedGrey}
                      stroke={i < stars ? palette.goldDark : palette.slate}
                    />
                  ))}
                  <Text variant="tiny" color={roles.ink.muted}>
                    {` ×${plays}`}
                  </Text>
                </View>
              ) : (
                <Text variant="tiny" color={roles.ink.muted}>
                  New!
                </Text>
              )}
            </View>
            {/* The Spanish game name used to print here, under the English
                one. On a board of a dozen tiles that is a dozen extra lines
                between the child and the thing they came to choose, and the
                name of a game is not what teaches Spanish — the games that
                actually teach it do, and Captain Bea still says everything
                aloud in both languages. */}
            <Text variant="small" color={roles.ink.secondary} numberOfLines={roomy ? 2 : 3}>
              {meta.blurb}
            </Text>
          </View>

          <GoChevron size={roomy ? 56 : 50} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1 },
  card: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: roles.surface.card,
    borderRadius: radii.card,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xs },
  title: { flexShrink: 1 },
  glyph: { borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  chevron: { alignItems: 'center', justifyContent: 'center' },
});
