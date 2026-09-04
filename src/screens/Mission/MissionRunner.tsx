/**
 * MISSION RUNNER — the screen that plays a mission.
 *
 * It renders `missionMachine` and nothing else decides the flow:
 *
 *   brief          → MissionBrief (the reference "Get Ready!" screen)
 *   dialogue       → DialogueOverlay over the scene
 *   minigameIntro  → DialogueOverlay (the game's set-up lines)
 *   minigame       → MiniGameStage (registry lookup + generated challenge)
 *   minigameOutro  → DialogueOverlay (the thank-you lines)
 *   travel         → TravelCinematic (the truck drive)
 *   scene          → DialogueOverlay over the arrival/return scene
 *   kitchen        → KitchenBeat (the Firehouse Kitchen, if it has registered)
 *   recap          → MissionRecap ("You used:")
 *   complete       → CelebrationOverlay ("Rescue Complete!")
 *   reward         → stars, badge, XP, "Return to Station"
 *
 * Every beat has a friendly escape hatch, so a child can always reach the end.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActor } from '@xstate/react';
import { useRouter } from 'expo-router';
import type { SceneId } from '@/learning/types';
import type { LocationId, MissionDef } from '@/content/types';
import type { MiniGameResult } from '@/minigames/types';
import { badgeById } from '@/content/badges';
import { beatsForBand, currentBeat, currentLines, missionMachine, missionStars } from '@/machines/missionMachine';
import { palette, radii, shadows, spacing } from '@/theme';
import { useShift } from '@/hooks/useShift';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useGame } from '@/state/store';
import { Button, Panel, RoundIconButton, ScreenFrame, Text, TopBar } from '@/ui';
import { BackIcon, ChevronRightIcon } from '@/ui/icons';
import { StarRow } from '@/ui/kit';
import { CelebrationOverlay, DialogueOverlay } from '@/characters';
import { TravelCinematic } from '@/world/travel/TravelCinematic';
import { KitchenBeat } from './KitchenBeat';
import { MiniGameStage } from './MiniGameStage';
import { MissionBrief } from './MissionBrief';
import { MissionHud } from './MissionHud';
import { MissionRecap } from './MissionRecap';
import { QuitModal } from './QuitModal';
import { SceneHero } from './SceneHero';
import { StarCounter } from './StarCounter';
import { UnderConstructionCard } from './UnderConstructionCard';

/** Which storefront dresses a location that has no scene of its own. */
const LOCATION_SCENE: Record<LocationId, SceneId> = {
  station: 'station-yard',
  bakery: 'bakery',
  school: 'school',
  library: 'library',
  park: 'park',
  'pet-shop': 'pet-shop',
  market: 'market',
  pizza: 'pizza',
  apartments: 'apartments',
  garden: 'park',
  museum: 'library',
  beach: 'park',
  festival: 'market',
  construction: 'apartments',
  'train-station': 'station-yard',
  'clock-tower': 'clock-tower',
};

const DIALOGUE_STATES = new Set(['dialogue', 'scene', 'minigameIntro', 'minigameOutro']);
const HUD_STATES = new Set(['dialogue', 'scene', 'minigameIntro', 'minigame', 'minigameOutro', 'travel', 'kitchen', 'recap']);

export interface MissionRunnerProps {
  mission: MissionDef;
}

export function MissionRunner({ mission }: MissionRunnerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const ageBand = useGame((s) => s.profile.ageBand);
  const spanishSupport = useGame((s) => s.settings.spanishSupport);
  const recordMiniGame = useGame((s) => s.recordMiniGame);
  const completeMission = useGame((s) => s.completeMission);
  const shift = useShift();

  const [snapshot, send] = useActor(missionMachine, { input: { mission, ageBand } });
  const ctx = snapshot.context;
  const state = String(snapshot.value);

  const [quitOpen, setQuitOpen] = useState(false);
  const saved = useRef(false);
  /**
   * One seed per visit, so replaying a mission is not the identical challenge.
   * `startedAt` is stamped once by the machine, which keeps render pure.
   */
  const sessionSeed = ctx.startedAt;

  const beats = useMemo(() => beatsForBand(mission, ageBand), [ageBand, mission]);
  const beat = currentBeat(ctx);
  const lines = currentLines(ctx);
  const line = lines[ctx.lineIndex];
  const starsSoFar = ctx.results.reduce((a, r) => a + r.stars, 0);
  const stars = missionStars(ctx.results);

  /* ---- lifecycle --------------------------------------------------- */
  useEffect(() => {
    send({ type: 'START' });
    return () => {
      speech.stop();
      sfx.stopAllLoops();
    };
  }, [send]);

  /** A beat with no lines would otherwise stall — step straight past it. */
  useEffect(() => {
    if (DIALOGUE_STATES.has(state) && lines.length === 0) send({ type: 'NEXT' });
  }, [lines.length, send, state]);

  useEffect(() => {
    if (state === 'quit') {
      if (router.canGoBack()) router.back();
      else router.replace('/dispatch');
    }
  }, [router, state]);

  /* ---- actions ----------------------------------------------------- */
  const onMiniGameDone = useCallback(
    (result: MiniGameResult) => {
      recordMiniGame(result);
      send({ type: 'MINIGAME_DONE', result });
    },
    [recordMiniGame, send],
  );

  /** Runs exactly once, when the child taps through the celebration. */
  const saveMission = useCallback(() => {
    if (saved.current) return;
    saved.current = true;
    completeMission(mission.id, stars, mission.xp, mission.sparks, mission.badge);
    shift.missionDone(stars);
  }, [completeMission, mission.badge, mission.id, mission.sparks, mission.xp, shift, stars]);

  const leave = useCallback(() => {
    setQuitOpen(false);
    speech.stop();
    sfx.stopAllLoops();
    send({ type: 'QUIT' });
  }, [send]);

  /* ---- backdrop ----------------------------------------------------- */
  const backdropScene: SceneId = useMemo(() => {
    if (beat?.type === 'dialogue' && beat.backdrop) return beat.backdrop;
    if (beat?.type === 'scene') return LOCATION_SCENE[beat.location] ?? mission.scene;
    if (beat?.type === 'travel') return LOCATION_SCENE[beat.to] ?? mission.scene;
    return mission.scene;
  }, [beat, mission.scene]);

  const showChrome = state !== 'complete' && state !== 'reward' && state !== 'done';
  const showHud = HUD_STATES.has(state);
  const bodyTop = showChrome ? insets.top + 8 + 56 + (showHud ? 42 : 8) : 0;

  const chrome = showChrome ? (
    <>
      <TopBar
        left={
          <RoundIconButton
            accessibilityLabel="Leave the mission"
            onPress={() => {
              setQuitOpen(true);
              haptics.select();
            }}
          >
            <BackIcon />
          </RoundIconButton>
        }
        right={<StarCounter stars={starsSoFar} />}
      />
      {showHud ? (
        <View style={[styles.hudSlot, { top: insets.top + 8 + 56 + 4 }]} pointerEvents="none">
          <MissionHud beats={beats} index={ctx.beatIndex} />
        </View>
      ) : null}
    </>
  ) : null;

  /* ---- body per state ------------------------------------------------ */
  let body: React.ReactNode = null;

  if (state === 'brief' || state === 'idle') {
    body = <MissionBrief mission={mission} onStart={() => send({ type: 'NEXT' })} />;
  } else if (DIALOGUE_STATES.has(state)) {
    body = (
      <View style={styles.sceneWrap}>
        <SceneHero scene={backdropScene} radius={0} style={StyleSheet.absoluteFill} />
        {line ? (
          <DialogueOverlay
            key={`${ctx.beatIndex}-${ctx.phase}-${ctx.lineIndex}`}
            line={line}
            index={ctx.lineIndex}
            total={lines.length}
            spanishSupport={spanishSupport}
            onNext={() => send({ type: 'NEXT' })}
            onSkip={() => send({ type: 'NEXT' })}
          />
        ) : null}
      </View>
    );
  } else if (state === 'minigame' && beat?.type === 'minigame') {
    body = (
      <MiniGameStage
        key={`mg-${ctx.beatIndex}`}
        beat={beat}
        ageBand={ageBand}
        scene={mission.scene}
        seed={sessionSeed + ctx.beatIndex * 7919}
        missionContext={{ locationName: mission.title, npcName: mission.npcName }}
        onComplete={onMiniGameDone}
      />
    );
  } else if (state === 'travel' && beat?.type === 'travel') {
    body = <TravelCinematic key={`tr-${ctx.beatIndex}`} from={beat.from} to={beat.to} onDone={() => send({ type: 'NEXT' })} />;
  } else if (state === 'kitchen' && beat?.type === 'kitchen') {
    body = (
      <KitchenBeat
        key={`kb-${ctx.beatIndex}`}
        recipeId={beat.recipe}
        onDone={(results) => send({ type: 'KITCHEN_DONE', results })}
      />
    );
  } else if (state === 'recap') {
    body = <MissionRecap mission={mission} results={ctx.results} onNext={() => send({ type: 'NEXT' })} />;
  } else if (state === 'reward') {
    body = <RewardScreen mission={mission} stars={stars} onHome={() => router.replace('/')} onBoard={() => router.replace('/dispatch')} shiftComplete={shift.complete} />;
  } else if (state === 'complete') {
    body = <View style={styles.sceneWrap}><SceneHero scene={backdropScene} radius={0} style={StyleSheet.absoluteFill} /></View>;
  } else if (state === 'done' || state === 'quit') {
    body = null;
  } else {
    // Should be unreachable — but never strand a child on a blank screen.
    body = <UnderConstructionCard onContinue={() => send({ type: 'NEXT' })} />;
  }

  return (
    <ScreenFrame mood="day" chrome={chrome} safeTop={false} safeBottom={false}>
      <View style={[styles.body, { paddingTop: bodyTop }]}>{body}</View>

      <CelebrationOverlay
        visible={state === 'complete'}
        title="Rescue Complete!"
        subtitle={mission.title}
        stars={stars}
        badge={mission.badge}
        xp={mission.xp}
        sparks={mission.sparks}
        subjects={mission.subjects}
        ctaLabel="See my reward"
        onNext={() => {
          saveMission();
          send({ type: 'NEXT' });
        }}
      />

      <QuitModal visible={quitOpen} onKeepGoing={() => setQuitOpen(false)} onLeave={leave} />
    </ScreenFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Reward                                                               */
/* ------------------------------------------------------------------ */

function RewardScreen({
  mission,
  stars,
  shiftComplete,
  onHome,
  onBoard,
}: {
  mission: MissionDef;
  stars: 0 | 1 | 2 | 3;
  shiftComplete: boolean;
  onHome: () => void;
  onBoard: () => void;
}) {
  const insets = useSafeAreaInsets();
  const badge = badgeById?.(mission.badge);

  useEffect(() => {
    sfx.play('fanfare');
    haptics.celebrate();
    const t = setTimeout(() => sfx.play('confetti'), 260);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScrollView
      contentContainerStyle={[styles.reward, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(300)}>
        <Panel tone="white" radius="panel" style={styles.rewardCard}>
          <Text variant="display" center>
            Great job!
          </Text>
          <Text variant="body" color={palette.navySoft} center>
            {mission.title}
          </Text>
          <StarRow stars={stars} size={52} animate />

          <View style={styles.rewardRow}>
            <View style={[styles.rewardChip, { backgroundColor: '#FFE9A8' }]}>
              <Text variant="h3" center>{`+${mission.xp} XP`}</Text>
            </View>
            <View style={[styles.rewardChip, { backgroundColor: palette.purpleSoft }]}>
              <Text variant="h3" center>{`✨ +${mission.sparks}`}</Text>
            </View>
          </View>

          {badge ? (
            <Animated.View entering={FadeInUp.delay(420).springify().damping(12)} style={[styles.badge, shadows.soft]}>
              <Text variant="tiny" color={palette.navyMuted} center>
                NEW BADGE
              </Text>
              <Text variant="h2" center>
                {badge.name}
              </Text>
              <Text variant="small" color={palette.navySoft} center>
                {badge.description}
              </Text>
            </Animated.View>
          ) : null}
        </Panel>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).springify().damping(15)} style={styles.rewardCtas}>
        <Button label="Return to Station" tone="red" size="xl" block iconRight={<ChevronRightIcon size={26} />} onPress={onHome} />
        {!shiftComplete ? <Button label="Back to the board" tone="white" size="md" block onPress={onBoard} sound="tap-soft" /> : null}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  sceneWrap: { flex: 1, overflow: 'hidden' },
  hudSlot: { position: 'absolute', left: 0, right: 0, zIndex: 45 },
  reward: { paddingHorizontal: spacing.md, gap: spacing.md, flexGrow: 1, justifyContent: 'center' },
  rewardCard: { alignItems: 'center', gap: spacing.sm, borderRadius: radii.panel },
  rewardRow: { flexDirection: 'row', gap: spacing.sm },
  rewardChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.pill, minWidth: 108 },
  badge: {
    alignSelf: 'stretch',
    backgroundColor: palette.panel,
    borderRadius: radii.card,
    padding: spacing.sm,
    gap: 2,
  },
  rewardCtas: { gap: spacing.xs },
});
