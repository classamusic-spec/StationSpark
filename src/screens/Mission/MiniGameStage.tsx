/**
 * MiniGameStage — hands one beat to one registered mini-game.
 *
 *   registry.getMiniGame(beat.game)  →  component
 *   beat.challenge({ ageBand, rng, scene })  →  challenge
 *
 * Everything that can go wrong here is caught and turned into the friendly
 * "being built" card, which completes the beat with three stars. A child never
 * meets a red screen, and a mission never dead-ends because a game is missing.
 *
 * Mini-game events are translated into the house feedback vocabulary: sound +
 * haptic + a character line. (Games also play their own feedback via the UI kit;
 * `sfx.play` pools one player per sound, so a doubled call is still one sound.)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import type { AgeBand, Challenge, SceneId } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import type { MissionBeat } from '@/content/types';
import type { MiniGameEvent, MiniGameResult } from '@/minigames/types';
import { getMiniGame } from '@/minigames/registry';
import { palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { createRng } from '@/utils/rng';
import { Text } from '@/ui/Text';
import { useTrayAnchor } from '@/ui/kit/playArea';
import { CharacterPortrait } from '@/characters';
import { UnderConstructionCard } from './UnderConstructionCard';
import { BeatErrorBoundary } from './BeatErrorBoundary';

export type MinigameBeat = Extract<MissionBeat, { type: 'minigame' }>;

/** Result used when a beat has to be skipped — full marks, never a penalty. */
export function skipResult(beat: MinigameBeat): MiniGameResult {
  return {
    kind: beat.game,
    success: true,
    attempts: 1,
    hintsUsed: 0,
    durationMs: 0,
    stars: 3,
    skills: challengeSkills[beat.game] ?? [],
  };
}

type SaySpeaker = Extract<MiniGameEvent, { type: 'say' }>['speaker'];
interface SayState {
  speaker: SaySpeaker;
  text: string;
  es?: string;
}

/**
 * Transient speech bubble for `say` events coming out of a game.
 *
 * It floats over the bottom of the play area — which is exactly where every
 * game keeps its tray of answer tiles and draggables — so it must NEVER take a
 * touch. `pointerEvents="box-none"` only frees the wrapper; the row and the
 * bubble underneath it still swallowed taps, which made the tray dead for the
 * 3.6 s the bubble was up (tap an answer, nothing happens). The whole thing is
 * decorative and auto-hides, so it is inert all the way down.
 */
function SayBubble({ say }: { say: SayState | null }) {
  const tray = useTrayAnchor();
  if (!say) return null;
  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15)}
      exiting={FadeOutDown}
      style={[styles.say, { bottom: tray.height + spacing.sm }]}
      pointerEvents="none"
    >
      <View style={styles.sayRow} pointerEvents="none">
        <CharacterPortrait id={say.speaker} emotion="happy" size={56} />
        <View style={[styles.sayBubble, shadows.card]} pointerEvents="none">
          <Text variant="bodyStrong">{say.text}</Text>
          {say.es && say.es !== say.text ? (
            <Text variant="small" color={palette.purple}>
              {say.es}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

export interface MiniGameStageProps {
  beat: MinigameBeat;
  ageBand: AgeBand;
  scene: SceneId;
  /** stable per beat so a replay of the same beat is the same challenge */
  seed: number;
  missionContext?: { locationName: string; npcName?: string };
  compact?: boolean;
  onComplete: (result: MiniGameResult) => void;
}

export function MiniGameStage({ beat, ageBand, scene, seed, missionContext, compact, onComplete }: MiniGameStageProps) {
  const [say, setSay] = useState<SayState | null>(null);
  const sayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completed = useRef(false);

  const entry = getMiniGame(beat.game);

  /** Build the challenge once per beat. A throwing generator falls back. */
  const challenge = useMemo<Challenge | null>(() => {
    try {
      const c = beat.challenge({ ageBand, rng: createRng(seed), scene });
      // A generator that returns the wrong variant would crash the game — treat
      // it exactly like a missing game and show the friendly card instead.
      return c && c.kind === beat.game ? c : null;
    } catch (e) {
      console.warn(`[mission] challenge generator for "${beat.game}" failed`, e);
      return null;
    }
  }, [ageBand, beat, scene, seed]);

  /**
   * QA hook: the automated play-through harness (tools/qa/play.mjs) reads the
   * live challenge to decide what the right answer is. Web only, read-only, and
   * nothing in the app ever reads it back.
   */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const g = globalThis as { __SS_CHALLENGE__?: Challenge | null };
    g.__SS_CHALLENGE__ = challenge;
    return () => {
      g.__SS_CHALLENGE__ = null;
    };
  }, [challenge]);

  /** the say-bubble timer must not outlive the stage */
  useEffect(
    () => () => {
      if (sayTimer.current) clearTimeout(sayTimer.current);
    },
    [],
  );

  const finish = useCallback(
    (result: MiniGameResult) => {
      if (completed.current) return;
      completed.current = true;
      if (sayTimer.current) clearTimeout(sayTimer.current);
      sfx.play('success');
      haptics.success();
      onComplete(result);
    },
    [onComplete],
  );

  const onEvent = useCallback((event: MiniGameEvent) => {
    switch (event.type) {
      case 'correct':
        sfx.play('correct');
        haptics.success();
        break;
      case 'incorrect':
        // never harsh: soft boop + a nudge, and Captain Bea offers to help
        sfx.play('wrong-soft');
        haptics.nudge();
        break;
      case 'hint':
        sfx.play('robot-beep');
        haptics.select();
        break;
      case 'progress':
        haptics.select();
        break;
      case 'say': {
        setSay({ speaker: event.speaker, text: event.text, es: event.es });
        speech.say(event.text, { speaker: event.speaker });
        if (sayTimer.current) clearTimeout(sayTimer.current);
        sayTimer.current = setTimeout(() => setSay(null), 3600);
        break;
      }
    }
  }, []);

  const fallback = (
    <UnderConstructionCard
      title="This station is being built"
      note="We are still building this game. Tap to continue the mission — you keep your stars!"
      onContinue={() => finish(skipResult(beat))}
    />
  );

  if (!entry || !challenge) return fallback;

  const Game = entry.component;

  return (
    <View style={styles.stage}>
      <BeatErrorBoundary resetKey={`${beat.game}-${seed}`} fallback={fallback}>
        <Game
          challenge={challenge}
          ageBand={ageBand}
          onComplete={finish}
          onEvent={onEvent}
          compact={compact}
          missionContext={missionContext}
        />
      </BeatErrorBoundary>
      <SayBubble say={say} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1 },
  /*
   * Consistency rule 10 — one bubble motif, one anchoring. The say bubble sits
   * where every game keeps its answer tiles, so it clears the measured `<Tray/>`
   * exactly like the hint does (see `@/ui/kit/playArea`). It is decorative
   * and auto-hides, so it is inert all the way down and never takes a touch.
   */
  say: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 45 },
  sayRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  sayBubble: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderBottomLeftRadius: 6,
    padding: spacing.sm,
  },
});
