import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { VocabWord } from '@/learning/types';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { PromptBanner } from '@/ui/kit/PromptBanner';
import { GrownUpChip } from '@/ui/kit/Chip';
import { HintBubble } from '@/ui/kit/HintBubble';
import { Tray } from '@/ui/kit/Tray';
import { VocabIcon } from '@/ui/kit/VocabIcon';
import { RoundIconButton } from '@/ui/RoundIconButton';
import { SpeakerIcon } from '@/ui/icons';

import { Stage as SceneStage } from '@/world';
import { SceneCrew } from '@/world/scenes';
import { Stage, at } from '../../parts/Stage';
import { RecipeCardFrame } from '../../parts/RecipeCardFrame';
import { CookCTA } from '../../parts/SceneBits';
import { countPhraseEn, countPhraseEs, needsPhraseEn, needsPhraseEs, pluralEs } from '../../spanish';
import { checkCounts, pantryList } from '../../shareMath';
import { kitchenFeel, nearestTarget, useCaptainHint, useDragSource } from '../useKitchenGame';

const D = { w: 390, h: 400 };
const BLENDER = { x: 195, y: 116 };
const SHELF_Y = 236;
const ITEM = 50;
const PER_ROW = 7;

interface PantryItem {
  uid: string;
  word: VocabWord;
  x: number;
  y: number;
}

export function CountIngredients({ challenge, onComplete, onEvent, compact }: MiniGameProps<'count-ingredients'>) {
  const session = useMiniGameSession('count-ingredients', onComplete, onEvent);
  const assist = useCaptainHint(session);

  /**
   * The shelf.
   *
   * NEVER DEAD-END: every ingredient the list asks for has to be reachable.
   * This used to push `count + 2` of each need, then the decoys, and finally
   * slice the whole thing down to two rows — so a three-item list lost its last
   * ingredient completely. Gino's quesadillas asked for two peppers and put
   * none on the shelf, and "Show me" had nothing to hand over either: the
   * recipe could not be finished at all. Lay the required items out first and
   * spend whatever room is left on spares and decoys.
   */
  const pantry = useMemo<PantryItem[]>(() => {
    // one spare of each ingredient (so over-counting is possible), then the decoys
    const spare: VocabWord[] = [...challenge.needs.map((n) => n.item), ...challenge.extras];
    const list = pantryList(challenge.needs, spare, PER_ROW * 2);
    // interleave so the needed items are not all clumped on the left
    const shuffled = list.map((w, i) => ({ w, k: (i * 7) % list.length })).sort((a, b) => a.k - b.k).map((e) => e.w);
    // a long list packs tighter rather than spilling off the shelf
    const perRow = Math.max(PER_ROW, Math.ceil(shuffled.length / 2));
    const stepX = perRow <= PER_ROW ? ITEM + 4 : Math.max(28, (D.w - 12) / perRow);
    return shuffled.map((word, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const inRow = Math.min(perRow, shuffled.length - row * perRow);
      const startX = (D.w - inRow * stepX) / 2;
      return { uid: `${word.id}-${i}`, word, x: startX + col * stepX, y: SHELF_Y + 18 + row * (ITEM + 24) };
    });
  }, [challenge.extras, challenge.needs]);

  const [taken, setTaken] = useState<string[]>([]);
  const [bowl, setBowl] = useState<Record<string, number>>({});
  const [blended, setBlended] = useState(false);
  const shake = useSharedValue(0);
  const spoken = useRef(false);

  const needsForCheck = useMemo(() => challenge.needs.map((n) => ({ id: n.item.id, count: n.count })), [challenge.needs]);
  const spanishFirst = challenge.spokenEs !== false;

  const readList = useCallback(() => {
    sfx.play('robot-beep');
    haptics.select();
    if (spanishFirst) {
      speech.say(needsPhraseEs(challenge.needs), { speaker: 'bea', lang: 'es' });
      setTimeout(() => speech.say(needsPhraseEn(challenge.needs), { speaker: 'bea' }), 1900);
    } else {
      speech.say(needsPhraseEn(challenge.needs), { speaker: 'bea' });
    }
  }, [challenge.needs, spanishFirst]);

  useEffect(() => {
    if (spoken.current) return;
    spoken.current = true;
    const t = setTimeout(readList, 420);
    return () => {
      clearTimeout(t);
      speech.stop();
    };
  }, [readList]);

  const addToBowl = useCallback(
    (item: PantryItem) => {
      setTaken((t) => (t.includes(item.uid) ? t : [...t, item.uid]));
      setBowl((b) => ({ ...b, [item.word.id]: (b[item.word.id] ?? 0) + 1 }));
      kitchenFeel.drop();
      session.learnedWord(item.word.es);
    },
    [session],
  );

  const returnItem = useCallback((uid: string, wordId: string) => {
    setTaken((t) => t.filter((x) => x !== uid));
    setBowl((b) => {
      const next = { ...b };
      const n = (next[wordId] ?? 1) - 1;
      if (n <= 0) delete next[wordId];
      else next[wordId] = n;
      return next;
    });
  }, []);

  /** hop the wrong ones back out onto the shelf */
  const popBackWrong = useCallback(
    (ids: string[]) => {
      const byId = new Map<string, string[]>();
      for (const uid of taken) {
        const wordId = uid.replace(/-\d+$/, '');
        byId.set(wordId, [...(byId.get(wordId) ?? []), uid]);
      }
      let removed = 0;
      for (const id of ids) {
        const list = byId.get(id) ?? [];
        const need = challenge.needs.find((n) => n.item.id === id)?.count ?? 0;
        const excess = Math.max(0, list.length - need);
        for (let i = 0; i < excess; i += 1) {
          const uid = list[list.length - 1 - i];
          if (uid) {
            returnItem(uid, id);
            removed += 1;
          }
        }
      }
      if (removed > 0) {
        sfx.play('pop');
        haptics.nudge();
      }
    },
    [challenge.needs, returnItem, taken],
  );

  const finish = useCallback(() => {
    setBlended(true);
    sfx.play('sizzle');
    haptics.celebrate();
    shake.value = withRepeat(
      withSequence(withTiming(-3, { duration: 60 }), withTiming(3, { duration: 60 })),
      8,
      true,
    );
    setTimeout(() => {
      sfx.play('sparkle');
      session.complete();
    }, 1500);
  }, [session, shake]);

  const check = useCallback(() => {
    if (blended) return;
    const result = checkCounts(needsForCheck, bowl);
    if (result.done) {
      kitchenFeel.good();
      session.correct('counts');
      assist.cheer('¡Perfecto! Blender time!');
      setTimeout(finish, 520);
      return;
    }
    if (result.extras.length > 0) {
      const id = result.extras[0] ?? '';
      const word = challenge.extras.find((e) => e.id === id);
      assist.nudge(`${word ? word.en : 'That one'} is not in this recipe — pop it back.`, word?.es);
      popBackWrong(result.extras);
      return;
    }
    if (result.over.length > 0) {
      const id = result.over[0] ?? '';
      const need = challenge.needs.find((n) => n.item.id === id);
      if (need) assist.nudge(`That's too many — we need ${countPhraseEn(need.count, need.item)}.`, countPhraseEs(need.count, need.item));
      popBackWrong(result.over);
      return;
    }
    const id = result.under[0] ?? '';
    const need = challenge.needs.find((n) => n.item.id === id);
    if (need) {
      const have = bowl[id] ?? 0;
      assist.nudge(
        `We still need ${need.count - have} more ${pluralEs(need.item.en)}.`,
        countPhraseEs(need.count, need.item),
      );
    }
  }, [assist, blended, bowl, challenge.extras, challenge.needs, finish, needsForCheck, popBackWrong, session]);

  const showMe = useCallback(() => {
    assist.askedForHelp();
    const result = checkCounts(needsForCheck, bowl);
    if (result.extras.length > 0) {
      popBackWrong(result.extras);
      return;
    }
    if (result.over.length > 0) {
      popBackWrong(result.over);
      return;
    }
    const id = result.under[0];
    if (!id) return;
    const item = pantry.find((p) => p.word.id === id && !taken.includes(p.uid));
    if (item) addToBowl(item);
  }, [addToBowl, assist, bowl, needsForCheck, pantry, popBackWrong, taken]);

  const blenderStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const inBowl = Object.entries(bowl).filter(([, n]) => n > 0);

  return (
    <View style={styles.root}>
      {/* a pantry, not a sky: shelves, jars, sacks and crates behind the play */}
      <SceneStage variant="pantry" groundHeight={160} />
      <SceneCrew side="right" size={50} npc="rosa" mood={blended ? 'cheer' : Object.keys(bowl).length > 0 ? 'happy' : 'idle'} />
      <PromptBanner title="Fill the blender!" subtitle="Drag what the recipe asks for — no more, no less." compact={compact} />

      <View style={styles.listWrap}>
        <RecipeCardFrame title="Shopping list" titleEs="Lista" compact badge={<GrownUpChip />}>
          <View style={styles.listRow}>
            <View style={styles.listItems}>
              {challenge.needs.map((n) => (
                <View key={n.item.id} style={styles.listItem}>
                  <VocabIcon id={n.item.id} size={30} />
                  <Text variant="bodyStrong" color={palette.navy}>
                    {countPhraseEn(n.count, n.item)}
                  </Text>
                  <Text variant="small" color={palette.purple}>
                    {countPhraseEs(n.count, n.item)}
                  </Text>
                </View>
              ))}
            </View>
            <RoundIconButton accessibilityLabel="Read the list again" onPress={readList} size={48}>
              <SpeakerIcon size={24} />
            </RoundIconButton>
          </View>
        </RecipeCardFrame>
      </View>

      <Stage design={D} style={styles.stage}>
        {(s) => (
          <>
            {/* counter chips */}
            <View style={[at(s, 8, 8, 130), styles.chipCol]} pointerEvents="none">
              {inBowl.map(([id, n]) => (
                <Animated.View key={id} entering={ZoomIn.springify().damping(13)} style={[styles.countChip, shadows.soft]}>
                  <VocabIcon id={id} size={26 * s} />
                  <Text variant="bodyStrong" color={palette.navy} style={{ fontSize: 18 * s, lineHeight: 22 * s }}>
                    ×{n}
                  </Text>
                </Animated.View>
              ))}
            </View>

            {/* blender */}
            <Animated.View style={[at(s, BLENDER.x - 66, BLENDER.y - 84, 132, 176), blenderStyle]} pointerEvents="none">
              <BlenderArt size={132 * s} fill={Object.keys(bowl).length > 0} blended={blended} />
            </Animated.View>

            {/* shelf */}
            <View style={at(s, 10, SHELF_Y, D.w - 20, 12)} pointerEvents="none">
              <View style={[styles.shelf, { height: 12 * s, borderRadius: 6 * s }]}>
                <View style={[styles.shelfLip, { height: 4 * s, borderRadius: 2 * s }]} />
                <View style={[styles.bracket, { left: 24 * s, borderTopWidth: 14 * s, borderRightWidth: 12 * s }]} />
                <View style={[styles.bracket, styles.bracketRight, { right: 24 * s, borderTopWidth: 14 * s, borderLeftWidth: 12 * s }]} />
              </View>
            </View>
            <View style={at(s, 10, SHELF_Y + ITEM + 20, D.w - 20, 12)} pointerEvents="none">
              <View style={[styles.shelf, { height: 12 * s, borderRadius: 6 * s }]}>
                <View style={[styles.shelfLip, { height: 4 * s, borderRadius: 2 * s }]} />
                <View style={[styles.bracket, { left: 24 * s, borderTopWidth: 14 * s, borderRightWidth: 12 * s }]} />
                <View style={[styles.bracket, styles.bracketRight, { right: 24 * s, borderTopWidth: 14 * s, borderLeftWidth: 12 * s }]} />
              </View>
            </View>

            {pantry.map((item) =>
              taken.includes(item.uid) ? null : (
                <PantryToken
                  key={item.uid}
                  s={s}
                  item={item}
                  disabled={blended}
                  onDrop={(dx, dy) => {
                    const p = { x: item.x + ITEM / 2 + dx, y: item.y + ITEM / 2 + dy };
                    const hit = nearestTarget(p, [BLENDER], 96);
                    if (hit < 0) {
                      assist.cheer('Drop it into the blender!');
                      return;
                    }
                    addToBowl(item);
                  }}
                  onTap={() => addToBowl(item)}
                />
              ),
            )}

            {blended ? (
              <Animated.View entering={ZoomIn.springify().damping(11)} style={at(s, BLENDER.x - 40, 250, 80, 110)} pointerEvents="none">
                <SmoothieArt size={80 * s} />
              </Animated.View>
            ) : null}
          </>
        )}
      </Stage>

      <Tray tone="cream">
        <View style={styles.trayRow}>
          {assist.offerHelp && !blended ? <Button label="Show me" tone="yellow" size="sm" onPress={showMe} sound="tap-soft" /> : null}
          {taken.length > 0 && !blended ? (
            <Text variant="small" color={palette.navySoft}>
              {taken.length} in the blender
            </Text>
          ) : null}
        </View>
        <CookCTA label={blended ? 'Delicious!' : 'Blend it!'} tone={blended ? 'green' : 'red'} onPress={check} disabled={blended} />
      </Tray>

      <HintBubble text={assist.text} es={assist.es} visible={assist.visible} onDismiss={assist.dismiss} />
    </View>
  );
}

function PantryToken({
  s,
  item,
  disabled,
  onDrop,
  onTap,
}: {
  s: number;
  item: PantryItem;
  disabled?: boolean;
  onDrop: (dx: number, dy: number) => void;
  onTap: () => void;
}) {
  const drag = useDragSource({
    scale: s,
    enabled: !disabled,
    onPickUp: () => kitchenFeel.pick(item.word),
    onTap,
    onDrop,
  });
  // Outer node owns the entrance (layout) animation, inner node owns the drag
  // transform — Reanimated warns and can drop one of them if they share a node.
  return (
    <Animated.View entering={FadeInDown.springify().damping(15)} style={at(s, item.x, item.y, ITEM, ITEM)}>
      <GestureDetector gesture={drag.gesture}>
        <Animated.View
          style={[styles.fill, drag.style]}
          accessibilityRole="button"
          accessibilityLabel={`${item.word.en} — ${item.word.es}`}
        >
          <Pressable style={[styles.token, { borderRadius: 14 * s, borderWidth: 3 * s }]} onPress={onTap}>
            <VocabIcon id={item.word.id} size={ITEM * 0.72 * s} />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

function BlenderArt({ size, fill, blended }: { size: number; fill: boolean; blended: boolean }) {
  return (
    <Svg width={size} height={size * 1.33} viewBox="0 0 132 176">
      <Defs>
        <LinearGradient id="jar" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="rgba(255,255,255,0.9)" />
          <Stop offset="0.55" stopColor="rgba(255,255,255,0.45)" />
          <Stop offset="1" stopColor="rgba(255,255,255,0.8)" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={66} cy={168} rx={46} ry={7} fill="rgba(31,42,90,0.12)" />
      <Rect x={26} y={126} width={80} height={42} rx={14} fill={palette.charcoal} />
      <Rect x={34} y={134} width={30} height={12} rx={6} fill={palette.slate} />
      <Circle cx={92} cy={140} r={7} fill={palette.engineRed} />
      <Path d="M30 24h72l-8 100H38z" fill="url(#jar)" />
      <Path d="M30 24h72l-8 100H38z" fill="none" stroke={palette.white} strokeWidth={5} />
      {fill ? <Path d="M41 78h50l-4 44H45z" fill={blended ? '#F2A0C0' : 'rgba(255,214,163,0.75)'} /> : null}
      <Rect x={24} y={14} width={84} height={16} rx={8} fill={palette.white} />
      <Rect x={52} y={2} width={28} height={14} rx={7} fill={palette.slateLight} />
    </Svg>
  );
}

function SmoothieArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.38} viewBox="0 0 80 110">
      <Ellipse cx={40} cy={104} rx={26} ry={5} fill="rgba(31,42,90,0.12)" />
      <Path d="M18 22h44l-6 78H24z" fill="rgba(255,255,255,0.6)" />
      <Path d="M22 42h36l-5 56H27z" fill="#F58BB2" />
      <Path d="M18 22h44l-6 78H24z" fill="none" stroke={palette.white} strokeWidth={4} />
      <Rect x={46} y={2} width={8} height={40} rx={4} fill={palette.engineRed} transform="rotate(14 50 22)" />
      <Circle cx={30} cy={54} r={4} fill="#FFD1E2" />
      <Circle cx={48} cy={68} r={3} fill="#FFD1E2" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stage: { flex: 1 },
  listWrap: { paddingHorizontal: spacing.md, marginTop: spacing.xs },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  listItems: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipCol: { gap: 6 },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  fill: { flex: 1 },
  shelf: { backgroundColor: palette.wood, width: '100%' },
  shelfLip: { position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: 'rgba(255,255,255,0.32)' },
  bracket: {
    position: 'absolute',
    top: '100%',
    width: 0,
    height: 0,
    borderTopColor: palette.woodDark,
    borderRightColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  bracketRight: {},
  token: {
    flex: 1,
    backgroundColor: palette.white,
    borderColor: palette.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  trayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xs, minHeight: 4 },
});
