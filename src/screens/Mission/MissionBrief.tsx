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
 *   ┌────────────────┐             ┌────────────┬───────────────┐
 *   │   storefront   │             │            │  cream card   │
 *   │    + Rosa      │             │ storefront │  who · where  │
 *   ├────────────────┤             │  + Rosa    │  jobs · time  │
 *   │  cream card    │             │            │  practising   │
 *   │  who · where   │             │            │ ┌───────────┐ │
 *   │  jobs · time   │             │            │ │ Get Ready │ │
 *   │  practising    │             ├────────────┴───────────────┤
 *   ├────────────────┤             │ ▒▒▒▒▒▒ pavement ▒▒▒▒▒▒▒▒▒▒ │
 *   │ ▒▒ pavement ▒▒ │             └────────────────────────────┘
 *   │ [ Get Ready! ] │
 *   └────────────────┘
 *
 * A tablet gets more *content*, not wider chrome: the reading column stays at
 * `contentWidth` and the width it does not need goes to the picture, which is
 * the one thing on the screen that genuinely wants to be big (see the header of
 * `src/screens/shared/useScaledLayout.ts`).
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
import { hit, palette, radii, roles, shadows, spacing } from '@/theme';
import { speech } from '@/services/speech';
import { Button, Panel, Text } from '@/ui';
import { ChevronRightIcon } from '@/ui/icons';
import { GlyphIcon } from '@/ui/kit';
import { subjectLabel, subjectSentence } from '@/ui/SubjectPill';
import { CharacterPortrait, Npc, type NpcVariant } from '@/characters';
import { useScaledLayout } from '@/screens/shared';
import { skillLabels } from './MissionRecap';
import { SceneHero, sceneStyles } from './SceneHero';

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

/** the storefront never gets smaller than this, whatever the copy does */
const MIN_HERO = 196;
/** how far the card laps over the bottom of the picture */
const OVERLAP = 26;
/** `Button size="xl"` — face + edge */
const CTA_HEIGHT = 85;
/**
 * `SceneHero bleed` carries sky above the roof and pavement below the kerb, and
 * it is sliced to fill, so the whole storefront survives in any box between
 * about 1 : 2 and 6 : 5. Outside that the roof goes over the top edge — hence
 * the clamps on `heroH` and the side-by-side layout in landscape, where a
 * full-width strip of picture would be far too short to hold a building.
 */
const HERO_ASPECT = { min: 0.5, max: 1.1 } as const;

function AddressPin({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2c-4 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3-7-7-7z" fill={palette.engineRed} />
      <Circle cx={12} cy={9} r={2.8} fill={palette.white} />
    </Svg>
  );
}

/**
 * THE GROUND THE BRIEF STANDS ON.
 *
 * The storefront's own pavement, carried on down to the bottom edge of the
 * screen in the scene's own colours, so the foot of the brief is a near plane
 * with paving seams and a soft contact shadow rather than a band of raw sky.
 *
 * Stacked, `sky` is 0 and the band picks the pavement up exactly where the
 * picture put it down — deliberately with no kerb lip, because a second edge
 * across the same pavement reads as a step. Side by side, `sky` is the height
 * of the sky above the horizon and the band draws the whole plate: sky, a flat
 * far bank, the lip, and the near ground the picture and the pill stand on.
 */
function GroundBand({ scene, width, height, sky = 0 }: { scene: SceneId; width: number; height: number; sky?: number }) {
  const s = sceneStyles[scene] ?? sceneStyles.bakery;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const gy = Math.round(Math.min(Math.max(sky, 0), h));

  /* every repeated shape in one Path — the shape budget in Stage.tsx */
  const seams = useMemo(() => {
    const step = Math.max(84, Math.round(w / 5));
    let d = `M 0 ${Math.round(gy + (h - gy) * 0.46)} L ${w} ${Math.round(gy + (h - gy) * 0.46)} `;
    for (let x = step; x < w; x += step) d += `M ${x} ${gy} L ${x} ${h} `;
    return d;
  }, [gy, h, w]);

  return (
    <Svg width={w} height={h} style={styles.ground} pointerEvents="none">
      <Defs>
        <LinearGradient id="briefSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={s.sky[0]} />
          <Stop offset="1" stopColor={s.sky[1]} />
        </LinearGradient>
        <LinearGradient id="briefGround" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={s.ground} />
          <Stop offset="1" stopColor={s.groundShade} />
        </LinearGradient>
      </Defs>
      {gy > 0 ? (
        <>
          <Rect x={0} y={0} width={w} height={gy} fill="url(#briefSky)" />
          {/* the far bank: palest, flattest layer, so the horizon is never a hard line */}
          <Rect x={0} y={gy - 30} width={w} height={30} fill={s.far?.[1] ?? s.sky[1]} opacity={0.55} />
        </>
      ) : null}
      <Rect x={0} y={gy} width={w} height={h - gy} fill="url(#briefGround)" />
      {/* the kerb: what is behind drops onto the plane the child stands on. A
          bare colour change here reads as a seam; an edge reads as a street. */}
      <Rect x={0} y={gy} width={w} height={3} fill="rgba(31,42,90,0.14)" />
      <Rect x={0} y={gy + 3} width={w} height={5} fill={s.lip ?? s.ground} />
      <Path d={seams} stroke="rgba(31,42,90,0.06)" strokeWidth={2} fill="none" />
      {/* the card's contact shadow, pooling on the pavement under its lower edge */}
      {gy > 0 ? null : <Ellipse cx={w / 2} cy={10} rx={w * 0.44} ry={16} fill={palette.navy} opacity={0.07} />}
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
   * In landscape a full-width band of picture is only ever a couple of hundred
   * px tall — far too short a box for a building — so past this the picture and
   * the reading column stand side by side and the extra width becomes a bigger
   * storefront, never a wider paragraph.
   */
  const wide = layout.landscape && width >= 720;
  /** a short phone drops the practice chips rather than pushing the CTA off */
  const dense = height < 740;
  /** and a narrow one keeps them to a single row, so the picture keeps its share */
  const chipCount = contentWidth >= 460 ? 4 : 2;
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
  /**
   * Side by side: the reading column is capped and the picture takes the rest.
   * The panel stops on the horizon and the neighbour steps out of it onto the
   * near pavement, so the foreground has a subject instead of being the widest
   * empty plane on the screen.
   */
  const colW = Math.min(contentWidth, Math.round(width * 0.46));
  const horizon = Math.round(height * 0.62);
  const panelH = Math.round(Math.max(200, Math.min(horizon - spacing.lg + 12, height - footPad - spacing.lg * 2)));

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
            {mission.npcName ? `${mission.npcName} is waiting` : `The ${place} needs us`}
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
            {plan.skills.length > chipCount ? (
              <View style={styles.chip}>
                <Text variant="tiny" color={roles.ink.muted}>{`+${plan.skills.length - chipCount}`}</Text>
              </View>
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

  /* ---- side by side: the width goes to the picture, not to the chrome ---- */
  if (wide) {
    return (
      <View style={[styles.root, { backgroundColor: sky }]}>
        <GroundBand scene={mission.scene} width={width} height={height} sky={Math.round(height * 0.62)} />
        <View style={[styles.wideRow, { paddingBottom: footPad + spacing.lg }]}>
          <View style={styles.wideHero}>
            <Animated.View entering={FadeIn.duration(360)} style={[styles.heroPanel, shadows.card, { height: panelH }]}>
              <SceneHero scene={mission.scene} radius={radii.panel} style={styles.fill} />
            </Animated.View>
            <View style={styles.wideNpc} pointerEvents="none">
              <Npc variant={npc} size={Math.round(Math.min(panelH * 0.44, height * 0.28))} emotion="worried" pose="wave" />
            </View>
          </View>

          {/* the pill lives outside the scroller: on a short landscape phone the
              card is taller than the column, and a "Get Ready!" a child has to
              scroll to find is a dead end by another name */}
          <View style={[styles.wideCol, { width: colW }]}>
            <ScrollView contentContainerStyle={styles.wideColInner} showsVerticalScrollIndicator={false}>
              <Animated.View entering={FadeInUp.delay(120).springify().damping(16)}>{card}</Animated.View>
            </ScrollView>
            {cta}
          </View>
        </View>
      </View>
    );
  }

  /* ---- stacked: picture, card, pavement, CTA ---- */
  return (
    <View style={[styles.root, { backgroundColor: sky }]}>
      <Animated.View entering={FadeIn.duration(360)} style={{ height: heroH }}>
        <SceneHero scene={mission.scene} radius={0} bleed style={styles.fill} />
        <View style={[styles.npc, { bottom: Math.round(heroH * 0.06) }]} pointerEvents="none">
          <Npc variant={npc} size={Math.round(Math.min(heroH * 0.36, width * 0.32))} emotion="worried" pose="wave" />
        </View>
      </Animated.View>

      <View style={styles.below}>
        <GroundBand scene={mission.scene} width={width} height={Math.max(1, height - heroH)} />
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

  /* side-by-side */
  wideRow: { flex: 1, flexDirection: 'row', alignItems: 'stretch', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  wideHero: { flex: 1 },
  heroPanel: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden', borderRadius: radii.panel },
  /* the neighbour steps out of the picture and stands on the near pavement */
  wideNpc: { position: 'absolute', left: '8%', bottom: 0 },
  /* a fixed reading column: without this the column's own flexGrow eats the
     space meant for the picture, which is the tablet mistake in miniature */
  wideCol: { flexGrow: 0, flexShrink: 0, justifyContent: 'center', gap: spacing.md },
  wideColInner: { justifyContent: 'center', flexGrow: 1, paddingVertical: spacing.xs },
});
