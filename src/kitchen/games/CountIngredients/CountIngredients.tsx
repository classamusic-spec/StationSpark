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

import { FluidStage, at, type FluidBox } from '../../parts/Stage';
import { RecipeCardFrame } from '../../parts/RecipeCardFrame';
import { CookCTA } from '../../parts/SceneBits';
import {
  Canister,
  CounterCrumbs,
  CounterRun,
  CuttingBoard,
  KitchenWall,
  KitchenWindow,
  MixingBowls,
  SaltAndPepper,
  Shelf,
  SplashbackBand,
  StoreJar,
  type JarTone,
  TeaTowel,
  UtensilRail,
} from '../../parts/KitchenRoom';
import { countPhraseEn, countPhraseEs, needsPhraseEn, needsPhraseEs, pluralEs } from '../../spanish';
import { checkCounts } from '../../shareMath';
import { SwirlHint, useIdleAssist, useSwirlGesture } from '../../gestures';
import { kitchenFeel, nearestTarget, packGrid, useCaptainHint, useDragSource, useSpokenTask, useTimers } from '../useKitchenGame';

/** the blender drawing's width ÷ height */
const JAR_ASPECT = 0.74;
/** how much swirling blends the smoothie: each half turn is one stir */
const STIRS_TO_BLEND = 7;
/** spare pieces in a basket beyond what the recipe asks for, so over-counting is possible */
const SPARE = 3;

/**
 * One basket on the pantry shelf.
 *
 * It used to be one loose token per piece of food — which meant Band C's "nine
 * strawberries, eight mushrooms and six eggs" laid twenty-three 28 px tokens
 * across two shelves, and the blender was squeezed into whatever was left. A
 * basket holds its whole ingredient, so seven big baskets cover every band and
 * the appliance gets the room it deserves. The counting still lives where it
 * belongs: in what the child puts *in*, shown on the list and on the chips.
 */
interface Basket {
  word: VocabWord;
  supply: number;
}

type Phase = 'fill' | 'blend' | 'done';

/** Everything the scene needs to know about the room it was given. */
interface Scene {
  s: number;
  w: number;
  h: number;
  wide: boolean;
  counterY: number;
  counterH: number;
  /** the blender, in design units */
  jar: { x: number; y: number; w: number; h: number };
  /** the drop target at the mouth of the jug */
  mouth: { x: number; y: number };
  dropRadius: number;
  shelfRegion: { x: number; y: number; w: number; h: number };
  /** the strip of wall kept for dressing on a wide screen (0 wide on a phone) */
  dressW: number;
  grid: ReturnType<typeof packGrid>;
}

/**
 * Compose the room. The blender is the subject of the screen, so it takes the
 * biggest block the play area can give it and stands on the counter; the pantry
 * baskets take the band above it on a phone and the column beside it on a wide
 * tablet, and the shelves are always FULL because the grid is packed to fit.
 */
function layout(box: FluidBox, count: number): Scene {
  const { s, w, h } = box;
  const counterH = Math.max(46, Math.min(84, h * 0.14));
  const counterY = h - counterH;
  const wide = w > h * 0.92;
  /* the hero never gets less than half the standing room */
  const heroFloor = (counterY - 12) * 0.5;

  const shelfRegion = wide
    ? { x: 10, y: 12, w: Math.min(w * 0.4, 230) - 20, h: counterY - 34 }
    : { x: 12, y: 6, w: w - 24, h: Math.min(h * 0.36, 210, counterY - 20 - heroFloor) };

  const grid = packGrid(count, shelfRegion, { gap: 10, max: 96, min: 44 });

  /* On a wide screen the room the blender does not need is a real strip of
     wall, kept back before the appliance is sized — that is what stops the
     window ending up behind the jug. */
  const dressW = wide ? Math.min(120, Math.max(0, w - (shelfRegion.x + shelfRegion.w) - 230)) : 0;
  const heroX = wide ? shelfRegion.x + shelfRegion.w + 16 : 0;
  const heroTop = wide ? 12 : shelfRegion.y + shelfRegion.h + 10;
  const heroW = w - heroX - dressW;
  const heroH = counterY - heroTop;

  const jarH = Math.min(heroH * 0.99, (heroW * 0.9) / JAR_ASPECT);
  const jarW = jarH * JAR_ASPECT;
  const jar = { x: heroX + (heroW - jarW) / 2, y: counterY - jarH, w: jarW, h: jarH };

  return {
    s,
    w,
    h,
    wide,
    counterY,
    counterH,
    jar,
    mouth: { x: jar.x + jar.w / 2, y: jar.y + jar.h * 0.34 },
    dropRadius: Math.max(100, jarW * 0.85),
    shelfRegion,
    dressW,
    grid,
  };
}

export function CountIngredients({ challenge, onComplete, onEvent, compact }: MiniGameProps<'count-ingredients'>) {
  const session = useMiniGameSession('count-ingredients', onComplete, onEvent);
  const assist = useCaptainHint(session);
  const timers = useTimers();
  const reduced = useReducedMotion();

  /**
   * The shelf.
   *
   * NEVER DEAD-END: every ingredient the list asks for has to be reachable, and
   * with a couple of spares so a child can over-count and put one back. The
   * decoys are real foods too, so the child has to read, not just grab.
   */
  const baskets = useMemo<Basket[]>(() => {
    const list: Basket[] = [
      ...challenge.needs.map((n) => ({ word: n.item, supply: n.count + SPARE })),
      ...challenge.extras.map((word) => ({ word, supply: SPARE })),
    ];
    // interleave so the needed items are not all clumped on the left
    return list.map((b, i) => ({ b, k: (i * 5) % Math.max(1, list.length) })).sort((a, z) => a.k - z.k).map((e) => e.b);
  }, [challenge.extras, challenge.needs]);

  /**
   * ONE SOURCE OF TRUTH. What is in the jug is one map of counts, written only
   * through functional updates — it used to be two pieces of state kept in step
   * by hand, so a double tap could add one to the count while the shelf only
   * removed one item: a blender holding three strawberries that insisted it held
   * four, with no way to put the phantom one back.
   */
  const [bowl, setBowl] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<Phase>('fill');
  const [stirs, setStirs] = useState(0);
  const [hovering, setHovering] = useState(false);
  const shake = useSharedValue(0);
  const spoken = useRef(false);

  const supplyOf = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of baskets) map.set(b.word.id, b.supply);
    return map;
  }, [baskets]);

  /* `orange-fruit` has no drawing of its own — every word carries the id of the
     picture that stands for it, and the kitchen must ask for that, not the word
     id, or the shelf shows a "?" tile. */
  const iconOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of baskets) map.set(b.word.id, b.word.icon);
    return map;
  }, [baskets]);

  const inJug = useMemo(() => Object.values(bowl).reduce((a, b) => a + b, 0), [bowl]);
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
    (word: VocabWord) => {
      if (phase !== 'fill') return;
      let added = false;
      setBowl((b) => {
        const have = b[word.id] ?? 0;
        if (have >= (supplyOf.get(word.id) ?? SPARE)) return b;
        added = true;
        return { ...b, [word.id]: have + 1 };
      });
      kitchenFeel.drop();
      if (added) session.learnedWord(word.es);
    },
    [phase, session, supplyOf],
  );

  /** hop the wrong ones back out of the jug and onto the shelf */
  const popBackWrong = useCallback(
    (ids: readonly string[]) => {
      let dropped = 0;
      setBowl((b) => {
        const next = { ...b };
        for (const id of ids) {
          const allowed = challenge.needs.find((n) => n.item.id === id)?.count ?? 0;
          const have = next[id] ?? 0;
          if (have > allowed) {
            dropped += have - allowed;
            next[id] = allowed;
          }
        }
        return dropped > 0 ? next : b;
      });
      if (dropped === 0) return;
      sfx.play('pop');
      haptics.nudge();
    },
    [challenge.needs],
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
    const need = challenge.needs.find((n) => n.item.id === id);
    if (need) addToBowl(need.item);
  }, [addStir, addToBowl, assist, bowl, challenge.needs, needsForCheck, phase, popBackWrong]);

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
        {phase === 'fill' && inJug > 0 ? (
          <Text variant="small" color={roles.ink.secondary}>
            {inJug} in the blender
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
      backdrop={<KitchenWall />}
      controls={controls}
      controlsTone="cream"
      hint={{ text: assist.text, es: assist.es, visible: assist.visible, onDismiss: assist.dismiss }}
    >
      <View style={styles.body}>
        <View style={styles.listWrap}>
          <RecipeCardFrame title="Shopping list" compact badge={<GrownUpChip />}>
            <View style={styles.listItems}>
              {challenge.needs.map((n) => {
                const have = bowl[n.item.id] ?? 0;
                return (
                  <View key={n.item.id} style={[styles.listItem, have === n.count && styles.listItemDone]}>
                    <VocabIcon id={n.item.icon} size={26} />
                    <Text variant="bodyStrong" color={palette.navy} style={styles.listName}>
                      {countPhraseEn(n.count, n.item)}
                    </Text>
                    <Text
                      variant="small"
                      color={have === n.count ? palette.leafGreenDark : roles.ink.muted}
                      style={styles.listTally}
                    >
                      {have}/{n.count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </RecipeCardFrame>
        </View>

        <FluidStage minH={320} maxScale={1.8} style={styles.stage}>
          {(box) => {
            const sc = layout(box, baskets.length);
            const { s, w, jar } = sc;
            const heroLeft = sc.wide ? sc.shelfRegion.x + sc.shelfRegion.w + 16 : 0;
            const sideRoom = jar.x - heroLeft - 8;
            return (
              <>
                {/* --- the room ------------------------------------- */}
                <SplashbackBand s={s} x={0} y={sc.counterY - 62} w={w} depth={62} />
                <PantryShelves sc={sc} count={baskets.length} />
                <CounterRun s={s} w={w} y={sc.counterY} h={sc.counterH + 44} />
                <CounterCrumbs s={s} x={jar.x - 20} y={sc.counterY - 12} w={jar.w + 40} seed={2} />

                {/* whatever room the blender does not need becomes kitchen */}
                {sideRoom > 52 ? (
                  <>
                    <CuttingBoard
                      s={s}
                      x={heroLeft + 4}
                      y={sc.counterY - Math.min(sideRoom, 122) * 0.44}
                      w={Math.min(sideRoom, 122)}
                    />
                    <MixingBowls
                      s={s}
                      x={jar.x + jar.w + 6}
                      y={sc.counterY - Math.min(sideRoom, 104) * 0.7}
                      w={Math.min(sideRoom, 104)}
                    />
                    <SaltAndPepper s={s} x={jar.x + jar.w + 10} y={sc.counterY - 26} h={24} />
                  </>
                ) : null}
                {sc.wide && sc.dressW > 60 ? (
                  <>
                    <KitchenWindow s={s} x={w - sc.dressW - 4} y={16} w={sc.dressW} />
                    <UtensilRail s={s} x={w - sc.dressW - 6} y={sc.counterY - 150} w={sc.dressW + 4} />
                    <TeaTowel s={s} x={w - sc.dressW * 0.62} y={sc.counterY - 116} w={sc.dressW * 0.38} />
                  </>
                ) : null}

                {/* --- what is already in the jug -------------------- */}
                <View style={[at(s, 8, sc.wide ? 8 : sc.shelfRegion.y + sc.shelfRegion.h + 12, 128), styles.chipCol]} pointerEvents="none">
                  {inBowl.map(([id, n]) => (
                    <Animated.View key={id} entering={ZoomIn.springify().damping(13)} style={[styles.countChip, shadows.soft]}>
                      <VocabIcon id={iconOf.get(id) ?? id} size={26 * s} />
                      <Text variant="bodyStrong" color={palette.navy} style={{ fontSize: 18 * s, lineHeight: 22 * s }}>
                        ×{n}
                      </Text>
                    </Animated.View>
                  ))}
                </View>

                {/* the blender lights up while a basket is hovering over it, so a
                    child can see where the drop will land before letting go */}
                {hovering ? (
                  <View
                    style={[
                      at(s, jar.x + jar.w * 0.06, jar.y, jar.w * 0.88, jar.h * 0.68),
                      styles.dropGlow,
                      { borderRadius: 26 * s, borderWidth: 4 * s },
                    ]}
                    pointerEvents="none"
                  />
                ) : null}

                <Animated.View style={[at(s, jar.x, jar.y, jar.w, jar.h), blenderStyle]} pointerEvents="none">
                  <BlenderArt width={jar.w * s} fill={inJug} blended={blended} whirl={whirl} />
                </Animated.View>

                {phase === 'blend' ? <BlendSurface sc={sc} onStir={onStir} showHint={stirs === 0} /> : null}

                {phase === 'fill'
                  ? baskets.map((basket, i) => {
                      const cell = sc.grid.cells[i];
                      if (!cell) return null;
                      const home = { x: cell.x + sc.grid.item / 2, y: cell.y + sc.grid.item / 2 };
                      const spent = (bowl[basket.word.id] ?? 0) >= basket.supply;
                      return (
                        <PantryBasket
                          key={basket.word.id}
                          s={s}
                          x={cell.x}
                          y={cell.y}
                          size={sc.grid.item}
                          index={i}
                          basket={basket}
                          spent={spent}
                          onHover={(dx, dy) => {
                            if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
                              setHovering(false);
                              return;
                            }
                            setHovering(nearestTarget({ x: home.x + dx, y: home.y + dy }, [sc.mouth], sc.dropRadius) >= 0);
                          }}
                          onDrop={(dx, dy) => {
                            setHovering(false);
                            if (nearestTarget({ x: home.x + dx, y: home.y + dy }, [sc.mouth], sc.dropRadius) < 0) {
                              assist.cheer('Drop it into the blender!');
                              return;
                            }
                            addToBowl(basket.word);
                          }}
                          onTap={() => addToBowl(basket.word)}
                        />
                      );
                    })
                  : null}

                {blended ? (
                  <Animated.View
                    entering={ZoomIn.springify().damping(11)}
                    style={at(s, jar.x + jar.w + 4, sc.counterY - jar.h * 0.42, jar.h * 0.3, jar.h * 0.42)}
                    pointerEvents="none"
                  >
                    <SmoothieArt size={jar.h * 0.3 * s} />
                  </Animated.View>
                ) : null}
              </>
            );
          }}
        </FluidStage>
      </View>
    </ActivityFrame>
  );
}

/* ------------------------------------------------------------------ */
/* The pantry: full shelves, jars in the gaps                           */
/* ------------------------------------------------------------------ */

function PantryShelves({ sc, count }: { sc: Scene; count: number }) {
  const { s, grid, shelfRegion } = sc;
  const plankX = Math.max(4, shelfRegion.x - 8);
  const plankW = Math.min(sc.w - plankX - 4, shelfRegion.w + 16);
  /* the last row is rarely full — the leftover slots become store jars rather
     than the "empty shelf run" the art director called out */
  const spare = grid.cols * grid.rows - count;
  const spareTones: JarTone[] = ['oats', 'beans', 'berry', 'herbs', 'honey', 'jam'];
  return (
    <>
      {Array.from({ length: Math.max(0, spare) }, (_, i) => {
        const cell = grid.cells[count + i];
        if (!cell) return null;
        const jh = grid.item * 0.82;
        return (
          <StoreJar
            key={`spare${i}`}
            s={s}
            x={cell.x + (grid.item - jh * 0.62) / 2}
            y={cell.y + grid.item - jh}
            h={jh}
            tone={spareTones[i % spareTones.length] ?? 'oats'}
          />
        );
      })}
      {grid.rowY.map((y, r) => {
        const rowWidth = Math.min(grid.width, plankW);
        const gap = (plankW - rowWidth) / 2;
        const jarH = Math.min(grid.item * 0.8, 56);
        const jarW = jarH * 0.62;
        const room = gap > jarW + 8;
        return (
          <React.Fragment key={`shelf${r}`}>
            <Shelf s={s} x={plankX} y={y + 5} w={plankW} thickness={Math.max(9, Math.min(14, grid.item * 0.17))} />
            {room ? (
              <>
                <StoreJar s={s} x={plankX + 6} y={y + 5 - jarH} h={jarH} tone={r % 2 ? 'herbs' : 'honey'} />
                {r === 0 ? (
                  <Canister s={s} x={plankX + plankW - jarW - 6} y={y + 5 - jarH} h={jarH} tone="#E8C89B" />
                ) : (
                  <StoreJar s={s} x={plankX + plankW - jarW - 6} y={y + 5 - jarH} h={jarH} tone={r % 2 ? 'jam' : 'berry'} />
                )}
              </>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* The blending surface: swirl a finger round the jug                   */
/* ------------------------------------------------------------------ */

function BlendSurface({ sc, onStir, showHint }: { sc: Scene; onStir: (tapped: boolean) => void; showHint: boolean }) {
  const { s, jar } = sc;
  const boxW = jar.w * 0.9;
  const boxH = jar.h * 0.66;
  const w = boxW * s;
  const h = boxH * s;
  const swirl = useSwirlGesture({ cx: w / 2, cy: h / 2, turnRadians: Math.PI, onStir });
  const spoonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(swirl.spin.value * 180) / Math.PI}deg` }, { scale: 1 + swirl.active.value * 0.05 }],
  }));

  return (
    <GestureDetector gesture={swirl.gesture}>
      <View
        accessibilityRole="button"
        accessibilityLabel="Blender — swirl your finger round and round to blend, or tap it"
        style={at(s, jar.x + jar.w * 0.05, jar.y, boxW, boxH)}
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

/* ------------------------------------------------------------------ */
/* A basket of one ingredient, standing on the shelf                    */
/* ------------------------------------------------------------------ */

function PantryBasket({
  s,
  x,
  y,
  size,
  index,
  basket,
  spent,
  onDrop,
  onTap,
  onHover,
}: {
  s: number;
  x: number;
  y: number;
  size: number;
  index: number;
  basket: Basket;
  spent: boolean;
  onDrop: (dx: number, dy: number) => void;
  onTap: () => void;
  onHover: (dx: number, dy: number) => void;
}) {
  const drag = useDragSource({
    scale: s,
    onPickUp: () => kitchenFeel.pick(basket.word),
    onTap,
    onDrop,
    onMove: onHover,
    enabled: !spent,
  });
  // Outer node owns the entrance (layout) animation, inner node owns the drag
  // transform — Reanimated warns and can drop one of them if they share a node.
  //
  // There used to be a <Pressable> inside this too. A tap could then be seen
  // twice — once by the pan and once by the pressable — dropping two
  // strawberries into the blender for one finger. The drag source handles taps.
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(15)} style={at(s, x, y, size, size)}>
      <GestureDetector gesture={drag.gesture}>
        <Animated.View
          style={[styles.basket, drag.style, spent && styles.basketSpent]}
          accessibilityRole="button"
          accessibilityLabel={`${basket.word.en} — ${basket.word.es}`}
        >
          {/* the produce sits INSIDE the basket: back of the basket, then the
              food, then the front rim drawn over it */}
          <BasketBack size={size * s} />
          <View style={[styles.basketPile, { top: size * 0.14 * s }]} pointerEvents="none">
            <View style={styles.basketRow}>
              <View style={{ marginRight: -size * 0.05 * s }}>
                <VocabIcon id={basket.word.icon} size={size * 0.38 * s} noShadow />
              </View>
              <View style={{ marginLeft: -size * 0.05 * s }}>
                <VocabIcon id={basket.word.icon} size={size * 0.38 * s} noShadow />
              </View>
            </View>
            <View style={{ marginTop: -size * 0.2 * s }}>
              <VocabIcon id={basket.word.icon} size={size * 0.44 * s} noShadow />
            </View>
          </View>
          <BasketFront size={size * s} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

/** The back of the woven basket — the bowl and the far side of the rim. */
function BasketBack({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
      <Ellipse cx={50} cy={95} rx={36} ry={5} fill="rgba(31,42,90,0.12)" />
      <Path d="M14 56h72l-7 32a8 8 0 0 1-8 7H29a8 8 0 0 1-8-7z" fill="#B87C41" />
      <Ellipse cx={50} cy={56} rx={36} ry={9} fill="#8C5C2C" />
      <Ellipse cx={50} cy={57} rx={31} ry={6} fill="#7A4E24" />
    </Svg>
  );
}

/** The front of the basket: the near rim, the weave and the lit edge. */
function BasketFront({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
      <Path d="M14 62c4 6 18 10 36 10s32-4 36-10l-7 26a8 8 0 0 1-8 7H29a8 8 0 0 1-8-7z" fill="#DCA76B" />
      {[0, 1, 2].map((i) => (
        <Path
          key={`weave${i}`}
          d={`M${23 + i * 2} ${74 + i * 7} h${54 - i * 4}`}
          stroke="#C08B4E"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <Path d="M22 68c3 2 7 3 10 4l3 23h-7z" fill="rgba(255,255,255,0.34)" />
      <Path d="M72 70l-3 25h6l4-22z" fill="rgba(31,42,90,0.10)" />
      <Path d="M14 56c0 5 16 9 36 9s36-4 36-9v6c0 5-16 9-36 9s-36-4-36-9z" fill="#C08B4E" />
      <Path d="M15 56a36 6 0 0 1 22-5c-10 1-18 2-21 6z" fill="rgba(255,255,255,0.40)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* The blender itself                                                   */
/* ------------------------------------------------------------------ */

/**
 * A real appliance, not a white beaker: a tapered glass jug with a spout, a
 * moulded handle, measurement marks, a two-part lid with a cap, and a motor
 * base with a speed dial, two buttons and cooling vents. The contents rise with
 * what goes in, change colour as they blend, and the vortex deepens with the
 * whirl.
 */
function BlenderArt({ width, fill, blended, whirl }: { width: number; fill: number; blended: boolean; whirl: number }) {
  const mix = Math.max(0, Math.min(1, whirl));
  const contents = blended ? '#F2A0C0' : mix > 0 ? '#F7C4A8' : '#FFD6A3';
  /* the pile rises with what is in the jug, so four strawberries look like four */
  const level = Math.min(1, fill / 8);
  const top = 132 - level * 56;
  /* the jug is a trapezoid: these give its inside edge at any height */
  const leftAt = (y: number) => 36 + (y - 40) * 0.09;
  const rightAt = (y: number) => 112 - (y - 40) * 0.09;
  return (
    <Svg width={width} height={width / JAR_ASPECT} viewBox="0 0 148 200">
      <Defs>
        <LinearGradient id="ciJar" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="rgba(255,255,255,0.92)" />
          <Stop offset="1" stopColor="rgba(255,255,255,0.42)" />
        </LinearGradient>
        <LinearGradient id="ciBase" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4B5573" />
          <Stop offset="1" stopColor="#2A3149" />
        </LinearGradient>
      </Defs>

      <Ellipse cx={74} cy={193} rx={54} ry={7} fill="rgba(31,42,90,0.16)" />

      {/* motor base */}
      <Path d="M24 146h100a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H24a10 10 0 0 1-10-10v-24a10 10 0 0 1 10-10z" fill="url(#ciBase)" />
      <Rect x={20} y={139} width={108} height={13} rx={6.5} fill="#5A648A" />
      <Rect x={26} y={142} width={44} height={4} rx={2} fill="rgba(255,255,255,0.28)" />
      {/* speed dial */}
      <Circle cx={108} cy={168} r={14} fill="#1F2438" />
      <Circle cx={108} cy={167} r={11} fill={mix > 0 ? palette.leafGreen : palette.engineRed} />
      <Rect x={106} y={158} width={4} height={9} rx={2} fill="rgba(255,255,255,0.85)" transform={`rotate(${mix * 90} 108 167)`} />
      {/* buttons + vents */}
      <Rect x={30} y={160} width={26} height={9} rx={4.5} fill="#8C94B3" />
      <Rect x={30} y={174} width={26} height={9} rx={4.5} fill="#6B76A8" />
      {[0, 1, 2, 3].map((i) => (
        <Rect key={`v${i}`} x={64 + i * 7} y={162} width={3.4} height={20} rx={1.7} fill="rgba(255,255,255,0.16)" />
      ))}

      {/* the jug — real value in the glass, so it is not a white void */}
      <Path d="M32 40h84l-9 100H41z" fill="#CFD9EA" />
      <Path d="M40 40h68l-7 100H47z" fill="#E7EDF7" />

      {/* contents, filling the tapered jug from the bottom up */}
      {fill > 0 ? (
        <>
          <Path
            d={`M${leftAt(top)} ${top} L${rightAt(top)} ${top} L${rightAt(140)} 140 L${leftAt(140)} 140 Z`}
            fill={contents}
          />
          <Ellipse cx={74} cy={top} rx={(rightAt(top) - leftAt(top)) / 2} ry={5} fill="rgba(255,255,255,0.38)" />
        </>
      ) : null}
      {/* the vortex: it deepens as the smoothie comes together */}
      {fill > 0 && mix > 0 ? (
        <Path
          d={`M50 ${top + 6 - mix * 4} q 24 ${10 + mix * 18} 48 0`}
          fill="none"
          stroke="rgba(255,255,255,0.78)"
          strokeWidth={4 + mix * 3}
          strokeLinecap="round"
        />
      ) : null}

      {/* glass sheen: two strips, not a wash over the whole jug */}
      <Path d="M36 44h13l-4 92h-9z" fill="url(#ciJar)" />
      <Path d="M104 44h9l-6 92h-6z" fill="rgba(255,255,255,0.45)" />

      {/* measurement marks, with a longer tick at the halfway line */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Rect key={`m${i}`} x={56} y={58 + i * 17} width={i === 2 ? 26 : 15} height={3} rx={1.5} fill="rgba(31,42,90,0.26)" />
      ))}

      {/* handle, in front of the glass so it reads as a handle */}
      <Path d="M112 58q30 6 30 32t-30 34" fill="none" stroke="#DCE3F0" strokeWidth={16} strokeLinecap="round" />
      <Path d="M112 58q30 6 30 32t-30 34" fill="none" stroke={palette.white} strokeWidth={10} strokeLinecap="round" />
      <Path d="M114 64q22 6 23 26" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={4} strokeLinecap="round" />

      {/* glass edge, lit side and spout */}
      <Path d="M32 40h84l-9 100H41z" fill="none" stroke={palette.white} strokeWidth={5} />
      <Path d="M40 50q5 12 4 30" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={7} strokeLinecap="round" />
      <Path d="M26 40h16l-4 12z" fill={palette.white} />

      {/* lid */}
      <Rect x={26} y={26} width={96} height={16} rx={8} fill={palette.white} />
      <Rect x={26} y={26} width={96} height={6} rx={3} fill="#F0F3FA" />
      <Rect x={58} y={12} width={32} height={16} rx={8} fill={palette.slateLight} />
      <Rect x={64} y={16} width={14} height={4} rx={2} fill="rgba(255,255,255,0.8)" />
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
  listItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  listItemDone: { backgroundColor: roles.state.successFill },
  listName: { fontSize: 16, lineHeight: 21 },
  listTally: { fontSize: 14, lineHeight: 19 },
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
  basket: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  basketSpent: { opacity: 0.5 },
  basketPile: { position: 'absolute', alignItems: 'center' },
  basketRow: { flexDirection: 'row', alignItems: 'flex-end' },
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
