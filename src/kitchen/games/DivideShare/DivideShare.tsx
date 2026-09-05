import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring } from 'react-native-reanimated';
import type { CharacterId } from '@/content/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useFeedbackAnim } from '@/hooks';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { PromptBanner } from '@/ui/kit/PromptBanner';
import { AnswerTile } from '@/ui/kit/AnswerTile';
import { HintBubble } from '@/ui/kit/HintBubble';
import { Tray } from '@/ui/kit/Tray';
import { VocabIcon } from '@/ui/kit/VocabIcon';
import { GameCrew } from '@/characters';
import { Stage as SceneStage } from '@/world';
import { CrewFigure } from '@/world/scenes';
import { Stage, at } from '../../parts/Stage';
import { PlateArt } from '../../parts/FoodBits';
import { EquationStrip } from '../../parts/SceneBits';
import { pluralEn } from '../../spanish';
import { answerOptions, equationText, nextPlate, shareState } from '../../shareMath';
import { kitchenFeel, nearestTarget, useBeaconHint, useDragSource } from '../useKitchenGame';

/**
 * BLOCKING DEFECT FIX (art critique): the answer tiles were drawn at y 150 and
 * the plate cards started at y 160, so the three plates and a stray answer card
 * piled on top of each other. The design box is taller now and the three bands
 * — serving tray, answer row, plate row — never share a pixel.
 */
const D = { w: 390, h: 486 };
const TRAY = { x: 18, y: 10, w: 354, h: 104 };
const ASK_Y = 126;
const PLATE_TOP = 250;
const PLATE_H = 210;
const PLATE_Y = PLATE_TOP + 120;
const ITEM = 42;

interface CrewSeat {
  id: CharacterId;
  name: string;
}

const CREW: CrewSeat[] = [
  { id: 'rookie', name: 'You' },
  { id: 'bea', name: 'Bea' },
  { id: 'beacon', name: 'Beacon' },
  { id: 'pepper', name: 'Pepper' },
];

const FALLBACK_CREW: CrewSeat = { id: 'rookie', name: 'You' };

export function DivideShare({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'divide-share'>) {
  const session = useMiniGameSession('divide-share', onComplete, onEvent);
  const beacon = useBeaconHint(session);

  const among = Math.max(1, challenge.among);
  const each = Math.max(1, challenge.each || Math.floor(challenge.total / among));
  const asksFirst = ageBand !== 'A';

  const [phase, setPhase] = useState<'ask' | 'deal' | 'eating'>(asksFirst ? 'ask' : 'deal');
  const [plates, setPlates] = useState<number[]>(() => Array.from({ length: among }, () => 0));
  const [wrong, setWrong] = useState<number[]>([]);
  const [bump, setBump] = useState<number[]>(() => Array.from({ length: among }, () => 0));

  const placed = plates.reduce((a, b) => a + b, 0);
  const left = Math.max(0, challenge.total - placed);
  const itemName = pluralEn(challenge.item.en, challenge.total);

  const platePoints = useMemo(() => {
    // leave a real gutter between cards so neighbouring plates never touch
    const w = Math.max(64, Math.min(92, (D.w - 28) / among - 10));
    const gap = (D.w - among * w) / (among + 1);
    return Array.from({ length: among }, (_, i) => ({ x: gap + i * (w + gap) + w / 2, y: PLATE_Y, w }));
  }, [among]);

  useEffect(() => {
    const line =
      phase === 'ask'
        ? `${challenge.total} ${itemName} for ${among} firefighters. How many each?`
        : `Give everyone the same number of ${itemName}.`;
    speech.say(line, { speaker: 'bea' });
    return () => speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const wobblePlate = useCallback((i: number) => {
    setBump((b) => b.map((v, k) => (k === i ? v + 1 : v)));
  }, []);

  const eatUp = useCallback(() => {
    setPhase('eating');
    kitchenFeel.finish();
    speech.say(`${each} ${pluralEn(challenge.item.en, each)} each. ¡Buen provecho!`, { speaker: 'bea' });
    setTimeout(() => session.complete(), 1600);
  }, [challenge.item.en, each, session]);

  const give = useCallback(
    (plateIndex: number) => {
      if (phase !== 'deal' || left <= 0) return;
      if ((plates[plateIndex] ?? 0) >= each) {
        wobblePlate(plateIndex);
        beacon.nudge(`That plate has enough — everybody gets ${each}.`);
        return;
      }
      const next = [...plates];
      next[plateIndex] = (next[plateIndex] ?? 0) + 1;
      setPlates(next);
      kitchenFeel.drop();
      session.correct('share');
      if (shareState(next, each).done) setTimeout(eatUp, 420);
    },
    [beacon, each, eatUp, left, phase, plates, session, wobblePlate],
  );

  const answer = useCallback(
    (value: number) => {
      if (value === each) {
        kitchenFeel.good();
        session.correct('division');
        beacon.cheer(`${each} each — now deal them out!`);
        setTimeout(() => setPhase('deal'), 640);
      } else {
        setWrong((w) => (w.includes(value) ? w : [...w, value]));
        beacon.nudge(`Try sharing them out one at a time and count one plate.`);
      }
    },
    [beacon, each, session],
  );

  const showMe = useCallback(() => {
    beacon.askedForHelp();
    if (phase === 'ask') {
      setPhase('deal');
      return;
    }
    const idx = nextPlate(plates, each);
    if (idx >= 0) give(idx);
  }, [beacon, each, give, phase, plates]);

  const trayItems = Array.from({ length: left }, (_, i) => i);
  const perRow = Math.min(8, Math.max(1, trayItems.length));
  const startX = TRAY.x + (TRAY.w - perRow * (ITEM + 4)) / 2;

  return (
    <View style={styles.root}>
      {/* an indoor game is played in a kitchen, never against a blue sky */}
      <SceneStage variant="counter" groundHeight={150} />
      {among < 3 ? (
        <GameCrew side="right" size={54} bottom={104} showPepper mood={phase === 'eating' ? 'cheer' : phase === 'deal' ? 'happy' : 'idle'} />
      ) : null}
      <PromptBanner
        title={`${challenge.total} ${itemName} for ${among} firefighters`}
        subtitle={phase === 'ask' ? 'How many does each one get?' : 'Drag one to a plate — or tap a plate.'}
        es={challenge.item.es}
        compact={compact}
      />

      <View style={styles.equationRow}>
        <EquationStrip text={equationText(challenge.total, among, phase === 'ask' ? null : each)} tone="gold" />
      </View>

      <Stage design={D} style={styles.stage}>
        {(s) => (
          <>
            {/* the serving tray */}
            <View style={at(s, TRAY.x, TRAY.y, TRAY.w, TRAY.h)} pointerEvents="none">
              <View style={[styles.tray, { borderRadius: 20 * s, borderWidth: 5 * s }]} />
            </View>

            {phase === 'ask' ? (
              <View style={[at(s, 8, ASK_Y, 374), styles.answerWrap]}>
                {answerOptions(each).map((value, i) => (
                  <AnswerTile
                    key={value}
                    label={String(value)}
                    index={i}
                    size="lg"
                    state={wrong.includes(value) ? 'wrong' : beacon.highlight && value === each ? 'highlight' : 'idle'}
                    onPress={() => answer(value)}
                  />
                ))}
              </View>
            ) : null}

            {trayItems.map((i) => {
              const row = Math.floor(i / perRow);
              const col = i % perRow;
              const x = startX + col * (ITEM + 4);
              const y = TRAY.y + 12 + row * (ITEM + 6);
              return (
                <FoodToken
                  key={`item${i}`}
                  s={s}
                  x={x}
                  y={y}
                  word={challenge.item}
                  enabled={phase === 'deal'}
                  onTap={() => {
                    const idx = nextPlate(plates, each);
                    if (idx >= 0) give(idx);
                  }}
                  onDrop={(dx, dy) => {
                    const p = { x: x + ITEM / 2 + dx, y: y + ITEM / 2 + dy };
                    const hit = nearestTarget(p, platePoints, 78);
                    if (hit < 0) beacon.cheer('Drop it right onto a plate!');
                    else give(hit);
                  }}
                />
              );
            })}

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
                glow={(beacon.highlight || ageBand === 'A') && phase === 'deal' && nextPlate(plates, each) === i}
                bump={bump[i] ?? 0}
                eating={phase === 'eating'}
                delay={i * 140}
                onPress={() => give(i)}
              />
            ))}
          </>
        )}
      </Stage>

      <Tray tone="cream">
        <View style={styles.trayRow}>
          {beacon.offerHelp && phase !== 'eating' ? (
            <Button label="Show me" tone="yellow" size="sm" onPress={showMe} sound="tap-soft" />
          ) : null}
          <Text variant="bodyStrong" color={palette.navySoft}>
            {phase === 'eating' ? '¡Buen provecho!' : `${left} left on the tray`}
          </Text>
        </View>
      </Tray>

      <HintBubble text={beacon.text} es={beacon.es} visible={beacon.visible} onDismiss={beacon.dismiss} />
    </View>
  );
}

function FoodToken({
  s,
  x,
  y,
  word,
  enabled,
  onDrop,
  onTap,
}: {
  s: number;
  x: number;
  y: number;
  word: { id: string; en: string; es: string };
  enabled: boolean;
  onDrop: (dx: number, dy: number) => void;
  onTap: () => void;
}) {
  const drag = useDragSource({
    scale: s,
    enabled,
    onPickUp: () => kitchenFeel.pick(word),
    onTap,
    onDrop,
  });
  // Outer node owns the entrance (layout) animation, inner node owns the drag
  // transform — Reanimated warns and can drop one of them if they share a node.
  return (
    <Animated.View entering={ZoomIn.springify().damping(15)} style={at(s, x, y, ITEM, ITEM)}>
      <GestureDetector gesture={drag.gesture}>
        <Animated.View style={drag.style} accessibilityRole="button" accessibilityLabel={`${word.en} — ${word.es}`}>
          <VocabIcon id={word.id} size={ITEM * s} />
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
            The slot has a fixed height so Beacon (who is shorter than the
            humans) does not pull his whole plate card out of the row. */}
        <View style={[styles.figureSlot, { height: 100 * s }]}>
          <CrewFigure id={crew.id} size={96 * s} emotion={eating ? 'excited' : 'happy'} jumping={eating} bobPhase={delay / 900} />
        </View>
        <Text variant="tiny" center numberOfLines={1} color={palette.navySoft} style={{ fontSize: 12 * s, lineHeight: 15 * s }}>
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
  root: { flex: 1 },
  stage: { flex: 1 },
  equationRow: { alignItems: 'center', marginTop: spacing.xs },
  tray: {
    flex: 1,
    backgroundColor: palette.tan,
    borderColor: palette.wood,
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
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    alignItems: 'center',
    ...shadows.soft,
  },
  trayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 4 },
});
