/**
 * MISSION BRIEF — where we are going, and why.
 *
 *   [ FULL-BLEED illustrated storefront, ~half the screen, an NPC waiting
 *     outside it ]
 *   ┌─────────────────────────────┐
 *   │  Smoke from the oven!       │
 *   │  Rosa's bread is burning…   │
 *   │  (pin) 24 Market Street      │
 *   │  Math · Reading · Español   │
 *   └─────────────────────────────┘
 *            Get Ready!  ›
 *
 * One headline, not three. There used to be a white "Mission Brief" pill
 * floating on the sky above an h2 tagline above a body line — a five-year-old
 * met two headings and a label before reaching the one that says what happened.
 * The storefront already announces the place; the tagline is the headline.
 *
 * The four big colour-blocked subject tiles are gone the same way: what this
 * mission practises is for the grown-up reading over a shoulder, so it prints
 * as one quiet line under the address instead of four 96 px squares that
 * outweighed the picture and pushed "Get Ready!" off the screen.
 */
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import type { MissionDef } from '@/content/types';
import type { SceneId } from '@/learning/types';
import { palette, roles, spacing } from '@/theme';
import { speech } from '@/services/speech';
import { Button, Panel, Text } from '@/ui';
import { ChevronRightIcon } from '@/ui/icons';
import { SubjectLine, subjectSentence } from '@/ui/SubjectPill';
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
            runs edge to edge at half the screen, an NPC waits outside, and the
            brief card laps over its lower edge. No logo and no screen-name
            pill: the child knows what app they are in, and the tagline below
            is the headline. */}
        <Animated.View entering={FadeIn.duration(360)} style={[styles.heroWrap, { height: heroH }]}>
          <SceneHero scene={mission.scene} radius={0} bleed style={styles.hero} />
          <View style={[styles.npc, { bottom: heroH * 0.1 }]} pointerEvents="none">
            <Npc variant={npc} size={Math.round(heroH * 0.36)} emotion="worried" pose="wave" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify().damping(16)} style={styles.cardWrap}>
          <Panel tone="cream" radius="panel" padding="md" style={styles.card}>
            <Text variant="h1" center accessibilityRole="header">
              {mission.tagline}
            </Text>
            <Text variant="body" color={roles.ink.secondary} center>
              {mission.brief}
            </Text>
            <View style={styles.addressRow}>
              <AddressPin />
              <Text variant="bodyStrong" color={roles.ink.secondary}>
                {mission.address}
              </Text>
            </View>
            {/* what this practises, and how long it takes: one quiet line for
                the grown-up, not four tiles competing with the storefront */}
            <View style={styles.meta} accessibilityLabel={`Practises ${subjectSentence(mission.subjects)}`}>
              <SubjectLine subjects={mission.subjects} max={4} />
              <Text variant="small" color={roles.ink.muted} center>
                {mission.npcName ? `${mission.npcName} is waiting · ` : ''}about {mission.minutes} min
              </Text>
            </View>
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
  heroWrap: { width: '100%' },
  hero: { width: '100%', height: '100%' },
  npc: { position: 'absolute', left: '6%' },
  /* the card laps over the bottom edge of the hero, as in the reference */
  cardWrap: { paddingHorizontal: spacing.md, marginTop: -26 },
  card: { gap: spacing.sm },
  addressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -4 },
  meta: { alignItems: 'center', gap: 2 },
  ctaWrap: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: 0 },
});
