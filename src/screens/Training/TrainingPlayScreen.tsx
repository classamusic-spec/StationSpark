/**
 * TRAINING PLAY — one station, on repeat.
 *
 * A fresh challenge is generated for the child's age band, the game runs in
 * `compact` mode (no story chrome), and finishing pops a small celebration with
 * "Play again" (new seed) and "Back to yard". Five XP per finish, every time —
 * practice always pays.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { ChallengeKind } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import { generateChallenge } from '@/learning/generators';
import type { MiniGameResult } from '@/minigames/types';
import { getMiniGame } from '@/minigames/registry';
import { palette, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useGame } from '@/state/store';
import { ActivityChromeProvider, Button, ScreenFrame, Text } from '@/ui';
import { CelebrationOverlay } from '@/characters';
import { MiniGameStage, type MinigameBeat } from '@/screens/Mission/MiniGameStage';
import { UnderConstructionCard } from '@/screens/Mission/UnderConstructionCard';

/** XP for finishing a practice round — the same whatever the stars. */
export const TRAINING_XP = 5;

const isChallengeKind = (value: string): value is ChallengeKind =>
  Object.prototype.hasOwnProperty.call(challengeSkills, value);

export function TrainingPlayScreen({ kind }: { kind: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const ageBand = useGame((s) => s.profile.ageBand);
  const recordMiniGame = useGame((s) => s.recordMiniGame);
  const addXp = useGame((s) => s.addXp);

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [result, setResult] = useState<MiniGameResult | null>(null);

  const valid = isChallengeKind(kind);
  const meta = valid ? getMiniGame(kind)?.meta : undefined;

  /**
   * A practice round is just a mission beat with no story around it, so it can
   * reuse the mission runner's stage — registry lookup, generator guard, error
   * boundary and event wiring all come for free.
   */
  const beat = useMemo<MinigameBeat | null>(
    () =>
      valid
        ? {
            type: 'minigame',
            game: kind,
            challenge: (ctx) => generateChallenge(kind, ctx),
          }
        : null,
    [kind, valid],
  );

  const backToYard = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/training');
  }, [router]);

  const onComplete = useCallback(
    (r: MiniGameResult) => {
      recordMiniGame(r);
      addXp(TRAINING_XP);
      haptics.celebrate();
      sfx.play('fanfare');
      setResult(r);
    },
    [addXp, recordMiniGame],
  );

  const playAgain = useCallback(() => {
    setResult(null);
    setSeed(Math.floor(Math.random() * 1_000_000));
  }, []);

  /*
   * No TopBar here any more. The activity's own TaskBar carries the back
   * button, so the child gets one bar instead of two and the play area starts
   * ~80 px higher.
   */
  const chromeValue = useMemo(() => ({ onBack: backToYard }), [backToYard]);

  return (
    <ScreenFrame mood="day" safeTop={false} safeBottom={false}>
      <View style={styles.body}>
        {beat ? (
          <ActivityChromeProvider value={chromeValue}>
            <MiniGameStage
              key={`${kind}-${seed}`}
              beat={beat}
              ageBand={ageBand}
              scene="station-yard"
              seed={seed}
              compact
              onComplete={onComplete}
            />
          </ActivityChromeProvider>
        ) : (
          <UnderConstructionCard
            title="That station is being built"
            note="Captain Bea could not find this practice station. Let's head back to the yard!"
            ctaLabel="Back to the yard ›"
            onContinue={backToYard}
          />
        )}
      </View>

      <CelebrationOverlay
        visible={!!result}
        title="Nice work!"
        subtitle={meta?.title}
        stars={result?.stars}
        xp={TRAINING_XP}
        subjects={meta?.subjects}
        ctaLabel="Play again"
        onNext={playAgain}
      />

      {result ? (
        <Animated.View
          entering={FadeInUp.delay(200).springify().damping(15)}
          style={[styles.secondary, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
          pointerEvents="box-none"
        >
          <Button label="Back to yard" tone="white" size="md" block onPress={backToYard} sound="tap-soft" />
          <Text variant="tiny" color={palette.white} center style={styles.hint}>
            {`+${TRAINING_XP} XP added to your shift`}
          </Text>
        </Animated.View>
      ) : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  // above the celebration overlay (zIndex 80) so both CTAs are reachable
  secondary: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 0, zIndex: 95, gap: 4 },
  hint: { opacity: 0.9 },
});
