import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { VocabWord } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { useCaptainLine } from '@/minigames/logic/shared/speak';
import { hit, palette, radii, roles, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { ActivityFrame, AnswerTile, Button, CheckIcon, Text, TrayRow, VocabIcon } from '@/ui';

import { Stage as SceneStage } from '@/world';

import { Stage, at } from '../../parts/Stage';
import { countPhraseEn, countPhraseEs, orderPhraseEn, orderPhraseEs } from '../../spanish';
import { answerOptions, potDrop, potState, potTotal } from '../../shareMath';
import { kitchenFeel, useCaptainHint } from '../useKitchenGame';

const D = { w: 390, h: 336 };
const POT = { x: 195, y: 176, w: 300, h: 214 };
/** The broth sits a quarter of the way down the pot drawing (viewBox cy 42 of 168). */
const BROTH_Y = POT.y - POT.h * 0.25;
const PIECE = 34;

/** Where a piece floats once it is in the broth (design units, from the broth centre). */
const FLOAT: readonly { x: number; y: number }[] = [
  { x: -38, y: -8 }, { x: 5, y: -13 }, { x: 46, y: -5 },
  { x: -64, y: 5 }, { x: -18, y: 8 }, { x: 26, y: 10 },
  { x: 66, y: 3 }, { x: -43, y: 19 }, { x: 3, y: 23 }, { x: 43, y: 17 },
];

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
      backdrop={<SceneStage variant="pantry" groundHeight={150} />}
      overlay={
        <>
          
          {phase === 'asking' ? (
            <Animated.View entering={FadeIn} style={styles.askLayer} pointerEvents="box-none">
              <Animated.View entering={ZoomIn.springify().damping(13)} style={[styles.askCard, shadows.card]}>
                <Text variant="h3" center>
                  How many pieces went in?
                </Text>
                <Text variant="small" center color={roles.ink.translation}>
                  ¿Cuántos pedazos entraron?
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

        <Stage design={D} style={styles.stage}>
          {(s) => (
            <>
              <Animated.View style={[at(s, POT.x - POT.w / 2, POT.y - POT.h / 2, POT.w, POT.h), potStyle]} pointerEvents="none">
                <PotArt size={POT.w * s} bubbling={bubbling} simmering={phase === 'simmering'} />
              </Animated.View>

              {floats.map((piece, i) => {
                const spot = FLOAT[i] ?? { x: 0, y: 0 };
                return (
                  <Animated.View
                    key={piece.key}
                    entering={ZoomIn.springify().damping(12)}
                    style={at(s, POT.x + spot.x - PIECE / 2, BROTH_Y + spot.y - PIECE / 2, PIECE, PIECE)}
                    pointerEvents="none"
                  >
                    <VocabIcon id={piece.word.icon} size={PIECE * s} noShadow />
                  </Animated.View>
                );
              })}

              {phase === 'simmering' ? (
                <Animated.View
                  entering={FadeIn}
                  style={[at(s, POT.x - 100, POT.y - POT.h / 2 - 44, 200, 38), styles.banner]}
                  pointerEvents="none"
                >
                  <Text variant="h3" center color={palette.leafGreenDark}>
                    ¡Buen provecho!
                  </Text>
                </Animated.View>
              ) : null}
            </>
          )}
        </Stage>
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
              <VocabIcon id={s.item.icon} size={28} noShadow />
              <Text variant="tiny" color={done ? palette.leafGreenDark : palette.navy} style={styles.chipCount}>
                {have}/{s.count}
              </Text>
              <Text variant="tiny" color={roles.ink.translation} numberOfLines={1} style={styles.chipWord}>
                {s.item.es}
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
        <VocabIcon id={word.icon} size={38} />
        <Text variant="tiny" center numberOfLines={1} style={styles.tileLabel}>
          {word.en}
        </Text>
        <Text variant="tiny" center numberOfLines={1} color={roles.ink.translation} style={styles.tileLabel}>
          {word.es}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* The pot                                                              */
/* ------------------------------------------------------------------ */

function PotArt({ size, bubbling, simmering }: { size: number; bubbling: boolean; simmering: boolean }) {
  const steam = useSharedValue(0);
  useEffect(() => {
    if (!simmering) return;
    steam.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1, true);
  }, [simmering, steam]);
  const steamStyle = useAnimatedStyle(() => ({ opacity: 0.25 + steam.value * 0.55, transform: [{ translateY: -steam.value * 8 }] }));

  return (
    <View style={styles.pot}>
      {simmering ? (
        <Animated.View style={[styles.steam, steamStyle]} pointerEvents="none">
          <Svg width={size * 0.5} height={size * 0.3} viewBox="0 0 100 60">
            <Path d="M24 56c-10-12 8-16 0-28s10-18 10-18" stroke="rgba(255,255,255,0.85)" strokeWidth={7} strokeLinecap="round" fill="none" />
            <Path d="M56 56c-10-14 10-18 2-30s8-16 8-16" stroke="rgba(255,255,255,0.7)" strokeWidth={7} strokeLinecap="round" fill="none" />
          </Svg>
        </Animated.View>
      ) : null}

      <Svg width={size} height={size * (POT.h / POT.w)} viewBox="0 0 236 168">
        <Defs>
          <LinearGradient id="potBody" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.engineRedDark} />
            <Stop offset="0.35" stopColor={palette.engineRed} />
            <Stop offset="1" stopColor={palette.engineRedDark} />
          </LinearGradient>
        </Defs>

        {/* the hob: warm, contained, no flames — the crew works the heat */}
        <Ellipse cx={118} cy={156} rx={86} ry={11} fill="rgba(31,42,90,0.16)" />
        <Rect x={38} y={140} width={160} height={14} rx={7} fill={palette.slate} />
        <Rect x={54} y={143} width={128} height={8} rx={4} fill={bubbling ? '#F7A64B' : palette.slateLight} />

        {/* handles */}
        <Rect x={2} y={54} width={30} height={16} rx={8} fill={palette.slate} />
        <Rect x={204} y={54} width={30} height={16} rx={8} fill={palette.slate} />

        {/* body */}
        <Path d="M26 44h184l-12 92a10 10 0 0 1-10 9H48a10 10 0 0 1-10-9z" fill="url(#potBody)" />
        <Path d="M40 60c6 30 8 56 8 78" stroke="rgba(255,255,255,0.28)" strokeWidth={7} strokeLinecap="round" fill="none" />

        {/* rim + broth */}
        <Ellipse cx={118} cy={44} rx={94} ry={20} fill={palette.white} />
        <Ellipse cx={118} cy={44} rx={82} ry={14} fill="#F2A93F" />
        <Ellipse cx={118} cy={42} rx={82} ry={14} fill="#FFC463" />
        {bubbling ? (
          <>
            <Circle cx={86} cy={40} r={5} fill="rgba(255,255,255,0.6)" />
            <Circle cx={132} cy={45} r={4} fill="rgba(255,255,255,0.5)" />
            <Circle cx={158} cy={38} r={3} fill="rgba(255,255,255,0.55)" />
          </>
        ) : null}
      </Svg>
    </View>
  );
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
    width: 66,
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
  pot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  steam: { position: 'absolute', top: -6, alignItems: 'center' },

  tray: { gap: spacing.xs },
  helpRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xs },
  tile: {
    width: 80,
    minHeight: hit.big + 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: radii.card,
    borderWidth: 3,
    borderColor: roles.border.draggable,
    backgroundColor: roles.surface.card,
  },
  tileLabel: { fontSize: 12, lineHeight: 15, letterSpacing: 0 },
  tileHint: { borderColor: palette.safetyYellow, ...shadows.glowGold },
  tilePressed: { transform: [{ scale: 0.96 }] },
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
