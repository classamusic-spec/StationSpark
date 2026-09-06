import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring } from 'react-native-reanimated';
import type { CharacterId } from '@/content/types';
import type { NpcVariant } from '@/characters/Npc';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, roles, shadows, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useFeedbackAnim, useReducedMotion } from '@/hooks';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { ActivityFrame } from '@/ui/kit/ActivityFrame';
import { AnswerTile } from '@/ui/kit/AnswerTile';
import { VocabIcon } from '@/ui/kit/VocabIcon';

import { Stage as SceneStage } from '@/world';
import { CrewFigure } from '@/world/scenes';
import { Stage, at } from '../../parts/Stage';
import { useSwing } from '../../parts/motion';
import { PlateArt } from '../../parts/FoodBits';
import { ChefKnife, EquationStrip } from '../../parts/SceneBits';
import { pluralEn } from '../../spanish';
import { answerOptions, equationText, nextPlate, shareState } from '../../shareMath';
import { CutHint, useIdleAssist, useStrokeGesture, type Stroke } from '../../gestures';
import { kitchenFeel, nearestTarget, useCaptainHint, useDragSource, useSpokenTask, useTimers } from '../useKitchenGame';

/**
 * BLOCKING DEFECT FIX (art critique): the answer tiles were drawn at y 150 and
 * the plate cards started at y 160, so the three plates and a stray answer card
 * piled on top of each other. The design box is taller now and the three bands
 * — serving tray, answer row, plate row — never share a pixel.
 */
const D = { w: 390, h: 486 };
const TRAY = { x: 18, y: 10, w: 354, h: 104 };
const ASK_Y = 126;
/** the one portion you can pick up, sitting on the counter in front of the tray */
const NEXT = { y: 126, size: 74 };
const PLATE_TOP = 250;
const PLATE_H = 210;
const PLATE_Y = PLATE_TOP + 120;
const ITEM = 42;

interface CrewSeat {
  id: CharacterId;
  npc?: NpcVariant;
  name: string;
}

/* Four eaters, and four is load-bearing: the challenge divides by the number
 * of seats. Change this list and you change the arithmetic. */
const CREW: CrewSeat[] = [
  { id: 'rookie', name: 'You' },
  { id: 'bea', name: 'Bea' },
  { id: 'npc', npc: 'rosa', name: 'Rosa' },
  { id: 'npc', npc: 'gino', name: 'Gino' },
];

const FALLBACK_CREW: CrewSeat = { id: 'rookie', name: 'You' };

export function DivideShare({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'divide-share'>) {
  const session = useMiniGameSession('divide-share', onComplete, onEvent);
  const assist = useCaptainHint(session);
  const timers = useTimers();
  const reduced = useReducedMotion();

  const among = Math.max(1, challenge.among);
  const each = Math.max(1, challenge.each || Math.floor(challenge.total / among));
  const asksFirst = ageBand !== 'A';

  const [phase, setPhase] = useState<'ask' | 'deal' | 'eating'>(asksFirst ? 'ask' : 'deal');
  const [plates, setPlates] = useState<number[]>(() => Array.from({ length: among }, () => 0));
  const [wrong, setWrong] = useState<number[]>([]);
  const [bump, setBump] = useState<number[]>(() => Array.from({ length: among }, () => 0));
  const [hover, setHover] = useState(-1);
  const [served, setServed] = useState(0);

  /** one writer for the plates, so two quick taps can never both read stale */
  const platesRef = useRef<number[]>(plates);
  const gate = useRef({ answered: false, eating: false });
  /** late-bound so `give` can reset the idle clock that is declared after it */
  const dealAssistRef = useRef<(() => void) | null>(null);

  const placed = plates.reduce((a, b) => a + b, 0);
  const left = Math.max(0, challenge.total - placed);
  const itemName = pluralEn(challenge.item.en, challenge.total);

  const platePoints = useMemo(() => {
    // leave a real gutter between cards so neighbouring plates never touch
    const w = Math.max(64, Math.min(92, (D.w - 28) / among - 10));
    const gap = (D.w - among * w) / (among + 1);
    return Array.from({ length: among }, (_, i) => ({ x: gap + i * (w + gap) + w / 2, y: PLATE_Y, w }));
  }, [among]);

  /* The task bar gives two lines and no more. The numbers live in the equation
     strip right under it, so the words only have to say what to *do*. */
  const task =
    phase === 'ask'
      ? `How many ${itemName} each?`
      : phase === 'eating'
        ? '¡Buen provecho!'
        : `Give everyone ${each} ${pluralEn(challenge.item.en, each)}`;

  const detail =
    phase === 'ask'
      ? `${challenge.total} for ${among} firefighters.`
      : phase === 'eating'
        ? undefined
        : 'Swipe the knife across the tray, or tap a plate.';

  const replay = useSpokenTask(
    phase === 'ask'
      ? `${challenge.total} ${itemName} for ${among} firefighters. How many each?`
      : phase === 'eating'
        ? `${each} ${pluralEn(challenge.item.en, each)} each. ¡Buen provecho!`
        : `Give everyone the same number of ${itemName}.`,
    { key: phase },
  );

  useEffect(() => {
    session.progress(phase === 'ask' ? 0 : 1, 2);
  }, [phase, session]);

  const wobblePlate = useCallback((i: number) => {
    setBump((b) => b.map((v, k) => (k === i ? v + 1 : v)));
  }, []);

  const eatUp = useCallback(() => {
    if (gate.current.eating) return;
    gate.current.eating = true;
    setPhase('eating');
    kitchenFeel.finish();
    timers.after(1600, () => session.complete());
  }, [session, timers]);

  const give = useCallback(
    (plateIndex: number) => {
      if (gate.current.eating) return;
      const current = platesRef.current;
      if (plateIndex < 0 || plateIndex >= current.length) return;
      const total = current.reduce((a, b) => a + b, 0);
      if (total >= challenge.total) return;
      if ((current[plateIndex] ?? 0) >= each) {
        wobblePlate(plateIndex);
        assist.nudge(`That plate has enough — everybody gets ${each}.`);
        return;
      }
      const next = [...current];
      next[plateIndex] = (next[plateIndex] ?? 0) + 1;
      platesRef.current = next;
      setPlates(next);
      setServed((n) => n + 1);
      kitchenFeel.drop();
      session.correct('share');
      /* NEVER A DEAD END: if the tray empties before every plate is full — a
         challenge where `each × among` does not divide the total — the meal
         still ends. Nobody is left staring at an empty tray and a hungry cook. */
      const emptied = next.reduce((a, b) => a + b, 0) >= challenge.total;
      if (shareState(next, each).done || emptied) timers.after(420, eatUp);
    },
    [assist, challenge.total, each, eatUp, session, timers, wobblePlate],
  );

  /* any real serving — knife, plate tap or drag — resets Captain Bea's clock */
  useEffect(() => {
    if (served > 0) dealAssistRef.current?.();
  }, [served]);

  /* ------------------------------------------------------------------ */
  /* Cut one portion free with a swipe of the knife                       */
  /* ------------------------------------------------------------------ */

  const serveNext = useCallback(() => {
    const idx = nextPlate(platesRef.current, each);
    if (idx < 0) return;
    kitchenFeel.chop();
    give(idx);
  }, [each, give]);

  /**
   * NEVER A DEAD END. If the tray sits untouched, Captain Bea picks the knife
   * up: she says what to do and cuts one free herself, over and over, until
   * everybody has been served. Any real serving resets the clock, so a child who
   * is dealing never sees it.
   */
  const dealAssist = useIdleAssist({
    active: phase === 'deal' && left > 0,
    firstMs: 9000,
    repeatMs: 3200,
    onHelp: (round) => {
      if (round === 1) {
        assist.cheer('Swipe the knife across the tray to cut one free!');
        return;
      }
      serveNext();
    },
  });
  dealAssistRef.current = dealAssist.poke;

  const onTrayStroke = useCallback(
    (stroke: Stroke, s: number) => {
      dealAssist.poke();
      if (phase !== 'deal') return;
      if (!stroke.tapped && stroke.length < 26 * (s || 1)) return;
      serveNext();
    },
    [dealAssist, phase, serveNext],
  );

  const answer = useCallback(
    (value: number) => {
      if (gate.current.answered) return;
      if (value === each) {
        gate.current.answered = true;
        kitchenFeel.good();
        session.correct('division');
        assist.cheer(`${each} each — now deal them out!`);
        timers.after(640, () => setPhase('deal'));
      } else {
        setWrong((w) => (w.includes(value) ? w : [...w, value]));
        assist.nudge('Try sharing them out one at a time and count one plate.');
      }
    },
    [assist, each, session, timers],
  );

  const showMe = useCallback(() => {
    assist.askedForHelp();
    if (phase === 'ask') {
      gate.current.answered = true;
      setPhase('deal');
      return;
    }
    serveNext();
  }, [assist, phase, serveNext]);

  /* The tray holds two rows of eight and no more: a third row used to be drawn
     below the tray, floating on the counter behind the answer tiles. The count
     under the tray is the number that matters, not how many are painted. */
  const onTray = phase === 'deal' ? Math.max(0, left - 1) : left;
  const trayItems = Array.from({ length: Math.min(16, onTray) }, (_, i) => i);
  const perRow = Math.min(8, Math.max(1, trayItems.length));
  const startX = TRAY.x + (TRAY.w - perRow * (ITEM + 4)) / 2;

  const controls = (
    <View style={styles.trayRow}>
      {assist.offerHelp && phase !== 'eating' ? (
        <Button label="Show me" tone="yellow" size="md" onPress={showMe} sound="tap-soft" />
      ) : null}
      {phase === 'deal' && reduced && left > 0 ? (
        <Button label="Cut one" tone="white" size="md" onPress={serveNext} sound="tap-soft" />
      ) : null}
      <Text variant="bodyStrong" color={roles.ink.secondary}>
        {phase === 'eating' ? '¡Buen provecho!' : `${left} left on the tray`}
      </Text>
    </View>
  );

  return (
    <ActivityFrame
      task={task}
      detail={detail}
      es={challenge.item.es}
      compact={compact}
      onReplay={replay}
      progress={{ done: phase === 'ask' ? 0 : 1, total: 2 }}
      backdrop={
        <>
          {/* an indoor game is played in a kitchen, never against a blue sky */}
          <SceneStage variant="counter" groundHeight={150} />
        </>
      }
      controls={controls}
      controlsTone="cream"
      hint={{ text: assist.text, es: assist.es, visible: assist.visible, onDismiss: assist.dismiss }}
    >
      <View style={styles.body}>
        <View style={styles.equationRow}>
          <EquationStrip text={equationText(challenge.total, among, phase === 'ask' ? null : each)} tone="gold" />
        </View>

        <Stage design={D} style={styles.stage}>
          {(s) => (
            <>
              {/* the serving tray — and, in the dealing phase, the chopping board */}
              <View style={at(s, TRAY.x, TRAY.y, TRAY.w, TRAY.h)} pointerEvents="none">
                <View style={[styles.tray, { borderRadius: 20 * s, borderWidth: 5 * s }]} />
              </View>

              {trayItems.map((i) => {
                const row = Math.floor(i / perRow);
                const col = i % perRow;
                return (
                  <Animated.View
                    key={`item${i}`}
                    entering={ZoomIn.springify().damping(15)}
                    style={at(s, startX + col * (ITEM + 4), TRAY.y + 12 + row * (ITEM + 6), ITEM, ITEM)}
                    pointerEvents="none"
                  >
                    <VocabIcon id={challenge.item.id} size={ITEM * s} />
                  </Animated.View>
                );
              })}

              {phase === 'deal' && left > 0 ? (
                <TraySurface s={s} onStroke={onTrayStroke} showHint={served === 0} />
              ) : null}

              {phase === 'ask' ? (
                <View style={[at(s, 8, ASK_Y, 374), styles.answerWrap]}>
                  {answerOptions(each).map((value, i) => (
                    <AnswerTile
                      key={value}
                      label={String(value)}
                      index={i}
                      size="lg"
                      state={wrong.includes(value) ? 'wrong' : assist.highlight && value === each ? 'highlight' : 'idle'}
                      onPress={() => answer(value)}
                    />
                  ))}
                </View>
              ) : null}

              {/* the one portion a child can pick up and carry to a plate */}
              {phase === 'deal' && left > 0 ? (
                <FoodToken
                  s={s}
                  x={D.w / 2 - NEXT.size / 2}
                  y={NEXT.y}
                  size={NEXT.size}
                  word={challenge.item}
                  onTap={serveNext}
                  onHover={(dx, dy) => {
                    if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
                      setHover(-1);
                      return;
                    }
                    setHover(nearestTarget({ x: D.w / 2 + dx, y: NEXT.y + NEXT.size / 2 + dy }, platePoints, 86));
                  }}
                  onDrop={(dx, dy) => {
                    setHover(-1);
                    const hit = nearestTarget({ x: D.w / 2 + dx, y: NEXT.y + NEXT.size / 2 + dy }, platePoints, 86);
                    if (hit < 0) assist.cheer('Drop it right onto a plate!');
                    else give(hit);
                  }}
                />
              ) : null}

              {platePoints.map((p, i) => (
                <PlateSpot
                  key={`plate${i}`}
                  s={s}
                  x={p.x - p.w / 2}
                  y={PLATE_TOP}
                  width={p.w}
                  count={plates[i] ?? 0}
                  each={each}
                  crew={CREW[i % CREW.length] ?? FALLBACK_CREW}
                  item={challenge.item}
                  glow={
                    phase === 'deal' &&
                    (hover === i || ((assist.highlight || ageBand === 'A') && hover < 0 && nextPlate(plates, each) === i))
                  }
                  bump={bump[i] ?? 0}
                  eating={phase === 'eating'}
                  delay={i * 140}
                  onPress={() => give(i)}
                />
              ))}
            </>
          )}
        </Stage>
      </View>
    </ActivityFrame>
  );
}

/* ------------------------------------------------------------------ */
/* The tray: a straight swipe cuts one portion free                     */
/* ------------------------------------------------------------------ */

function TraySurface({
  s,
  onStroke,
  showHint,
}: {
  s: number;
  onStroke: (stroke: Stroke, s: number) => void;
  showHint: boolean;
}) {
  const report = useCallback((stroke: Stroke) => onStroke(stroke, s), [onStroke, s]);
  const stroke = useStrokeGesture({ onStroke: report, tapSlop: 14 * (s || 1) });
  const w = TRAY.w * s;
  const h = TRAY.h * s;
  const knifeW = 132 * s;
  /* the knife slides gently along the tray until a hand takes it */
  const idle = useSwing(1, 2300);

  const knifeStyle = useAnimatedStyle(() => {
    const t = stroke.active.value;
    const held = 1 - t;
    const x = (w * 0.5 + idle.value * w * 0.2) * held + stroke.x.value * t;
    const y = h * 0.5 * held + stroke.y.value * t;
    return {
      opacity: 0.85 + t * 0.15,
      transform: [{ translateX: x - knifeW / 2 }, { translateY: y - 26 * s }, { rotate: `${(-6 - t * 8).toFixed(2)}deg` }],
    };
  });

  return (
    <GestureDetector gesture={stroke.gesture}>
      <View
        accessibilityRole="button"
        accessibilityLabel="Serving tray — swipe the knife across it to cut one portion free, or tap it"
        style={at(s, TRAY.x, TRAY.y, TRAY.w, TRAY.h)}
      >
        {showHint ? <CutHint x1={w * 0.12} y1={h * 0.5} x2={w * 0.88} y2={h * 0.5} width={w} height={h} /> : null}
        <Animated.View style={[styles.knife, knifeStyle]} pointerEvents="none">
          <ChefKnife size={knifeW} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

function FoodToken({
  s,
  x,
  y,
  size,
  word,
  onDrop,
  onTap,
  onHover,
}: {
  s: number;
  x: number;
  y: number;
  size: number;
  word: { id: string; en: string; es: string };
  onDrop: (dx: number, dy: number) => void;
  onTap: () => void;
  onHover: (dx: number, dy: number) => void;
}) {
  const drag = useDragSource({
    scale: s,
    onPickUp: () => kitchenFeel.pick(word),
    onTap,
    onDrop,
    onMove: onHover,
  });
  // Outer node owns the entrance (layout) animation, inner node owns the drag
  // transform — Reanimated warns and can drop one of them if they share a node.
  return (
    <Animated.View entering={ZoomIn.springify().damping(15)} style={at(s, x, y, size, size)}>
      <GestureDetector gesture={drag.gesture}>
        <Animated.View
          style={[styles.nextToken, drag.style, { borderRadius: 20 * s, borderWidth: 3 * s }]}
          accessibilityRole="button"
          accessibilityLabel={`${word.en} — ${word.es}`}
        >
          <VocabIcon id={word.id} size={size * 0.72 * s} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

function PlateSpot({
  s,
  x,
  y,
  width,
  count,
  each,
  crew,
  item,
  glow,
  bump,
  eating,
  delay,
  onPress,
}: {
  s: number;
  x: number;
  y: number;
  width: number;
  count: number;
  each: number;
  crew: CrewSeat;
  item: { id: string; en: string };
  glow: boolean;
  bump: number;
  eating: boolean;
  delay: number;
  onPress: () => void;
}) {
  const fb = useFeedbackAnim();
  const hop = useSharedValue(0);

  useEffect(() => {
    if (bump > 0) fb.wobble({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump]);

  useEffect(() => {
    if (!eating) return;
    hop.value = withDelay(delay, withSequence(withSpring(-14, springs.pop), withSpring(0, springs.bounce)));
    const t = setTimeout(() => {
      sfx.play('pop');
      haptics.tap();
    }, delay);
    return () => clearTimeout(t);
  }, [delay, eating, hop]);

  const hopStyle = useAnimatedStyle(() => ({ transform: [{ translateY: hop.value }] }));

  return (
    <Animated.View style={[at(s, x, y, width, PLATE_H), fb.style]}>
      <Animated.View style={[styles.plateCol, hopStyle]}>
        {/* critique #23 — the whole rig stands behind the plate, not a head.
            The slot has a fixed height so a shorter character (a seated neighbour, say) does not
            pull his whole plate card out of the row. */}
        <View style={[styles.figureSlot, { height: 100 * s }]}>
          <CrewFigure id={crew.id} npc={crew.npc} size={96 * s} emotion={eating ? 'excited' : 'happy'} jumping={eating} bobPhase={delay / 900} />
        </View>
        <Text variant="tiny" center numberOfLines={1} color={roles.ink.secondary} style={{ fontSize: 12 * s, lineHeight: 15 * s }}>
          {crew.name}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${crew.name}'s plate, ${count} ${item.en}`}
          onPress={onPress}
          style={[styles.plateHit, glow && styles.plateGlow, { borderRadius: 16 * s }]}
        >
          <PlateArt size={width * 0.86 * s} />
          <View style={styles.plateItems}>
            {Array.from({ length: Math.min(count, 4) }, (_, i) => (
              <Animated.View key={i} entering={ZoomIn.springify().damping(12)}>
                <VocabIcon id={item.id} size={18 * s} />
              </Animated.View>
            ))}
          </View>
        </Pressable>
        {/* the count lives *inside* the card, in flow — it used to float outside it */}
        <View style={[styles.plateBadge, { borderRadius: 999, paddingHorizontal: 9 * s, marginTop: -8 * s }]}>
          <Text variant="bodyStrong" color={count === each ? palette.leafGreenDark : palette.navy} style={{ fontSize: 16 * s, lineHeight: 21 * s }}>
            {count}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  stage: { flex: 1 },
  equationRow: { alignItems: 'center' },
  tray: {
    flex: 1,
    backgroundColor: palette.tan,
    borderColor: palette.wood,
  },
  knife: { position: 'absolute', left: 0, top: 0 },
  nextToken: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: roles.surface.card,
    borderColor: roles.border.draggable,
    ...shadows.card,
  },
  /* the third option used to wrap onto a second line and land on the crew
     row — the art director's "orphan card". One row, always. */
  answerWrap: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, flexWrap: 'nowrap' },
  plateCol: { alignItems: 'center' },
  figureSlot: { alignItems: 'center', justifyContent: 'flex-end' },
  plateHit: { alignItems: 'center', justifyContent: 'center', padding: 3, borderWidth: 3, borderColor: 'transparent' },
  plateGlow: { borderColor: palette.safetyYellow, backgroundColor: 'rgba(255,199,44,0.2)' },
  plateItems: { position: 'absolute', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '70%' },
  plateBadge: {
    backgroundColor: roles.surface.card,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    alignItems: 'center',
    ...shadows.soft,
  },
  trayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 4 },
});
