/**
 * MISSION BRIEF — where we are going, who needs us, and what we will practise.
 *
 * The brief used to be a picture and a card stacked at the top of the phone,
 * then a band of raw blue sky worth about 40 % of the screen, then a red button
 * glued to the bottom edge. That band is the exact fault `src/world/Stage.tsx`
 * names as the blandest thing a screen can do, so it is gone three ways:
 *
 *  1. the storefront is *given* the height instead of being capped at a
 *     fraction of it — the picture grows until the card and the foot have what
 *     they need, and shrinks (never below `MIN_HERO`) when the copy is long;
 *  2. the pavement outside the shop keeps going down to the bottom edge, so the
 *     "Get Ready!" pill stands on ground rather than floating on sky;
 *  3. the room that is left carries the two things a brief was actually missing
 *     — WHO needs us and WHAT we will practise. Both are read off the mission
 *     (its NPC, its address, its beats for *this* child's age band, the skills
 *     those beats carry). Nothing on this screen is invented.
 *
 *   phone / portrait               tablet landscape
 *   ┌────────────────┐             ┌────────────────────────────┐
 *   │   storefront   │             │        storefront          │
 *   │    + Rosa      │             │      (the whole screen)    │
 *   ├────────────────┤             │                ┌─────────┐ │
 *   │  cream card    │             │                │  cream  │ │
 *   │  who · where   │             │        ┌───┐   │  card   │ │
 *   │  jobs · time   │             │        │Rosa│  │         │ │
 *   │  practising    │             │        └───┘   ├─────────┤ │
 *   ├────────────────┤             │  ▒▒ pavement ▒▒│Get Ready│ │
 *   │ ▒▒ pavement ▒▒ │             └────────────────┴─────────┘
 *   │ [ Get Ready! ] │
 *   └────────────────┘
 *
 * A tablet gets more *content*, not wider chrome: the reading column stays at
 * `contentWidth` and the width it does not need goes to the picture, which is
 * the one thing on the screen that genuinely wants to be big (see the header of
 * `src/screens/shared/useScaledLayout.ts`).
 *
 * Landscape used to be two columns inside a margin, and it reproduced the very
 * fault this screen was rebuilt to kill: the picture was a rounded panel that
 * stopped on a computed horizon, so the bottom ~37 % of a 1024 × 768 tablet was
 * one flat invented plane with a small figure marooned on it, there was raw sky
 * above the card, and the card floated with a hole between it and the pill.
 * There is no invented ground in landscape now — the storefront IS the screen,
 * edge to edge, and the brief is a cream sheet standing in the lower corner of
 * that street with the neighbour out in front of the shop. Any room left over
 * is *scene*, which is the only kind of empty a backdrop is allowed to be.
 *
 * One headline, not three. There used to be a white "Mission Brief" pill
 * floating on the sky above an h2 tagline above a body line — a five-year-old
 * met two headings and a label before reaching the one that says what happened.
 * The storefront already announces the place; the tagline is the headline.
 *
 * The four big colour-blocked subject tiles stay gone: what this mission
 * practises is a quiet row of skill chips for the grown-up reading over a
 * shoulder, never four 96 px squares that outweigh the picture.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import type { MissionDef } from '@/content/types';
import type { SceneId, SkillTag } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import { recipeById } from '@/content/recipes';
import { beatsForBand } from '@/machines/missionMachine';
import { useGame } from '@/state/store';
import { hit, palette, radii, roles, spacing } from '@/theme';
import { speech } from '@/services/speech';
import { Button, Panel, Text } from '@/ui';
import { ChevronRightIcon } from '@/ui/icons';
import { GlyphIcon } from '@/ui/kit';
import { subjectLabel, subjectSentence } from '@/ui/SubjectPill';
import { CharacterPortrait, Npc, type NpcVariant } from '@/characters';
import { useScaledLayout } from '@/screens/shared';
import { skillLabels } from './MissionRecap';
import { SceneHero, sceneStyles } from './SceneHero';
import { darker, mix, roadLine, sceneDefs, sceneFrame } from './scene';

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

/**
 * "Ana & Luis is waiting." Some missions are called in by a pair, and this is a
 * reading game — the one printed sentence about who needs us has to parse.
 */
const waitingLine = (npcName: string) => `${npcName} ${/\s(?:&|and)\s|,/.test(npcName) ? 'are' : 'is'} waiting`;

/** the storefront never gets smaller than this, whatever the copy does */
const MIN_HERO = 196;
/** how far the card laps over the bottom of the picture */
const OVERLAP = 26;
/** `Button size="xl"` — face + edge */
const CTA_HEIGHT = 85;
/**
 * The mission chrome the runner floats over this screen: `TopBar` at
 * `insets.top + 8`, 56 tall. The reading column starts below it, because on a
 * landscape phone the sheet is taller than the room it has and its headline
 * slid up underneath the star counter.
 */
const CHROME_H = 8 + 56 + spacing.xs;
/**
 * `SceneHero bleed` carries sky above the roof and pavement below the kerb, and
 * it is sliced to fill, so the whole storefront survives in any box between
 * about 1 : 2 and 6 : 5. Outside that the roof goes over the top edge — hence
 * the clamps on `heroH` and the side-by-side layout in landscape, where a
 * full-width strip of picture would be far too short to hold a building.
 */
const HERO_ASPECT = { min: 0.5, max: 1.1 } as const;

/**
 * WHAT THE PICTURE IS STANDING ON, MEASURED FROM THE PICTURE.
 *
 * Two numbers this screen used to guess, and got wrong:
 *
 *  - `foot` — how far above the bottom of the box the neighbour's feet belong.
 *    A flat percentage put them out in the middle of the tarmac, because the
 *    kerb sits at a different height in every box: `SceneHero` composes for the
 *    aspect it is given rather than scaling one drawing.
 *  - `surface` — the colour the band under the picture has to be. It was
 *    painted in the scene's *pavement* tone, but the bottom edge of the picture
 *    is the road beyond the kerb, so the two met in a hard grey step straight
 *    across the screen.
 *
 * `sceneFrame`, `roadLine` and `mix` are the very functions `SceneHero` and its
 * `GroundPlane` compose with, so both answers are the picture's own — and they
 * follow it if it is ever retuned.
 */
function sceneFoot(scene: SceneId, w: number, h: number): { foot: number; surface: string } {
  const def = sceneDefs[scene] ?? sceneDefs.bakery;
  const style = sceneStyles[scene] ?? sceneStyles.bakery;
  const f = sceneFrame(w, h, def.height, true, true, def.spill);
  const kerb = Math.min(roadLine(f), h - 6 * f.s);
  const road = def.ground !== 'grass' && kerb < h - 10 * f.s;
  return {
    /* a step back from the edge, so nobody is left balancing on the kerbstone */
    foot: Math.max(0, Math.round(h - kerb + 5 * f.s)),
    /* GroundPlane's own tarmac mix, or the near ground where there is no road */
    surface: road ? mix(style.ground, palette.charcoal, 0.46) : style.ground,
  };
}

function AddressPin({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2c-4 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3-7-7-7z" fill={palette.engineRed} />
      <Circle cx={12} cy={9} r={2.8} fill={palette.white} />
    </Svg>
  );
}

/**
 * THE GROUND THE BRIEF STANDS ON (portrait only).
 *
 * The street outside the shop, carried on down to the bottom edge of the screen,
 * so the foot of the brief is a near plane with a soft contact shadow on it
 * rather than a band of raw sky.
 *
 * It picks the surface up in the picture's own colour (`sceneFoot`) and draws
 * no kerb of its own: a second edge across the same road reads as a step, which
 * is precisely the fault it exists to remove. Landscape has no band at all —
 * there the picture is the whole screen. See the header.
 */
function GroundBand({ surface, width, height }: { surface: string; width: number; height: number }) {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));

  return (
    <Svg width={w} height={h} style={styles.ground} pointerEvents="none">
      <Defs>
        <LinearGradient id="briefGround" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={surface} />
          {/* one value step down towards the viewer, like every plane above it */}
          <Stop offset="1" stopColor={darker(surface, 0.16)} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill="url(#briefGround)" />
      {/* the card's contact shadow, pooling on the road under its lower edge */}
      <Ellipse cx={w / 2} cy={10} rx={w * 0.44} ry={16} fill={palette.navy} opacity={0.09} />
    </Svg>
  );
}

/** One measured fact off the mission, on the card's quiet second surface. */
function Fact({ glyph, value, label }: { glyph: string; value: string; label: string }) {
  return (
    <View style={styles.fact}>
      <GlyphIcon id={glyph} size={22} />
      <View style={styles.factText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {value}
        </Text>
        <Text variant="tiny" color={roles.ink.muted} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export interface MissionBriefProps {
  mission: MissionDef;
  onStart: () => void;
}

export function MissionBrief({ mission, onStart }: MissionBriefProps) {
  const insets = useSafeAreaInsets();
  const layout = useScaledLayout();
  const ageBand = useGame((s) => s.profile.ageBand);
  const { width, height, contentWidth } = layout;

  /**
   * In landscape the picture cannot sit *above* the card: a full-width band of
   * storefront is only ever a couple of hundred px tall, far too short a box for
   * a building. So past this it goes *behind* the card and fills the screen, and
   * the extra width becomes a bigger storefront rather than a wider paragraph.
   */
  const wide = layout.landscape && width >= 720;
  /** a short phone drops the practice chips rather than pushing the CTA off */
  const dense = height < 740;
  /**
   * Landscape: the storefront is the whole screen and the brief is a sheet
   * standing in the lower corner of it. The reading column is still capped at
   * `contentWidth` — the extra width goes to the picture, not to the paragraph.
   */
  const colW = Math.min(contentWidth, Math.round(width * 0.46));
  /** the card the copy actually has to fit inside, either way */
  const cardW = wide ? colW : contentWidth;
  /** as many skills as fit on ONE line with their tail, so nothing is orphaned */
  const chipCount = cardW >= 440 ? 3 : 2;
  const npc = SCENE_NPC[mission.scene] ?? 'rosa';
  const style = sceneStyles[mission.scene] ?? sceneStyles.bakery;
  const place = style.name;
  const sky = style.sky[1];

  /** what this mission actually is, for *this* child: its jobs and its skills */
  const plan = useMemo(() => {
    const seen = new Set<SkillTag>();
    let jobs = 0;
    for (const beat of beatsForBand(mission, ageBand)) {
      if (beat.type === 'minigame') {
        jobs += 1;
        for (const skill of challengeSkills[beat.game]) seen.add(skill);
      } else if (beat.type === 'kitchen') {
        jobs += 1;
        for (const step of recipeById(beat.recipe)?.steps ?? []) for (const skill of challengeSkills[step.game]) seen.add(skill);
      }
    }
    const labels = Array.from(seen).map((s) => skillLabels[s]);
    return { jobs, skills: labels.length > 0 ? labels : mission.subjects.map(subjectLabel) };
  }, [ageBand, mission]);

  /* the card measures itself so the picture can take everything it leaves */
  const [cardH, setCardH] = useState(dense ? 300 : 360);
  const onCardLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    setCardH((prev) => (Math.abs(prev - h) > 1 ? h : prev));
  }, []);

  const footPad = Math.max(insets.bottom, spacing.md);
  const foot = CTA_HEIGHT + spacing.lg + footPad + spacing.sm;

  /** stacked: the storefront takes the height the card and the foot don't need */
  const heroH = Math.round(
    Math.min(
      Math.max(height - cardH - foot + OVERLAP, MIN_HERO, width * HERO_ASPECT.min),
      Math.max(MIN_HERO, height - foot - 148),
      width * HERO_ASPECT.max,
    ),
  );
  /** the neighbour stands out on the near pavement, in front of the shop */
  const npcSize = Math.round(Math.min(height * 0.3, (width - colW) * 0.4, 260));

  useEffect(() => {
    const t = setTimeout(() => speech.say(mission.brief, { speaker: 'bea' }), 600);
    return () => {
      clearTimeout(t);
      speech.stop();
    };
  }, [mission.brief]);

  const card = (
    <Panel tone="cream" radius="panel" padding={dense ? 'sm' : 'md'} style={styles.card}>
      <Text variant="h1" center accessibilityRole="header">
        {mission.tagline}
      </Text>
      <Text variant="body" color={roles.ink.secondary} center>
        {mission.brief}
      </Text>

      {/* WHO needs us, and where they are — one tile instead of a floating line */}
      <View style={styles.who}>
        <CharacterPortrait id="npc" npc={npc} emotion="worried" size={48} />
        <View style={styles.whoText}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {mission.npcName ? waitingLine(mission.npcName) : `The ${place} needs us`}
          </Text>
          <View style={styles.whoAddress}>
            <AddressPin />
            <Text variant="small" color={roles.ink.secondary} numberOfLines={1} style={styles.flex}>
              {mission.address}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.facts}>
        <Fact glyph="equipment" value={String(plan.jobs)} label={plan.jobs === 1 ? 'job to do' : 'jobs to do'} />
        <Fact glyph="clock" value={`${mission.minutes} min`} label="of helping" />
      </View>

      {/* WHAT we will practise — read off the beats, quiet enough to stay behind
          the picture and the headline */}
      {dense ? null : (
        <View style={styles.practise} accessibilityLabel={`We will practise ${subjectSentence(mission.subjects)}`}>
          <Text variant="tiny" color={roles.ink.muted} center>
            WE WILL PRACTISE
          </Text>
          <View style={styles.chips}>
            {plan.skills.slice(0, chipCount).map((label) => (
              <View key={label} style={styles.chip}>
                <Text variant="tiny" color={roles.ink.secondary}>
                  {label}
                </Text>
              </View>
            ))}
            {/* the tail is plain muted text, not a fourth chip: as a chip it
                reads as one more thing you will practise, and when the row
                wraps it lands underneath on its own looking orphaned */}
            {plan.skills.length > chipCount ? (
              <Text variant="tiny" color={roles.ink.muted} style={styles.chipTail}>
                {`+${plan.skills.length - chipCount} more`}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </Panel>
  );

  const cta = (
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
  );

  /* ---- landscape: the street is the screen, the brief stands in it ---- */
  if (wide) {
    return (
      <View style={[styles.root, { backgroundColor: sky }]}>
        {/* edge to edge, so every pixel the card does not use is the place
            itself: sky, terrace, pavement and road, never a flat plate */}
        <Animated.View entering={FadeIn.duration(360)} style={StyleSheet.absoluteFill}>
          <SceneHero scene={mission.scene} radius={0} bleed style={styles.fill} />
        </Animated.View>
        <View style={[styles.wideNpc, { bottom: sceneFoot(mission.scene, width, height).foot }]} pointerEvents="none">
          <Npc variant={npc} size={npcSize} emotion="worried" pose="wave" />
        </View>

        {/* The sheet hangs from the foot of the column rather than floating in
            the middle of it, so the slack is one open piece of street above the
            headline instead of a hole between the card and the pill. The pill
            stays outside the scroller: on a short landscape phone the card is
            taller than the column, and a "Get Ready!" a child has to scroll to
            find is a dead end by another name. */}
        <View
          style={[
            styles.wideCol,
            { width: colW, top: insets.top + CHROME_H, bottom: footPad + spacing.md, right: spacing.lg },
          ]}
        >
          <ScrollView contentContainerStyle={styles.wideColInner} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInUp.delay(120).springify().damping(16)}>{card}</Animated.View>
          </ScrollView>
          {cta}
        </View>
      </View>
    );
  }

  /* ---- stacked: picture, card, street, CTA ---- */
  const ground = sceneFoot(mission.scene, width, heroH);
  return (
    <View style={[styles.root, { backgroundColor: sky }]}>
      <Animated.View entering={FadeIn.duration(360)} style={{ height: heroH }}>
        <SceneHero scene={mission.scene} radius={0} bleed style={styles.fill} />
        <View style={[styles.npc, { bottom: ground.foot }]} pointerEvents="none">
          <Npc variant={npc} size={Math.round(Math.min(heroH * 0.36, width * 0.32))} emotion="worried" pose="wave" />
        </View>
      </Animated.View>

      <View style={styles.below}>
        <GroundBand surface={ground.surface} width={width} height={Math.max(1, height - heroH)} />
        {/* the lap over the picture is the *scroller's* offset, not the card's:
            a ScrollView clips its content, so a negative margin inside it took
            the top off the headline instead of lifting the card. */}
        <ScrollView
          style={styles.belowScroll}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInUp.delay(120).springify().damping(16)}
            style={[styles.cardWrap, { width: contentWidth }]}
            onLayout={onCardLayout}
          >
            {card}
          </Animated.View>
        </ScrollView>
        {/* never inside the scroller — see the note in the side-by-side branch */}
        <View style={[styles.ctaWrap, { width: contentWidth, paddingBottom: footPad }]}>{cta}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  flex: { flexShrink: 1 },
  ground: { position: 'absolute', left: 0, bottom: 0 },

  npc: { position: 'absolute', left: '5%' },

  /* everything under the picture stands on the pavement */
  below: { flex: 1, alignItems: 'center' },
  belowScroll: { marginTop: -OVERLAP, alignSelf: 'stretch' },
  scroll: { alignItems: 'center', paddingBottom: spacing.md },
  cardWrap: { paddingHorizontal: spacing.md },
  ctaWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },

  card: { gap: spacing.sm },

  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: roles.surface.muted,
    borderRadius: radii.tile,
    padding: spacing.xs,
  },
  whoText: { flex: 1, gap: 1 },
  whoAddress: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  facts: { flexDirection: 'row', gap: spacing.xs },
  fact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: hit.min - 12,
    backgroundColor: roles.surface.muted,
    borderRadius: radii.tile,
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
  },
  factText: { flex: 1 },

  practise: { alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  chip: { backgroundColor: palette.white, borderRadius: radii.tag, paddingHorizontal: 10, paddingVertical: 5 },
  chipTail: { alignSelf: 'center', paddingVertical: 5 },

  /* landscape */
  /* the neighbour stands out on the near pavement, in front of the shop */
  wideNpc: { position: 'absolute', left: '5%' },
  /* a fixed reading column pinned to the foot of the street. Absolute, so its
     own flexGrow can never eat the width meant for the picture — that is the
     tablet mistake in miniature (see useScaledLayout's header). */
  wideCol: { position: 'absolute', gap: spacing.md },
  /* bottom-aligned: the slack ends up as open street above the sheet */
  wideColInner: { justifyContent: 'flex-end', flexGrow: 1, paddingVertical: spacing.xs },
});
