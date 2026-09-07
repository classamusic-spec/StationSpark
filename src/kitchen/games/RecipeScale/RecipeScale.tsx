import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, roles, shadows, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useFeedbackAnim, useReducedMotion } from '@/hooks';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { ActivityFrame } from '@/ui/kit/ActivityFrame';
import { GrownUpChip } from '@/ui/kit/Chip';

import { CrewFigure } from '@/world/scenes';
import { POT_ASPECT, StockPot } from '../../parts/Cookware';
import { FluidStage, at, type FluidBox } from '../../parts/Stage';
import { FoodThumb } from '../../parts/FoodBits';
import { RecipeCardFrame } from '../../parts/RecipeCardFrame';
import {
  ContactPatch,
  CounterCrumbs,
  CounterRun,
  HerbPot,
  Hob,
  KitchenWall,
  KitchenWindow,
  MixingBowls,
  Shelf,
  SplashbackBand,
  Steam,
  StoreJar,
  UtensilRail,
} from '../../parts/KitchenRoom';
import { CookCTA, WoodenSpoon } from '../../parts/SceneBits';
import { pluralEn } from '../../spanish';
import { scaleExplanation } from '../../shareMath';
import { SwirlHint, useIdleAssist, useScrubGesture, useSwirlGesture } from '../../gestures';
import { kitchenFeel, useCaptainHint, useSpokenTask, useTimers } from '../useKitchenGame';

/* Who shows up to eat. Two leads and two neighbours — four, because the
 * fraction being shared is a fraction of four. */
const CREW = [
  { id: 'rookie' },
  { id: 'bea' },
  { id: 'npc', npc: 'rosa' },
  { id: 'npc', npc: 'gino' },
] as const;

/** half turns of the spoon that cook the pot */
const STIRS_TO_COOK = 6;

type Phase = 'set' | 'stir' | 'done';

export function RecipeScale({ challenge, onComplete, onEvent, compact }: MiniGameProps<'recipe-scale'>) {
  const session = useMiniGameSession('recipe-scale', onComplete, onEvent);
  const assist = useCaptainHint(session);
  const timers = useTimers();
  const reduced = useReducedMotion();

  const [values, setValues] = useState<number[]>(() => challenge.lines.map((l) => l.amount));
  const [bumps, setBumps] = useState<number[]>(() => challenge.lines.map(() => 0));
  const [phase, setPhase] = useState<Phase>('set');
  const [stirs, setStirs] = useState(0);
  const gate = useRef({ cooked: false });

  const cooking = phase !== 'set';
  const stirred = Math.min(1, stirs / STIRS_TO_COOK);

  const allCorrect = useMemo(
    () => challenge.lines.every((l, i) => (values[i] ?? 0) === l.scaled),
    [challenge.lines, values],
  );

  const task =
    phase === 'set'
      ? `Make it feed ${challenge.eating}`
      : phase === 'stir'
        ? 'Stir the pot'
        : 'Dinner is ready!';

  const detail =
    phase === 'set'
      ? 'Drag a number up or down, or tap + and −.'
      : phase === 'stir'
        ? 'Swirl your finger round the pot — or tap it.'
        : undefined;

  /**
   * Nine firefighters at 40 px do not fit across a phone: the row used to run
   * off both edges of the screen. The figures shrink to whatever the widest
   * row can actually hold.
   */
  const figureSize = useMemo(() => {
    const heads = Math.min(challenge.serves, 8) + Math.min(challenge.eating, 8);
    return Math.max(22, Math.min(40, Math.floor((330 - 28) / Math.max(1, heads)) - 2));
  }, [challenge.eating, challenge.serves]);

  const replay = useSpokenTask(
    phase === 'set'
      ? `This recipe serves ${challenge.serves}, but ${challenge.eating} are eating. Fix the amounts!`
      : phase === 'stir'
        ? 'Now stir the pot! Swirl your finger round and round.'
        : 'Enough for everyone!',
    { key: phase },
  );

  useEffect(() => {
    session.progress(phase === 'set' ? 0 : 1, 2);
  }, [phase, session]);

  const step = useCallback(
    (index: number, delta: number) => {
      if (cooking || delta === 0) return;
      setValues((v) => v.map((n, i) => (i === index ? Math.max(0, Math.min(99, n + delta)) : n)));
      sfx.play(delta > 0 ? 'pop' : 'tap-soft');
      haptics.select();
      const line = challenge.lines[index];
      if (line) session.learnedWord(line.item.es);
    },
    [challenge.lines, cooking, session],
  );

  /* ------------------------------------------------------------------ */
  /* Stirring the pot                                                     */
  /* ------------------------------------------------------------------ */

  const finish = useCallback(() => {
    if (gate.current.cooked) return;
    gate.current.cooked = true;
    setPhase('done');
    kitchenFeel.finish();
    sfx.play('sizzle');
    timers.after(1500, () => session.complete());
  }, [session, timers]);

  const addStir = useCallback(
    (amount: number) => {
      setStirs((n) => {
        if (n >= STIRS_TO_COOK) return n;
        const next = Math.min(STIRS_TO_COOK, n + amount);
        if (next >= STIRS_TO_COOK) timers.after(0, finish);
        return next;
      });
    },
    [finish, timers],
  );

  /**
   * NEVER A DEAD END. A pot on a hob cooks whether or not anybody stirs it: if
   * the spoon sits still, Captain Bea takes over and the soup comes together on
   * its own. Stirring is what makes it *yours*, never what makes it possible.
   */
  const stirAssist = useIdleAssist({
    active: phase === 'stir',
    firstMs: 2200,
    repeatMs: 170,
    onHelp: (round) => {
      if (round === 1) assist.cheer('Swirl your finger round the pot!', '¡Revuelve la olla!');
      addStir(0.5);
    },
  });

  const onStir = useCallback(() => {
    stirAssist.poke();
    kitchenFeel.stir();
    addStir(1);
  }, [addStir, stirAssist]);

  const check = useCallback(() => {
    if (cooking) return;
    if (allCorrect) {
      session.correct('scaled');
      kitchenFeel.good();
      assist.cheer('Perfect amounts for everybody!');
      setPhase('stir');
      return;
    }
    const wrongIndex = challenge.lines.findIndex((l, i) => (values[i] ?? 0) !== l.scaled);
    const line = challenge.lines[wrongIndex];
    setBumps((b) => b.map((v, i) => ((values[i] ?? 0) !== (challenge.lines[i]?.scaled ?? 0) ? v + 1 : v)));
    if (line) {
      assist.nudge(
        scaleExplanation(pluralEn(line.item.en, line.amount), line.amount, challenge.serves, challenge.eating, line.scaled),
        line.item.es,
      );
    }
  }, [allCorrect, assist, challenge.eating, challenge.lines, challenge.serves, cooking, session, values]);

  const showMe = useCallback(() => {
    assist.askedForHelp();
    if (phase === 'stir') {
      addStir(STIRS_TO_COOK);
      return;
    }
    const idx = challenge.lines.findIndex((l, i) => (values[i] ?? 0) !== l.scaled);
    const line = challenge.lines[idx];
    if (!line) return;
    setValues((v) => v.map((n, i) => (i === idx ? line.scaled : n)));
    sfx.play('pop');
    haptics.drop();
  }, [addStir, assist, challenge.lines, phase, values]);

  const controls = (
    <>
      <View style={styles.trayRow}>
        {assist.offerHelp && phase !== 'done' ? (
          <Button label="Show me" tone="yellow" size="md" onPress={showMe} sound="tap-soft" />
        ) : null}
        {phase === 'stir' && reduced ? (
          <Button label="Stir" tone="white" size="md" onPress={onStir} sound="tap-soft" />
        ) : null}
      </View>
      {phase === 'set' ? (
        <CookCTA label="Into the pot!" onPress={check} />
      ) : (
        <View style={styles.meterWrap}>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${Math.round(stirred * 100)}%` }]} />
          </View>
          <Text variant="bodyStrong" color={roles.ink.secondary}>
            {phase === 'done' ? 'Simmering…' : stirs > 0 ? 'Keep stirring…' : 'Give it a good stir!'}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <ActivityFrame
      task={task}
      detail={detail}
      compact={compact}
      onReplay={replay}
      progress={{ done: phase === 'set' ? 0 : 1, total: 2 }}
      backdrop={<KitchenWall />}
      controls={controls}
      controlsTone="cream"
      hint={{ text: assist.text, es: assist.es, visible: assist.visible, onDismiss: assist.dismiss }}
    >
      <View style={styles.body}>
        {/* The crew stays on screen while the pot cooks: you are stirring *for*
            somebody, and the band above the pot had nothing else to say. */}
        <View style={styles.ratio}>
          <CrewRow label={`Serves ${challenge.serves}`} count={challenge.serves} size={figureSize} />
          <Text variant="h2" color={palette.engineRed}>
            →
          </Text>
          <CrewRow
            label={`${challenge.eating} eating`}
            count={challenge.eating}
            extraFrom={challenge.serves}
            size={figureSize}
          />
        </View>

        {phase === 'set' ? (
          <View style={styles.cardWrap}>
            <RecipeCardFrame title={`Serves ${challenge.serves} → ${challenge.eating}`} badge={<GrownUpChip />}>
              {challenge.lines.map((line, i) => (
                <ScaleLine
                  key={line.item.id}
                  index={i}
                  icon={line.item.icon}
                  en={line.item.en}
                  was={line.amount}
                  value={values[i] ?? 0}
                  correct={(values[i] ?? 0) === line.scaled}
                  bump={bumps[i] ?? 0}
                  onStep={(d) => step(i, d)}
                />
              ))}
            </RecipeCardFrame>
          </View>
        ) : null}

        {/* The pot is on the hob the whole time — while the amounts are being
            set it is simply waiting, which fills the band of counter that used
            to be nothing but wall, and shows the child where this is going. */}
        <FluidStage minH={phase === 'set' ? 150 : 280} maxScale={1.8} style={styles.potStage}>
          {(box) => (
            <StirScene
              box={box}
              interactive={phase !== 'set'}
              onStir={onStir}
              showHint={phase === 'stir' && stirs === 0}
              bubbling={phase === 'done' || stirred > 0.3}
              simmering={phase === 'done'}
            />
          )}
        </FluidStage>
      </View>
    </ActivityFrame>
  );
}

/* ------------------------------------------------------------------ */
/* The pot you actually stir                                            */
/* ------------------------------------------------------------------ */

/**
 * THE POT YOU STIR — the whole play area, on a real hob.
 *
 * It used to be a fixed 290 px pot floating in the middle of a screen twice
 * that size. It is sized from the room now: the pot takes the width, the hob is
 * built to fit under it and the wall behind gets a shelf, a window and a rail.
 */
function StirScene({
  box,
  interactive,
  onStir,
  showHint,
  bubbling,
  simmering,
}: {
  box: FluidBox;
  interactive: boolean;
  onStir: () => void;
  showHint: boolean;
  bubbling: boolean;
  simmering: boolean;
}) {
  const { s, w, h } = box;
  /* the counter is a SURFACE: `deck` is the worktop drawn receding above its
     front edge, so the hob stands on wood instead of on the counter's lip */
  const counterH = Math.max(26, Math.min(52, h * 0.09));
  const counterY = h - counterH;
  const deck = Math.max(52, Math.min(132, h * 0.22));
  const deckTop = counterY - deck;
  const availH = deckTop + deck * 0.62 - 6;

  const potW = Math.min(w * 0.74, (availH - 40) * POT_ASPECT);
  const potH = potW / POT_ASPECT;
  const hobW = Math.min(w - 32, potW * 1.28);
  const hobH = hobW * 0.3;
  const hobX = (w - hobW) / 2;
  const deckY = counterY - deck * 0.34;
  const hobY = deckY - hobH * 0.88;
  const pot = { x: (w - potW) / 2, y: hobY + hobH * 0.3 - potH * 0.94, w: potW, h: potH };
  const side = hobX + hobW * 0.06;

  const swirl = useSwirlGesture({ cx: (potW * s) / 2, cy: (potH * s) / 2, turnRadians: Math.PI, onStir });
  const spoonStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${(swirl.spin.value * 180) / Math.PI}deg` },
      { translateY: -potH * 0.1 * s },
      { scale: 1 + swirl.active.value * 0.06 },
    ],
  }));

  return (
    <>
      <SplashbackBand s={s} x={0} y={4} w={w} depth={Math.max(26, deckTop - 4)} />
      {deckTop > 100 ? (
        <>
          <Shelf s={s} x={8} y={deckTop - 46} w={Math.max(84, side + 40)} />
          <StoreJar s={s} x={12} y={deckTop - 88} h={42} tone="jam" />
          <StoreJar s={s} x={50} y={deckTop - 92} h={46} tone="oats" />
        </>
      ) : null}
      <KitchenWindow s={s} x={w - Math.min(112, side + 56) - 8} y={6} w={Math.min(112, side + 56)} />
      <UtensilRail s={s} x={8} y={6} w={Math.min(140, w * 0.32)} />
      <CounterRun s={s} w={w} y={counterY} h={counterH + 44} deck={deck} />
      <CounterCrumbs s={s} x={hobX} y={counterY - 24} w={hobW} seed={4} />
      <HerbPot s={s} x={Math.max(6, hobX - 50)} y={counterY - deck * 0.06 - 48} h={46} />
      {w - (hobX + hobW) > 78 ? <MixingBowls s={s} x={hobX + hobW + 6} y={counterY - deck * 0.08 - 42} w={66} /> : null}
      <ContactPatch s={s} cx={w / 2} y={hobY + hobH * 0.92} rx={hobW * 0.5} />
      <Hob s={s} x={hobX} y={hobY} w={hobW} lit={bubbling} />
      {bubbling || simmering ? (
        <Steam s={s} x={pot.x + pot.w * 0.28} y={pot.y - pot.w * 0.2} w={pot.w * 0.44} strength={simmering ? 1 : 0.7} />
      ) : null}

      {interactive ? (
        <GestureDetector gesture={swirl.gesture}>
          <View
            accessibilityRole="button"
            accessibilityLabel="Pot — swirl your finger round and round to stir it, or tap it"
            style={at(s, pot.x, pot.y, pot.w, pot.h)}
          >
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <ScalePotArt size={pot.w * s} bubbling={bubbling} />
            </View>
            {showHint ? <SwirlHint size={potW * 0.6 * s} style={styles.potCentre} /> : null}
            <Animated.View style={[styles.potCentre, spoonStyle]} pointerEvents="none">
              <WoodenSpoon size={potW * 0.2 * s} />
            </Animated.View>
          </View>
        </GestureDetector>
      ) : (
        <View style={at(s, pot.x, pot.y, pot.w, pot.h)} pointerEvents="none">
          <ScalePotArt size={pot.w * s} bubbling={bubbling} />
        </View>
      )}
    </>
  );
}

/** The same enamelled stock pot the Soup Pot cooks in — one pot, one kitchen. */
function ScalePotArt({ size, bubbling }: { size: number; bubbling: boolean }) {
  return <StockPot size={size} bubbling={bubbling} level="low" />;
}

function CrewRow({
  label,
  count,
  extraFrom,
  size,
}: {
  label: string;
  count: number;
  extraFrom?: number;
  size: number;
}) {
  return (
    <View style={styles.crewCol}>
      <View style={styles.crewRow}>
        {Array.from({ length: Math.min(count, 8) }, (_, i) => (
          <Animated.View
            key={i}
            entering={ZoomIn.delay(i * 50)
              .springify()
              .damping(13)}
            style={extraFrom !== undefined && i >= extraFrom ? styles.crewExtra : undefined}
          >
            {/* critique #23 — full rigs, not heads in circles */}
            <CrewFigure {...(CREW[i % CREW.length] ?? CREW[0])} size={size} bobPhase={i * 0.4} />
          </Animated.View>
        ))}
      </View>
      <Text variant="tiny" color={roles.ink.secondary}>
        {label}
      </Text>
    </View>
  );
}

function ScaleLine({
  index,
  icon,
  en,
  was,
  value,
  correct,
  bump,
  onStep,
}: {
  index: number;
  icon: string;
  en: string;
  was: number;
  value: number;
  correct: boolean;
  bump: number;
  onStep: (delta: number) => void;
}) {
  const fb = useFeedbackAnim();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (bump > 0) fb.wobble({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump]);

  useEffect(() => {
    pulse.value = withSequence(withSpring(1.12, springs.pop), withSpring(1, springs.gentle));
  }, [pulse, value]);

  /**
   * SCOOP THE AMOUNT. Dragging the number up adds and down takes away — the
   * hand movement of tipping more flour into the bowl. The + and − buttons sit
   * either side of it and do exactly the same job, so the drag is the nicer
   * road, never the only one.
   */
  const scrub = useScrubGesture({ stepPx: 32, onStep });
  const numStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value * (1 + scrub.active.value * 0.08) }, { translateY: scrub.pull.value * 0.12 }],
  }));

  // Outer node owns the entrance (layout) animation, inner node owns the wobble
  // transform — Reanimated warns and can drop one of them if they share a node.
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).springify()}>
      <Animated.View style={fb.style}>
        <View style={[styles.line, correct && styles.lineDone]}>
          {/* the ingredient is a THING with a dish under it, not a sticker in
              a list — this row is the whole picture on a Recipe Scale screen */}
          <FoodThumb id={icon} size={46} />
          {/* BLOCKING DEFECT FIX: six labels were truncated ("mushr…",
              "champiñ…", "tomate · …"). Names now wrap onto two lines and the
              "was N" note sits on its own line — the layout gives, not the word.
              The printed Spanish is gone from here; the word is still spoken. */}
          <View style={styles.lineText}>
            <Text variant="bodyStrong" color={palette.navy} numberOfLines={2} style={styles.lineName}>
              {pluralEn(en, value)}
            </Text>
            <Text variant="tiny" color={roles.ink.muted} numberOfLines={1} style={styles.lineWas}>
              was {was}
            </Text>
          </View>
          {/* red is brand energy, never a destructive control: minus is neutral */}
          <Stepper label="−" tone="neutral" onPress={() => onStep(-1)} disabled={value <= 0} />
          <GestureDetector gesture={scrub.gesture}>
            <Animated.View
              accessibilityRole="adjustable"
              accessibilityLabel={`${en}: ${value}. Drag up for more, down for fewer.`}
              style={[styles.value, numStyle]}
            >
              <Text variant="h1" color={correct ? palette.leafGreenDark : palette.navy}>
                {value}
              </Text>
            </Animated.View>
          </GestureDetector>
          <Stepper label="+" tone="add" onPress={() => onStep(1)} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function Stepper({
  label,
  tone,
  onPress,
  disabled,
}: {
  label: string;
  tone: 'neutral' | 'add';
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'One more' : 'One less'}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={[styles.stepper, tone === 'add' ? styles.stepperAdd : styles.stepperNeutral, disabled && styles.stepperOff]}
    >
      <Text variant="h1" color={tone === 'add' ? palette.white : palette.navy}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  ratio: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: 4,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: radii.card,
  },
  crewCol: { alignItems: 'center' },
  crewRow: { flexDirection: 'row', gap: 2 },
  crewExtra: { borderRadius: 999, borderWidth: 2, borderColor: palette.safetyYellow },
  cardWrap: { paddingHorizontal: spacing.md, marginTop: spacing.xs },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    /* Tight gaps, because every pixel here belongs to the ingredient name:
       "strawberries" was breaking across two lines in the middle of the word. */
    gap: spacing.xxs,
    backgroundColor: roles.surface.card,
    borderRadius: radii.tile,
    paddingVertical: 6,
    paddingHorizontal: spacing.xs,
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadows.soft,
  },
  lineDone: { borderColor: palette.leafGreen, backgroundColor: palette.mint },
  lineText: { flex: 1, minWidth: 84 },
  lineName: { fontSize: 16, lineHeight: 20 },
  lineWas: { fontSize: 12, lineHeight: 15 },
  /* 44 wide, not 56: the extra room went to the ingredient name, which was
     breaking "mushrooms" across two lines mid-word. The drag target is still a
     full 56 tall, and the two 56 × 56 steppers beside it do the same job. */
  value: { minWidth: 34, height: 56, alignItems: 'center', justifyContent: 'center' },
  stepper: {
    width: 56,
    height: 56,
    flexShrink: 0,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  stepperNeutral: { backgroundColor: palette.creamDeep },
  stepperAdd: { backgroundColor: palette.leafGreen },
  stepperOff: { backgroundColor: palette.lockedGrey },
  potStage: { flex: 1 },
  potCentre: { position: 'absolute', alignSelf: 'center', top: '22%' },
  trayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 4,
  },
  meterWrap: { alignItems: 'center', gap: 6, paddingVertical: spacing.xs },
  meterTrack: { width: '76%', height: 14, borderRadius: 7, backgroundColor: roles.surface.sunken, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 7, backgroundColor: palette.leafGreen },
});
