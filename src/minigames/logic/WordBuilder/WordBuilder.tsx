import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  ZoomIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { activity, hit, palette, radii, roles, shadows, spacing, springs, timings } from '@/theme';
import { useIdleBob } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { Chip, SparkleBurst, Text, TrayRow, VocabIcon, useSideRail } from '@/ui';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useHintLadder } from '../shared/useHintLadder';
import { useDragToSlot, type DropOutcome } from '../shared/useDragToSlot';
import { BoardRules, LetterSlotGhost, LetterTile, PictureCard } from './WordBoard';
import { Classroom, RoomWash, classroomMetrics, clamp, usePlayBox } from '../shared/art/Scene';

/* ---------------- state machine ---------------- */

interface State {
  phase: 'spelling' | 'solved' | 'done';
  /** how many slots are filled, always left to right */
  filled: number;
  /** tray tile indices already used up */
  used: number[];
  misses: number;
  /** tile that just wobbled, so it can flash */
  wrong: number | null;
}

type Action =
  | { type: 'PLACE'; tile: number }
  | { type: 'MISS'; tile: number }
  | { type: 'CLEAR_WRONG' }
  | { type: 'SOLVE' }
  | { type: 'FINISH' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PLACE':
      return { ...state, filled: state.filled + 1, used: [...state.used, action.tile], wrong: null };
    case 'MISS':
      return { ...state, misses: state.misses + 1, wrong: action.tile };
    case 'CLEAR_WRONG':
      return { ...state, wrong: null };
    case 'SOLVE':
      return { ...state, phase: 'solved' };
    case 'FINISH':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

/* ---------------- a letter you can drag or tap ---------------- */

interface TileProps {
  letter: string;
  size: number;
  index: number;
  used: boolean;
  wrong: boolean;
  highlight: boolean;
  disabled: boolean;
  onDropTile: (slotId: string | null) => DropOutcome;
  onTap: () => void;
}

function TileToken({ letter, size, index, used, wrong, highlight, disabled, onDropTile, onTap }: TileProps) {
  const { gesture, animatedStyle, dragging, nodeRef } = useDragToSlot({
    disabled: used || disabled,
    snapRadius: 56,
    onDrop: onDropTile,
  });
  const shake = useSharedValue(0);

  useEffect(() => {
    if (!wrong) return;
    shake.value = withSequence(
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(-4, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }, [shake, wrong]);

  const composed = useMemo(
    () =>
      Gesture.Race(
        gesture,
        Gesture.Tap()
          .enabled(!used && !disabled)
          .maxDistance(14)
          .onEnd((_e, ok) => {
            if (ok) runOnJS(onTap)();
          }),
      ),
    [disabled, gesture, onTap, used],
  );

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        ref={nodeRef}
        collapsable={false}
        accessible={!used}
        accessibilityRole="button"
        accessibilityLabel={used ? `letter ${letter}, already used` : `letter ${letter}`}
        style={[styles.tileWrap, highlight && shadows.glowGold, dragging && styles.dragging, animatedStyle]}
      >
        {/* the entering animation and the wobble transform need separate nodes */}
        <Animated.View
          entering={ZoomIn.delay(index * 55)
            .springify()
            .damping(14)}
        >
          <Animated.View style={shakeStyle}>
            <LetterTile letter={letter} size={size} tone={highlight ? 'gold' : 'cream'} dim={used} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/* ---------------- game ---------------- */

export function WordBuilder({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'word-builder'>) {
  const session = useMiniGameSession('word-builder', onComplete, onEvent);
  const layout = useGameLayout({ compact });
  const { word, lang, letters, tiles, prefilled } = challenge;
  const finished = useRef(false);

  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    phase: 'spelling' as const,
    filled: prefilled,
    used: [],
    misses: 0,
    wrong: null,
  }));

  const hintLadder = useHintLadder(state.misses, session.hint);
  const expected = letters[state.filled] ?? '';

  const sparkPlay = useRef(0);
  const bob = useIdleBob(2.5, 2800);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const glow = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + glow.value * 0.75,
    transform: [{ scale: 1 + glow.value * 0.04 }],
  }));

  const sayWord = useCallback(() => {
    sfx.play('robot-beep');
    speech.sayWord({ en: word.en, es: word.es }, lang);
  }, [lang, word.en, word.es]);

  /*
   * The prompt is SPOKEN and printed once in the task bar. It used to also be
   * raised as a `say` event, which drew a card over the answer slots repeating
   * "Can you spell frog?" — the same instruction for a third time.
   */
  useEffect(() => {
    const t = setTimeout(sayWord, 380);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    session.progress(state.filled, letters.length);
  }, [letters.length, session, state.filled]);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    dispatch({ type: 'FINISH' });
    session.complete();
  }, [session]);

  const solve = useCallback(() => {
    dispatch({ type: 'SOLVE' });
    session.learnedWord(word.en);
    session.learnedWord(word.es);
    sparkPlay.current += 1;
    sfx.play('correct');
    haptics.celebrate();
    glow.value = withSequence(withTiming(1, timings.base), withSpring(0.45, springs.gentle));
    setTimeout(() => speech.sayWord({ en: word.en, es: word.es }, lang), 380);
    setTimeout(finish, 2200);
  }, [finish, glow, lang, session, word.en, word.es]);

  const place = useCallback(
    (tileIndex: number) => {
      dispatch({ type: 'PLACE', tile: tileIndex });
      session.correct(letters[state.filled] ?? '');
      sfx.play('pop');
      haptics.success();
      if (state.filled + 1 >= letters.length) setTimeout(solve, 220);
    },
    [letters, session, solve, state.filled],
  );

  const miss = useCallback(
    (tileIndex: number) => {
      dispatch({ type: 'MISS', tile: tileIndex });
      session.incorrect(tiles[tileIndex] ?? '');
      setTimeout(() => dispatch({ type: 'CLEAR_WRONG' }), 520);
    },
    [session, tiles],
  );

  const onDropTile = useCallback(
    (tileIndex: number, slotId: string | null): DropOutcome => {
      if (state.phase !== 'spelling' || !slotId) return { accept: false, silent: true };
      if (tiles[tileIndex] === expected) {
        return { accept: true, snapToSlotId: `slot#${state.filled}`, onSettled: () => place(tileIndex) };
      }
      return { accept: false, onSettled: () => miss(tileIndex) };
    },
    [expected, miss, place, state.filled, state.phase, tiles],
  );

  const tapTile = useCallback(
    (tileIndex: number) => {
      if (state.phase !== 'spelling') return;
      sfx.play('tap-soft');
      if (tiles[tileIndex] === expected) place(tileIndex);
      else {
        sfx.play('wrong-soft');
        haptics.nudge();
        miss(tileIndex);
      }
    },
    [expected, miss, place, state.phase, tiles],
  );

  /* ----- geometry: the word board hangs on the reading corner's board ----- */
  const sideRail = useSideRail();
  const { box, onLayout } = usePlayBox();
  const room = classroomMetrics(box);
  const playWidth = box.w > 0
    ? box.w
    : sideRail
      ? Math.min(layout.width - activity.sidePanelWidth - spacing.sm * 3, 820)
      : layout.boxWidth;
  const boardWidth = box.w > 0 ? clamp(room.boardW - 22, 210, 640) : Math.min(playWidth - spacing.sm * 2, layout.s(360));
  const inner = boardWidth - spacing.md * 2 - 20;
  const perRow = letters.length <= 5 ? letters.length : Math.ceil(letters.length / 2);
  const slotGap = 10;
  const slotSize = Math.max(34, Math.min(sideRail ? 88 : 74, (inner - (perRow - 1) * slotGap) / perRow));
  /** pin the row width so a long word always wraps into two tidy lines */
  const rowWidth = perRow * (slotSize + slotGap) - slotGap;
  const tileSize = Math.max(hit.min, layout.s(tiles.length > 6 ? 58 : tiles.length > 4 ? 62 : 66));
  const iconSize = box.w > 0 ? clamp(boardWidth * 0.24, 56, ageBand === 'A' ? 108 : 96) : layout.s(72);

  /* ----- copy ----- */
  const hintText = useMemo(() => {
    if (!expected) return 'That is the whole word — well done!';
    return `The next letter is “${expected}”. Find the ${expected} tile and drop it in the glowing space.`;
  }, [expected]);

  const solved = state.phase !== 'spelling';

  /* the hint points at "the glowing space" — so the board moves up while the
     bubble is on screen instead of letting it sit on the answer slots */
  const hintLane = hintLadder.showBubble && !solved ? clamp(box.h * 0.18, 80, 130) : 0;

  return (
    <GameFrame
      title={lang === 'es' ? `Escribe: ${word.es}` : `Spell the ${word.en}`}
      subtitle="Tap or drag the letters."
      es={lang === 'es' ? 'Escucha y escribe la palabra.' : `En español: ${word.es}`}
      compact={compact}
      backdrop={<RoomWash top="#F6EEDC" bottom="#C7B181" />}
      /* one hear-it-again, in the task bar — the tray's own "Hear it" button is gone */
      onReplay={sayWord}
      /* …and the "0 / 4 letters" chip is gone too: the bar draws the dots */
      progress={{ done: state.filled, total: letters.length }}
      hint={{ text: hintText, visible: hintLadder.showBubble && !solved, onDismiss: hintLadder.dismiss }}
      tray={
        <TrayRow style={styles.tileRow}>
          {tiles.map((letter, i) => (
            <TileToken
              key={`${letter}-${i}`}
              letter={letter}
              index={i}
              size={tileSize}
              used={state.used.includes(i)}
              wrong={state.wrong === i}
              highlight={hintLadder.highlight && !state.used.includes(i) && letter === expected}
              disabled={solved}
              onDropTile={(slotId) => onDropTile(i, slotId)}
              onTap={() => tapTile(i)}
            />
          ))}
        </TrayRow>
      }
    >
      <View style={styles.stage} onLayout={onLayout}>
        {/* ---- the station's reading corner the board hangs in ---- */}
        <Classroom box={box} />

        <View
          style={[
            styles.deck,
            box.w > 0
              ? { left: room.boardX, top: room.boardY, width: room.boardW, height: room.boardH, bottom: undefined }
              : { left: 0, right: 0, top: 0, bottom: 0 },
            { paddingBottom: hintLane },
          ]}
        >
        <View style={[styles.board, { width: boardWidth }]}>
          <BoardRules />
          <Animated.View style={cardStyle}>
            <PictureCard size={iconSize}>
              <VocabIcon id={word.icon} size={iconSize} />
            </PictureCard>
          </Animated.View>

          {lang === 'es' ? (
            <View style={styles.support}>
              <Chip label={`in English: ${word.en}`} tone="purple" />
            </View>
          ) : null}

          <Animated.View style={[styles.slots, { width: rowWidth, gap: slotGap }, solved && glowStyle]}>
            {letters.map((letter, i) => {
              const isFilled = i < state.filled;
              return (
                <SlotZone
                  key={i}
                  id={`slot#${i}`}
                  enabled={!isFilled && !solved}
                  highlight={(hintLadder.highlight || solved) && i === state.filled}
                  hitPad={layout.s(10)}
                  style={{ width: slotSize, height: slotSize }}
                >
                  {isFilled ? (
                    <Animated.View entering={ZoomIn.springify().damping(11)}>
                      <LetterTile letter={letter} size={slotSize} tone={solved ? 'gold' : 'cream'} />
                    </Animated.View>
                  ) : (
                    <LetterSlotGhost size={slotSize} />
                  )}
                </SlotZone>
              );
            })}
            {solved ? (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <SparkleBurst play={sparkPlay.current} radius={layout.s(70)} count={12} />
              </View>
            ) : null}
          </Animated.View>

          {solved ? (
            <Animated.View entering={FadeIn} style={styles.banner}>
              <Text variant="h3" color={palette.leafGreenDark} center>
                {word.en} = {word.es}
              </Text>
            </Animated.View>
          ) : null}
        </View>
        </View>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  /* the board sits just above the letter bank: a short drag, and the word and
     the letters read as one thing */
  stage: { flex: 1, alignSelf: 'stretch' },
  deck: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  board: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.panel,
    borderRadius: radii.panel,
    borderWidth: 10,
    borderColor: palette.wood,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  support: { alignItems: 'center' },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  banner: {
    backgroundColor: roles.state.successFill,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  /* the letter bank needs air: a tile is a target as well as a token */
  tileRow: { rowGap: spacing.sm, columnGap: spacing.sm, paddingVertical: 2 },
  tileWrap: { borderRadius: radii.tile },
  dragging: { zIndex: 60, elevation: 14 },
});
