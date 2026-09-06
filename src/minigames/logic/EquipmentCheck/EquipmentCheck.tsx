import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { EquipmentId } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { hit, palette, radii, shadows, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { Button, CheckIcon, Chip, EquipmentIcon, ResetIcon, Text, TrayRow, equipmentLabel } from '@/ui';

import { Stage } from '@/world';

import { AskQuestion } from '../shared/AskQuestion';
import { Draggable } from '../shared/Draggable';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useCaptainLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { TruckSide, truckBayRect } from '../shared/art/Props';

/* ---------------- state machine ---------------- */

type Phase = 'ask' | 'packing' | 'closing' | 'done';

interface State {
  phase: Phase;
  packed: Record<string, number>;
  misses: number;
  /** row the child should be looking at (drives the hint highlight) */
  focus: EquipmentId | null;
}

type Action =
  | { type: 'ASK_DONE' }
  | { type: 'PACK'; item: EquipmentId }
  | { type: 'MISS'; focus: EquipmentId | null }
  | { type: 'RESET'; base: Record<string, number> }
  | { type: 'CLOSE' }
  | { type: 'FINISH' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ASK_DONE':
      return { ...state, phase: 'packing' };
    case 'PACK':
      return {
        ...state,
        packed: { ...state.packed, [action.item]: (state.packed[action.item] ?? 0) + 1 },
      };
    case 'MISS':
      return { ...state, misses: state.misses + 1, focus: action.focus };
    case 'RESET':
      return { ...state, packed: { ...action.base }, focus: null };
    case 'CLOSE':
      return { ...state, phase: 'closing' };
    case 'FINISH':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

/* ---------------- little pieces ---------------- */

function CounterPill({ current, total, size }: { current: number; total: number; size: number }) {
  const full = current >= total;
  return (
    <View
      style={[
        styles.counter,
        { minWidth: size * 1.9, paddingVertical: size * 0.16, backgroundColor: full ? palette.leafGreen : palette.navy },
      ]}
    >
      <Text variant="bodyStrong" color={palette.white} center style={{ fontSize: size * 0.62, lineHeight: size * 0.86 }}>
        {current}/{total}
      </Text>
    </View>
  );
}

/* ---------------- game ---------------- */

export function EquipmentCheck({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'equipment-check'>) {
  const session = useMiniGameSession('equipment-check', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const base = useMemo(() => {
    const map: Record<string, number> = {};
    for (const it of challenge.items) map[it.id] = it.alreadyPacked;
    return map;
  }, [challenge.items]);

  const askItem = useMemo(
    () => (ageBand === 'A' ? undefined : challenge.items.find((i) => i.alreadyPacked > 0 && i.need > i.alreadyPacked)),
    [ageBand, challenge.items],
  );

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    phase: askItem ? ('ask' as Phase) : ('packing' as Phase),
    packed: { ...base },
    misses: 0,
    focus: null,
  }));

  const hintLadder = useHintLadder(state.misses, session.hint);
  const truckBounce = useSharedValue(0);
  const doorOpen = useSharedValue(0);

  const totals = useMemo(() => {
    const need = challenge.items.reduce((n, i) => n + i.need, 0);
    const packed = challenge.items.reduce((n, i) => n + Math.min(i.need, state.packed[i.id] ?? 0), 0);
    return { need, packed, complete: packed >= need };
  }, [challenge.items, state.packed]);

  useEffect(() => {
    session.progress(totals.packed, totals.need);
  }, [session, totals.packed, totals.need]);

  const remaining = useCallback(
    (id: EquipmentId) => {
      const item = challenge.items.find((i) => i.id === id);
      if (!item) return 0;
      return Math.max(0, item.need - (state.packed[id] ?? 0));
    },
    [challenge.items, state.packed],
  );

  const firstUnfinished = useMemo(
    () => challenge.items.find((i) => (state.packed[i.id] ?? 0) < i.need)?.id ?? null,
    [challenge.items, state.packed],
  );

  useCaptainLine(state.phase === 'packing' ? 'Pack the right equipment. Drag each item into the truck!' : null, session.say, {
    key: state.phase,
  });

  /* ----- geometry ----- */
  // critique: the reference makes the engine full-bleed, filling the frame —
  // ours was inset and read as a small cropped van.
  const truckWidth = Math.min(layout.boxWidth, layout.s(430));
  const bay = truckBayRect(truckWidth);
  const rowHeight = bay.height / Math.max(1, challenge.items.length);
  /** each shelf sizes its own ghosts, so a row of 7 and a row of 2 both look right */
  const slotSizeFor = (need: number) =>
    Math.max(20, Math.min(rowHeight - layout.s(9), (bay.width - layout.s(52)) / Math.max(1, need) - layout.s(5)));

  /* ----- interactions ----- */

  const onDropItem = useCallback(
    (item: EquipmentId, slotId: string | null) => {
      if (!slotId) return { accept: false, silent: true };
      const target = slotId.split('#')[0] as EquipmentId | undefined;
      const isDecoy = challenge.decoys.includes(item);

      if (!isDecoy && target === item && remaining(item) > 0) {
        const next = state.packed[item] ?? 0;
        return {
          accept: true,
          snapToSlotId: `${item}#${next}`,
          onSettled: () => {
            dispatch({ type: 'PACK', item });
            session.correct(item);
            sfx.play('pop');
            haptics.success();
          },
        };
      }

      if (!isDecoy && target === item) {
        // that shelf is already full — a gentle nudge, never a mistake
        return { accept: false };
      }

      return {
        accept: false,
        onSettled: () => {
          dispatch({ type: 'MISS', focus: isDecoy ? firstUnfinished : item });
          session.incorrect(item);
        },
      };
    },
    [challenge.decoys, firstUnfinished, remaining, session, state.packed],
  );

  const onReset = useCallback(() => {
    dispatch({ type: 'RESET', base });
    sfx.play('whoosh');
  }, [base]);

  const finish = useRef(false);
  const onDone = useCallback(() => {
    if (!totals.complete) {
      const missing = challenge.items.find((i) => (state.packed[i.id] ?? 0) < i.need);
      if (missing) {
        dispatch({ type: 'MISS', focus: missing.id });
        sfx.play('wrong-soft');
        haptics.nudge();
      }
      return;
    }
    if (finish.current) return;
    finish.current = true;
    dispatch({ type: 'CLOSE' });
    doorOpen.value = withTiming(1, { duration: 520 });
    truckBounce.value = withDelay(
      420,
      withSequence(withSpring(-14, springs.pop), withSpring(0, springs.bounce)),
    );
    sfx.play('horn');
    haptics.celebrate();
    setTimeout(() => {
      dispatch({ type: 'FINISH' });
      session.complete();
    }, 1100);
  }, [challenge.items, doorOpen, session, state.packed, totals.complete, truckBounce]);

  const truckStyle = useAnimatedStyle(() => ({ transform: [{ translateY: truckBounce.value }] }));
  const doorStyle = useAnimatedStyle(() => ({ height: doorOpen.value * bay.height }));

  /* ----- ask beat ----- */
  const askAnswer = askItem ? askItem.need - askItem.alreadyPacked : 0;
  const askOptions = useMemo(() => {
    const set = new Set<number>([askAnswer]);
    let d = 1;
    while (set.size < 3 && d < 6) {
      if (askAnswer - d > 0) set.add(askAnswer - d);
      if (set.size < 3) set.add(askAnswer + d);
      d += 1;
    }
    return Array.from(set)
      .sort((a, b) => a - b)
      .map(String);
  }, [askAnswer]);

  const hintText = useMemo(() => {
    const focus = state.focus ?? firstUnfinished;
    if (!focus) return 'Tap the green Done button when the truck is packed!';
    const name = equipmentLabel(focus);
    const left = remaining(focus);
    return `${name}s go on their own shelf — the one with the matching dashed picture. We still need ${left}!`;
  }, [firstUnfinished, remaining, state.focus]);

  const highlightItem = hintLadder.highlight ? (state.focus ?? firstUnfinished) : null;

  /* ----- render ----- */

  const trayItems = useMemo(
    () => [...challenge.items.map((i) => i.id), ...challenge.decoys],
    [challenge.decoys, challenge.items],
  );
  const tokenSize = Math.max(hit.big, layout.s(ageBand === 'A' ? 78 : 68));

  return (
    <GameFrame
      title="Pack the Right Equipment"
      subtitle={ageBand === 'A' ? undefined : 'Drag the items into the truck.'}
      compact={compact}
      backdrop={
                  <Stage variant="yard" groundHeight={150} />
      }
      hint={{ text: hintText, visible: hintLadder.showBubble && state.phase === 'packing', onDismiss: hintLadder.dismiss }}
      overlay={
        askItem ? (
          <AskQuestion
            visible={state.phase === 'ask'}
            prompt={`We already packed ${askItem.alreadyPacked} ${equipmentLabel(askItem.id).toLowerCase()}${
              askItem.alreadyPacked === 1 ? '' : 's'
            }. How many more do we need?`}
            options={askOptions}
            correct={String(askAnswer)}
            ageBand={ageBand}
            hintText={`We need ${askItem.need} in total and ${askItem.alreadyPacked} are in. ${askItem.need} take away ${askItem.alreadyPacked} is ${askAnswer}.`}
            onCorrect={() => session.correct('ask')}
            onWrong={() => session.incorrect('ask')}
            onHint={session.hint}
            onDone={() => dispatch({ type: 'ASK_DONE' })}
          />
        ) : null
      }
      tray={
        <View style={styles.trayInner}>
          <TrayRow>
            {trayItems.map((id, i) => {
              const item = challenge.items.find((x) => x.id === id);
              const left = item ? Math.max(0, item.need - (state.packed[id] ?? 0)) : 0;
              const spent = !!item && left === 0;
              return (
                <Animated.View key={id} entering={ZoomIn.delay(i * 70).springify().damping(14)}>
                  <Draggable
                    id={id}
                    disabled={state.phase !== 'packing' || spent}
                    snapRadius={layout.s(48)}
                    onDrop={(slotId) => onDropItem(id, slotId)}
                    accessibilityLabel={equipmentLabel(id)}
                    style={[styles.token, { width: tokenSize + spacing.md, opacity: spent ? 0.4 : 1 }]}
                  >
                    <EquipmentIcon id={id} size={tokenSize} />
                    <Text variant="tiny" center numberOfLines={1}>
                      {equipmentLabel(id)}
                    </Text>
                    <View style={styles.tokenChip}>
                      <Chip label={item ? `x${left}` : 'extra'} tone={item ? 'cream' : 'purple'} />
                    </View>
                  </Draggable>
                </Animated.View>
              );
            })}
          </TrayRow>
          <View style={styles.actions}>
            <Button
              label="Reset"
              tone="white"
              size="md"
              icon={<ResetIcon size={22} />}
              onPress={onReset}
              disabled={state.phase !== 'packing'}
            />
            <Button
              label="Done"
              tone="green"
              size="md"
              icon={<CheckIcon size={22} />}
              onPress={onDone}
              disabled={state.phase === 'closing' || state.phase === 'done'}
            />
          </View>
        </View>
      }
    >
      <View style={styles.stage}>
        <Animated.View style={truckStyle}>
          <TruckSide width={truckWidth} />
          <View style={[styles.bay, { left: bay.x, top: bay.y, width: bay.width, height: bay.height }]}>
            {/* the compartment is lit from above, not a flat navy box */}
            <View style={styles.bayLight} pointerEvents="none" />
            {challenge.items.map((item, rowIndex) => {
              const packed = Math.min(item.need, state.packed[item.id] ?? 0);
              const slotSize = slotSizeFor(item.need);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.shelf,
                    { height: rowHeight },
                    rowIndex < challenge.items.length - 1 && styles.shelfDivider,
                  ]}
                >
                  <View style={styles.ghosts}>
                    {Array.from({ length: item.need }, (_, i) => {
                      const filled = i < packed;
                      return (
                        <SlotZone
                          key={i}
                          id={`${item.id}#${i}`}
                          enabled={!filled && state.phase === 'packing'}
                          highlight={highlightItem === item.id && i === packed}
                          hitPad={layout.s(10)}
                          style={{ width: slotSize, height: slotSize }}
                        >
                          {filled ? (
                            <Animated.View entering={ZoomIn.springify().damping(11)}>
                              <EquipmentIcon id={item.id} size={slotSize * 0.94} />
                            </Animated.View>
                          ) : (
                            <EquipmentIcon id={item.id} size={slotSize * 0.94} ghost />
                          )}
                        </SlotZone>
                      );
                    })}
                  </View>
                  <CounterPill current={packed} total={item.need} size={layout.s(18)} />
                </View>
              );
            })}
            <Animated.View style={[styles.door, doorStyle]} pointerEvents="none">
              {Array.from({ length: 8 }, (_, i) => (
                <View
                  key={i}
                  style={[styles.slat, { backgroundColor: i % 2 ? palette.slate : palette.slateLight }]}
                />
              ))}
            </Animated.View>
          </View>
        </Animated.View>
        {state.phase === 'done' ? (
          <Animated.View entering={FadeIn} style={styles.doneBadge}>
            <Text variant="h2" color={palette.leafGreenDark}>
              Truck packed!
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'center' },
  bay: { position: 'absolute', overflow: 'hidden', borderRadius: 8 },
  bayLight: { position: 'absolute', left: 0, right: 0, top: 0, height: '38%', backgroundColor: 'rgba(255,255,255,0.14)' },
  shelf: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  shelfDivider: { borderBottomWidth: 3, borderBottomColor: 'rgba(255,255,255,0.22)' },
  ghosts: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  counter: {
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    ...shadows.soft,
  },
  door: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
  slat: { height: '13%', marginBottom: 1.5, borderRadius: 3 },
  doneBadge: {
    position: 'absolute',
    backgroundColor: palette.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    ...shadows.card,
  },
  trayInner: { gap: spacing.sm },
  token: {
    alignItems: 'center',
    backgroundColor: palette.panel,
    borderRadius: radii.card,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    gap: 2,
  },
  tokenChip: { alignItems: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.xs },
});
