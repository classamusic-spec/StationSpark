/**
 * PROGRESS — the STATION BOARD.
 *
 * The child's name badge and four cork boards (progress, badges, ranks, the
 * Sparks shop) pinned to the cream station wall, with the town peeking over
 * the cornice. Phone stacks the boards; tablets hang them in two columns.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, spacing, stagger } from '@/theme';
import { BadgeArt, Chip, GearIcon, Logo, RoundIconButton, ScreenFrame, StationBoard, Text, TopBar } from '@/ui';
import { CelebrationOverlay } from '@/characters';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import type { BadgeDef, BadgeId, StationUpgradeDef } from '@/content/types';
import { useGame } from '@/state/store';
import { useBadgeWall, useRankInfo, useRankLadder, useStats, useUpgradeBoard } from '@/state/selectors';
import { BadgeShield, BottomBar, ModalCard, SparksCounter, useScaledLayout } from '@/screens/shared';
import { NameBadge } from './parts/NameBadge';
import { RankLadder } from './parts/RankLadder';
import { ShopShelf } from './parts/ShopShelf';
import { StatTile } from './parts/StatTile';
import { StationWall } from './parts/StationWall';
import { BookGlyph, ChefGlyph, ConeGlyph, TruckGlyph } from './StatGlyphs';

/** How each badge is earned, in kid words. */
const HOW_TO: Partial<Record<BadgeId, string>> = {
  'first-shift': 'Finish your very first call.',
  'number-navigator': 'Play 5 number games.',
  'fraction-firefighter': 'Play 3 fraction games.',
  'hose-hero': 'Play Hose Hero 3 times.',
  'word-watcher': 'Learn 20 new words.',
  'spanish-speaker': 'Learn 10 Spanish words.',
  'recipe-rescuer': 'Cook 3 recipes in the kitchen.',
  'map-master': 'Plan 3 routes across Spark City.',
  'pattern-pro': 'Play 3 spray-pattern games.',
  'team-player': 'Come back for 3 different shifts.',
  'community-helper': 'Finish every mission in Spark City.',
  'kitchen-pro': 'Cook 5 recipes in the kitchen.',
  'ladder-legend': 'Play 3 ladder games.',
  'time-keeper': 'Play 3 clock games.',
  'time-traveler': 'Play 5 clock games.',
  'shape-shaper': 'Play 3 shape games.',
  'chef-de-station': 'Cook every recipe in the book.',
  'bilingual-buddy': 'Learn 30 Spanish words.',
};

const STAT_BLUE = '#3E8FE0';

export function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useScaledLayout();
  const profile = useGame((s) => s.profile);
  const buyUpgrade = useGame((s) => s.buyUpgrade);
  const rank = useRankInfo();
  const ladder = useRankLadder();
  const stats = useStats();
  const wall = useBadgeWall();
  const board = useUpgradeBoard();

  const [openBadge, setOpenBadge] = useState<BadgeDef | null>(null);
  const [openEarned, setOpenEarned] = useState(false);
  const [bought, setBought] = useState<StationUpgradeDef | null>(null);

  /* ── layout: one column on phones; on tablets the progress and rank boards
   *    hang side by side, then the badge wall and the shop run full width ── */
  const twoCol = layout.width >= 700;
  const maxWidth = twoCol ? Math.min(layout.width - spacing.lg * 2, 940) : layout.contentWidth;
  /* The bottom bar already says where you are; the mark just needs to greet. */
  const logoSize = twoCol ? 132 : Math.min(layout.s(104), 120);
  const logoHeight = logoSize * 0.86 + 23;
  const wallTop = insets.top + 6 + logoHeight + 14;
  const fullWidth = maxWidth - spacing.md * 2;

  /**
   * Badge cells: the wood frame (12) and board padding (16) each side, minus
   * the 6 px the grid claws back, split into columns. Three across on a phone
   * is the narrowest cell that still fits "Firefighter" on one plaque line.
   */
  const badgeCols = twoCol ? 6 : 3;
  const badgeSize = useMemo(() => {
    const inner = fullWidth - 12 * 2 - spacing.md * 2 + 12;
    return Math.max(56, Math.floor((inner - (badgeCols - 1) * spacing.sm) / badgeCols) - 12);
  }, [badgeCols, fullWidth]);
  const shopCols: 2 | 3 | 4 = twoCol ? 4 : fullWidth >= 470 ? 3 : 2;

  const onBuy = useCallback(
    (def: StationUpgradeDef) => {
      const ok = buyUpgrade(def.id, def.cost);
      if (!ok) return;
      sfx.play('level-up');
      sfx.play('sparkle');
      haptics.celebrate();
      setBought(def);
    },
    [buyUpgrade],
  );

  const progressBoard = (
    <Animated.View entering={FadeInDown.delay(stagger.card).springify().damping(17)}>
      <StationBoard title="Your Progress" plain>
        <Text variant="small" color={palette.navySoft}>
          Small steps. A bigger you!
        </Text>
        <View style={styles.statGrid}>
          <StatTile value={stats.missions} label={'Missions\nCompleted'} color={palette.engineRed} glyph={<TruckGlyph />} delayMs={120} wide={twoCol} />
          <StatTile value={stats.skills} label={'Skills\nPractised'} color={palette.orange} glyph={<ConeGlyph />} delayMs={200} wide={twoCol} />
          <StatTile value={stats.recipes} label={'Recipes\nCooked'} color={STAT_BLUE} glyph={<ChefGlyph />} delayMs={280} wide={twoCol} />
          <StatTile value={stats.words} label={'Words\nLearned'} color={palette.leafGreen} glyph={<BookGlyph />} delayMs={360} wide={twoCol} />
        </View>
      </StationBoard>
    </Animated.View>
  );

  const badgesBoard = (
    <Animated.View entering={FadeInDown.delay(stagger.card * 2).springify().damping(17)}>
      <StationBoard title="Your Badges" meta={`${wall.earnedCount} of ${wall.total} earned`} contentStyle={styles.badgeGrid}>
        {wall.entries.map((e, i) => (
          <BadgeShield
            key={e.def.id}
            name={e.def.name}
            color={e.def.color}
            icon={e.def.icon}
            earned={e.earned}
            size={badgeSize}
            index={i}
            onPress={() => {
              setOpenBadge(e.def);
              setOpenEarned(e.earned);
            }}
          />
        ))}
      </StationBoard>
    </Animated.View>
  );

  const ranksBoard = (
    <Animated.View entering={FadeInDown.delay(stagger.card * 3).springify().damping(17)}>
      {/* The name badge above already carries the level and the XP bar, so this
          board names only what comes next — one progress story, not two. */}
      <StationBoard title="Your Ranks" meta={rank.nextName ? `Next: ${rank.nextName}` : 'Top rank!'} plain>
        <Text variant="small" color={palette.navySoft}>
          Every mission, recipe and practice climbs you one rung closer to Community Hero.
        </Text>
        <RankLadder ladder={ladder} />
      </StationBoard>
    </Animated.View>
  );

  const shopBoard = (
    <Animated.View entering={FadeInDown.delay(stagger.card * 4).springify().damping(17)}>
      <StationBoard title="Sparks Shop" plain>
        <View style={styles.shopHead}>
          <Text variant="small" color={palette.navySoft} style={styles.shopBlurb}>
            Sparks come from playing. Spend them on things that make the station yours.
          </Text>
          <SparksCounter />
        </View>
        <ShopShelf entries={board.entries} columns={shopCols} onBuy={onBuy} />
      </StationBoard>
    </Animated.View>
  );

  return (
    <ScreenFrame
      safeBottom={false}
      backdrop={<StationWall top={wallTop} />}
      chrome={
        <TopBar
          right={
            <RoundIconButton accessibilityLabel="Settings" onPress={() => router.push({ pathname: '/grownups', params: { section: 'settings' } })}>
              <GearIcon />
            </RoundIconButton>
          }
        />
      }
    >
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { maxWidth }]} showsVerticalScrollIndicator={false}>
        <View style={styles.logo}>
          <Logo size={logoSize} />
        </View>

        <View style={styles.badgeWrap}>
          <NameBadge
            name={profile.name?.trim() || 'Rookie'}
            avatar={profile.avatar}
            rankName={rank.name}
            level={rank.level}
            nextName={rank.nextName}
            t={rank.t}
            into={rank.into}
            span={rank.span}
            xp={rank.xp}
            avatarSize={Math.min(layout.s(108), 128)}
            onEdit={() => router.push('/locker')}
          />
        </View>

        {twoCol ? (
          <>
            <View style={styles.columns}>
              <View style={styles.column}>{ranksBoard}</View>
              <View style={styles.column}>{progressBoard}</View>
            </View>
            {badgesBoard}
            {shopBoard}
          </>
        ) : (
          <>
            {/* rank first, then the wall the screen is named for, then the
                supporting numbers */}
            {ranksBoard}
            {badgesBoard}
            {progressBoard}
            {shopBoard}
          </>
        )}

        <View style={styles.footerSpace} />
      </ScrollView>

      <ModalCard visible={!!openBadge} title={openBadge?.name ?? ''} subtitle={openBadge?.nameEs} onClose={() => setOpenBadge(null)}>
        {openBadge ? (
          <View style={styles.badgeModal}>
            <BadgeArt color={openBadge.color} icon={openBadge.icon} size={118} locked={!openEarned} />
            <Text variant="body" center>
              {openBadge.description}
            </Text>
            <Chip
              label={openEarned ? 'Earned!' : `How to earn: ${HOW_TO[openBadge.id] ?? 'Keep playing missions and games!'}`}
              tone={openEarned ? 'green' : 'cream'}
              glyph={openEarned ? 'check' : undefined}
            />
          </View>
        ) : null}
      </ModalCard>

      <CelebrationOverlay
        visible={!!bought}
        title="New for the station!"
        subtitle={bought ? `${bought.name} — ${bought.description}` : undefined}
        ctaLabel="Nice!"
        onNext={() => setBought(null)}
      />

      <BottomBar active="progress" />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  logo: { alignItems: 'center', marginTop: 6 },
  /** hangs just under the cornice of the wall */
  badgeWrap: { marginTop: 30 },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  column: { flex: 1, gap: spacing.md },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  /** claws 6 px back from the board padding each side so three plaques fit a phone */
  badgeGrid: { justifyContent: 'flex-start', rowGap: spacing.sm, marginHorizontal: -6 },
  shopHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  shopBlurb: { flex: 1 },
  badgeModal: { alignItems: 'center', gap: spacing.sm },
  footerSpace: { height: spacing.xl + spacing.lg },
});
