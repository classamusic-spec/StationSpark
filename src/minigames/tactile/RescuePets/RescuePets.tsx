import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { AnimalId } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing, springs } from '@/theme';
import { Chip, Text } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { Rookie } from '@/characters';
import { ContactShadow, Stage } from '@/world';

import { Animal, RescueBasket, animalName, sceneTheme } from '@/world/props';
import {
  AskQuestion,
  BigTree,
  GameShell,
  PlayGround,
  PulseRing,
  TREE_ASPECT,
  TREE_FOOT,
  TREE_PERCHES,
  TREE_VB,
  bark,
  leaf,
  optionsFor,
  useHintLadder,
  useMeasuredBox,
  useSpokenPrompt,
  useStage,
} from '../shared';

/* ------------------------------------------------------------------ */
/* State machine: asking → rescuing → carrying → done                   */
/* ------------------------------------------------------------------ */

type Phase = 'asking' | 'rescuing' | 'carrying' | 'done';

interface State {
  phase: Phase;
  /** indices of the stranded animals already in the basket */
  saved: number[];
}

type Action = { type: 'answered' } | { type: 'rescue'; index: number } | { type: 'carry' } | { type: 'finish' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'answered':
      return state.phase === 'asking' ? { ...state, phase: 'rescuing' } : state;
    case 'rescue':
      if (state.saved.includes(action.index)) return state;
      return { ...state, saved: [...state.saved, action.index] };
    case 'carry':
      return { ...state, phase: 'carrying' };
    case 'finish':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */

interface StrandedProps {
  id: AnimalId;
  size: number;
  x: number;
  y: number;
  phase: number;
  /** basket centre in the same coordinate space */
  basket: { x: number; y: number; r: number };
  enabled: boolean;
  onRescue: () => void;
  onPickUp: () => void;
}

/** One animal on a branch: wiggles on pickup, plops into the basket on release. */
function Stranded({ id, size, x, y, phase, basket, enabled, onRescue, onPickUp }: StrandedProps) {
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const lift = useSharedValue(0);

  const drop = useCallback(
    (tx: number, ty: number) => {
      const cx = x + tx + size / 2;
      const cy = y + ty + size / 2;
      const near = Math.hypot(cx - basket.x, cy - basket.y) <= basket.r;
      if (near) onRescue();
    },
    [basket.r, basket.x, basket.y, onRescue, size, x, y],
  );

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(enabled)
      .minDistance(4)
      .onBegin(() => {
        lift.value = withSpring(1, springs.pop);
        runOnJS(onPickUp)();
      })
      .onUpdate((e) => {
        dx.value = e.translationX;
        dy.value = e.translationY;
      })
      .onEnd((e) => {
        runOnJS(drop)(e.translationX, e.translationY);
      })
      .onFinalize(() => {
        dx.value = withSpring(0, springs.snap);
        dy.value = withSpring(0, springs.snap);
        lift.value = withSpring(0, springs.pop);
      });
    const tap = Gesture.Tap()
      .enabled(enabled)
      .maxDistance(14)
      .onEnd((_e, ok) => {
        if (ok) {
          runOnJS(onPickUp)();
          runOnJS(onRescue)();
        }
      });
    return Gesture.Race(pan, tap);
  }, [drop, dx, dy, enabled, lift, onPickUp, onRescue]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.value }, { translateY: dy.value }, { scale: 1 + lift.value * 0.14 }, { rotate: `${lift.value * 5}deg` }],
    zIndex: lift.value > 0 ? 40 : 5,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.stranded, { left: x, top: y, width: size, height: size }, style]}
        accessibilityLabel={`Rescue the ${animalName[id].en}`}
      >
        <Animal id={id} size={size} mood="help" phase={phase} />
      </Animated.View>
    </GestureDetector>
  );
}

/* ------------------------------------------------------------------ */

export function RescuePets({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'rescue-pets'>) {
  const session = useMiniGameSession('rescue-pets', onComplete, onEvent);
  const stage = useStage(compact);
  const hints = useHintLadder(session.hint);
  const { box, ready, onLayout } = useMeasuredBox();

  const total = Math.max(1, challenge.total);
  const alreadySafe = Math.max(0, Math.min(challenge.alreadySafe, total));
  const needHelp = total - alreadySafe;
  const pet = animalName[challenge.animal];
  const askFirst = ageBand !== 'A' && needHelp > 0;

  const [state, dispatch] = useReducer(reducer, { phase: askFirst ? 'asking' : 'rescuing', saved: [] });

  const hug = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      list.length = 0;
    };
  }, []);

  const safeCount = alreadySafe + state.saved.length;
  const toGo = total - safeCount;

  /* ---- prompt ---- */
  const place = sceneTheme(challenge.scene).name;
  const prompt =
    ageBand === 'A' ? `Rescue the ${pet.plural}!` : `${needHelp} ${needHelp === 1 ? pet.en : pet.plural} need help at the ${place}`;
  const subtitle = compact ? undefined : 'Drag each one into the basket.';
  useSpokenPrompt(state.phase === 'asking' ? null : `Rescue the ${pet.plural}`, { speaker: 'bea' });

  /* ---- geometry ----
   * Composition rule for this game: **the oak commands the play area.** The
   * old layout drew a 250 px tree in the top third and left half the screen as
   * flat sky. Now the tree is measured off the ground line, grows to fill the
   * height it is given (capped so a tablet gets one big tree, not an absurd
   * one), and Rookie's basket stands on the very same line. */
  const geo = useMemo(() => {
    const w = Math.max(1, box.w);
    const h = Math.max(1, box.h);
    const wide = w > h * 1.15;

    /* the near grass bank — deep enough to stand on, never half the screen */
    const groundY = h - Math.max(54, Math.min(h * 0.19, stage.s(104)));
    const topPad = Math.max(6, h * 0.02);

    /* the canopy is allowed to run past the screen edges on a narrow phone —
       a cropped canopy reads as a big tree; a shrunken one reads as a shrub */
    let treeH = Math.min(groundY - topPad, stage.s(680));
    let treeW = treeH * TREE_ASPECT;
    const maxTreeW = w * (wide ? 0.5 : 1.18);
    if (treeW > maxTreeW) {
      treeW = maxTreeW;
      treeH = treeW / TREE_ASPECT;
    }
    const treeX = w * (wide ? 0.3 : 0.45) - treeW / 2;
    const treeY = groundY - treeH * (TREE_FOOT / TREE_VB.h);

    const petSize = Math.max(64, Math.min(stage.s(76), treeW * 0.21));

    const basketW = Math.max(104, Math.min(stage.s(158), w * (wide ? 0.22 : 0.34)));
    const basketH = basketW * 0.75;
    const basketX = w - basketW - stage.s(16);
    const basketY = groundY - basketH * 0.86;

    const rookieH = Math.max(96, Math.min(groundY * 0.42, stage.s(200)));
    const rookieW = rookieH * 0.727;

    return {
      w,
      h,
      groundY,
      tree: { x: treeX, y: treeY, w: treeW, h: treeH },
      petSize,
      basket: { x: basketX, y: basketY, w: basketW, h: basketH },
      basketCentre: { x: basketX + basketW / 2, y: basketY + basketH / 2, r: Math.max(96, basketW * 0.9) },
      /* Rookie stands *behind* the basket on the same ground line, so the two
         read as one rescue post rather than a head in a basket */
      rookie: { x: basketX + basketW * 0.5 - rookieW / 2, y: groundY - basketH * 0.3 - rookieH, h: rookieH, w: rookieW },
    };
  }, [box.h, box.w, stage]);

  /** where each stranded animal perches — the branches the art actually drew */
  const perches = useMemo(
    () =>
      Array.from({ length: needHelp }, (_, i) => {
        const spot = TREE_PERCHES[i % TREE_PERCHES.length];
        const fx = spot?.fx ?? 0.5;
        const fy = spot?.fy ?? 0.4;
        return {
          x: geo.tree.x + fx * geo.tree.w - geo.petSize / 2,
          y: geo.tree.y + fy * geo.tree.h - geo.petSize,
        };
      }),
    [geo.petSize, geo.tree.h, geo.tree.w, geo.tree.x, geo.tree.y, needHelp],
  );

  /* ---- rescuing ---- */
  const pickUp = useCallback(() => {
    sfx.play(pet.sound, { volume: 0.7 });
    haptics.select();
  }, [pet.sound]);

  const finish = useCallback(() => {
    dispatch({ type: 'carry' });
    hug.value = withDelay(150, withSpring(1, springs.bounce));
    sfx.play('success');
    haptics.celebrate();
    session.progress(total, total);
    session.say('rookie', `Everyone is safe! ${total} ${total === 1 ? pet.en : pet.plural} in the basket.`);
    speech.say(`All ${total} safe!`, { speaker: 'rookie' });
    timers.current.push(
      setTimeout(() => {
        dispatch({ type: 'finish' });
        sfx.play('fanfare');
        session.say('rookie', 'Got you! You are safe.');
        session.complete();
      }, 1400),
    );
  }, [hug, pet, session, total]);

  const rescue = useCallback(
    (index: number) => {
      if (state.phase !== 'rescuing' || state.saved.includes(index)) return;
      dispatch({ type: 'rescue', index });
      sfx.play('pop');
      haptics.drop();
      const nextSafe = safeCount + 1;
      const nextToGo = total - nextSafe;
      session.correct(`safe=${nextSafe}`);
      session.progress(nextSafe, total);
      speech.say(nextToGo > 0 ? `${nextSafe} safe. ${nextToGo} to go.` : `${nextSafe} safe!`, { speaker: 'bea' });
      if (nextToGo === 0) timers.current.push(setTimeout(finish, 520));
    },
    [finish, safeCount, session, state.phase, state.saved, total],
  );

  /* ---- idle nudge ---- */
  useEffect(() => {
    if (state.phase !== 'rescuing' || toGo === 0) return;
    const t = setTimeout(() => {
      hints.nudge({ text: `Drag a ${pet.en} into Rookie's basket!`, es: `¡Arrastra un ${pet.es} a la canasta!` });
    }, 13000);
    return () => clearTimeout(t);
  }, [hints, pet.en, pet.es, state.phase, state.saved.length, toGo]);

  /* ---- the subtraction beat ---- */
  const askCorrect = needHelp;
  const askOptions = useMemo(() => optionsFor(askCorrect, 2, 0, total + 2), [askCorrect, total]);
  const askText = `${total} ${pet.plural}. ${alreadySafe} ${alreadySafe === 1 ? 'is' : 'are'} safe. How many need help?`;

  const onAnswer = useCallback(
    (ok: boolean, value: number) => {
      if (ok) {
        session.correct(`needHelp=${value}`);
        session.learnedWord(pet.en);
        timers.current.push(setTimeout(() => dispatch({ type: 'answered' }), 760));
        return;
      }
      session.incorrect(`needHelp=${value}`);
      hints.miss({
        text: `${total} take away ${alreadySafe} is ${needHelp}. Count the ones still in the tree!`,
        es: `${total} menos ${alreadySafe} son ${needHelp}.`,
      });
    },
    [alreadySafe, hints, needHelp, pet.en, session, total],
  );

  const hugStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + hug.value * 0.12 }, { translateY: -hug.value * 6 }],
  }));

  const firstUnsaved = useMemo(() => {
    for (let i = 0; i < needHelp; i += 1) if (!state.saved.includes(i)) return i;
    return null;
  }, [needHelp, state.saved]);

  const ringAt = hints.level > 0 && firstUnsaved !== null ? perches[firstUnsaved] : undefined;

  return (
    <GameShell
      prompt={prompt}
      subtitle={subtitle}
      es={`¡Rescata los ${pet.pluralEs}!`}
      compact={compact}
      onStageLayout={onLayout}
      hint={hints.bubble}
      onDismissHint={hints.dismiss}
      backdrop={<Stage variant="park" groundHeight={140} />}
      footer={
        <View style={styles.counter}>
          <Chip label={`${safeCount} safe`} tone="green" />
          <Text variant="h3" color={palette.navy}>
            {toGo > 0 ? `${toGo} to go` : 'All safe!'}
          </Text>
        </View>
      }
      overlay={
        <>
        
        <AskQuestion
          visible={state.phase === 'asking'}
          question={askText}
          es={`¿Cuántos necesitan ayuda?`}
          options={askOptions}
          correct={askCorrect}
          ageBand={ageBand}
          countGlyph="drop"
          assist={hints.assist}
          compact={compact}
          onAnswer={onAnswer}
        />
        </>
      }
    >
      {ready ? (
        <View style={StyleSheet.absoluteFill}>
          {/* the park bank the whole scene stands on */}
          <PlayGround width={geo.w} height={geo.h} top={geo.groundY} variant="grass" seed={needHelp} />

          {/* dressing at the foot of the trunk: a fallen limb and two acorns —
              detail that belongs, and nothing a child has to touch */}
          <View style={[styles.litter, { left: Math.max(2, geo.tree.x + geo.tree.w * 0.06), top: geo.groundY - stage.s(16) }]} pointerEvents="none">
            <Svg width={stage.s(96)} height={stage.s(34)} viewBox="0 0 96 34">
              <Ellipse cx={46} cy={26} rx={38} ry={6} fill={palette.navy} opacity={0.1} />
              <Path d="M6 22 q 26 -10 62 -4 q 8 1 20 -3 q -12 8 -22 8 q -34 4 -60 3 z" fill={bark.mid} />
              <Path d="M8 21 q 24 -8 56 -3" stroke={bark.rim} strokeWidth={2.4} fill="none" strokeLinecap="round" />
              <G>
                <Path d="M66 12 q 8 -3 12 4 q -8 5 -12 -4 z" fill={leaf.mid} />
                <Path d="M78 10 q 7 -4 11 2 q -7 5 -11 -2 z" fill={leaf.lit} />
              </G>
              <Ellipse cx={22} cy={28} rx={5} ry={4.4} fill={bark.lit} />
              <Ellipse cx={22} cy={25} rx={5} ry={2.4} fill={bark.deep} />
              <Ellipse cx={33} cy={30} rx={4} ry={3.4} fill={bark.lit} />
            </Svg>
          </View>

          {/* the oak — the subject, sized to the play area it was given */}
          <View style={[styles.tree, { left: geo.tree.x, top: geo.tree.y }]} pointerEvents="none">
            <BigTree width={geo.tree.w} height={geo.tree.h} perches={needHelp} />
          </View>

          {/* Rookie with the basket, both standing on the ground line */}
          <Animated.View
            style={[styles.rookie, { left: geo.rookie.x, top: geo.rookie.y, width: geo.rookie.w }, hugStyle]}
            pointerEvents="none"
          >
            {/* critique #23 — a head in a basket is unsettling; use the full rig */}
            <Rookie
              size={geo.rookie.h}
              emotion={state.phase === 'done' ? 'proud' : 'happy'}
              pose={state.phase === 'done' ? 'cheer' : 'stand'}
              jumping={state.phase === 'done'}
            />
          </Animated.View>
          <View
            style={[styles.contact, { left: geo.basket.x - geo.basket.w * 0.08, top: geo.groundY - geo.basket.h * 0.06 }]}
            pointerEvents="none"
          >
            <ContactShadow width={geo.basket.w * 1.16} />
          </View>
          <Animated.View
            style={[styles.basket, { left: geo.basket.x, top: geo.basket.y, width: geo.basket.w, height: geo.basket.h }, hugStyle]}
            pointerEvents="none"
          >
            <RescueBasket width={geo.basket.w} height={geo.basket.h} full={safeCount > 0} />
            <View style={styles.basketPets}>
              {Array.from({ length: Math.min(safeCount, 5) }, (_, i) => (
                <Animated.View key={i} entering={ZoomIn.springify().damping(11)} style={styles.basketPet}>
                  <Animal id={challenge.animal} size={geo.petSize * 0.68} mood="safe" phase={i} />
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* stranded animals */}
          {perches.map((p, i) =>
            state.saved.includes(i) ? null : (
              <Stranded
                key={i}
                id={challenge.animal}
                size={geo.petSize}
                x={p.x}
                y={p.y}
                phase={i}
                basket={geo.basketCentre}
                enabled={state.phase === 'rescuing'}
                onRescue={() => rescue(i)}
                onPickUp={pickUp}
              />
            ),
          )}

          {ringAt ? <PulseRing x={ringAt.x + geo.petSize / 2} y={ringAt.y + geo.petSize / 2} size={geo.petSize * 1.5} /> : null}

          {state.phase === 'done' ? (
            <Animated.View entering={FadeIn} style={[styles.hearts, { left: geo.rookie.x, top: geo.rookie.y - stage.s(30) }]} pointerEvents="none">
              {/* rule #5 — drawn, never an emoji glyph */}
              <Svg width={stage.s(44)} height={stage.s(44)} viewBox="0 0 44 44">
                <Path
                  d="M22 39C10 30 4 24 4 16.5A9.5 9.5 0 0 1 22 12a9.5 9.5 0 0 1 18 4.5C40 24 34 30 22 39z"
                  fill={palette.safetyYellow}
                />
                <Path d="M13 15a6 6 0 0 1 7-3c-4 1-6 3-7 7z" fill="rgba(255,255,255,0.32)" />
              </Svg>
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  tree: { position: 'absolute' },
  litter: { position: 'absolute' },
  contact: { position: 'absolute' },
  rookie: { position: 'absolute', alignItems: 'center' },
  basket: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  basketPets: { position: 'absolute', top: -6, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  basketPet: { marginHorizontal: -6 },
  stranded: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  hearts: { position: 'absolute' },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    ...shadows.soft,
  },
});
