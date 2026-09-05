import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import type { SignalId } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { hit, palette, radii, shadows, spacing, springs } from '@/theme';
import { sfx, type SfxName } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Button, CheckIcon, ChevronRightIcon, Text, TrayRow } from '@/ui';
import { Draggable } from '../shared/Draggable';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useBeaconLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { SignalGlyph, signalName } from '../shared/art/Glyphs';

const SIGNAL_SFX: Record<SignalId, SfxName> = {
  bell: 'bell',
  truck: 'siren',
  water: 'water-spray',
  check: 'correct',
  ladder: 'clank',
  hose: 'slide',
  map: 'page',
  radio: 'radio',
};

interface State {
  phase: 'ordering' | 'playing' | 'done';
  /** slot index → card index in `shuffled` */
  slots: (number | null)[];
  locked: boolean[];
  misses: number;
  playIndex: number;
}

type Action =
  | { type: 'PLACE'; slot: number; card: number }
  | { type: 'PULL'; slot: number }
  | { type: 'CHECK'; locked: boolean[]; slots: (number | null)[]; correct: boolean }
  | { type: 'PLAY'; index: number }
  | { type: 'DONE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PLACE': {
      // Dropping a card back on the slot it already occupies is a no-op. The
      // "clear the card's old slot" pass used to run first and blank it out, so
      // a re-drop made the card vanish back into the tray.
      if (state.slots[action.slot] === action.card) return state;
      const slots = state.slots.map((s, i) => (s === action.card ? null : i === action.slot ? action.card : s));
      return { ...state, slots };
    }
    case 'PULL': {
      if (state.locked[action.slot]) return state;
      const slots = [...state.slots];
      slots[action.slot] = null;
      return { ...state, slots };
    }
    case 'CHECK':
      return {
        ...state,
        locked: action.locked,
        slots: action.slots,
        misses: action.correct ? state.misses : state.misses + 1,
        phase: action.correct ? 'playing' : 'ordering',
      };
    case 'PLAY':
      return { ...state, playIndex: action.index };
    case 'DONE':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

export function Signals({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'signals'>) {
  const session = useMiniGameSession('signals', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const steps = challenge.steps;
  const shuffled = challenge.shuffled;

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    phase: 'ordering' as const,
    slots: Array.from({ length: steps.length }, () => null),
    locked: Array.from({ length: steps.length }, () => false),
    misses: 0,
    playIndex: -1,
  }));
  const hintLadder = useHintLadder(state.misses, session.hint);
  const finished = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => {
      for (const t of list) clearTimeout(t);
    };
  }, []);

  useBeaconLine('Put the call steps in order. What happens first?', session.say);

  const placedCards = useMemo(() => new Set(state.slots.filter((s): s is number => s !== null)), [state.slots]);
  const trayCards = shuffled.map((id, index) => ({ id, index })).filter((c) => !placedCards.has(c.index));
  const filled = state.slots.every((s) => s !== null);

  useEffect(() => {
    session.progress(state.slots.filter((s) => s !== null).length, steps.length);
  }, [session, state.slots, steps.length]);

  const onDrop = useCallback(
    (cardIndex: number, slotId: string | null) => {
      if (!slotId) return { accept: false, silent: true };
      const slot = Number(slotId.replace('step:', ''));
      if (Number.isNaN(slot) || state.locked[slot]) return { accept: false };
      return {
        accept: true,
        onSettled: () => dispatch({ type: 'PLACE', slot, card: cardIndex }),
      };
    },
    [state.locked],
  );

  const playSequence = useCallback(() => {
    steps.forEach((id, i) => {
      timers.current.push(
        setTimeout(() => {
          dispatch({ type: 'PLAY', index: i });
          sfx.play(SIGNAL_SFX[id]);
          haptics.tap();
        }, i * 480),
      );
    });
    timers.current.push(
      setTimeout(
        () => {
          dispatch({ type: 'DONE' });
          sfx.play('success');
          haptics.celebrate();
          if (!finished.current) {
            finished.current = true;
            setTimeout(() => session.complete(), 700);
          }
        },
        steps.length * 480 + 260,
      ),
    );
  }, [session, steps]);

  const check = useCallback(() => {
    if (state.phase !== 'ordering') return;
    const locked = [...state.locked];
    const slots = [...state.slots];
    let allRight = true;
    steps.forEach((want, i) => {
      const cardIndex = slots[i];
      const got = cardIndex === null || cardIndex === undefined ? null : shuffled[cardIndex];
      if (got === want) {
        locked[i] = true;
      } else {
        allRight = false;
        slots[i] = null;
      }
    });
    dispatch({ type: 'CHECK', locked, slots, correct: allRight });
    if (allRight) {
      session.correct('order');
      sfx.play('correct');
      haptics.success();
      playSequence();
    } else {
      session.incorrect('order');
      sfx.play('wrong-soft');
      haptics.nudge();
    }
  }, [playSequence, session, shuffled, state.locked, state.phase, state.slots, steps]);

  /* layout */
  const perRow = steps.length <= 3 ? steps.length : 3;
  const slotSize = Math.min(
    layout.s(96),
    (layout.boxWidth - spacing.md * 2 - (perRow - 1) * layout.s(22)) / perRow,
  );
  const cardSize = Math.max(hit.big, Math.min(slotSize - 6, layout.s(82)));

  const nextWrongSlot = state.slots.findIndex((cardIndex, i) => {
    if (state.locked[i]) return false;
    const got = cardIndex === null || cardIndex === undefined ? null : shuffled[cardIndex];
    return got !== steps[i];
  });
  const hintStep = nextWrongSlot >= 0 ? nextWrongSlot : null;
  const hintSignal = hintStep !== null ? steps[hintStep] : null;
  const hintText = hintSignal
    ? `Step ${(hintStep ?? 0) + 1} is “${signalName[hintSignal].en}”. Look for that card!`
    : 'Tap Check when the steps look right.';

  return (
    <GameFrame
      title="Firefighter Signals"
      subtitle={ageBand === 'A' ? undefined : 'Put the steps of the call in order.'}
      compact={compact}
      hint={{ text: hintText, visible: hintLadder.showBubble && state.phase === 'ordering', onDismiss: hintLadder.dismiss }}
      tray={
        <View style={styles.trayInner}>
          <TrayRow>
            {trayCards.length === 0 ? (
              <Text variant="small" color={palette.navySoft}>
                All cards are placed — tap Check!
              </Text>
            ) : (
              trayCards.map(({ id, index }, i) => (
                <Animated.View key={index} entering={ZoomIn.delay(i * 50).springify().damping(14)}>
                  <Draggable
                    id={`card-${index}`}
                    snapRadius={layout.s(48)}
                    disabled={state.phase !== 'ordering'}
                    onDrop={(slotId) => onDrop(index, slotId)}
                    accessibilityLabel={signalName[id].en}
                    style={[
                      styles.card,
                      { width: cardSize },
                      hintLadder.highlight && hintSignal === id ? styles.cardHint : null,
                    ]}
                  >
                    <SignalGlyph id={id} size={cardSize * 0.6} />
                    <Text variant="tiny" center numberOfLines={1}>
                      {signalName[id].en}
                    </Text>
                  </Draggable>
                </Animated.View>
              ))
            )}
          </TrayRow>
          <View style={styles.actions}>
            <Button
              label="Check"
              tone="green"
              size="md"
              icon={<CheckIcon size={22} />}
              onPress={check}
              disabled={!filled || state.phase !== 'ordering'}
            />
          </View>
        </View>
      }
    >
      <View style={styles.stage}>
        <View style={styles.slotRow}>
          {steps.map((want, i) => {
            const cardIndex = state.slots[i];
            const id = cardIndex === null || cardIndex === undefined ? null : shuffled[cardIndex];
            const locked = state.locked[i];
            const playing = state.playIndex === i;
            return (
              <React.Fragment key={i}>
                <View style={styles.slotCol}>
                  <Text variant="tiny" color={palette.navyMuted}>
                    {i + 1}
                  </Text>
                  <SlotZone
                    id={`step:${i}`}
                    enabled={!locked && state.phase === 'ordering'}
                    highlight={hintLadder.highlight && hintStep === i}
                    hitPad={layout.s(8)}
                    style={[
                      styles.slot,
                      { width: slotSize, height: slotSize },
                      locked && styles.slotLocked,
                    ]}
                  >
                    {id ? (
                      <PlacedCard
                        id={id}
                        size={slotSize * 0.78}
                        playing={playing}
                        locked={!!locked}
                        onPress={() => {
                          if (locked || state.phase !== 'ordering') return;
                          sfx.play('tap-soft');
                          haptics.tap();
                          dispatch({ type: 'PULL', slot: i });
                        }}
                      />
                    ) : (
                      <Text variant="tiny" color={palette.slate} center>
                        step {i + 1}
                      </Text>
                    )}
                  </SlotZone>
                </View>
                {i < steps.length - 1 && (i + 1) % perRow !== 0 ? (
                  <View style={styles.arrow}>
                    <ChevronRightIcon size={layout.s(20)} color={palette.slate} />
                  </View>
                ) : null}
              </React.Fragment>
            );
          })}
        </View>

        {state.phase === 'done' ? (
          <Animated.View entering={FadeIn} style={styles.banner}>
            <Text variant="h3" color={palette.leafGreenDark} center>
              That&apos;s the drill!
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

function PlacedCard({
  id,
  size,
  playing,
  locked,
  onPress,
}: {
  id: SignalId;
  size: number;
  playing: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (playing) scale.value = withSequence(withSpring(1.18, springs.pop), withSpring(1, springs.bounce));
  }, [playing, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={signalName[id].en} disabled={locked}>
      <Animated.View style={[styles.placed, locked && styles.placedLocked, style]}>
        <SignalGlyph id={id} size={size} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.sm },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  slotCol: { alignItems: 'center' },
  slot: {
    borderRadius: radii.card,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: palette.slateLight,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLocked: { borderStyle: 'solid', borderColor: palette.leafGreen, backgroundColor: palette.mint },
  placed: { alignItems: 'center', justifyContent: 'center', padding: 2 },
  placedLocked: { opacity: 1 },
  arrow: { paddingHorizontal: 2, paddingTop: 14 },
  banner: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  trayInner: { gap: spacing.xs },
  card: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.card,
    paddingVertical: spacing.xs,
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadows.soft,
  },
  cardHint: { borderColor: palette.safetyYellow, ...shadows.glowGold },
  actions: { flexDirection: 'row', justifyContent: 'center' },
});
