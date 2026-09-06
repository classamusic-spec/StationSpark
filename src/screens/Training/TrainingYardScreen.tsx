/**
 * TRAINING YARD — practise any station, any time, no mission attached.
 *
 * Every registered mini-game with `meta.yard === 'training'` gets a tile,
 * grouped under cream yard signs by subject, standing on the grass of the
 * obstacle course behind the firehouse. Nothing is locked and nothing is
 * timed; the yard is where a child goes to get good at a thing.
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { SkillTag } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import type { MiniGameMeta, Stars } from '@/minigames/types';
import { listMiniGames } from '@/minigames/registry';
import { palette, spacing, stagger, subjectColors, type SubjectId } from '@/theme';
import { useShift } from '@/hooks/useShift';
import { useGame } from '@/state/store';
import { Button, Logo, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { subjectLabel } from '@/ui/SubjectPill';
import { CharacterPortrait } from '@/characters';
import { StarCounter } from '@/screens/Mission/StarCounter';
import { SignBoard } from '@/screens/Locker/parts/SignBoard';
import { TrainingBackdrop } from './TrainingBackdrop';
import { TrainingStationTile } from './TrainingStationTile';
import { YardSign } from './parts/YardSign';

/** The order subjects appear on the board. */
const SUBJECT_ORDER: SubjectId[] = ['math', 'reading', 'english', 'spanish', 'logic', 'teamwork', 'cooking'];

type Mastery = Partial<Record<SkillTag, { attempts: number; correct: number }>>;

/**
 * How confidently is this station going? The store keeps play counts and
 * per-skill mastery, not per-game bests, so we read the skills the game
 * exercises. Never played = 0 stars (the tile shows "New!" instead).
 */
export function stationStars(kind: MiniGameMeta['kind'], plays: number, mastery: Mastery): Stars {
  if (plays <= 0) return 0;
  const skills = challengeSkills[kind] ?? [];
  let attempts = 0;
  let correct = 0;
  for (const s of skills) {
    const m = mastery[s];
    if (m) {
      attempts += m.attempts;
      correct += m.correct;
    }
  }
  if (attempts === 0) return 1;
  const ratio = correct / attempts;
  return ratio >= 0.85 ? 3 : ratio >= 0.55 ? 2 : 1;
}

export function TrainingYardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const gamesPlayed = useGame((s) => s.progress.gamesPlayed);
  const mastery = useGame((s) => s.progress.mastery);
  const xp = useGame((s) => s.progress.xp);
  const shift = useShift();

  const stations = useMemo(() => listMiniGames('training').map((e) => e.meta), []);

  const groups = useMemo(() => {
    const bySubject = new Map<SubjectId, MiniGameMeta[]>();
    for (const meta of stations) {
      const subject: SubjectId = meta.subjects[0] ?? 'logic';
      const list = bySubject.get(subject);
      if (list) list.push(meta);
      else bySubject.set(subject, [meta]);
    }
    return SUBJECT_ORDER.filter((s) => bySubject.has(s)).map((s) => ({ subject: s, metas: bySubject.get(s) ?? [] }));
  }, [stations]);

  return (
    <ScreenFrame
      backdrop={<TrainingBackdrop />}
      chrome={<TopBar right={<StarCounter stars={shift.starsEarned} />} />}
      safeBottom={false}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoRow} pointerEvents="none">
          <Logo size={160} tagline={false} />
        </View>

        {/* the yard's name board, hanging from the bunting */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.titleWrap}>
          <SignBoard hang>
            <View style={styles.titleText}>
              <Text variant="h2" center>
                Training Yard
              </Text>
              <Text variant="small" color={palette.navySoft} center>
                Practise anything, any time!
              </Text>
            </View>
          </SignBoard>
        </Animated.View>

        {stations.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Panel tone="white" radius="panel" style={styles.empty}>
              <CharacterPortrait id="rookie" emotion="happy" size={96} />
              <Text variant="h1" center>
                Stations are being built!
              </Text>
              <Text variant="body" color={palette.navySoft} center>
                The crew is still setting out the cones. Come back soon — or take a call from Dispatch.
              </Text>
              <Button label="Go to Dispatch ›" tone="green" size="lg" block onPress={() => router.push('/dispatch')} />
            </Panel>
          </Animated.View>
        ) : (
          groups.map((group, gi) => (
            <View key={group.subject} style={styles.group}>
              <Animated.View entering={FadeInDown.delay(gi * stagger.card).springify().damping(16)} style={styles.signRow}>
                <YardSign label={subjectLabel(group.subject)} count={group.metas.length} glyph={`subject-${group.subject}`} color={subjectColors[group.subject].bg} />
              </Animated.View>
              <View style={styles.grid}>
                {group.metas.map((meta, i) => {
                  const plays = gamesPlayed[meta.kind] ?? 0;
                  return (
                    <TrainingStationTile
                      key={meta.kind}
                      meta={meta}
                      index={i}
                      plays={plays}
                      stars={stationStars(meta.kind, plays, mastery)}
                      onPress={() => router.push({ pathname: '/training/[kind]', params: { kind: meta.kind } })}
                    />
                  );
                })}
              </View>
            </View>
          ))
        )}

        {stations.length > 0 ? (
          <View style={styles.footer}>
            <SignBoard compact>
              <Text variant="small" color={palette.navySoft} center>
                {`Every station you finish adds 5 XP. You have ${xp} XP.`}
              </Text>
            </SignBoard>
          </View>
        ) : null}
      </ScrollView>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.md, gap: spacing.md, paddingTop: spacing.xs },
  logoRow: { alignItems: 'center' },
  /** the ropes reach up to the bunting line in the backdrop */
  titleWrap: { alignItems: 'center', marginTop: 14 },
  titleText: { alignItems: 'center', paddingHorizontal: spacing.xs },
  empty: { alignItems: 'center', gap: spacing.sm },
  group: { gap: spacing.xs },
  signRow: { alignSelf: 'flex-start', marginLeft: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { alignItems: 'center', marginTop: spacing.xs },
});
