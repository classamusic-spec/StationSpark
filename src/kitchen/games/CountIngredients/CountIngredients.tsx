import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { palette, radii, roles, shadows, spacing } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useReducedMotion } from '@/hooks';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { ActivityFrame } from '@/ui/kit/ActivityFrame';
import { GrownUpChip } from '@/ui/kit/Chip';
import { VocabIcon } from '@/ui/kit/VocabIcon';

import { Stage as SceneStage } from '@/world';
import { SceneCrew } from '@/world/scenes';
import { Stage, at } from '../../parts/Stage';
import { RecipeCardFrame } from '../../parts/RecipeCardFrame';
import { CookCTA } from '../../parts/SceneBits';
import { countPhraseEn, countPhraseEs, needsPhraseEn, needsPhraseEs, pluralEs } from '../../spanish';
import { checkCounts, pantryList } from '../../shareMath';
import { SwirlHint, useIdleAssist, useSwirlGesture } from '../../gestures';
import { kitchenFeel, nearestTarget, useCaptainHint, useDragSource, useSpokenTask, useTimers } from '../useKitchenGame';

const D = { w: 390, h: 400 };
const BLENDER = { x: 195, y: 116 };
const JAR = { x: BLENDER.x - 74, y: BLENDER.y - 96, w: 148, h: 158 };
const SHELF_Y = 236;
const ITEM = 50;
const PER_ROW = 7;
/** how much swirling blends the smoothie: each half turn is one stir */
const STIRS_TO_BLEND = 7;

interface PantryItem {
  uid: string;
  word: VocabWord;
  x: number;
  y: number;
}

type Phase = 'fill' | 'blend' | 'done';

export function CountIngredients({ challenge, onComplete, onEvent, compact }: MiniGameProps<'count-ingredients'>) {
  const session = useMiniGameSession('count-ingredients', onComplete, onEvent);
  const assist = useCaptainHint(session);
  const timers = useTimers();
  const reduced = useReducedMotion();

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

  /**
   * ONE SOURCE OF TRUTH. `taken` is the list of shelf items in the jug and the
   * counts are *derived* from it. They used to be two separate pieces of state
   * updated side by side, so a double tap could add one to the count while the
   * shelf only removed one item — a blender holding three strawberries that
   * insisted it held four, with no way to put the phantom one back.
   */
  const [taken, setTaken] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('fill');
  const [stirs, setStirs] = useState(0);
  const [hovering, setHovering] = useState(false);
  const shake = useSharedValue(0);
  const spoken = useRef(false);

  const wordOf = useMemo(() => {
    const map = new Map<string, VocabWord>();
    for (const item of pantry) map.set(item.uid, item.word);
    return map;
  }, [pantry]);

  const bowl = useMemo(() => {
    const out: Record<string, number> = {};
    for (const uid of taken) {
      const word = wordOf.get(uid);
      if (!word) continue;
      out[word.id] = (out[word.id] ?? 0) + 1;
    }
    return out;
  }, [taken, wordOf]);

  const needsForCheck = useMemo(() => challenge.needs.map((n) => ({ id: n.item.id, count: n.count })), [challenge.needs]);
  const spanishFirst = challenge.spokenEs !== false;
  const blended = phase === 'done';
  const whirl = Math.min(1, stirs / STIRS_TO_BLEND);

  const readList = useCallback(() => {
    sfx.play('tap-soft');
    haptics.select();
    if (spanishFirst) {
      speech.say(needsPhraseEs(challenge.needs), { speaker: 'bea', lang: 'es' });
      timers.after(1900, () => speech.say(needsPhraseEn(challenge.needs), { speaker: 'bea' }));
    } else {
      speech.say(needsPhraseEn(challenge.needs), { speaker: 'bea' });
    }
  }, [challenge.needs, spanishFirst, timers]);

  useEffect(() => {
    if (spoken.current) return;
    spoken.current = true;
    const t = setTimeout(readList, 420);
    return () => {
      clearTimeout(t);
      speech.stop();
    };
  }, [readList]);

  /* the blend step gets its own voice line; the fill step is read out above */
  useSpokenTask(phase === 'fill' ? '' : 'Swirl your finger round and round to blend it!', { key: phase });

  const addToBowl = useCallback(
    (item: PantryItem) => {
      if (phase !== 'fill') return;
      setTaken((t) => (t.includes(item.uid) ? t : [...t, item.uid]));
      kitchenFeel.drop();
      session.learnedWord(item.word.es);
    },
    [phase, session],
  );

  /** hop the wrong ones back out onto the shelf — the newest mistakes first */
  const popBackWrong = useCallback(
    (ids: readonly string[]) => {
      const budget = new Map<string, number>();
      for (const id of ids) budget.set(id, challenge.needs.find((n) => n.item.id === id)?.count ?? 0);
      const keep: string[] = [];
      let dropped = 0;
      for (const uid of taken) {
        const id = wordOf.get(uid)?.id;
        if (id !== undefined && budget.has(id)) {
          const room = budget.get(id) ?? 0;
          if (room <= 0) {
            dropped += 1;
            continue;
          }
          budget.set(id, room - 1);
        }
        keep.push(uid);
      }
      if (dropped === 0) return;
      setTaken(keep);
      sfx.play('pop');
      haptics.nudge();
    },
    [challenge.needs, taken, wordOf],
  );

  /* ------------------------------------------------------------------ */
  /* Blending — a circular drag round the jug                             */
  /* ------------------------------------------------------------------ */

  const finish = useCallback(() => {
    setPhase('done');
    sfx.play('sizzle');
    haptics.celebrate();
    shake.value = withRepeat(withSequence(withTiming(-3, { duration: 60 }), withTiming(3, { duration: 60 })), 6, true);
    timers.after(1200, () => {
      sfx.play('sparkle');
      session.complete();
    });
  }, [session, shake, timers]);

  const addStir = useCallback(
    (amount: number) => {
      setStirs((n) => {
        if (n >= STIRS_TO_BLEND) return n;
        const next = Math.min(STIRS_TO_BLEND, n + amount);
        if (next >= STIRS_TO_BLEND) timers.after(0, finish);
        return next;
      });
    },
    [finish, timers],
  );

  /**
   * NEVER A DEAD END. If nobody swirls, the motor takes over: Captain Bea says
   * what to do and the blender starts turning by itself, so the smoothie always
   * gets made. Swirling is faster and far more fun — but it is never the only
   * way through.
   */
  const blendAssist = useIdleAssist({
    active: phase === 'blend',
    firstMs: 2200,
    repeatMs: 150,
    onHelp: (round) => {
      if (round === 1) {
        assist.cheer('Swirl your finger round and round!', '¡Da vueltas!');
        sfx.play('robot-beep');
      }
      addStir(0.5);
    },
  });

  const onStir = useCallback(() => {
    blendAssist.poke();
    kitchenFeel.stir();
    addStir(1);
  }, [addStir, blendAssist]);

  const check = useCallback(() => {
    if (phase !== 'fill') return;
    const result = checkCounts(needsForCheck, bowl);
    if (result.done) {
      kitchenFeel.good();
      session.correct('counts');
      assist.cheer('¡Perfecto! Lid on — now blend it!');
      setPhase('blend');
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
      assist.nudge(`We still need ${need.count - have} more ${pluralEs(need.item.en)}.`, countPhraseEs(need.count, need.item));
    }
  }, [assist, bowl, challenge.extras, challenge.needs, needsForCheck, phase, popBackWrong, session]);

  const showMe = useCallback(() => {
    assist.askedForHelp();
    if (phase === 'blend') {
      addStir(STIRS_TO_BLEND);
      return;
    }
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
  }, [addStir, addToBowl, assist, bowl, needsForCheck, pantry, phase, popBackWrong, taken]);

  const blenderStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const inBowl = Object.entries(bowl).filter(([, n]) => n > 0);

  const controls = (
    <>
      <View style={styles.trayRow}>
        {assist.offerHelp && !blended ? (
          <Button label="Show me" tone="yellow" size="md" onPress={showMe} sound="tap-soft" />
        ) : null}
        {phase === 'blend' && reduced ? (
          <Button label="Blend" tone="white" size="md" onPress={onStir} sound="tap-soft" />
        ) : null}
        {phase === 'fill' && taken.length > 0 ? (
          <Text variant="small" color={roles.ink.secondary}>
            {taken.length} in the blender
          </Text>
        ) : null}
      </View>
      {phase === 'fill' ? (
        <CookCTA label="Blend it!" onPress={check} />
      ) : (
        <View style={styles.meterWrap}>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${Math.round(whirl * 100)}%` }]} />
          </View>
          <Text variant="bodyStrong" color={roles.ink.secondary}>
            {blended ? '¡Delicioso!' : whirl > 0 ? 'Keep swirling…' : 'Swirl the blender!'}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <ActivityFrame
      task={phase === 'fill' ? 'Fill the blender!' : blended ? 'Smoothie time!' : 'Blend the smoothie'}
      detail={
        phase === 'fill'
          ? 'Drag what the recipe asks for — no more, no less.'
          : blended
            ? undefined
            : 'Swirl your finger round the jug — or tap it.'
      }
      compact={compact}
      onReplay={phase === 'fill' ? readList : undefined}
      progress={{ done: phase === 'fill' ? 0 : 1, total: 2 }}
      backdrop={
        <>
          {/* a pantry, not a sky: shelves, jars, sacks and crates behind the play */}
          <SceneStage variant="pantry" groundHeight={160} />
          <SceneCrew side="right" size={50} npc="rosa" mood={blended ? 'cheer' : taken.length > 0 ? 'happy' : 'idle'} />
        </>
      }
      controls={controls}
      controlsTone="cream"
      hint={{ text: assist.text, es: assist.es, visible: assist.visible, onDismiss: assist.dismiss }}
    >
      <View style={styles.body}>
        <View style={styles.listWrap}>
          <RecipeCardFrame title="Shopping list" titleEs="Lista" compact badge={<GrownUpChip />}>
            <View style={styles.listItems}>
              {challenge.needs.map((n) => {
                const have = bowl[n.item.id] ?? 0;
                return (
                  <View key={n.item.id} style={[styles.listItem, have === n.count && styles.listItemDone]}>
                    <VocabIcon id={n.item.id} size={30} />
                    <Text variant="bodyStrong" color={palette.navy}>
                      {countPhraseEn(n.count, n.item)}
                    </Text>
                    <Text variant="small" color={roles.ink.translation}>
                      {countPhraseEs(n.count, n.item)}
                    </Text>
                    <Text variant="small" color={have === n.count ? palette.leafGreenDark : roles.ink.muted}>
                      {have}/{n.count}
                    </Text>
                  </View>
                );
              })}
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

              {/* the blender lights up while a token is hovering over it, so a
                  child can see where the drop will land before letting go */}
              {hovering ? (
                <View style={[at(s, JAR.x, JAR.y, JAR.w, JAR.h), styles.dropGlow, { borderRadius: 24 * s, borderWidth: 4 * s }]} pointerEvents="none" />
              ) : null}

              {/* blender */}
              <Animated.View style={[at(s, BLENDER.x - 66, BLENDER.y - 84, 132, 176), blenderStyle]} pointerEvents="none">
                <BlenderArt size={132 * s} fill={taken.length > 0} blended={blended} whirl={whirl} />
              </Animated.View>

              {phase === 'blend' ? <BlendSurface s={s} onStir={onStir} showHint={stirs === 0} /> : null}

              {/* shelf */}
              {[SHELF_Y, SHELF_Y + ITEM + 20].map((y) => (
                <View key={y} style={at(s, 10, y, D.w - 20, 12)} pointerEvents="none">
                  <View style={[styles.shelf, { height: 12 * s, borderRadius: 6 * s }]}>
                    <View style={[styles.shelfLip, { height: 4 * s, borderRadius: 2 * s }]} />
                    <View style={[styles.bracket, { left: 24 * s, borderTopWidth: 14 * s, borderRightWidth: 12 * s }]} />
                    <View
                      style={[styles.bracket, styles.bracketRight, { right: 24 * s, borderTopWidth: 14 * s, borderLeftWidth: 12 * s }]}
                    />
                  </View>
                </View>
              ))}

              {phase === 'fill'
                ? pantry.map((item) =>
                    taken.includes(item.uid) ? null : (
                      <PantryToken
                        key={item.uid}
                        s={s}
                        item={item}
                        onHover={(dx, dy) => {
                          if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
                            setHovering(false);
                            return;
                          }
                          const p = { x: item.x + ITEM / 2 + dx, y: item.y + ITEM / 2 + dy };
                          setHovering(nearestTarget(p, [BLENDER], 104) >= 0);
                        }}
                        onDrop={(dx, dy) => {
                          setHovering(false);
                          const p = { x: item.x + ITEM / 2 + dx, y: item.y + ITEM / 2 + dy };
                          if (nearestTarget(p, [BLENDER], 104) < 0) {
                            assist.cheer('Drop it into the blender!');
                            return;
                          }
                          addToBowl(item);
                        }}
                        onTap={() => addToBowl(item)}
                      />
                    ),
                  )
                : null}

              {blended ? (
                <Animated.View entering={ZoomIn.springify().damping(11)} style={at(s, BLENDER.x - 40, 250, 80, 110)} pointerEvents="none">
                  <SmoothieArt size={80 * s} />
                </Animated.View>
              ) : null}
            </>
          )}
        </Stage>
      </View>
    </ActivityFrame>
  );
}

/* ------------------------------------------------------------------ */
/* The blending surface: swirl a finger round the jug                   */
/* ------------------------------------------------------------------ */

function BlendSurface({ s, onStir, showHint }: { s: number; onStir: (tapped: boolean) => void; showHint: boolean }) {
  const w = JAR.w * s;
  const h = JAR.h * s;
  const swirl = useSwirlGesture({ cx: w / 2, cy: h / 2, turnRadians: Math.PI, onStir });
  const spoonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(swirl.spin.value * 180) / Math.PI}deg` }, { scale: 1 + swirl.active.value * 0.05 }],
  }));

  return (
    <GestureDetector gesture={swirl.gesture}>
      <View
        accessibilityRole="button"
        accessibilityLabel="Blender — swirl your finger round and round to blend, or tap it"
        style={at(s, JAR.x, JAR.y, JAR.w, JAR.h)}
      >
        {showHint ? <SwirlHint size={Math.min(w, h)} style={styles.hintCentre} /> : null}
        <Animated.View style={[styles.hintCentre, spoonStyle]} pointerEvents="none">
          <Svg width={w * 0.5} height={h * 0.5} viewBox="0 0 60 60">
            <Circle cx={30} cy={12} r={7} fill="rgba(255,255,255,0.55)" />
            <Circle cx={48} cy={34} r={5} fill="rgba(255,255,255,0.4)" />
            <Circle cx={16} cy={40} r={6} fill="rgba(255,255,255,0.45)" />
          </Svg>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

function PantryToken({
  s,
  item,
  onDrop,
  onTap,
  onHover,
}: {
  s: number;
  item: PantryItem;
  onDrop: (dx: number, dy: number) => void;
  onTap: () => void;
  onHover: (dx: number, dy: number) => void;
}) {
  const drag = useDragSource({
    scale: s,
    onPickUp: () => kitchenFeel.pick(item.word),
    onTap,
    onDrop,
    onMove: onHover,
  });
  // Outer node owns the entrance (layout) animation, inner node owns the drag
  // transform — Reanimated warns and can drop one of them if they share a node.
  //
  // There used to be a <Pressable> inside this too. A tap could then be seen
  // twice — once by the pan and once by the pressable — dropping two
  // strawberries into the blender for one finger. The drag source handles taps.
  return (
    <Animated.View entering={FadeInDown.springify().damping(15)} style={at(s, item.x, item.y, ITEM, ITEM)}>
      <GestureDetector gesture={drag.gesture}>
        <Animated.View
          style={[styles.token, drag.style, { borderRadius: 14 * s, borderWidth: 3 * s }]}
          accessibilityRole="button"
          accessibilityLabel={`${item.word.en} — ${item.word.es}`}
        >
          <VocabIcon id={item.word.id} size={ITEM * 0.72 * s} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

function BlenderArt({ size, fill, blended, whirl }: { size: number; fill: boolean; blended: boolean; whirl: number }) {
  const mix = Math.max(0, Math.min(1, whirl));
  const contents = blended ? '#F2A0C0' : mix > 0 ? '#F7C4A8' : 'rgba(255,214,163,0.75)';
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
      <Circle cx={92} cy={140} r={7} fill={mix > 0 ? palette.leafGreen : palette.engineRed} />
      <Path d="M30 24h72l-8 100H38z" fill="url(#jar)" />
      <Path d="M30 24h72l-8 100H38z" fill="none" stroke={palette.white} strokeWidth={5} />
      {fill ? <Path d="M41 78h50l-4 44H45z" fill={contents} /> : null}
      {/* the vortex: it deepens as the smoothie comes together */}
      {fill && mix > 0 ? (
        <Path
          d={`M43 ${84 - mix * 6} q 23 ${10 + mix * 16} 46 0`}
          fill="none"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth={4 + mix * 3}
          strokeLinecap="round"
        />
      ) : null}
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
  body: { flex: 1 },
  stage: { flex: 1 },
  listWrap: { paddingHorizontal: spacing.md },
  listItems: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  listItemDone: { backgroundColor: roles.state.successFill },
  chipCol: { gap: 6 },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: roles.surface.card,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  dropGlow: { borderColor: roles.state.focusRing, backgroundColor: 'rgba(255,199,44,0.20)' },
  hintCentre: { position: 'absolute', alignSelf: 'center', top: '22%' },
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
    backgroundColor: roles.surface.card,
    borderColor: palette.creamDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  trayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    minHeight: 4,
  },
  meterWrap: { alignItems: 'center', gap: 6, paddingVertical: spacing.xs },
  meterTrack: { width: '76%', height: 14, borderRadius: 7, backgroundColor: roles.surface.sunken, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 7, backgroundColor: palette.leafGreen },
});
