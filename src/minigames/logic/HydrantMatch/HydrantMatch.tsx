import React, { useCallback, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { activity, hit, palette, radii, roles, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { EquipmentIcon, Text, useSideRail } from '@/ui';

import { Draggable } from '../shared/Draggable';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useCaptainLine } from '../shared/speak';
import { useHintLadder } from '../shared/useHintLadder';
import { WaterBurst } from '../shared/art/Glyphs';
import { TruckSide } from '../shared/art/Props';
import { RoomWash, StreetBlock, clamp, streetMetrics, usePlayBox } from '../shared/art/Scene';
import { Hydrant } from '@/world/props';

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

const spoken = (label: string) =>
  label
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/[−-]/g, ' minus ')
    .replace(/\+/g, ' plus ')
    .replace(/\s+/g, ' ')
    .trim();

/** True when the tag is a sum rather than a plain number or a number word. */
const isSum = (label: string) => /[+×÷−-]/.test(label);

/** "3 × 4" / "5 + 20" → the parts we can draw as a dot helper. */
function parseEquation(label: string): { op: 'times' | 'plus'; a: number; b: number } | null {
  const m = label.match(/(\d+)\s*([×x*+])\s*(\d+)/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[3]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { op: m[2] === '+' ? 'plus' : 'times', a, b };
}

/** Dots stay readable: big numbers show one row of ten-frames instead of hundreds of dots. */
const dotGroups = (eq: { op: 'times' | 'plus'; a: number; b: number }): number[] =>
  eq.op === 'plus' ? [eq.a, eq.b] : Array.from({ length: Math.min(eq.a, 6) }, () => eq.b);

export function HydrantMatch({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'hydrant-match'>) {
  const session = useMiniGameSession('hydrant-match', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const [state, dispatch] = useReducer(reducer, { phase: 'connecting', misses: 0 });
  const hintLadder = useHintLadder(state.misses, session.hint);
  const done = useRef(false);

  const equation = useMemo(() => parseEquation(challenge.label), [challenge.label]);
  const call = `Connect the hose to hydrant ${spoken(challenge.label)}`;
  useCaptainLine(call, session.say);

  /* The task bar's hear-it-again replaces the game's own "Say it again" button. */
  const replay = useCallback(() => {
    sfx.play('radio');
    haptics.tap();
    speech.say(call, { speaker: 'bea' });
  }, [call]);

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

  /* the street is measured, so the hydrants stand on a real pavement and the
     block above them is drawn inside the play box instead of behind the chrome */
  const sideRail = useSideRail();
  const { box, onLayout } = usePlayBox();
  const street = streetMetrics(box);
  const playWidth = box.w > 0
    ? box.w
    : sideRail
      ? Math.min(layout.width - activity.sidePanelWidth - spacing.sm * 3, 820)
      : layout.boxWidth;

  const count = Math.max(1, challenge.options.length);
  const bayWidth = (playWidth - spacing.sm * 2 - (count - 1) * 6) / count;
  const hydrantWidth = clamp(bayWidth - 14, 46, sideRail ? 128 : 104);
  const coilSize = Math.max(hit.big, layout.s(76));
  /* the ticket carries the sum, so the truck is scenery and stays out of the way */
  const truckWidth = clamp(playWidth * 0.46, 130, 320);

  const showDots = (ageBand === 'C' || hintLadder.level > 0) && !!equation;

  const hintText = !equation
    ? `Look for the plate that says ${challenge.correct}.`
    : equation.op === 'plus'
      ? `${equation.a} and ${equation.b} more makes ${challenge.correct}. Find hydrant ${challenge.correct}!`
      : `${equation.a} × ${equation.b} means ${equation.a} groups of ${equation.b}. Count them all: ${challenge.correct}!`;

  /* "Look for the plate that says 51" is useless if the bubble is sitting on
     the plates — while a hint is up the street moves up out of its lane */
  const hintLane = hintLadder.showBubble ? layout.s(132) : 0;

  return (
    <GameFrame
      title="Connect the Hose"
      subtitle="Drag the hose to the hydrant that matches."
      compact={compact}
      onReplay={replay}
      /* the engine is this scene's character; the block itself is drawn inside
         the play box so no shopfront is ever sliced by the task bar */
      backdrop={<RoomWash top="#6FC0F8" bottom="#C4CCDE" />}
      hint={{ text: hintText, visible: hintLadder.showBubble, onDismiss: hintLadder.dismiss }}
      tray={
        <View style={styles.tray}>
          <Draggable
            id="hose-end"
            chrome="token"
            snapRadius={layout.s(60)}
            disabled={state.phase === 'connected'}
            onDrop={onDrop}
            accessibilityLabel="Hose end"
            style={{ width: coilSize + spacing.lg }}
          >
            <EquipmentIcon id="hose" size={coilSize} shadow />
            <Text variant="tiny" center>
              Hose
            </Text>
          </Draggable>
        </View>
      }
    >
      <View style={styles.stage} onLayout={onLayout}>
        {/* the block of Spark City the hydrants stand on */}
        <StreetBlock box={box} />

        <View
          style={[
            styles.deck,
            { paddingBottom: (box.h > 0 ? Math.max(spacing.xs, (box.h - street.roadTop) * 0.24) : spacing.xs) + hintLane },
          ]}
        >
        {/*
         * THE SUM, ONCE. It used to be squeezed into the task bar (where it
         * wrapped onto two lines) and printed again on a helper card in the
         * tray. This is the only place it appears.
         */}
        <Animated.View entering={FadeIn} style={styles.ticket}>
          <Text variant="tiny" color={roles.ink.muted}>
            FIND HYDRANT
          </Text>
          <Text variant="numeral" center style={{ fontSize: layout.s(40), lineHeight: layout.s(48) }}>
            {isSum(challenge.label) ? `${challenge.label} = ?` : challenge.label}
          </Text>
          {showDots && equation ? (
            <View style={styles.dots}>
              {dotGroups(equation).map((n, g) => (
                <View key={g} style={styles.dotGroup}>
                  {Array.from({ length: Math.min(n, 10) }, (_, d) => (
                    <View key={d} style={styles.dot} />
                  ))}
                  {n > 10 ? (
                    <Text variant="tiny" color={roles.ink.secondary}>
                      +{n - 10}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </Animated.View>

        <View style={styles.truckRow}>
          <TruckSide width={truckWidth} bay={false} />
          <View style={[styles.hoseLine, { width: layout.s(40) }]} />
        </View>

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
                  style={[styles.bay, { width: bayWidth }]}
                >
                  <Animated.View entering={ZoomIn.delay(i * 80).springify().damping(13)} style={styles.hydrantCol}>
                    {isMatch ? (
                      <Animated.View entering={ZoomIn.springify()} style={styles.burst} pointerEvents="none">
                        <WaterBurst size={hydrantWidth * 1.6} />
                      </Animated.View>
                    ) : null}
                    <Hydrant width={hydrantWidth} tone={i % 2 === 0 ? 'red' : 'yellow'} wet={isMatch} />
                    {/* the number lives here and nowhere else */}
                    <View style={[styles.plate, { minWidth: bayWidth - 10 }]}>
                      <Text variant="h2" center numberOfLines={1} style={{ fontSize: layout.s(24), lineHeight: layout.s(30) }}>
                        {value}
                      </Text>
                    </View>
                  </Animated.View>
                </SlotZone>
              );
            })}
        </View>

        {state.phase === 'connected' ? (
          <Animated.View entering={FadeIn} style={styles.banner}>
            <Text variant="h3" color={palette.leafGreenDark} center>
              Water&apos;s on! {challenge.label} = {challenge.correct}
            </Text>
          </Animated.View>
        ) : null}
        </View>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignSelf: 'stretch' },
  deck: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: spacing.sm },
  ticket: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: roles.surface.card,
    borderRadius: radii.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    maxWidth: 440,
    ...roles.lift.surface,
  },
  dots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4, marginBottom: 2 },
  dotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: roles.surface.sunken,
    borderRadius: radii.tag,
    padding: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.waterCyan },

  truckRow: { flexDirection: 'row', alignItems: 'flex-end', paddingLeft: spacing.xs, marginBottom: -6 },
  hoseLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.engineRed,
    marginLeft: -6,
    borderBottomWidth: 3,
    borderBottomColor: palette.engineRedDark,
  },
  hydrants: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 6 },
  /* each hydrant stands in a lit bay, so every drop target is visible before
     the child has picked anything up */
  bay: {
    paddingHorizontal: 2,
    paddingTop: 4,
    paddingBottom: 4,
    borderRadius: radii.tile,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  hydrantCol: { alignItems: 'center' },
  burst: { position: 'absolute', top: -10, zIndex: 2 },
  plate: {
    marginTop: -8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: roles.surface.card,
    borderRadius: radii.tag,
    borderBottomWidth: 4,
    borderBottomColor: palette.slateLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    ...roles.lift.surface,
  },
  banner: {
    alignSelf: 'center',
    marginTop: spacing.xs,
    backgroundColor: roles.state.successFill,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  tray: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, flexWrap: 'wrap' },
});
