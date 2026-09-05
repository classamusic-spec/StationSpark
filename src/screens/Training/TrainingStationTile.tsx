/**
 * TrainingStationTile — one practice station on the yard grid.
 *
 * White card: subject pill, title, blurb, a "≈40 s" chip, how many times it has
 * been played and how well it is going. Nothing here is a leaderboard.
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { MiniGameMeta, Stars } from '@/minigames/types';
import { hit, palette, radii, shadows, spacing, springs, stagger, subjectColors, type SubjectId } from '@/theme';
import { StarIcon } from '@/ui/icons';
import { SubjectPill } from '@/ui/SubjectPill';
import { Text } from '@/ui/Text';

/** A big soft glyph badge in the game's subject colour. */
function StationGlyph({ subject, glyph }: { subject: SubjectId; glyph: string }) {
  return (
    <View style={[styles.glyph, { backgroundColor: subjectColors[subject].soft }]}>
      <Text variant="numeral" center style={styles.glyphText}>
        {glyph}
      </Text>
    </View>
  );
}

/** Icon ids from `MiniGameMeta.icon` mapped to a glyph the yard can show. */
const ICON_GLYPHS: Record<string, string> = {
  hose: '💦',
  water: '💧',
  tank: '🫙',
  ladder: '🪜',
  numbers: '🔢',
  radio: '📻',
  equipment: '🎒',
  gear: '🧰',
  path: '🧩',
  route: '🗺️',
  hydrant: '🚰',
  spray: '🌈',
  clock: '🕰️',
  pets: '🐾',
  barrier: '🚧',
  signals: '🚦',
  vocab: '💬',
  listen: '👂',
  pizza: '🍕',
  measure: '🥄',
  count: '🧮',
  share: '🍽️',
  scale: '⚖️',
};

export interface TrainingStationTileProps {
  meta: MiniGameMeta;
  index?: number;
  /** how many times the child has played this station */
  plays?: number;
  /** how it is going, 0 = not played yet */
  stars?: Stars;
  onPress?: () => void;
}

export function TrainingStationTile({ meta, index = 0, plays = 0, stars = 0, onPress }: TrainingStationTileProps) {
  const press = useSharedValue(0);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.03 }] }));
  const subject: SubjectId = meta.subjects[0] ?? 'logic';
  const glyph = ICON_GLYPHS[meta.icon] ?? '⭐';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * stagger.tile)
        .springify()
        .damping(15)}
      style={styles.wrap}
    >
      <Animated.View style={a}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${meta.title}. ${meta.blurb}. About ${meta.seconds} seconds.`}
        onPressIn={() => {
          press.value = withSpring(1, springs.pop);
        }}
        onPressOut={() => {
          press.value = withSpring(0, springs.pop);
        }}
        onPress={onPress}
        style={[styles.card, shadows.card]}
      >
        <View style={styles.head}>
          <StationGlyph subject={subject} glyph={glyph} />
          <View style={styles.headText}>
            <Text variant="h3" numberOfLines={2}>
              {meta.title}
            </Text>
            <SubjectPill subject={subject} small />
          </View>
        </View>

        <Text variant="small" color={palette.navySoft} numberOfLines={2} style={styles.blurb}>
          {meta.blurb}
        </Text>

        <View style={styles.foot}>
          <View style={styles.seconds}>
            <Text variant="tiny" color={palette.navy}>
              ≈{meta.seconds}s
            </Text>
          </View>
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
              <Text variant="tiny" color={palette.navyMuted}>
                {` ×${plays}`}
              </Text>
            </View>
          ) : (
            <Text variant="tiny" color={palette.navyMuted}>
              New!
            </Text>
          )}
        </View>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, flexBasis: 250, maxWidth: 420 },
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.sm,
    gap: 6,
    minHeight: hit.big + 62,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headText: { flex: 1, gap: 4, alignItems: 'flex-start' },
  glyph: { width: 64, height: 64, borderRadius: radii.tile, alignItems: 'center', justifyContent: 'center' },
  glyphText: { lineHeight: 46 },
  blurb: { minHeight: 40 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seconds: { backgroundColor: palette.creamDeep, borderRadius: radii.tag, paddingHorizontal: 10, paddingVertical: 4 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
