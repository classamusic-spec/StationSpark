import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import type { GearSortChallenge } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { hit, palette, radii, roles, spacing } from '@/theme';
import { useShowTranslation } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { EquipmentIcon, Text, TrayRow, equipmentLabel } from '@/ui';

import { Stage } from '@/world';
import { SceneCrew } from '@/world/scenes';
import { Draggable } from '../shared/Draggable';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useCaptainLine } from '../shared/speak';
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

/**
 * The task, and the one line of "how" that goes under it.
 *
 * The screen used to give the same direction three times over: a title, a
 * subtitle that just restated the title as a verb ("drag each piece of gear
 * into its bin"), and a spoken line that restated both. The title is now the
 * task and the line underneath is the actual sorting *rule* — the only part a
 * child cannot work out by looking at the bins.
 */
const PROMPTS: Record<GearSortChallenge['by'], { title: string; es: string; rule: string }> = {
  color: { title: 'Sort by Color', es: 'Ordena por color', rule: 'Look at the color of each one.' },
  shape: { title: 'Sort by Shape', es: 'Ordena por forma', rule: 'Look at the shape of each one.' },
  size: { title: 'Sort by Size', es: 'Ordena por tamaño', rule: 'Look at how big each one is.' },
  category: { title: 'Sort by Kind', es: 'Ordena por tipo', rule: 'Think about what each one is for.' },
};

const SIZE_SCALE: Record<'S' | 'M' | 'L', number> = { S: 0.78, M: 1, L: 1.2 };

const itemLabel = (item: Item) => item.label ?? equipmentLabel(item.equipment);

export function GearSort({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'gear-sort'>) {
  const session = useMiniGameSession('gear-sort', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const showEs = useShowTranslation();
  const [state, dispatch] = useReducer(reducer, { phase: 'sorting', placed: {}, misses: 0, focusBin: null });

  const prompt = PROMPTS[challenge.by];
  const remaining = useMemo(
    () => challenge.items.filter((i) => !state.placed[i.id]),
    [challenge.items, state.placed],
  );
  const hintLadder = useHintLadder(state.misses, session.hint);

  const spokenLine = `${prompt.title}. ${prompt.rule}`;
  useCaptainLine(spokenLine, session.say, { es: prompt.es });

  /* One "hear it again", in the task bar, in both languages. */
  const replay = useCallback(() => {
    sfx.play('tap-soft');
    haptics.tap();
    speech.say(spokenLine, { speaker: 'bea' });
    if (showEs) setTimeout(() => speech.say(prompt.es, { speaker: 'bea', lang: 'es' }), 1600);
  }, [prompt.es, showEs, spokenLine]);

  const done = challenge.items.length - remaining.length;

  useEffect(() => {
    session.progress(done, challenge.items.length);
  }, [challenge.items.length, done, session]);

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

  /* ----- geometry: the bins are the play area, so they take the room ----- */
  const binCount = Math.max(1, challenge.bins.length);
  const binGap = spacing.xs;
  const binWidth = Math.min(
    layout.s(168),
    (layout.boxWidth - spacing.md * 2 - (binCount - 1) * binGap) / binCount,
  );
  const binHeight = Math.round(binWidth * 0.92);
  const tokenIcon = Math.max(44, layout.s(ageBand === 'C' ? 48 : 54));
  const tokenWidth = Math.max(hit.big + 20, layout.s(98));

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
      subtitle={prompt.rule}
      es={prompt.es}
      compact={compact}
      onReplay={replay}
      progress={{ done, total: challenge.items.length }}
      backdrop={
        <>
          <Stage variant="store-room" groundHeight={150} />
          <SceneCrew side="right" size={54} mood={state.phase === 'done' ? 'cheer' : done > 0 ? 'happy' : 'idle'} />
        </>
      }
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <TrayRow style={styles.tokens}>
          {remaining.length === 0 ? (
            <Animated.View entering={FadeIn} style={styles.clear}>
              <Text variant="h3" color={palette.leafGreenDark} center>
                Workbench clear!
              </Text>
            </Animated.View>
          ) : (
            remaining.map((item, i) => (
              <Animated.View key={item.id} entering={ZoomIn.delay(i * 60).springify().damping(14)}>
                <Draggable
                  id={item.id}
                  chrome="token"
                  snapRadius={layout.s(56)}
                  disabled={state.phase === 'done'}
                  onDrop={(slotId) => onDrop(item, slotId)}
                  accessibilityLabel={itemLabel(item)}
                  style={{ width: tokenWidth }}
                >
                  <View style={{ height: tokenIcon * 1.24, justifyContent: 'flex-end' }}>
                    <EquipmentIcon id={item.equipment} size={tokenIcon * SIZE_SCALE[item.size ?? 'M']} />
                  </View>
                  {/* two lines, so "Extinguisher" and "First Aid Kit" are never clipped */}
                  <Text variant="tiny" center numberOfLines={2} style={styles.tokenLabel}>
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
        <View style={[styles.bins, { gap: binGap }]}>
          {challenge.bins.map((bin, i) => {
            const contents = challenge.items.filter((it) => state.placed[it.id] === bin.id);
            const tint = bin.color ?? [palette.waterCyan, palette.safetyYellow, palette.leafGreen, palette.purple][i % 4] ?? palette.waterCyan;
            return (
              <View key={bin.id} style={[styles.binCol, { width: binWidth }]}>
                <SlotZone
                  id={`bin:${bin.id}`}
                  hitPad={layout.s(14)}
                  highlight={hintLadder.highlight && hintBin === bin.id}
                  style={{ width: binWidth, height: binHeight }}
                >
                  <BinBox width={binWidth} height={binHeight} tint={tint} />
                  {/* the mouth: a dashed well so the bin reads as somewhere to put things */}
                  {contents.length === 0 ? (
                    <View
                      style={[
                        styles.well,
                        { top: binHeight * 0.34, height: binHeight * 0.42, left: binWidth * 0.16, right: binWidth * 0.16 },
                      ]}
                      pointerEvents="none"
                    />
                  ) : null}
                  <View style={styles.binContents} pointerEvents="none">
                    {contents.map((it) => (
                      <Animated.View key={it.id} entering={ZoomIn.springify().damping(11)}>
                        <EquipmentIcon id={it.equipment} size={Math.max(20, binWidth * 0.28)} />
                      </Animated.View>
                    ))}
                  </View>
                </SlotZone>

                {/* one plaque per bin: the name, and the Spanish only when asked for */}
                <View style={styles.plaque}>
                  <Text variant="bodyStrong" center numberOfLines={2} style={{ fontSize: layout.s(15), lineHeight: layout.s(19) }}>
                    {bin.label}
                  </Text>
                  {showEs && bin.labelEs ? (
                    <Text variant="small" color={roles.ink.translation} center numberOfLines={1} style={{ fontSize: layout.s(13) }}>
                      {bin.labelEs}
                    </Text>
                  ) : null}
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
  bench: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.sm, paddingBottom: spacing.xs },
  bins: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start' },
  binCol: { alignItems: 'center', gap: 6 },
  well: {
    position: 'absolute',
    borderRadius: radii.tile,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(31,42,90,0.22)',
  },
  binContents: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  plaque: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: roles.surface.card,
    borderRadius: radii.tag,
    paddingHorizontal: 6,
    paddingVertical: 5,
    minHeight: 40,
    justifyContent: 'center',
    ...roles.lift.surface,
  },
  tokens: { rowGap: spacing.xs },
  tokenLabel: { marginTop: 2 },
  clear: { minHeight: hit.big, justifyContent: 'center' },
});
