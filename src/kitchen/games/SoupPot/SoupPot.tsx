import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import type { VocabWord } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { useCaptainLine } from '@/minigames/logic/shared/speak';
import { hit, palette, radii, roles, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { ActivityFrame, AnswerTile, Button, CheckIcon, Text, TrayRow, VocabIcon } from '@/ui';

import { POT_ASPECT, StockPot } from '../../parts/Cookware';
import { FoodThumb } from '../../parts/FoodBits';
import { FluidStage, at, type FluidBox } from '../../parts/Stage';
import {
  Canister,
  ContactPatch,
  CounterCrumbs,
  CounterRun,
  HerbPot,
  Hob,
  KitchenWall,
  KitchenWindow,
  Shelf,
  SplashbackBand,
  Steam,
  StoreJar,
  TeaTowel,
  UtensilRail,
} from '../../parts/KitchenRoom';
import { countPhraseEn, countPhraseEs, orderPhraseEn, orderPhraseEs } from '../../spanish';
import { answerOptions, potDrop, potState, potTotal } from '../../shareMath';
import { kitchenFeel, useCaptainHint } from '../useKitchenGame';

/**
 * Where a piece floats once it is in the broth, as a FRACTION of the pot's
 * width — so the soup fills the pot at every size instead of clustering in the
 * middle of a pot that has grown around it.
 */
const FLOAT: readonly { x: number; y: number }[] = [
  { x: -0.16, y: -0.034 }, { x: 0.02, y: -0.055 }, { x: 0.19, y: -0.021 },
  { x: -0.27, y: 0.021 }, { x: -0.076, y: 0.034 }, { x: 0.11, y: 0.042 },
  { x: 0.28, y: 0.013 }, { x: -0.18, y: 0.08 }, { x: 0.013, y: 0.097 }, { x: 0.18, y: 0.072 },
];

interface Scene {
  s: number;
  w: number;
  h: number;
  counterY: number;
  counterH: number;
  /** how much worktop SURFACE is drawn above the counter's front edge */
  deck: number;
  deckTop: number;
  pot: { x: number; y: number; w: number; h: number };
  /** the surface of the broth, where a piece lands */
  broth: { x: number; y: number };
  piece: number;
  hob: { x: number; y: number; w: number };
}

/**
 * Compose the room. The pot is the subject of the screen, so it takes the width
 * the play area gives it and stands on a real hob; the wall behind it gets a
 * shelf, a window and a rail rather than the flat beige field this game shipped
 * with.
 */
function layout(box: FluidBox): Scene {
  const { s, w, h } = box;
  /* the counter is a SURFACE: `deck` is the worktop drawn receding above its
     front edge, and the hob stands ON that wood — before this the hob's feet
     were level with the counter's nose, so a two-ring stove was balanced on a
     20-unit lip with wall behind it */
  const counterH = Math.max(26, Math.min(52, h * 0.09));
  const counterY = h - counterH;
  const deck = Math.max(52, Math.min(132, h * 0.22));
  const deckTop = counterY - deck;
  const top = 6;
  const availH = deckTop + deck * 0.62 - top;

  /* the pot is sized first — it is the subject — and the hob is built to fit
     under it, rather than a giant stove squeezing the pan it is there to hold */
  const potW = Math.min(w * 0.74, (availH - 40) * POT_ASPECT);
  const potH = potW / POT_ASPECT;
  /* the hob never runs to the frame edge: a stove sliced by the screen reads as
     a bug, not as a room carrying on */
  const hobW = Math.min(w - 32, potW * 1.28);
  const hobH = hobW * 0.3;
  const deckY = counterY - deck * 0.34;
  const hob = { x: (w - hobW) / 2, y: deckY - hobH * 0.88, w: hobW };
  /* the drawing's feet sit at 0.94 of its box, so the pot lands ON the ring
     instead of hovering a finger's width above it */
  const pot = { x: (w - potW) / 2, y: hob.y + hobH * 0.3 - potH * 0.94, w: potW, h: potH };

  return {
    s,
    w,
    h,
    counterY,
    counterH,
    deck,
    deckTop,
    pot,
    broth: { x: pot.x + potW / 2, y: pot.y + potH * 0.28 },
    piece: Math.max(26, potW * 0.13),
    hob,
  };
}

/**
 * SOUP POT — the pot cooks in an order.
 *
 * Count Ingredients asks "is the right stuff in the bowl?"; this asks "did it go
 * in in the right order?", which is a different job for a child's head. The pot
 * card is the sequence — chip 1, chip 2, chip 3 — and only the live chip
 * accepts anything. Putting the potatoes in before the onions is never wrong in
 * red: the pot just says "the onions go first" and hands it back.
 *
 * The task lives once, in the TaskBar. Captain Bea's bubble carries the hints.
 */
export function SoupPot({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'soup-pot'>) {
  const session = useMiniGameSession('soup-pot', onComplete, onEvent);
  const assist = useCaptainHint(session);
  const steps = challenge.steps;

  const [added, setAdded] = useState<number[]>(() => steps.map(() => 0));
  const [phase, setPhase] = useState<'cooking' | 'asking' | 'simmering'>('cooking');
  const finished = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const wobble = useSharedValue(0);

  useEffect(() => {
    const list = timers.current;
    return () => {
      for (const t of list) clearTimeout(t);
    };
  }, []);

  const state = useMemo(() => potState(steps, added), [added, steps]);
  const total = useMemo(() => potTotal(steps), [steps]);
  const spanishFirst = challenge.spokenEs === true;

  /* ---- what Captain Bea says --------------------------------------- */

  const orderEn = useMemo(() => orderPhraseEn(steps), [steps]);
  const orderEs = useMemo(() => orderPhraseEs(steps), [steps]);
  const spokenLine = spanishFirst ? orderEs : orderEn;

  /* The TaskBar owns the words; this owns the voice. */
  useCaptainLine(phase === 'cooking' ? spokenLine : null, session.say, {
    lang: spanishFirst ? 'es' : 'en',
    es: orderEs,
    delayMs: 420,
  });

  const readOrder = useCallback(() => {
    sfx.play('page');
    haptics.select();
    if (spanishFirst) {
      speech.say(orderEs, { speaker: 'bea', lang: 'es' });
      timers.current.push(setTimeout(() => speech.say(orderEn, { speaker: 'bea' }), 2400));
    } else {
      speech.say(orderEn, { speaker: 'bea' });
    }
  }, [orderEn, orderEs, spanishFirst]);

  /* ---- the counter -------------------------------------------------- */

  /** One tile per ingredient — tiles never leave, so the counter never shifts. */
  const counter = useMemo<VocabWord[]>(() => {
    const all = [...steps.map((s) => s.item), ...challenge.extras];
    // interleave so the soup's own ingredients are not all bunched on the left
    return all.map((w, i) => ({ w, k: (i * 5) % Math.max(1, all.length) })).sort((a, b) => a.k - b.k).map((e) => e.w);
  }, [challenge.extras, steps]);

  const wanted = state.step >= 0 ? steps[state.step] : undefined;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setPhase('simmering');
    kitchenFeel.finish();
    timers.current.push(setTimeout(() => session.complete(), 1500));
  }, [session]);

  const potIsFull = useCallback(
    (next: number[]) => {
      if (!potState(steps, next).done) return;
      if (challenge.askTotal !== undefined) {
        timers.current.push(
          setTimeout(() => {
            setPhase('asking');
            sfx.play('robot-beep');
          }, 520),
        );
        return;
      }
      assist.cheer('That is the whole pot. ¡Qué rico!');
      timers.current.push(setTimeout(finish, 620));
    },
    [assist, challenge.askTotal, finish, steps],
  );

  /* ---- the band-C question: how many pieces went in? ----------------- */

  const options = useMemo(
    () => (challenge.askTotal === undefined ? [] : answerOptions(challenge.askTotal, 3)),
    [challenge.askTotal],
  );
  const [picked, setPicked] = useState<number | null>(null);

  const answer = useCallback(
    (value: number) => {
      if (picked !== null) return;
      if (value === challenge.askTotal) {
        setPicked(value);
        session.correct('total');
        kitchenFeel.good();
        timers.current.push(setTimeout(finish, 700));
        return;
      }
      assist.nudge(`Add the numbers on the card: ${steps.map((s) => s.count).join(' + ')}.`);
    },
    [assist, challenge.askTotal, finish, picked, session, steps],
  );

  const put = useCallback(
    (word: VocabWord) => {
      if (phase !== 'cooking') return;
      const drop = potDrop(steps, added, word.id);

      if (drop.verdict === 'add') {
        const next = added.map((n, i) => (i === drop.step ? n + 1 : n));
        setAdded(next);
        kitchenFeel.drop('drop');
        speech.sayWord(word);
        session.learnedWord(word.es);
        const step = steps[drop.step];
        if (step && next[drop.step] === step.count) {
          session.correct(`step ${drop.step + 1}`);
          sfx.play('correct');
        }
        session.progress(potState(steps, next).total, total);
        potIsFull(next);
        return;
      }

      wobble.value = withSequence(withTiming(-6, { duration: 70 }), withTiming(6, { duration: 70 }), withTiming(0, { duration: 70 }));
      if (drop.verdict === 'wait' && wanted) {
        assist.nudge(
          `Not yet — ${countPhraseEn(wanted.count, wanted.item)} go in first.`,
          countPhraseEs(wanted.count, wanted.item),
        );
      } else {
        assist.nudge(`${word.en} is for another dish — it stays on the counter.`, word.es);
      }
    },
    [added, assist, phase, potIsFull, session, steps, total, wanted, wobble],
  );

  /** The child asked for help: put the very next piece in for them. */
  const showMe = useCallback(() => {
    assist.askedForHelp();
    if (phase === 'asking') {
      if (challenge.askTotal !== undefined) answer(challenge.askTotal);
      return;
    }
    if (wanted) put(wanted.item);
  }, [answer, assist, challenge.askTotal, phase, put, wanted]);

  /* ---- art ---------------------------------------------------------- */

  const potStyle = useAnimatedStyle(() => ({ transform: [{ translateX: wobble.value }] }));
  const bubbling = state.total > 0;
  const floats = useMemo(() => {
    const out: { word: VocabWord; key: string }[] = [];
    steps.forEach((step, i) => {
      const have = Math.min(added[i] ?? 0, step.count);
      for (let n = 0; n < have; n += 1) out.push({ word: step.item, key: `${step.item.id}-${n}` });
    });
    return out.slice(0, FLOAT.length);
  }, [added, steps]);

  return (
    <ActivityFrame
      task="Fill the pot in order."
      es="Llena la olla en orden."
      detail={ageBand === 'A' ? 'Tap number 1 first.' : 'Left to right, like the card.'}
      onReplay={readOrder}
      compact={compact}
      backdrop={<KitchenWall />}
      overlay={
        <>
          
          {phase === 'asking' ? (
            <Animated.View entering={FadeIn} style={styles.askLayer} pointerEvents="box-none">
              <Animated.View entering={ZoomIn.springify().damping(13)} style={[styles.askCard, shadows.card]}>
                <Text variant="h3" center>
                  How many pieces went in?
                </Text>
                <View style={styles.askRow}>
                  {options.map((value, i) => (
                    <AnswerTile
                      key={value}
                      label={String(value)}
                      index={i}
                      size="sm"
                      state={
                        picked === value
                          ? 'correct'
                          : assist.highlight && value === challenge.askTotal
                            ? 'highlight'
                            : 'idle'
                      }
                      onPress={() => answer(value)}
                    />
                  ))}
                </View>
              </Animated.View>
            </Animated.View>
          ) : null}
        </>
      }
      hint={{ text: assist.text, es: assist.es, visible: assist.visible, onDismiss: assist.dismiss }}
      controls={
        <View style={styles.tray}>
          <TrayRow>
            {counter.map((word, i) => (
              <CounterTile
                key={word.id}
                word={word}
                index={i}
                highlight={assist.highlight && phase === 'cooking' && word.id === wanted?.item.id}
                disabled={phase !== 'cooking'}
                onPress={() => put(word)}
              />
            ))}
          </TrayRow>
          {assist.offerHelp && phase !== 'simmering' ? (
            <View style={styles.helpRow}>
              <Button label="Show me" tone="yellow" size="sm" onPress={showMe} sound="tap-soft" />
            </View>
          ) : null}
        </View>
      }
    >
      <View style={styles.play}>
        <PotCard steps={steps} added={added} step={state.step} />

        <FluidStage minH={280} maxScale={1.8} style={styles.stage}>
          {(box) => {
            const sc = layout(box);
            const { s, w, pot } = sc;
            const side = (w - sc.hob.w) / 2 + sc.hob.w * 0.06;
            const deckFoot = sc.deck * 0.06;
            return (
              <>
                {/* --- the room ------------------------------------- */}
                <SplashbackBand s={s} x={0} y={4} w={w} depth={Math.max(26, sc.deckTop - 4)} />
                {sc.deckTop > 100 ? (
                  <>
                    <Shelf s={s} x={8} y={sc.deckTop - 46} w={Math.max(84, side + 40)} />
                    <StoreJar s={s} x={12} y={sc.deckTop - 46 - 42} h={42} tone="herbs" />
                    <Canister s={s} x={48} y={sc.deckTop - 46 - 46} h={46} tone="#E8C89B" />
                  </>
                ) : null}
                <KitchenWindow s={s} x={w - Math.min(112, side + 56) - 8} y={6} w={Math.min(112, side + 56)} />
                <UtensilRail s={s} x={8} y={6} w={Math.min(140, w * 0.32)} />
                <TeaTowel s={s} x={w - 46} y={Math.max(8, sc.deckTop - 92)} w={34} />
                <CounterRun s={s} w={w} y={sc.counterY} h={sc.counterH + 44} deck={sc.deck} />
                <CounterCrumbs s={s} x={sc.hob.x} y={sc.counterY - 24} w={sc.hob.w} seed={3} />
                <HerbPot s={s} x={Math.max(6, sc.hob.x - 50)} y={sc.counterY - deckFoot - 48} h={46} />

                {/* --- the hob and the pot -------------------------- */}
                <ContactPatch s={s} cx={w / 2} y={sc.hob.y + sc.hob.w * 0.3 * 0.92} rx={sc.hob.w * 0.5} />
                <Hob s={s} x={sc.hob.x} y={sc.hob.y} w={sc.hob.w} lit={bubbling} />
                {bubbling || phase === 'simmering' ? (
                  <Steam s={s} x={pot.x + pot.w * 0.28} y={pot.y - pot.w * 0.2} w={pot.w * 0.44} strength={phase === 'simmering' ? 1 : 0.7} />
                ) : null}

                <Animated.View style={[at(s, pot.x, pot.y, pot.w, pot.h), potStyle]} pointerEvents="none">
                  <PotArt size={pot.w * s} bubbling={bubbling} />
                </Animated.View>

                {floats.map((piece, i) => {
                  const spot = FLOAT[i] ?? { x: 0, y: 0 };
                  return (
                    <Animated.View
                      key={piece.key}
                      entering={ZoomIn.springify().damping(12)}
                      style={at(
                        s,
                        sc.broth.x + spot.x * pot.w - sc.piece / 2,
                        sc.broth.y + spot.y * pot.w - sc.piece / 2,
                        sc.piece,
                        sc.piece,
                      )}
                      pointerEvents="none"
                    >
                      <VocabIcon id={piece.word.icon} size={sc.piece * s} noShadow />
                    </Animated.View>
                  );
                })}

                {phase === 'simmering' ? (
                  <Animated.View
                    entering={FadeIn}
                    style={[at(s, pot.x + pot.w / 2 - 100, Math.max(4, pot.y - 46), 200, 38), styles.banner]}
                    pointerEvents="none"
                  >
                    <Text variant="h3" center color={palette.leafGreenDark}>
                      ¡Buen provecho!
                    </Text>
                  </Animated.View>
                ) : null}
              </>
            );
          }}
        </FluidStage>
      </View>
    </ActivityFrame>
  );
}

/* ------------------------------------------------------------------ */
/* The pot card — the order, drawn                                      */
/* ------------------------------------------------------------------ */

function PotCard({
  steps,
  added,
  step,
}: {
  steps: { item: VocabWord; count: number }[];
  added: number[];
  step: number;
}) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.card, shadows.soft]}>
      <View style={styles.cardRow}>
        {steps.map((s, i) => {
          const have = Math.min(added[i] ?? 0, s.count);
          const done = have >= s.count;
          const now = i === step;
          return (
            <View key={s.item.id} style={[styles.chip, done && styles.chipDone, now && styles.chipNow]}>
              <View style={[styles.chipNum, done && styles.chipNumDone]}>
                {done ? (
                  <CheckIcon size={13} color={palette.white} />
                ) : (
                  <Text variant="tiny" color={now ? palette.navy : palette.navyMuted}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <VocabIcon id={s.item.icon} size={34} noShadow />
              <Text variant="tiny" color={done ? palette.leafGreenDark : palette.navy} style={styles.chipCount}>
                {have}/{s.count}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* One thing on the counter                                             */
/* ------------------------------------------------------------------ */

function CounterTile({
  word,
  index,
  highlight,
  disabled,
  onPress,
}: {
  word: VocabWord;
  index: number;
  highlight?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 45).springify().damping(15)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${word.en} — ${word.es}`}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          shadows.soft,
          highlight && styles.tileHint,
          pressed && styles.tilePressed,
          disabled && styles.tileOff,
        ]}
      >
        <FoodThumb id={word.icon} size={52} />
        <Text variant="tiny" center numberOfLines={1} style={styles.tileLabel}>
          {word.en}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* The pot                                                              */
/* ------------------------------------------------------------------ */

/** The station's one stock pot, filled to the brim and floating its soup. */
function PotArt({ size, bubbling }: { size: number; bubbling: boolean }) {
  return <StockPot size={size} bubbling={bubbling} level="brim" />;
}

const styles = StyleSheet.create({
  play: { flex: 1, gap: spacing.xs },
  stage: { flex: 1 },

  card: {
    alignSelf: 'center',
    backgroundColor: roles.surface.card,
    borderRadius: radii.card,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.sm,
  },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  /* Five steps have to sit on ONE rail: a wrapped card pushes the pot off the
     bottom of a small phone, so the chip is a fixed width and the words are
     sized to fit inside it. */
  chip: {
    alignItems: 'center',
    gap: 1,
    width: 62,
    paddingHorizontal: 2,
    paddingVertical: 4,
    borderRadius: radii.card,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: roles.surface.sunken,
  },
  chipNow: { borderColor: palette.safetyYellow, backgroundColor: palette.white, ...shadows.glowGold },
  chipDone: { backgroundColor: palette.mint },
  chipCount: { fontSize: 12, lineHeight: 15, letterSpacing: 0 },
  chipWord: { fontSize: 11, lineHeight: 14, letterSpacing: 0 },
  chipNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31,42,90,0.08)',
  },
  chipNumDone: { backgroundColor: palette.leafGreen },

  banner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
  },

  tray: { gap: spacing.xs },
  helpRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xs },
  tile: {
    width: 84,
    minHeight: hit.big + 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: radii.card,
    borderWidth: 3,
    /* the house 3D pressable: a face standing on a darker edge, so a tile a
       child can pick up sits UP off the tray instead of lying flat on it */
    borderBottomWidth: 7,
    borderColor: roles.border.draggable,
    borderBottomColor: 'rgba(31,42,90,0.16)',
    backgroundColor: roles.surface.card,
  },
  tileLabel: { fontSize: 12, lineHeight: 15, letterSpacing: 0 },
  tileHint: { borderColor: palette.safetyYellow, ...shadows.glowGold },
  tilePressed: { transform: [{ scale: 0.96 }, { translateY: 2 }], borderBottomWidth: 4 },
  tileOff: { opacity: 0.5 },

  askLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  askCard: {
    backgroundColor: roles.surface.card,
    borderRadius: radii.panel,
    padding: spacing.md,
    gap: spacing.xs,
    maxWidth: 380,
  },
  askRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs },
});
