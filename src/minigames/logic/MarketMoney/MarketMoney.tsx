import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  ZoomIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing, springs, timings } from '@/theme';
import { useIdleBob } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Button, Chip, ResetIcon, SparkleBurst, Text, TrayRow, VocabIcon } from '@/ui';
import { AskQuestion } from '../shared/AskQuestion';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useBeaconLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { useDragToSlot, type DropOutcome } from '../shared/useDragToSlot';
import { Bunting, CoinDisc, MarketGround, PaperBag, StallFront, stallRects } from './Stall';

/* ---------------- state machine ---------------- */

type Phase = 'shopping' | 'paying' | 'change' | 'done';

interface State {
  phase: Phase;
  /** indices into `challenge.coins` that are lying on the counter, in the order they were put down */
  counter: number[];
  misses: number;
}

type Action =
  | { type: 'PUT'; index: number }
  | { type: 'TAKE'; index: number }
  | { type: 'CLEAR' }
  | { type: 'MISS' }
  | { type: 'PAID' }
  | { type: 'ASK_CHANGE' }
  | { type: 'FINISH' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PUT':
      return state.counter.includes(action.index) ? state : { ...state, counter: [...state.counter, action.index] };
    case 'TAKE':
      return { ...state, counter: state.counter.filter((i) => i !== action.index) };
    case 'CLEAR':
      return { ...state, counter: [] };
    case 'MISS':
      return { ...state, misses: state.misses + 1 };
    case 'PAID':
      return { ...state, phase: 'paying' };
    case 'ASK_CHANGE':
      return { ...state, phase: 'change' };
    case 'FINISH':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

/* ---------------- a coin you can drag OR tap ---------------- */

interface CoinTokenProps {
  value: number;
  size: number;
  /** dim + ignore everything (a coin already spent) */
  spent?: boolean;
  /** tap still works, dragging does not (coins resting on the counter) */
  dragDisabled?: boolean;
  highlight?: boolean;
  label: string;
  onDropCoin?: (slotId: string | null) => DropOutcome;
  onTap: () => void;
}

/**
 * A coin the child can drag onto the counter — or simply tap, which is the
 * accessibility path and how most five-year-olds actually play.
 */
function CoinToken({ value, size, spent, dragDisabled, highlight, label, onDropCoin, onTap }: CoinTokenProps) {
  const noDrag = !!spent || !!dragDisabled;
  const { gesture, animatedStyle, dragging, nodeRef } = useDragToSlot({
    disabled: noDrag,
    snapRadius: 60,
    onDrop: onDropCoin ?? (() => ({ accept: false, silent: true })),
  });

  const composed = useMemo(
    () =>
      Gesture.Race(
        gesture,
        Gesture.Tap()
          .enabled(!spent)
          .maxDistance(14)
          .onEnd((_e, ok) => {
            if (ok) runOnJS(onTap)();
          }),
      ),
    [gesture, onTap, spent],
  );

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        ref={nodeRef}
        collapsable={false}
        accessible={!spent}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.coinToken,
          { width: size, height: size },
          highlight && styles.coinHighlight,
          dragging && styles.dragging,
          animatedStyle,
        ]}
      >
        <CoinDisc value={value} size={size} dim={spent} />
        {highlight ? <View style={[styles.coinGlow, { borderRadius: size }]} pointerEvents="none" /> : null}
      </Animated.View>
    </GestureDetector>
  );
}

/* ---------------- game ---------------- */

export function MarketMoney({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'market-money'>) {
  const session = useMiniGameSession('market-money', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { phase: 'shopping', counter: [], misses: 0 });
  const hintLadder = useHintLadder(state.misses, session.hint);
  const finished = useRef(false);

  const { coins, price, item, exactChange } = challenge;

  /** purse order: biggest coins first, so counting up reads left to right */
  const purse = useMemo(
    () => coins.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value || a.index - b.index),
    [coins],
  );

  const total = useMemo(
    () => state.counter.reduce((sum, i) => sum + (coins[i] ?? 0), 0),
    [coins, state.counter],
  );
  const short = price - total;
  const enough = exactChange ? total === price : total >= price;

  /* the cheapest way to pay, used by Beacon's hint and the auto-assist glow */
  const bestSolution = useMemo(() => {
    const sorted = [...challenge.solutions].sort((a, b) => a.length - b.length);
    return sorted[0] ?? [];
  }, [challenge.solutions]);

  /** which purse coins still need to go down if the child follows `bestSolution` */
  const wanted = useMemo(() => {
    const need = new Map<number, number>();
    for (const value of bestSolution) need.set(value, (need.get(value) ?? 0) + 1);
    for (const i of state.counter) {
      const value = coins[i] ?? 0;
      const left = need.get(value) ?? 0;
      if (left > 0) need.set(value, left - 1);
    }
    const ids = new Set<number>();
    for (const { value, index } of purse) {
      if (state.counter.includes(index)) continue;
      const left = need.get(value) ?? 0;
      if (left > 0) {
        need.set(value, left - 1);
        ids.add(index);
      }
    }
    return ids;
  }, [bestSolution, coins, purse, state.counter]);

  useEffect(() => {
    session.progress(Math.min(total, price), price);
  }, [price, session, total]);

  useBeaconLine(
    state.phase === 'shopping' ? `The ${item.en} costs ${price} coins. Count them onto the counter!` : null,
    session.say,
    { es: `${item.es}: ${price} monedas.`, key: state.phase },
  );

  /* ----- animation ----- */
  const bagPop = useSharedValue(0);
  const itemDrop = useSharedValue(0);
  const stripShake = useSharedValue(0);
  const sparkPlay = useRef(0);
  /** the produce breathes in its crate and the price board sways on its strings */
  const bob = useIdleBob(3, 2600);
  const sway = useIdleBob(1.5, 3200, 0.5);

  const stallWidth = Math.min(layout.boxWidth - spacing.md * 2, layout.s(352));
  const stall = stallRects(stallWidth);

  const itemStyle = useAnimatedStyle(() => ({
    opacity: 1 - itemDrop.value * 0.85,
    transform: [
      { translateY: itemDrop.value * stall.height * 0.5 + bob.value * (1 - itemDrop.value) },
      { translateX: itemDrop.value * stallWidth * 0.28 },
      { scale: 1 - itemDrop.value * 0.45 },
    ],
  }));
  const signStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value}deg` }] }));
  const bagStyle = useAnimatedStyle(() => ({
    opacity: bagPop.value,
    transform: [{ scale: 0.6 + bagPop.value * 0.4 }],
  }));
  const stripStyle = useAnimatedStyle(() => ({ transform: [{ translateX: stripShake.value }] }));

  const wobbleStrip = useCallback(() => {
    stripShake.value = withSequence(
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(-4, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }, [stripShake]);

  /* ----- interactions ----- */

  const putDown = useCallback(
    (index: number) => {
      dispatch({ type: 'PUT', index });
      sfx.play('drop');
      haptics.drop();
    },
    [],
  );

  const onDropCoin = useCallback(
    (index: number, slotId: string | null): DropOutcome => {
      if (state.phase !== 'shopping' || state.counter.includes(index)) return { accept: false, silent: true };
      if (slotId === 'counter') {
        return { accept: true, silent: true, onSettled: () => putDown(index) };
      }
      // a coin dropped anywhere else just rolls back — never a mistake
      return { accept: false, silent: true };
    },
    [putDown, state.counter, state.phase],
  );

  const tapPurseCoin = useCallback(
    (index: number) => {
      if (state.phase !== 'shopping' || state.counter.includes(index)) return;
      putDown(index);
    },
    [putDown, state.counter, state.phase],
  );

  const takeBack = useCallback(
    (index: number) => {
      if (state.phase !== 'shopping') return;
      dispatch({ type: 'TAKE', index });
      sfx.play('tap-soft');
      haptics.tap();
    },
    [state.phase],
  );

  const clearCounter = useCallback(() => {
    if (state.phase !== 'shopping' || state.counter.length === 0) return;
    dispatch({ type: 'CLEAR' });
    sfx.play('whoosh');
    haptics.tap();
  }, [state.counter.length, state.phase]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    dispatch({ type: 'FINISH' });
    session.complete();
  }, [session]);

  const pay = useCallback(() => {
    if (state.phase !== 'shopping') return;
    if (!enough) {
      dispatch({ type: 'MISS' });
      session.incorrect(String(total));
      sfx.play('wrong-soft');
      haptics.nudge();
      wobbleStrip();
      return;
    }
    dispatch({ type: 'PAID' });
    session.correct(String(total));
    session.learnedWord(item.en);
    session.learnedWord(item.es);
    sparkPlay.current += 1;
    sfx.play('correct');
    haptics.celebrate();
    itemDrop.value = withDelay(160, withTiming(1, timings.slow));
    bagPop.value = withDelay(200, withSpring(1, springs.bounce));
    setTimeout(() => {
      if (challenge.askChange) dispatch({ type: 'ASK_CHANGE' });
      else finish();
    }, 1200);
  }, [bagPop, challenge.askChange, enough, finish, item.en, item.es, itemDrop, session, state.phase, total, wobbleStrip]);

  /* ----- the band C change question ----- */
  const changeOptions = useMemo(() => {
    const answer = challenge.askChange?.change ?? 0;
    const set = new Set<number>([answer]);
    for (const delta of [10, 5, 1, 2, 20]) {
      if (set.size >= 3) break;
      if (answer - delta > 0) set.add(answer - delta);
      if (set.size < 3) set.add(answer + delta);
    }
    return [...set].sort((a, b) => a - b).map(String);
  }, [challenge.askChange]);

  /* ----- copy ----- */
  const hintText = useMemo(() => {
    if (short > 0) {
      const missing = bestSolution.length > 0 ? ` Try ${bestSolution.join(' + ')}.` : '';
      return `Need ${short} more — you have ${total}.${missing}`;
    }
    if (short < 0 && exactChange) return `That's ${-short} too many! Tap a coin on the counter to take it back.`;
    return `That's ${price}! Tap the green Pay button.`;
  }, [bestSolution, exactChange, price, short, total]);

  const equation = useMemo(() => {
    const values = state.counter.map((i) => coins[i] ?? 0);
    if (values.length === 0) return '0';
    if (values.length > 5) return `${values.length} coins = ${total}`;
    return `${values.join(' + ')} = ${total}`;
  }, [coins, state.counter, total]);

  const coinSize = Math.max(52, layout.s(purse.length > 8 ? 56 : 62));
  const counterCoin = Math.max(38, layout.s(44));
  const canPay = state.phase === 'shopping' && state.counter.length > 0;

  return (
    <GameFrame
      title={`Pay for the ${item.en}`}
      subtitle={ageBand === 'A' ? `Put ${price} on the counter` : 'Drag coins onto the counter, then tap Pay.'}
      es={`Cuesta ${price} monedas.`}
      compact={compact}
      hint={{
        text: hintText,
        es: short > 0 ? `Faltan ${short}.` : undefined,
        visible: hintLadder.showBubble && state.phase === 'shopping',
        onDismiss: hintLadder.dismiss,
      }}
      overlay={
        challenge.askChange ? (
          <AskQuestion
            visible={state.phase === 'change'}
            prompt={`The next customer pays with ${challenge.askChange.paid}. How much change?`}
            promptEs={`Paga con ${challenge.askChange.paid}. ¿Cuánto es el cambio?`}
            options={changeOptions}
            correct={String(challenge.askChange.change)}
            ageBand={ageBand}
            hintText={`${challenge.askChange.paid} take away ${price} is ${challenge.askChange.change}.`}
            onCorrect={() => session.correct('change')}
            onWrong={() => session.incorrect('change')}
            onHint={session.hint}
            onDone={finish}
          />
        ) : null
      }
      tray={
        <View style={styles.trayInner}>
          <TrayRow style={styles.purse}>
            {purse.map(({ value, index }, i) => {
              const spent = state.counter.includes(index);
              return (
                <Animated.View key={index} entering={ZoomIn.delay(i * 55).springify().damping(14)}>
                  <CoinToken
                    value={value}
                    size={coinSize}
                    label={`${value} coin`}
                    spent={spent || state.phase !== 'shopping'}
                    highlight={hintLadder.highlight && wanted.has(index)}
                    onDropCoin={(slotId) => onDropCoin(index, slotId)}
                    onTap={() => tapPurseCoin(index)}
                  />
                </Animated.View>
              );
            })}
          </TrayRow>
          <View style={styles.actions}>
            <Button
              label="Take back"
              tone="white"
              size="md"
              icon={<ResetIcon size={20} />}
              onPress={clearCounter}
              disabled={state.phase !== 'shopping' || state.counter.length === 0}
            />
            <Button label="Pay" tone="green" size="md" onPress={pay} disabled={!canPay} />
          </View>
        </View>
      }
    >
      <View style={styles.stage}>
        {/* ---- the market itself: bunting overhead, paving underfoot ---- */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Bunting width={layout.boxWidth} />
          <MarketGround width={layout.boxWidth} />
        </View>

        {/* ---- the stall ---- */}
        <View style={{ width: stallWidth, height: stall.height }}>
          <StallFront width={stallWidth} />
          <Animated.View style={[styles.abs, stall.item, itemStyle]} pointerEvents="none">
            <VocabIcon id={item.icon} size={stall.item.width} />
          </Animated.View>
          <Animated.View style={[styles.abs, stall.sign, styles.sign, signStyle]} pointerEvents="none">
            <Text variant="tiny" color={palette.navyMuted}>
              PRICE
            </Text>
            <Text variant="h2" center style={{ lineHeight: stall.sign.height * 0.62 }}>
              {price}
            </Text>
          </Animated.View>
          <Animated.View style={[styles.bag, bagStyle]} pointerEvents="none">
            <PaperBag size={layout.s(56)} />
            <SparkleBurst play={sparkPlay.current} radius={layout.s(40)} count={10} />
          </Animated.View>
        </View>

        {/* ---- the counter the coins land on ---- */}
        <SlotZone
          id="counter"
          enabled={state.phase === 'shopping'}
          hitPad={layout.s(14)}
          style={[styles.counter, { width: stallWidth, minHeight: layout.s(74) }]}
        >
          <View style={styles.counterInner}>
            {state.counter.length === 0 ? (
              <Text variant="small" color={palette.woodDark} center>
                Drop your coins here
              </Text>
            ) : (
              state.counter.map((index) => (
                <Animated.View key={index} entering={ZoomIn.springify().damping(12)}>
                  <CoinToken
                    value={coins[index] ?? 0}
                    size={counterCoin}
                    label={`Take back the ${coins[index] ?? 0} coin`}
                    dragDisabled
                    onTap={() => takeBack(index)}
                  />
                </Animated.View>
              ))
            )}
          </View>
        </SlotZone>

        {/* ---- running total ---- */}
        <Animated.View style={[styles.strip, enough && styles.stripDone, stripStyle]}>
          <Text variant="h3" center color={enough ? palette.leafGreenDark : palette.navy}>
            {equation}
          </Text>
          <Chip label={enough ? 'Just right!' : `needs ${price}`} tone={enough ? 'green' : 'cream'} />
        </Animated.View>

        {state.phase !== 'shopping' ? (
          <Animated.View entering={FadeIn} style={styles.thanks}>
            <Text variant="h3" color={palette.leafGreenDark} center>
              ¡Gracias! One {item.en}, please.
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  abs: { position: 'absolute' },
  sign: { alignItems: 'center', justifyContent: 'center' },
  bag: { position: 'absolute', right: 6, bottom: -6, alignItems: 'center', justifyContent: 'center' },
  counter: {
    backgroundColor: palette.wood,
    borderRadius: radii.card,
    borderBottomWidth: 6,
    borderBottomColor: palette.woodDark,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  counterInner: {
    flex: 1,
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,246,229,0.55)',
    borderRadius: radii.tile,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: palette.tanDark,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    ...shadows.card,
  },
  stripDone: { backgroundColor: palette.mint },
  thanks: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  trayInner: { gap: spacing.sm },
  purse: { rowGap: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  coinToken: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
    borderRadius: radii.pill,
    shadowColor: palette.navy,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  coinHighlight: { ...shadows.glowGold },
  coinGlow: {
    ...StyleSheet.absoluteFill,
    borderWidth: 4,
    borderColor: palette.safetyYellow,
  },
  dragging: { zIndex: 60, elevation: 14 },
});
