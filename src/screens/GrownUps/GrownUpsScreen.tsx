/**
 * FOR GROWN-UPS — settings, the progress report and the safety poster,
 * behind a one-question parent gate. Calm and adult, still on the station's
 * paper: every section is a sheet from the office, the safety lines hang in
 * a wooden frame, and Captain Bea waits beside the gate.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { palette, radii, spacing, stagger } from '@/theme';
import { Button, ScreenFrame, SegmentedPills, Text, Toggle, TopBar } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import type { Stars } from '@/minigames/types';
import { missionById } from '@/content/missions';
import { vocabulary } from '@/learning/vocabulary';
import { useGame } from '@/state/store';
import { useMastery, useRankInfo, useStats } from '@/state/selectors';
import { useScaledLayout } from '@/screens/shared';
import { AgeBandCards } from '@/screens/Locker/LockerScreen';
import { GrownUpsBackdrop } from './parts/GrownUpsBackdrop';
import { Paper } from './parts/Paper';
import { ReportCard } from './parts/ReportCard';
import { SafetyPoster } from './parts/SafetyPoster';
import { ParentGate } from './ParentGate';

const SPANISH_OPTIONS = [
  { id: 'full' as const, label: 'Full' },
  { id: 'some' as const, label: 'Some' },
  { id: 'min' as const, label: 'Minimal' },
];

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

  const enter = (i: number) => FadeInDown.delay(i * stagger.card).springify().damping(18);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { maxWidth: layout.contentWidth }]} showsVerticalScrollIndicator={false}>
      <Animated.View entering={enter(0)} style={styles.header}>
        <Text variant="h1" center>
          For Grown-Ups
        </Text>
        <Text variant="body" color={palette.navySoft} center>
          Settings, progress and safety — all in one place.
        </Text>
      </Animated.View>

      {/* ── settings ─────────────────────────────────────────── */}
      <Animated.View entering={enter(1)}>
        <Paper tab="SETTINGS" title="Sound & motion">
          <Toggle label="Sound effects" hint="Taps, chimes and the station bell" value={settings.sfx} onChange={(v) => setSettings({ sfx: v })} />
          <Toggle label="Character voices" hint="Captain Bea, Beacon and the neighbours speak" value={settings.voice} onChange={(v) => setSettings({ voice: v })} />
          <Toggle
            label="Haptics"
            hint={Platform.OS === 'web' ? 'Not available in the browser' : 'A little buzz on every tap'}
            value={settings.haptics}
            onChange={(v) => setSettings({ haptics: v })}
          />
          <Toggle label="Reduce motion" hint="Calmer screens: fewer drifting, swaying things" value={settings.reduceMotion} onChange={(v) => setSettings({ reduceMotion: v })} />
        </Paper>
      </Animated.View>

      <Animated.View entering={enter(2)}>
        <Paper
          tab="LANGUAGE"
          tabColor={palette.purpleSoft}
          title="Spanish support"
          subtitle="How much English shows beside Spanish lines: all of it, help on new words only, or Spanish on its own."
        >
          <SegmentedPills options={SPANISH_OPTIONS} value={settings.spanishSupport} onChange={(v) => setSettings({ spanishSupport: v })} color={palette.purple} />
        </Paper>
      </Animated.View>

      <Animated.View entering={enter(3)}>
        <Paper tab="LEARNING" tabColor="#FFE9A8" title="Age band" subtitle="Sets the difficulty of every generated challenge.">
          <AgeBandCards value={profile.ageBand} onChange={(b) => setProfile({ ageBand: b })} />
        </Paper>
      </Animated.View>

      {/* ── progress report ──────────────────────────────────── */}
      <Animated.View entering={enter(4)}>
        <ReportCard
          name={profile.name?.trim() || 'Rookie'}
          rankName={rank.name}
          level={rank.level}
          xp={rank.xp}
          stats={stats}
          mastery={mastery}
          missions={missionRows}
        />
      </Animated.View>

      <Animated.View entering={enter(5)}>
        <Paper tab="WORDS" tabColor={palette.pinkSoft} title="Words learned" subtitle="Every word in Station Spark is bilingual.">
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
        </Paper>
      </Animated.View>

      {/* ── safety poster ────────────────────────────────────── */}
      <Animated.View entering={enter(6)}>
        <SafetyPoster />
      </Animated.View>

      {/* ── reset ────────────────────────────────────────────── */}
      <Animated.View entering={enter(7)}>
        <Paper tab="DEVICE" title="Reset progress" subtitle="Clears badges, XP, Sparks, words and the profile on this device.">
          {resetStep === 0 ? (
            <Button label="Reset progress" tone="white" size="md" onPress={() => setResetStep(1)} style={styles.resetBtn} />
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
        </Paper>
      </Animated.View>

      <Animated.View entering={enter(8)}>
        <Paper tab="ABOUT" title="Station Spark 0.1.0">
          <Text variant="small" color={palette.navySoft}>
            No ads, no in-app purchases, no accounts. Sparks are earned by playing and only buy decorations for the station.
            {Platform.OS === 'web' ? ' You are playing in the browser — sound and haptics may be limited.' : ' Also plays in the browser.'}
          </Text>
        </Paper>
      </Animated.View>

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
    <ScreenFrame mood="day" backdrop={<GrownUpsBackdrop bea={!passed} />} chrome={<TopBar onBack={leave} />}>
      {passed ? <GrownUpsSettings /> : <ParentGate onPass={() => setPassed(true)} onFail={leave} />}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  header: { marginTop: 56, gap: 4, alignItems: 'center', marginBottom: spacing.xs },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  word: { backgroundColor: palette.panel, borderRadius: radii.tag, paddingHorizontal: 10, paddingVertical: 6 },
  resetBtn: { alignSelf: 'flex-start' },
  resetRow: { gap: spacing.xs },
  resetButtons: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  footerSpace: { height: spacing.xl },
});
