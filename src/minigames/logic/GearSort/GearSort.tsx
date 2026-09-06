import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import type { GearSortChallenge } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { Chip, EquipmentIcon, Text, TrayRow, equipmentLabel } from '@/ui';

import { Stage } from '@/world';
import { SceneCrew } from '@/world/scenes';
import { Draggable } from '../shared/Draggable';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useBeaconLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { BinBox } from '../shared/art/Props';

type Item = GearSortChallenge['items'][number];

interface State {
  phase: 'sorting' | 'done';
  placed: Record<string, string>;
  misses: number;
  focusBin: string | null;
}

type Action =
  | { type: 'PLACE'; item: string; bin: string }
  | { type: 'MISS'; bin: string | null }
  | { type: 'DONE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PLACE':
      return { ...state, placed: { ...state.placed, [action.item]: action.bin } };
    case 'MISS':
      return { ...state, misses: state.misses + 1, focusBin: action.bin };
    case 'DONE':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

const PROMPTS: Record<GearSortChallenge['by'], { title: string; es: string }> = {
  color: { title: 'Sort by Color', es: 'Ordena por color' },
  shape: { title: 'Sort by Shape', es: 'Ordena por forma' },
  size: { title: 'Sort by Size', es: 'Ordena por tamaño' },
  category: { title: 'Sort by Kind', es: 'Ordena por tipo' },
};

const SIZE_SCALE: Record<'S' | 'M' | 'L', number> = { S: 0.76, M: 1, L: 1.22 };

const itemLabel = (item: Item) => item.label ?? equipmentLabel(item.equipment);

export function GearSort({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'gear-sort'>) {
  const session = useMiniGameSession('gear-sort', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { phase: 'sorting', placed: {}, misses: 0, focusBin: null });

  const prompt = PROMPTS[challenge.by];
  const remaining = useMemo(
    () => challenge.items.filter((i) => !state.placed[i.id]),
    [challenge.items, state.placed],
  );
  const hintLadder = useHintLadder(state.misses, session.hint);

  useBeaconLine(`${prompt.title}. Drag each thing into the right bin!`, session.say, { es: prompt.es });

  useEffect(() => {
    session.progress(challenge.items.length - remaining.length, challenge.items.length);
  }, [challenge.items.length, remaining.length, session]);

  useEffect(() => {
    if (state.phase === 'sorting' && remaining.length === 0 && challenge.items.length > 0) {
      dispatch({ type: 'DONE' });
      sfx.play('success');
      haptics.celebrate();
      setTimeout(() => session.complete(), 700);
    }
  }, [challenge.items.length, remaining.length, session, state.phase]);

  const onDrop = useCallback(
    (item: Item, slotId: string | null) => {
      if (!slotId) return { accept: false, silent: true };
      const binId = slotId.replace('bin:', '');
      if (binId === item.bin) {
        return {
          accept: true,
          onSettled: () => {
            dispatch({ type: 'PLACE', item: item.id, bin: binId });
            session.correct(item.id);
            sfx.play('pop');
            haptics.success();
          },
        };
      }
      return {
        accept: false,
        onSettled: () => {
          dispatch({ type: 'MISS', bin: item.bin });
          session.incorrect(item.id);
        },
      };
    },
    [session],
  );

  const binCount = Math.max(1, challenge.bins.length);
  const binWidth = Math.min(layout.s(150), (layout.boxWidth - spacing.md * 2 - (binCount - 1) * spacing.sm) / binCount);
  const binHeight = binWidth * 0.78;
  const tokenSize = Math.max(hit.big, layout.s(ageBand === 'C' ? 62 : 72));

  const focusItem = remaining[0];
  const hintBin = state.focusBin ?? focusItem?.bin ?? null;
  const hintText = useMemo(() => {
    if (!focusItem) return 'Great sorting!';
    const bin = challenge.bins.find((b) => b.id === focusItem.bin);
    const by = challenge.by === 'category' ? 'kind' : challenge.by;
    return `Look at the ${by}. The ${itemLabel(focusItem).toLowerCase()} belongs in the ${bin?.label ?? 'right'} bin.`;
  }, [challenge.bins, challenge.by, focusItem]);

  return (
    <GameFrame
      title={prompt.title}
      subtitle={ageBand === 'A' ? undefined : 'Drag each piece of gear into its bin.'}
      es={prompt.es}
      compact={compact}
      backdrop={
        <>
          <Stage variant="store-room" groundHeight={150} />
          <SceneCrew side="right" size={54} mood={state.phase === 'done' ? 'cheer' : Object.keys(state.placed).length > 0 ? 'happy' : 'idle'} />
        </>
      }
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <TrayRow>
          {remaining.length === 0 ? (
            <Animated.View entering={FadeIn}>
              <Text variant="h3" color={palette.leafGreenDark}>
                Workbench clear!
              </Text>
            </Animated.View>
          ) : (
            remaining.map((item, i) => (
              <Animated.View key={item.id} entering={ZoomIn.delay(i * 60).springify().damping(14)}>
                <Draggable
                  id={item.id}
                  snapRadius={layout.s(52)}
                  disabled={state.phase === 'done'}
                  onDrop={(slotId) => onDrop(item, slotId)}
                  accessibilityLabel={itemLabel(item)}
                  style={[
                    styles.token,
                    { width: tokenSize + spacing.md, backgroundColor: palette.panel },
                  ]}
                >
                  <EquipmentIcon id={item.equipment} size={tokenSize * SIZE_SCALE[item.size ?? 'M']} />
                  <Text variant="tiny" center numberOfLines={1}>
                    {itemLabel(item)}
                  </Text>
                </Draggable>
              </Animated.View>
            ))
          )}
        </TrayRow>
      }
    >
      <View style={styles.bench}>
        <View style={styles.benchTop} />
        <View style={styles.bins}>
          {challenge.bins.map((bin, i) => {
            const contents = challenge.items.filter((it) => state.placed[it.id] === bin.id);
            const tint = bin.color ?? [palette.waterCyan, palette.safetyYellow, palette.leafGreen, palette.purple][i % 4] ?? palette.waterCyan;
            return (
              <View key={bin.id} style={styles.binCol}>
                <SlotZone
                  id={`bin:${bin.id}`}
                  hitPad={layout.s(12)}
                  highlight={hintLadder.highlight && hintBin === bin.id}
                  style={{ width: binWidth, height: binHeight }}
                >
                  <BinBox width={binWidth} height={binHeight} tint={tint} />
                  <View style={styles.binContents} pointerEvents="none">
                    {contents.map((it) => (
                      <Animated.View key={it.id} entering={ZoomIn.springify().damping(11)}>
                        <EquipmentIcon id={it.equipment} size={Math.max(18, binWidth * 0.26)} />
                      </Animated.View>
                    ))}
                  </View>
                </SlotZone>
                <View style={styles.binLabel}>
                  <Text variant="bodyStrong" center numberOfLines={1} style={{ fontSize: layout.s(15), lineHeight: layout.s(20) }}>
                    {bin.label}
                  </Text>
                  {bin.labelEs ? (
                    <Text
                      variant="tiny"
                      color={palette.purple}
                      center
                      numberOfLines={1}
                      onPress={() => speech.say(bin.labelEs ?? '', { speaker: 'beacon', lang: 'es' })}
                    >
                      {bin.labelEs}
                    </Text>
                  ) : null}
                  <Chip label={`${contents.length}`} tone={contents.length ? 'green' : 'cream'} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  bench: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.md },
  benchTop: {
    height: 14,
    borderRadius: radii.pill,
    backgroundColor: palette.wood,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  bins: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: spacing.sm },
  binCol: { alignItems: 'center', gap: 4 },
  binContents: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  binLabel: { alignItems: 'center', gap: 2 },
  token: {
    alignItems: 'center',
    borderRadius: radii.card,
    borderWidth: 3,
    borderColor: 'transparent',
    paddingVertical: spacing.xs,
    gap: 2,
  },
});
