import React, { useCallback, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { Button, EquipmentIcon, SpeakerIcon, Text } from '@/ui';
import { Draggable } from '../shared/Draggable';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useBeaconLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { WaterBurst } from '../shared/art/Glyphs';
import { Hydrant, TruckSide } from '../shared/art/Props';

interface State {
  phase: 'connecting' | 'connected';
  misses: number;
}

type Action = { type: 'MISS' } | { type: 'CONNECT' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'MISS':
      return { ...state, misses: state.misses + 1 };
    case 'CONNECT':
      return { ...state, phase: 'connected' };
    default:
      return state;
  }
}

const spoken = (label: string) => label.replace(/×/g, ' times ').replace(/\s+/g, ' ').trim();

/** "3 × 4" → { a: 3, b: 4 } so we can show the dot array helper. */
function parseProduct(label: string): { a: number; b: number } | null {
  const m = label.match(/(\d+)\s*[×x*]\s*(\d+)/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return Number.isFinite(a) && Number.isFinite(b) ? { a, b } : null;
}

export function HydrantMatch({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'hydrant-match'>) {
  const session = useMiniGameSession('hydrant-match', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { phase: 'connecting', misses: 0 });
  const hintLadder = useHintLadder(state.misses, session.hint);
  const done = useRef(false);

  const product = useMemo(() => parseProduct(challenge.label), [challenge.label]);
  const call = `Connect to hydrant ${spoken(challenge.label)}`;
  useBeaconLine(call, session.say);

  const onDrop = useCallback(
    (slotId: string | null) => {
      if (!slotId) return { accept: false, silent: true };
      const value = Number(slotId.replace('hyd:', ''));
      if (value === challenge.correct) {
        return {
          accept: true,
          silent: true,
          onSettled: () => {
            dispatch({ type: 'CONNECT' });
            session.correct(String(value));
            sfx.play('clank');
            haptics.success();
            if (!done.current) {
              done.current = true;
              setTimeout(() => {
                sfx.play('splash');
                session.complete();
              }, 1000);
            }
          },
        };
      }
      return {
        accept: false,
        onSettled: () => {
          dispatch({ type: 'MISS' });
          session.incorrect(String(value));
        },
      };
    },
    [challenge.correct, session],
  );

  const count = Math.max(1, challenge.options.length);
  const hydrantWidth = Math.min(layout.s(84), (layout.boxWidth - spacing.md * 2 - (count - 1) * spacing.xs) / count);
  const coilSize = Math.max(hit.big, layout.s(76));

  const hintText = product
    ? `${product.a} × ${product.b} means ${product.a} groups of ${product.b}. Count them all: ${challenge.correct}!`
    : `Look for the plate that says ${challenge.correct}.`;

  return (
    <GameFrame
      title={`Connect to Hydrant ${challenge.label}`}
      subtitle={ageBand === 'A' ? undefined : 'Drag the hose to the matching hydrant.'}
      compact={compact}
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <View style={styles.tray}>
          <Draggable
            id="hose-end"
            snapRadius={layout.s(56)}
            disabled={state.phase === 'connected'}
            onDrop={onDrop}
            accessibilityLabel="Hose end"
            style={[styles.coil, { width: coilSize + spacing.md }]}
          >
            <EquipmentIcon id="hose" size={coilSize} shadow />
            <Text variant="tiny" center>
              Hose
            </Text>
          </Draggable>
          <View style={styles.trayInfo}>
            <Button
              label="Say it again"
              tone="blue"
              size="sm"
              sound="none"
              icon={<SpeakerIcon size={20} color={palette.white} />}
              onPress={() => {
                sfx.play('radio');
                speech.say(call, { speaker: 'beacon' });
              }}
            />
            {(ageBand === 'C' || hintLadder.level > 0) && product ? (
              <Animated.View entering={FadeIn} style={styles.helper}>
                <Text variant="bodyStrong" center>
                  {product.a} × {product.b} = ?
                </Text>
                <View style={styles.dots}>
                  {Array.from({ length: product.a }, (_, g) => (
                    <View key={g} style={styles.dotGroup}>
                      {Array.from({ length: product.b }, (_, d) => (
                        <View key={d} style={styles.dot} />
                      ))}
                    </View>
                  ))}
                </View>
              </Animated.View>
            ) : null}
          </View>
        </View>
      }
    >
      <View style={styles.stage}>
        <View style={styles.truckRow}>
          <TruckSide width={Math.min(layout.s(180), layout.boxWidth * 0.5)} />
          <View style={[styles.hoseLine, { width: layout.s(60) }]} />
        </View>
        <View style={styles.street}>
          <View style={styles.curb} />
          <View style={styles.hydrants}>
            {challenge.options.map((value, i) => {
              const isMatch = state.phase === 'connected' && value === challenge.correct;
              return (
                <SlotZone
                  key={value}
                  id={`hyd:${value}`}
                  hitPad={layout.s(10)}
                  enabled={state.phase === 'connecting'}
                  highlight={hintLadder.highlight && value === challenge.correct}
                  style={styles.hydrantSlot}
                >
                  <Animated.View entering={ZoomIn.delay(i * 80).springify().damping(13)} style={styles.hydrantCol}>
                    {isMatch ? (
                      <Animated.View entering={ZoomIn.springify()} style={styles.burst} pointerEvents="none">
                        <WaterBurst size={hydrantWidth * 1.5} />
                      </Animated.View>
                    ) : null}
                    <Hydrant width={hydrantWidth} tone={i % 2 === 0 ? 'red' : 'yellow'} wet={isMatch} />
                    <View style={styles.plate}>
                      <Text variant="h3" center>
                        {value}
                      </Text>
                    </View>
                  </Animated.View>
                </SlotZone>
              );
            })}
          </View>
        </View>
        {state.phase === 'connected' ? (
          <Animated.View entering={FadeIn} style={styles.banner}>
            <Text variant="h3" color={palette.leafGreenDark} center>
              Water&apos;s on! {challenge.label} = {challenge.correct}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, justifyContent: 'flex-end', paddingBottom: spacing.sm },
  truckRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.xs },
  hoseLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.engineRed,
    marginLeft: -6,
    borderBottomWidth: 3,
    borderBottomColor: palette.engineRedDark,
  },
  street: {
    backgroundColor: '#C9D0E0',
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    ...shadows.soft,
  },
  curb: {
    height: 8,
    backgroundColor: palette.slateLight,
    borderRadius: 4,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  hydrants: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-end' },
  hydrantSlot: { paddingHorizontal: 2 },
  hydrantCol: { alignItems: 'center' },
  burst: { position: 'absolute', top: -10, zIndex: 2 },
  plate: {
    marginTop: -10,
    backgroundColor: palette.white,
    borderRadius: radii.tag,
    paddingHorizontal: 10,
    paddingVertical: 1,
    ...shadows.soft,
  },
  banner: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  tray: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, flexWrap: 'wrap' },
  coil: {
    alignItems: 'center',
    backgroundColor: palette.panel,
    borderRadius: radii.card,
    paddingVertical: spacing.xs,
  },
  trayInfo: { alignItems: 'center', gap: spacing.xs },
  helper: { alignItems: 'center', backgroundColor: palette.cream, borderRadius: radii.card, padding: spacing.xs },
  dots: { flexDirection: 'row', gap: 6, marginTop: 4 },
  dotGroup: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: palette.white,
    borderRadius: radii.tag,
    padding: 3,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.waterCyan },
});
