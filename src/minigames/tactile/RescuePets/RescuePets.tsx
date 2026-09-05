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
import { CharacterPortrait } from '@/characters/CharacterPortrait';
import { Animal, RescueBasket, RescueTree, animalName, sceneTheme } from '@/world/props';
import { AskQuestion, GameShell, PulseRing, optionsFor, useHintLadder, useMeasuredBox, useSpokenPrompt, useStage } from '../shared';

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
  useSpokenPrompt(state.phase === 'asking' ? null : `Rescue the ${pet.plural}`, { speaker: 'beacon' });

  /* ---- geometry ---- */
  const geo = useMemo(() => {
    const w = Math.max(1, box.w);
    const h = Math.max(1, box.h);
    const treeW = Math.min(w * 0.72, stage.s(250));
    const treeH = Math.min(h * 0.78, treeW * 1.08);
    const treeX = w * 0.04;
    const treeY = h * 0.02;
    const petSize = Math.max(46, Math.min(stage.s(60), treeW * 0.26));
    const basketW = Math.max(96, Math.min(stage.s(132), w * 0.36));
    const basketH = basketW * 0.75;
    const basketX = w - basketW - stage.s(8);
    const basketY = h - basketH - stage.s(24);
    const rookieSize = Math.max(64, Math.min(stage.s(96), w * 0.28));
    return {
      w,
      h,
      tree: { x: treeX, y: treeY, w: treeW, h: treeH },
      petSize,
      basket: { x: basketX, y: basketY, w: basketW, h: basketH },
      basketCentre: { x: basketX + basketW / 2, y: basketY + basketH / 2, r: Math.max(90, basketW * 0.85) },
      rookie: { x: basketX + basketW * 0.5 - rookieSize * 0.5, y: basketY - rookieSize * 0.72, size: rookieSize },
    };
  }, [box.h, box.w, stage]);

  /** where each stranded animal perches, spread across the tree canopy */
  const perches = useMemo(() => {
    const spots = [
      { fx: 0.44, fy: 0.1 },
      { fx: 0.16, fy: 0.3 },
      { fx: 0.72, fy: 0.28 },
      { fx: 0.34, fy: 0.48 },
      { fx: 0.62, fy: 0.55 },
      { fx: 0.1, fy: 0.58 },
      { fx: 0.84, fy: 0.46 },
      { fx: 0.48, fy: 0.68 },
    ];
    return Array.from({ length: needHelp }, (_, i) => {
      const s = spots[i % spots.length] ?? { fx: 0.4, fy: 0.4 };
      return {
        x: geo.tree.x + s.fx * (geo.tree.w - geo.petSize),
        y: geo.tree.y + s.fy * (geo.tree.h - geo.petSize),
      };
    });
  }, [geo.petSize, geo.tree.h, geo.tree.w, geo.tree.x, geo.tree.y, needHelp]);

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
        session.say('pepper', 'Woof!');
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
      speech.say(nextToGo > 0 ? `${nextSafe} safe. ${nextToGo} to go.` : `${nextSafe} safe!`, { speaker: 'beacon' });
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
      footer={
        <View style={styles.counter}>
          <Chip label={`${safeCount} safe`} tone="green" />
          <Text variant="h3" color={palette.navy}>
            {toGo > 0 ? `${toGo} to go` : 'All safe!'}
          </Text>
        </View>
      }
      overlay={
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
      }
    >
      {ready ? (
        <View style={StyleSheet.absoluteFill}>
          <View style={[styles.tree, { left: geo.tree.x, top: geo.tree.y }]} pointerEvents="none">
            <RescueTree width={geo.tree.w} height={geo.tree.h} />
          </View>

          {/* grass */}
          <View style={[styles.grass, { top: geo.h - stage.s(26) }]} pointerEvents="none" />

          {/* Rookie with the basket */}
          <Animated.View
            style={[styles.rookie, { left: geo.rookie.x, top: geo.rookie.y, width: geo.rookie.size }, hugStyle]}
            pointerEvents="none"
          >
            <CharacterPortrait id="rookie" emotion={state.phase === 'done' ? 'proud' : 'happy'} size={geo.rookie.size} />
          </Animated.View>
          <Animated.View
            style={[styles.basket, { left: geo.basket.x, top: geo.basket.y, width: geo.basket.w, height: geo.basket.h }, hugStyle]}
            pointerEvents="none"
          >
            <RescueBasket width={geo.basket.w} height={geo.basket.h} full={safeCount > 0} />
            <View style={styles.basketPets}>
              {Array.from({ length: Math.min(safeCount, 5) }, (_, i) => (
                <Animated.View key={i} entering={ZoomIn.springify().damping(11)} style={styles.basketPet}>
                  <Animal id={challenge.animal} size={geo.petSize * 0.72} mood="safe" phase={i} />
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
              <Text variant="h1">💛</Text>
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  tree: { position: 'absolute' },
  grass: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: palette.grass, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
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
