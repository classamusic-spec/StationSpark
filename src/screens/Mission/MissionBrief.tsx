/**
 * MISSION BRIEF — the reference frame, exactly.
 *
 *   [ FULL-BLEED illustrated storefront, ~half the screen, an NPC waiting
 *     outside it, the "Mission Brief" pill floating on the sky ]
 *   ┌─────────────────────────────┐
 *   │  Smoke from the oven!       │
 *   │  (pin) 24 Market Street      │
 *   │  [Math][Reading][Español][…]│
 *   └─────────────────────────────┘
 *            Get Ready!  ›
 */
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import type { MissionDef } from '@/content/types';
import type { SceneId } from '@/learning/types';
import { palette, radii, shadows, spacing, stagger, subjectColors, type SubjectId } from '@/theme';
import { speech } from '@/services/speech';
import { Button, Panel, Text } from '@/ui';
import { ChevronRightIcon } from '@/ui/icons';
import { GlyphIcon } from '@/ui/kit/GlyphIcon';
import { subjectLabel } from '@/ui/SubjectPill';
import { Npc, type NpcVariant } from '@/characters';
import { SceneHero } from './SceneHero';

/** Who is standing outside, waiting for the crew. */
const SCENE_NPC: Record<SceneId, NpcVariant> = {
  bakery: 'rosa',
  pizza: 'gino',
  school: 'ms-lee',
  park: 'okafor',
  'clock-tower': 'maya',
  apartments: 'twins',
  'pet-shop': 'twins',
  library: 'maya',
  market: 'rosa',
  'station-yard': 'okafor',
};

/** A soft-coloured square tile: the drawn subject mark over the subject name. */
function SubjectTile({ subject, index }: { subject: SubjectId; index: number }) {
  const c = subjectColors[subject];
  return (
    <Animated.View
      entering={FadeInUp.delay(220 + index * stagger.tile)
        .springify()
        .damping(14)}
      style={[styles.tile, { backgroundColor: c.soft }]}
    >
      <View style={styles.tileGlyph}>
        {/* the drawn subject mark, inked in the subject's own hue for the pale tile */}
        <GlyphIcon id={subject} size={44} ink={c.bg} label={subjectLabel(subject)} />
      </View>
      <Text variant="bodyStrong" center numberOfLines={1}>
        {subjectLabel(subject)}
      </Text>
    </Animated.View>
  );
}

function AddressPin() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M12 2c-4 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3-7-7-7z" fill={palette.engineRed} />
      <Circle cx={12} cy={9} r={2.8} fill={palette.white} />
    </Svg>
  );
}

export interface MissionBriefProps {
  mission: MissionDef;
  onStart: () => void;
}

export function MissionBrief({ mission, onStart }: MissionBriefProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  /* ~half the screen, and never so tall that the storefront's flanks get
     sliced away (the art is 1.6 : 1 before the bleed widens it). */
  const heroH = Math.round(Math.min(height * 0.44, width * 1.02));
  const npc = SCENE_NPC[mission.scene] ?? 'rosa';

  useEffect(() => {
    const t = setTimeout(() => speech.say(mission.brief, { speaker: 'bea' }), 600);
    return () => {
      clearTimeout(t);
      speech.stop();
    };
  }, [mission.brief]);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 116 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* critique #12: the storefront IS the promise of the adventure — it
            runs edge to edge at half the screen, the title floats on its sky,
            an NPC waits outside, and the brief card laps over its lower edge.
            The logo is gone: the child knows what app they are in. */}
        <Animated.View entering={FadeIn.duration(360)} style={[styles.heroWrap, { height: heroH }]}>
          <SceneHero scene={mission.scene} radius={0} bleed style={styles.hero} />
          <View style={[styles.npc, { bottom: heroH * 0.1 }]} pointerEvents="none">
            <Npc variant={npc} size={Math.round(heroH * 0.36)} emotion="worried" pose="wave" />
          </View>
          <Animated.View
            entering={FadeInDown.springify().damping(16)}
            style={[styles.titlePill, { top: insets.top + spacing.xxl + spacing.xs }]}
          >
            <Text variant="h1" center>
              Mission Brief
            </Text>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify().damping(16)} style={styles.cardWrap}>
          <Panel tone="cream" radius="panel" padding="md" style={styles.card}>
            <Text variant="h2" center>
              {mission.tagline}
            </Text>
            <Text variant="body" color={palette.navySoft} center>
              {mission.brief}
            </Text>
            <View style={styles.addressRow}>
              <AddressPin />
              <Text variant="bodyStrong" color={palette.navySoft}>
                {mission.address}
              </Text>
            </View>
            <View style={styles.tiles}>
              {mission.subjects.slice(0, 4).map((s, i) => (
                <SubjectTile key={s} subject={s} index={i} />
              ))}
            </View>
            {mission.npcName ? (
              <Text variant="small" color={palette.navyMuted} center>
                {mission.npcName} is waiting for you · about {mission.minutes} min
              </Text>
            ) : (
              <Text variant="small" color={palette.navyMuted} center>
                About {mission.minutes} min
              </Text>
            )}
          </Panel>
        </Animated.View>
      </ScrollView>

      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} pointerEvents="box-none">
        <Animated.View entering={FadeInUp.delay(300).springify().damping(14)}>
          <Button
            label="Get Ready!"
            tone="red"
            size="xl"
            block
            iconRight={<ChevronRightIcon size={28} />}
            onPress={onStart}
            accessibilityLabel={`Get ready for ${mission.title}`}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: spacing.sm },
  titlePill: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  heroWrap: { width: '100%' },
  hero: { width: '100%', height: '100%' },
  npc: { position: 'absolute', left: '6%' },
  /* the card laps over the bottom edge of the hero, as in the reference */
  cardWrap: { paddingHorizontal: spacing.md, marginTop: -26 },
  card: { gap: spacing.sm },
  addressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  tile: {
    flexGrow: 1,
    flexBasis: 96,
    maxWidth: 150,
    minHeight: 96,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: 6,
    gap: 2,
  },
  tileGlyph: { alignItems: 'center', justifyContent: 'center', height: 46 },
  ctaWrap: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: 0 },
});
