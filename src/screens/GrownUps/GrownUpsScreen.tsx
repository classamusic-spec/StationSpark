import React, { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { palette, radii, shadows, spacing } from '@/theme';
import { Button, Chip, Panel, ScreenFrame, StarRow, Text, TopBar } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import type { Stars } from '@/minigames/types';
import { missionById } from '@/content/missions';
import { vocabulary } from '@/learning/vocabulary';
import { useGame } from '@/state/store';
import { useMastery, useRankInfo, useStats } from '@/state/selectors';
import { ProgressBar, SegmentedPills, Toggle, useScaledLayout } from '@/screens/shared';
import { AgeBandCards } from '@/screens/Locker/LockerScreen';
import { ParentGate } from './ParentGate';

/**
 * The safety card, verbatim from docs/ART_DIRECTION.md. These five lines are
 * the only real-world emergency guidance the app ever gives.
 */
const SAFETY_LINES = [
  'Get away from danger.',
  'Tell a grown-up.',
  'Follow emergency instructions.',
  'Call your local emergency number.',
  'Never hide from firefighters.',
] as const;

const SPANISH_OPTIONS = [
  { value: 'full' as const, label: 'Full' },
  { value: 'some' as const, label: 'Some' },
  { value: 'min' as const, label: 'Minimal' },
];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Panel tone="white" padding="md" radius="panel" style={styles.card}>
      <Text variant="h3">{title}</Text>
      {subtitle ? (
        <Text variant="small" color={palette.navySoft}>
          {subtitle}
        </Text>
      ) : null}
      {children}
    </Panel>
  );
}

function GrownUpsSettings() {
  const router = useRouter();
  const layout = useScaledLayout();
  const settings = useGame((s) => s.settings);
  const setSettings = useGame((s) => s.setSettings);
  const profile = useGame((s) => s.profile);
  const setProfile = useGame((s) => s.setProfile);
  const playedMissions = useGame((s) => s.progress.missions);
  const words = useGame((s) => s.progress.words);
  const resetAll = useGame((s) => s.resetAll);
  const mastery = useMastery();
  const stats = useStats();
  const rank = useRankInfo();

  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);

  const missionRows = useMemo(
    () =>
      Object.entries(playedMissions)
        .map(([id, m]) => ({ id, title: missionById(id)?.title ?? id, stars: m.stars as Stars, plays: m.plays }))
        .sort((a, b) => b.stars - a.stars),
    [playedMissions],
  );

  const wordRows = useMemo(() => {
    const byId = new Map(vocabulary.map((w) => [w.id, w]));
    return words.map((id) => byId.get(id) ?? { id, en: id, es: '', icon: '', category: 'actions' as const });
  }, [words]);

  const doReset = useCallback(() => {
    resetAll();
    sfx.play('whoosh');
    haptics.thud();
    setResetStep(0);
    router.replace('/onboarding');
  }, [resetAll, router]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { maxWidth: layout.contentWidth }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.header}>
        <Text variant="h1" center>
          For Grown-Ups
        </Text>
        <Text variant="body" color={palette.navySoft} center>
          Settings, progress and safety — all in one place.
        </Text>
      </Animated.View>

      {/* ── settings ─────────────────────────────────────────── */}
      <Section title="Sound & motion">
        <Toggle label="Sound effects" value={settings.sfx} onChange={(v) => setSettings({ sfx: v })} />
        <Toggle label="Character voices" value={settings.voice} onChange={(v) => setSettings({ voice: v })} />
        <Toggle
          label="Haptics"
          value={settings.haptics}
          onChange={(v) => setSettings({ haptics: v })}
          accessibilityHint={Platform.OS === 'web' ? 'Not available in the browser' : undefined}
        />
        <Toggle label="Reduce motion" value={settings.reduceMotion} onChange={(v) => setSettings({ reduceMotion: v })} />
      </Section>

      <Section title="Spanish support" subtitle="How much English scaffolding shows next to Spanish lines.">
        <SegmentedPills options={SPANISH_OPTIONS} value={settings.spanishSupport} onChange={(v) => setSettings({ spanishSupport: v })} tone={palette.purple} />
      </Section>

      <Section title="Age band" subtitle="Sets the difficulty of every generated challenge.">
        <AgeBandCards value={profile.ageBand} onChange={(b) => setProfile({ ageBand: b })} />
      </Section>

      {/* ── progress summary ─────────────────────────────────── */}
      <Section title="Progress" subtitle={`${rank.name} · Level ${rank.level} · ${rank.xp} XP`}>
        <View style={styles.statRow}>
          <Chip label={`${stats.missions} missions`} />
          <Chip label={`${stats.skills} games played`} />
          <Chip label={`${stats.recipes} recipes`} />
          <Chip label={`${stats.words} words`} />
          <Chip label={`${stats.badges} badges`} tone="green" />
        </View>
      </Section>

      <Section title="Skills practised" subtitle="Share of correct first attempts in each skill.">
        {mastery.length === 0 ? (
          <Text variant="small" color={palette.navySoft}>
            Nothing yet — skills appear here after the first few games.
          </Text>
        ) : (
          <View style={styles.masteryList}>
            {mastery.map((row) => (
              <View key={row.skill} style={styles.masteryRow}>
                <View style={styles.masteryHead}>
                  <Text variant="small">{row.label}</Text>
                  <Text variant="small" color={palette.navySoft}>
                    {Math.round(row.ratio * 100)}%
                  </Text>
                </View>
                <ProgressBar value={row.ratio} height={12} tone={palette.waterCyan} />
              </View>
            ))}
          </View>
        )}
      </Section>

      <Section title="Words learned" subtitle="Every word in Station Spark is bilingual.">
        {wordRows.length === 0 ? (
          <Text variant="small" color={palette.navySoft}>
            No words yet.
          </Text>
        ) : (
          <View style={styles.wordWrap}>
            {wordRows.map((w) => (
              <View key={w.id} style={styles.word}>
                <Text variant="small">{w.en}</Text>
                {w.es ? (
                  <Text variant="tiny" color={palette.purple}>
                    {w.es}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Section>

      <Section title="Missions" subtitle="Best star rating for each call.">
        {missionRows.length === 0 ? (
          <Text variant="small" color={palette.navySoft}>
            No missions completed yet.
          </Text>
        ) : (
          <View style={styles.missionList}>
            {missionRows.map((m) => (
              <View key={m.id} style={styles.missionRow}>
                <Text variant="small" numberOfLines={1} style={styles.missionTitle}>
                  {m.title}
                </Text>
                <StarRow stars={m.stars} size={18} />
              </View>
            ))}
          </View>
        )}
      </Section>

      {/* ── safety card ──────────────────────────────────────── */}
      <Panel tone="cream" padding="md" radius="panel" style={[styles.card, styles.safety]}>
        <Text variant="h3">If there is a real emergency</Text>
        <Text variant="small" color={palette.navySoft}>
          Station Spark is a game. It never teaches real fire procedure. These are the only real-world messages we give:
        </Text>
        <View style={styles.safetyList}>
          {SAFETY_LINES.map((line) => (
            <View key={line} style={styles.safetyRow}>
              <View style={styles.safetyDot} />
              <Text variant="bodyStrong">{line}</Text>
            </View>
          ))}
        </View>
        <Chip label="Ask a grown-up before cooking" tone="yellow" />
      </Panel>

      {/* ── reset ────────────────────────────────────────────── */}
      <Section title="Reset progress" subtitle="Clears badges, XP, Sparks, words and the profile on this device.">
        {resetStep === 0 ? (
          <Button label="Reset progress" tone="white" size="md" onPress={() => setResetStep(1)} />
        ) : resetStep === 1 ? (
          <View style={styles.resetRow}>
            <Text variant="small" color={palette.navySoft}>
              This cannot be undone. Are you sure?
            </Text>
            <View style={styles.resetButtons}>
              <Button label="Keep my progress" tone="green" size="sm" onPress={() => setResetStep(0)} />
              <Button label="Yes, reset" tone="white" size="sm" onPress={() => setResetStep(2)} />
            </View>
          </View>
        ) : (
          <View style={styles.resetRow}>
            <Text variant="bodyStrong">Last check — erase everything?</Text>
            <View style={styles.resetButtons}>
              <Button label="Cancel" tone="green" size="sm" onPress={() => setResetStep(0)} />
              <Button label="Erase everything" tone="navy" size="sm" onPress={doReset} />
            </View>
          </View>
        )}
      </Section>

      <Section title="About" subtitle="Station Spark 0.1.0">
        <Text variant="small" color={palette.navySoft}>
          No ads, no in-app purchases, no accounts. Sparks are earned by playing and only buy decorations for the station.
          {Platform.OS === 'web' ? ' You are playing in the browser — sound and haptics may be limited.' : ' Also plays in the browser.'}
        </Text>
      </Section>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
}

export function GrownUpsScreen() {
  const router = useRouter();
  const [passed, setPassed] = useState(false);

  const leave = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  return (
    <ScreenFrame mood="day" chrome={<TopBar onBack={leave} />}>
      {passed ? <GrownUpsSettings /> : <ParentGate onPass={() => setPassed(true)} onFail={leave} />}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  header: { marginTop: 56, gap: 4, alignItems: 'center', marginBottom: spacing.xs },
  card: { gap: spacing.xs },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  masteryList: { gap: spacing.xs },
  masteryRow: { gap: 4 },
  masteryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  word: { backgroundColor: palette.panel, borderRadius: radii.tag, paddingHorizontal: 10, paddingVertical: 6 },
  missionList: { gap: 6 },
  missionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  missionTitle: { flex: 1 },
  safety: { borderWidth: 3, borderColor: palette.tanDark, ...shadows.soft },
  safetyList: { gap: 6, marginTop: 2 },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  safetyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.engineRed },
  resetRow: { gap: spacing.xs },
  resetButtons: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  footerSpace: { height: spacing.lg },
});
