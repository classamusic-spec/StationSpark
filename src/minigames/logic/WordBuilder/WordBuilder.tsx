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
import { hit, palette, radii, shadows, spacing, springs, timings } from '@/theme';
import { useIdleBob } from '@/hooks';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { Button, Chip, SparkleBurst, SpeakerIcon, Text, TrayRow, VocabIcon } from '@/ui';
import { GameFrame } from '../shared/GameFrame';
import { SlotZone } from '../shared/SlotZone';
import { useGameLayout } from '../shared/layout';
import { useHintLadder } from '../shared/useHintLadder';
import { useDragToSlot, type DropOutcome } from '../shared/useDragToSlot';
import { BoardRules, ChalkLedge, LetterSlotGhost, LetterTile, PictureCard, ReadyRoomFloor, ReadyRoomWall } from './WordBoard';

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
  const other: 'en' | 'es' = lang === 'en' ? 'es' : 'en';
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

  useEffect(() => {
    session.say('beacon', `Can you spell ${word[lang]}?`, word[other]);
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

  /* ----- geometry ----- */
  const boardWidth = Math.min(layout.boxWidth - spacing.md * 2, layout.s(322));
  const inner = boardWidth - spacing.md * 2 - 20;
  const perRow = letters.length <= 5 ? letters.length : Math.ceil(letters.length / 2);
  const slotSize = Math.max(30, Math.min(layout.s(54), (inner - (perRow - 1) * 8) / perRow));
  /** pin the row width so a long word always wraps into two tidy lines */
  const rowWidth = perRow * (slotSize + 8) - 8;
  const tileSize = Math.max(hit.min, layout.s(tiles.length > 6 ? 56 : tiles.length > 4 ? 58 : 64));
  const iconSize = layout.s(ageBand === 'A' ? 88 : 76);

  /* ----- copy ----- */
  const hintText = useMemo(() => {
    if (!expected) return 'That is the whole word — well done!';
    return `The next letter is “${expected}”. Find the ${expected} tile and drop it in the glowing space.`;
  }, [expected]);

  const solved = state.phase !== 'spelling';

  return (
    <GameFrame
      title={lang === 'es' ? `Escribe: ${word.es}` : `Spell the ${word.en}`}
      subtitle={ageBand === 'A' ? 'Tap or drag the letters.' : 'Listen, then build the word letter by letter.'}
      es={lang === 'es' ? 'Escucha y escribe la palabra.' : `En español: ${word.es}`}
      compact={compact}
      hint={{ text: hintText, visible: hintLadder.showBubble && !solved, onDismiss: hintLadder.dismiss }}
      tray={
        <View style={styles.trayInner}>
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
          <View style={styles.actions}>
            <Chip label={`${state.filled} / ${letters.length} letters`} tone="cream" />
            <Button
              label={lang === 'es' ? 'Escuchar' : 'Hear it'}
              tone="blue"
              size="md"
              sound="none"
              icon={<SpeakerIcon size={20} color={palette.white} />}
              onPress={sayWord}
            />
          </View>
        </View>
      }
    >
      <View style={styles.stage}>
        {/* ---- the ready room the board hangs in ---- */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.wall}>
            <ReadyRoomWall width={layout.boxWidth} />
          </View>
          <View style={styles.floor}>
            <ReadyRoomFloor width={layout.boxWidth} />
          </View>
        </View>

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

          <Animated.View style={[styles.slots, { width: rowWidth }, solved && glowStyle]}>
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
        <View style={{ width: boardWidth, height: Math.round(boardWidth * 0.075) }}>
          <ChalkLedge width={boardWidth} />
        </View>
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.sm },
  wall: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '5%',
    bottom: '12%',
    overflow: 'hidden',
    backgroundColor: '#D9EEF7',
    borderTopLeftRadius: radii.panel,
    borderTopRightRadius: radii.panel,
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '13%',
    overflow: 'hidden',
    backgroundColor: palette.tan,
    justifyContent: 'flex-start',
  },
  board: {
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.panel,
    borderRadius: radii.panel,
    borderWidth: 10,
    borderColor: palette.wood,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  support: { alignItems: 'center' },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
  },
  banner: {
    backgroundColor: palette.mint,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  trayInner: { gap: spacing.sm },
  tileRow: { rowGap: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  tileWrap: { borderRadius: radii.tile },
  dragging: { zIndex: 60, elevation: 14 },
});
