import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { hit, palette, radii, shadows, spacing, stagger } from '@/theme';
import { Button, Chip, GearIcon, Logo, Panel, RoundIconButton, ScreenFrame, StarIcon, Text, TopBar } from '@/ui';
import { CelebrationOverlay } from '@/characters';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import type { BadgeDef, BadgeId, StationUpgradeDef } from '@/content/types';
import { useGame } from '@/state/store';
import { useBadgeWall, useRankInfo, useRankLadder, useStats, useUpgradeBoard } from '@/state/selectors';
import { TownBackdrop } from '@/world';
import { BadgeShield, BottomBar, ModalCard, ProgressBar, SparksCounter, StatTile, useScaledLayout } from '@/screens/shared';
import { HelmetAvatar } from './HelmetAvatar';
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
};

const PencilIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Path d="M4 17.2 15.6 5.6l2.8 2.8L6.8 20H4z" fill="#2F6BD8" />
    <Path d="M16.8 4.4l1.6-1.6a1.6 1.6 0 0 1 2.3 0l.5.5a1.6 1.6 0 0 1 0 2.3l-1.6 1.6z" fill="#2F6BD8" />
  </Svg>
);

function SectionTitle({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text variant="h2">{title}</Text>
      {trailing ? (
        <Text variant="small" color={palette.navySoft}>
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}

function UpgradeRow({ entry, onBuy }: { entry: { def: StationUpgradeDef; owned: boolean; affordable: boolean }; onBuy: (d: StationUpgradeDef) => void }) {
  const { def, owned, affordable } = entry;
  return (
    <View style={[styles.upgradeRow, owned && styles.upgradeOwned]}>
      <View style={styles.upgradeText}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {def.name}
        </Text>
        <Text variant="small" color={palette.navySoft} numberOfLines={2}>
          {def.description}
        </Text>
      </View>
      {owned ? (
        <Chip label="Built" tone="green" glyph="check" />
      ) : (
        <View style={styles.buyCol}>
          <Chip label={String(def.cost)} tone="yellow" glyph="spark" />
          <Button label="Buy" size="sm" tone={affordable ? 'green' : 'white'} disabled={!affordable} onPress={() => onBuy(def)} />
        </View>
      )}
    </View>
  );
}

export function ProgressScreen() {
  const router = useRouter();
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

  const badgeSize = useMemo(() => {
    const cols = layout.contentWidth >= 460 ? 5 : 4;
    return Math.floor((layout.contentWidth - spacing.md * 2 - spacing.md * 2 - (cols - 1) * 10) / cols);
  }, [layout.contentWidth]);

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

  return (
    <ScreenFrame
      safeBottom={false}
      backdrop={<TownBackdrop hills={180} cloudCount={3} sun={false} />}
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { maxWidth: layout.contentWidth }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          <Logo size={Math.min(layout.s(176), 220)} />
        </View>

        {/* ── profile card ─────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.springify().damping(17)}>
          <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.profileLeft}>
                <HelmetAvatar helmet={profile.avatar.helmet} size={Math.min(layout.s(112), 132)} />
                <Chip label={rank.name} tone="yellow" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit profile"
                  onPress={() => {
                    sfx.play('tap');
                    haptics.tap();
                    router.push('/locker');
                  }}
                  style={styles.editBtn}
                  hitSlop={6}
                >
                  <PencilIcon />
                  <Text variant="buttonSmall" color="#2F6BD8">
                    Edit Profile
                  </Text>
                </Pressable>
              </View>

              <View style={styles.profileRight}>
                <Text variant="h1" numberOfLines={2}>
                  {profile.name?.trim() || 'Rookie'}
                </Text>
                <Text variant="small" color={palette.navySoft}>
                  Helping today for a brighter tomorrow!
                </Text>
                <View style={styles.levelRow}>
                  <Text variant="h3" numberOfLines={1} style={styles.levelText}>
                    Level {rank.level}
                  </Text>
                  <View style={styles.nextLevel}>
                    <Text variant="small" color={palette.navySoft} numberOfLines={1}>
                      {rank.nextName ? `Next: ${rank.nextName}` : 'Top rank!'}
                    </Text>
                    <StarIcon size={24} />
                  </View>
                </View>
                <ProgressBar value={rank.t} height={22} />
                <Text variant="small" color={palette.navySoft}>
                  {rank.span > 0 ? `${rank.into} / ${rank.span} XP` : `${rank.xp} XP`}
                </Text>
              </View>
            </View>
          </Panel>
        </Animated.View>

        {/* ── stats ────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(stagger.card).springify().damping(17)}>
          <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
            <SectionTitle title="Your Progress" trailing="Small steps. A bigger you!" />
            <View style={styles.statGrid}>
              <StatTile value={stats.missions} label={'Missions\nCompleted'} color={palette.engineRed} glyph={<TruckGlyph />} delayMs={120} />
              <StatTile value={stats.skills} label={'Skills\nPractised'} color={palette.orange} glyph={<ConeGlyph />} delayMs={200} />
              <StatTile value={stats.recipes} label={'Recipes\nCooked'} color="#3E8FE0" glyph={<ChefGlyph />} delayMs={280} />
              <StatTile value={stats.words} label={'Words\nLearned'} color={palette.leafGreen} glyph={<BookGlyph />} delayMs={360} />
            </View>
          </Panel>
        </Animated.View>

        {/* ── badges ───────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(stagger.card * 2).springify().damping(17)}>
          <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
            <SectionTitle title="Your Badges" trailing={`${wall.earnedCount} of ${wall.total} Earned`} />
            <View style={styles.badgeGrid}>
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
            </View>
          </Panel>
        </Animated.View>

        {/* ── rank ladder ──────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(stagger.card * 3).springify().damping(17)}>
          <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
            <SectionTitle title="Your Ranks" trailing="Cadet → Community Hero" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ladder}>
              {ladder.map((r) => (
                <View
                  key={r.name}
                  style={[styles.rung, r.reached && styles.rungReached, r.current && [styles.rungCurrent, shadows.glowGold]]}
                >
                  <Text variant="buttonSmall" color={r.current ? palette.navy : r.reached ? palette.navy : palette.slate} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text variant="tiny" color={r.current ? palette.goldDark : palette.navyMuted}>
                    {r.minXp} XP
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Panel>
        </Animated.View>

        {/* ── station board ────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(stagger.card * 4).springify().damping(17)}>
          <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
            <View style={styles.sectionHead}>
              <Text variant="h2">Station Board</Text>
              <SparksCounter />
            </View>
            <Text variant="small" color={palette.navySoft}>
              Sparks come from playing. Spend them on things to make the station yours.
            </Text>
            <View style={styles.upgrades}>
              {board.entries.map((e) => (
                <UpgradeRow key={e.def.id} entry={e} onBuy={onBuy} />
              ))}
            </View>
          </Panel>
        </Animated.View>

        <View style={styles.footerSpace} />
      </ScrollView>

      <ModalCard
        visible={!!openBadge}
        title={openBadge?.name ?? ''}
        subtitle={openBadge?.nameEs}
        onClose={() => setOpenBadge(null)}
      >
        {openBadge ? (
          <View style={styles.badgeModal}>
            <BadgeShield name={openBadge.name} color={openBadge.color} icon={openBadge.icon} earned={openEarned} size={104} />
            <Text variant="body" center>
              {openBadge.description}
            </Text>
            <Chip label={openEarned ? 'Earned!' : `How to earn: ${HOW_TO[openBadge.id] ?? 'Keep playing missions and games!'}`} tone={openEarned ? 'green' : 'cream'} />
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
  logo: { alignItems: 'center', marginTop: 52 },
  card: { gap: spacing.sm },
  profileRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  profileLeft: { alignItems: 'center', gap: spacing.xs },
  profileRight: { flex: 1, gap: 6, minWidth: 150 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: hit.min,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: '#DCEBFF',
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, flexWrap: 'wrap' },
  levelText: { flexShrink: 0 },
  nextLevel: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, flexWrap: 'wrap' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' },
  ladder: { gap: spacing.xs, paddingVertical: 4, paddingHorizontal: 2 },
  rung: {
    minWidth: 118,
    minHeight: hit.min,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.tile,
    backgroundColor: '#EDF0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rungReached: { backgroundColor: palette.mint },
  rungCurrent: { backgroundColor: palette.safetyYellow },
  upgrades: { gap: spacing.xs },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.sm,
    minHeight: 76,
  },
  upgradeOwned: { backgroundColor: '#EFF9EF' },
  upgradeText: { flex: 1, gap: 2 },
  buyCol: { alignItems: 'flex-end', gap: 6 },
  badgeModal: { alignItems: 'center', gap: spacing.sm },
  footerSpace: { height: spacing.lg },
});
