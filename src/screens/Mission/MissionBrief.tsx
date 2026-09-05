/**
 * MISSION BRIEF — the reference frame, exactly.
 *
 *   Logo · "Mission Brief" pill
 *   [ big illustrated storefront ]
 *   ┌─────────────────────────────┐
 *   │  Smoke from the oven!       │
 *   │  (pin) 24 Market Street      │
 *   │  [Math][Reading][Español][…]│
 *   └─────────────────────────────┘
 *            Get Ready!  ›
 */
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import type { MissionDef } from '@/content/types';
import { palette, radii, shadows, spacing, stagger, subjectColors, type SubjectId } from '@/theme';
import { speech } from '@/services/speech';
import { Button, Logo, Panel, Text } from '@/ui';
import { ChevronRightIcon } from '@/ui/icons';
import { GlyphIcon } from '@/ui/kit/GlyphIcon';
import { subjectLabel } from '@/ui/SubjectPill';
import { SceneHero } from './SceneHero';

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
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xxs, paddingBottom: insets.bottom + 116 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoRow} pointerEvents="none">
          <Logo size={150} tagline={false} />
        </View>

        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.titlePill}>
          <Text variant="h1" center>
            Mission Brief
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(360)} style={[styles.heroWrap, shadows.card]}>
          <SceneHero scene={mission.scene} radius={radii.panel} style={styles.hero} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).springify().damping(16)}>
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
  scroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  logoRow: { alignItems: 'center', marginBottom: -spacing.xs },
  titlePill: {
    alignSelf: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  heroWrap: { borderRadius: radii.panel, marginTop: spacing.xs },
  hero: { height: 210, width: '100%' },
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
