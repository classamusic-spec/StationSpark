import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import type { AgeBand, Challenge } from '@/learning/types';
import { challengeSkills } from '@/learning/types';
import type { DialogueLine, RecipeDef, RecipeId } from '@/content/types';
import { recipeById } from '@/content/recipes';
import type { MiniGameEvent, MiniGameResult, Stars } from '@/minigames/types';
import { getMiniGame } from '@/minigames/registry';
import { useGame } from '@/state/store';
import { palette, spacing } from '@/theme';
import { createRng } from '@/utils/rng';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { GrownUpChip } from '@/ui/kit/Chip';
import { DialogueOverlay } from '@/characters/DialogueOverlay';
import { CelebrationOverlay } from '@/characters/CelebrationOverlay';
import { RecipeCardFrame, RecipeStepStrip } from './parts/RecipeCardFrame';
import { DinnerTable } from './parts/DinnerTable';
import { hashString, recipeStars } from './progress';

type RecipeStepDef = RecipeDef['steps'][number] & { bands?: AgeBand[] };

type Phase =
  | { t: 'intro'; line: number }
  | { t: 'step-intro'; step: number; line: number }
  | { t: 'play'; step: number }
  | { t: 'tick'; step: number }
  | { t: 'table' }
  | { t: 'celebrate' };

export interface KitchenRunnerProps {
  recipeId: RecipeId;
  /** every step's result, in order — the host decides what to do with them */
  onDone: (results: MiniGameResult[]) => void;
  /** running inside a mission beat: no store writes, no navigation, just onDone */
  embedded?: boolean;
}

const TICK_MS = 1700;

const stepLabel = (kind: string): string =>
  ({
    'pizza-fractions': 'Pizza',
    'measure-pour': 'Pour',
    'count-ingredients': 'Count',
    'divide-share': 'Share',
    'recipe-scale': 'Scale',
    'clock-watch': 'Timer',
    'soup-pot': 'Pot',
    'market-money': 'Buy',
    'word-builder': 'Label',
  })[kind] ?? kind.replace(/-/g, ' ');

/**
 * Runs one recipe end to end: Captain Bea's welcome → each step's mini-game,
 * ticking off a recipe card between them → the crew around the dinner table →
 * stars. Used standalone by `RecipeScreen` and embedded by the MissionRunner
 * for `{ type: 'kitchen' }` beats.
 */
export function KitchenRunner({ recipeId, onDone, embedded }: KitchenRunnerProps) {
  const ageBand = useGame((s) => s.profile.ageBand);
  const recipe = recipeById(recipeId);

  const steps = useMemo<RecipeStepDef[]>(() => {
    const all = (recipe?.steps ?? []) as RecipeStepDef[];
    const forBand = all.filter((s) => !s.bands || s.bands.includes(ageBand));
    return forBand.length > 0 ? forBand : all;
  }, [ageBand, recipe]);

  // Seeded once per mount from the recipe + how much has been played, so the
  // challenges are stable through a run but vary between visits.
  const played = useGame((s) => s.progress.stats.skills);
  const [seed] = useState(() => hashString(recipeId) + played * 31);
  const challenges = useMemo<Challenge[]>(
    () => steps.map((s, i) => s.challenge({ ageBand, rng: createRng(seed + i * 7919) })),
    [ageBand, seed, steps],
  );

  const introLines = useMemo<DialogueLine[]>(() => {
    if (recipe?.intro?.length) return recipe.intro;
    return [
      {
        speaker: 'bea',
        text: `Let's cook ${recipe?.name ?? 'something tasty'}!`,
        es: recipe?.nameEs,
        emotion: 'happy',
      },
    ];
  }, [recipe]);

  const [phase, setPhase] = useState<Phase>({ t: 'intro', line: 0 });
  const [results, setResults] = useState<MiniGameResult[]>([]);
  const advanced = useRef(false);

  const startStep = useCallback(
    (index: number) => {
      const step = steps[index];
      if (!step) {
        setPhase({ t: 'table' });
        return;
      }
      if (step.intro?.length) setPhase({ t: 'step-intro', step: index, line: 0 });
      else setPhase({ t: 'play', step: index });
    },
    [steps],
  );

  const finishStep = useCallback(
    (index: number, result: MiniGameResult) => {
      setResults((r) => [...r, result]);
      sfx.play('page');
      haptics.success();
      setPhase({ t: 'tick', step: index });
    },
    [],
  );

  const leaveTick = useCallback(
    (index: number) => {
      if (advanced.current) return;
      advanced.current = true;
      if (index + 1 < steps.length) startStep(index + 1);
      else setPhase({ t: 'table' });
    },
    [startStep, steps.length],
  );

  useEffect(() => {
    if (phase.t !== 'tick') return;
    advanced.current = false;
    const index = phase.step;
    const timer = setTimeout(() => leaveTick(index), TICK_MS);
    return () => clearTimeout(timer);
  }, [leaveTick, phase]);

  /* ---- nothing to cook: never dead-end ---- */
  if (!recipe || steps.length === 0) {
    return (
      <View style={styles.missing}>
        <Text variant="h2" center>
          This recipe is still being written!
        </Text>
        <Button label="Back to the kitchen" tone="green" size="lg" onPress={() => onDone([])} />
      </View>
    );
  }

  const stripSteps = steps.map((s, i) => ({
    label: stepLabel(s.game),
    done: i < results.length,
    current: (phase.t === 'play' || phase.t === 'step-intro' || phase.t === 'tick') && phase.step === i,
  }));

  const stars = recipeStars(results.map((r) => r.stars));

  return (
    <View style={styles.root}>
      {phase.t === 'play' || phase.t === 'step-intro' || phase.t === 'tick' ? (
        <View style={styles.chrome} pointerEvents="none">
          <RecipeStepStrip title={recipe.name} steps={stripSteps} />
        </View>
      ) : null}

      <View style={styles.body}>
        {phase.t === 'play' ? (
          <StepGame
            key={`step-${phase.step}`}
            step={steps[phase.step]}
            challenge={challenges[phase.step]}
            ageBand={ageBand}
            onDone={(r) => finishStep(phase.step, r)}
          />
        ) : phase.t === 'tick' ? (
          <Animated.View entering={FadeIn} style={styles.tickWrap}>
            <Pressable style={styles.tickPress} accessibilityRole="button" accessibilityLabel="Keep cooking" onPress={() => leaveTick(phase.step)}>
              <Animated.View entering={FadeInDown.springify().damping(14)} style={styles.tickCard}>
                <RecipeCardFrame title={recipe.name} titleEs={recipe.nameEs} badge={recipe.grownUp ? <GrownUpChip /> : undefined}>
                  <RecipeStepStrip title="Recipe card" steps={stripSteps} />
                  <Text variant="body" center color={palette.navySoft}>
                    {phase.step + 1 < steps.length ? 'Next up…' : 'That was the last step!'}
                  </Text>
                </RecipeCardFrame>
              </Animated.View>
            </Pressable>
          </Animated.View>
        ) : phase.t === 'table' ? (
          <DinnerTable recipeId={recipe.id} recipeName={recipe.name} onNext={() => setPhase({ t: 'celebrate' })} />
        ) : null}
      </View>

      {phase.t === 'intro' ? (
        <DialogueOverlay
          line={introLines[phase.line] ?? introLines[0] ?? { speaker: 'bea', text: 'Aprons on!' }}
          index={phase.line}
          total={introLines.length}
          onNext={() => (phase.line + 1 < introLines.length ? setPhase({ t: 'intro', line: phase.line + 1 }) : startStep(0))}
          onSkip={() => startStep(0)}
        />
      ) : null}

      {phase.t === 'step-intro' ? (
        <StepIntro
          lines={steps[phase.step]?.intro ?? []}
          line={phase.line}
          onNext={() =>
            phase.line + 1 < (steps[phase.step]?.intro?.length ?? 0)
              ? setPhase({ t: 'step-intro', step: phase.step, line: phase.line + 1 })
              : setPhase({ t: 'play', step: phase.step })
          }
          onSkip={() => setPhase({ t: 'play', step: phase.step })}
        />
      ) : null}

      <CelebrationOverlay
        visible={phase.t === 'celebrate'}
        title="Recipe complete!"
        subtitle={`${recipe.name} — cooked by you`}
        stars={stars as Stars}
        xp={embedded ? undefined : recipe.xp}
        subjects={recipe.subjects}
        ctaLabel={embedded ? 'Back to the mission' : 'Back to the kitchen'}
        onNext={() => onDone(results)}
      />
    </View>
  );
}

/** One recipe step. A kind we cannot render yet still lets the child move on. */
function StepGame({
  step,
  challenge,
  ageBand,
  onDone,
}: {
  step: RecipeStepDef | undefined;
  challenge: Challenge | undefined;
  ageBand: AgeBand;
  onDone: (r: MiniGameResult) => void;
}) {
  const entry = step ? getMiniGame(step.game) : undefined;
  const usable = !!entry && !!challenge && challenge.kind === step?.game;

  const skip = useCallback(() => {
    const kind = step?.game ?? 'count-ingredients';
    onDone({
      kind,
      success: true,
      attempts: 1,
      hintsUsed: 0,
      durationMs: 0,
      stars: 3,
      skills: challengeSkills[kind] ?? [],
      wordsLearned: [],
    });
  }, [onDone, step?.game]);

  /** the runner owns no sound of its own — every game speaks for itself */
  const onEvent = useCallback((_e: MiniGameEvent) => undefined, []);

  /** QA hook — mirrors MiniGameStage so the play-through harness can read the
   *  live challenge on web. Read-only; nothing in the app consumes it. */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const g = globalThis as { __SS_CHALLENGE__?: Challenge | null };
    g.__SS_CHALLENGE__ = usable ? (challenge ?? null) : null;
    return () => {
      g.__SS_CHALLENGE__ = null;
    };
  }, [challenge, usable]);

  if (!usable || !entry || !challenge) {
    return (
      <View style={styles.missing}>
        <Text variant="h2" center>
          This step is still cooking!
        </Text>
        <Text variant="body" center color={palette.navySoft}>
          {step ? stepLabel(step.game) : ''} is on its way to the kitchen.
        </Text>
        <Button label="Keep going" tone="green" size="lg" onPress={skip} />
      </View>
    );
  }

  const Game = entry.component;
  return <Game challenge={challenge} ageBand={ageBand} onComplete={onDone} onEvent={onEvent} />;
}

function StepIntro({
  lines,
  line,
  onNext,
  onSkip,
}: {
  lines: DialogueLine[];
  line: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const current = lines[line];
  useEffect(() => {
    if (!current) onNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);
  if (!current) return null;
  return <DialogueOverlay line={current} index={line} total={lines.length} onNext={onNext} onSkip={onSkip} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chrome: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, zIndex: 5 },
  body: { flex: 1 },
  tickWrap: { flex: 1 },
  tickPress: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  tickCard: { width: '100%', maxWidth: 460 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
});
