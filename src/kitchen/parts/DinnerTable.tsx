import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring } from 'react-native-reanimated';
import type { CharacterId, RecipeId } from '@/content/types';
import { palette, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useReducedMotion } from '@/hooks';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { VocabIcon } from '@/ui/kit/VocabIcon';
import { CharacterPortrait } from '@/characters/CharacterPortrait';
import type { NpcVariant } from '@/characters/Npc';
import { recipeGlyph } from '../food';

/* Four at the table, and four is load-bearing: the share maths divides by
 * however many seats there are. Adding or removing one changes the lesson. */
const SEATS: { id: CharacterId; npc?: NpcVariant; name: string }[] = [
  { id: 'rookie', name: 'You' },
  { id: 'bea', name: 'Captain Bea' },
  { id: 'npc', npc: 'rosa', name: 'Rosa' },
  { id: 'npc', npc: 'gino', name: 'Gino' },
];

/**
 * "Dinner is served!" — the whole crew sits around what the child just cooked.
 * The warm pay-off at the end of every recipe.
 */
export function DinnerTable({
  recipeId,
  recipeName,
  onNext,
}: {
  recipeId: RecipeId;
  recipeName: string;
  onNext: () => void;
}) {
  const [boxW, setBoxW] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setBoxW((p) => (Math.abs(p - width) < 1 ? p : width));
  }, []);
  /* the table takes the room it is given: it used to be a fixed 260 px oval,
     which on a tablet was a doll's table marooned in the middle of the screen */
  const tableW = Math.max(260, Math.min(560, boxW - spacing.lg * 2));

  useEffect(() => {
    sfx.play('fanfare');
    haptics.celebrate();
    speech.say(`Dinner is served! ${recipeName} for everyone.`, { speaker: 'bea' });
    return () => speech.stop();
  }, [recipeName]);

  return (
    <Animated.View entering={FadeIn} style={styles.root} onLayout={onLayout}>
      <Animated.View entering={FadeInDown.springify().damping(14)}>
        <Text variant="display" center color={palette.engineRed}>
          Dinner is served!
        </Text>
        <Text variant="body" center color={palette.navySoft}>
          {recipeName}
        </Text>
      </Animated.View>

      <View style={styles.tableWrap}>
        <View style={styles.seatRow}>
          {SEATS.slice(0, 2).map((seat, i) => (
            <Diner key={seat.id} seat={seat} delay={i * 180} />
          ))}
        </View>

        <View style={styles.table}>
          <TableTop width={tableW} recipeId={recipeId} />
        </View>

        <View style={styles.seatRow}>
          {SEATS.slice(2).map((seat, i) => (
            <Diner key={seat.id} seat={seat} delay={360 + i * 180} />
          ))}
        </View>

      </View>

      <Button label="Nice work!" tone="green" size="lg" onPress={onNext} sound="pop" />
    </Animated.View>
  );
}

/**
 * The table the crew sit round: a wooden top with a visible edge and a lit rim,
 * a cream cloth over the middle, four laid places and what the child cooked in
 * the centre. It scales with the room, so a tablet gets a bigger table rather
 * than the same small one in more space.
 */
function TableTop({ width, recipeId }: { width: number; recipeId: RecipeId }) {
  const h = width * 0.423;
  const places: [number, number][] = [
    [66, 34],
    [194, 34],
    [98, 60],
    [162, 60],
  ];
  return (
    <View style={{ width, height: h }}>
      <Svg width={width} height={h} viewBox="0 0 260 110">
        {/* what the table lays on the floor */}
        <Ellipse cx={134} cy={106} rx={110} ry={9} fill="rgba(31,42,90,0.06)" />
        <Ellipse cx={132} cy={103} rx={94} ry={6} fill="rgba(31,42,90,0.15)" />
        {/* legs */}
        <Rect x={44} y={54} width={16} height={48} rx={7} fill={palette.woodDark} />
        <Rect x={200} y={54} width={16} height={48} rx={7} fill={palette.woodDark} />
        {/* the top: its edge, then its face */}
        <Ellipse cx={130} cy={53} rx={124} ry={34} fill="#8E5C2C" />
        <Ellipse cx={130} cy={45} rx={124} ry={34} fill={palette.wood} />
        <Ellipse cx={130} cy={43} rx={117} ry={31} fill="#DCA76B" />
        {/* one light direction: the rim is lit up its top-left */}
        <Path d="M14 42a124 34 0 0 1 96 -31 124 34 0 0 0 -87 33z" fill="rgba(255,255,255,0.42)" />
        {/* the cloth */}
        <Ellipse cx={130} cy={42} rx={94} ry={23} fill="#FFFDF6" />
        <Ellipse cx={130} cy={42} rx={94} ry={23} fill="none" stroke="#F2685C" strokeWidth={3} />
        <Ellipse cx={130} cy={41} rx={80} ry={18} fill="none" stroke="rgba(242,104,92,0.35)" strokeWidth={2} />
        {/* four places laid */}
        {places.map(([cx, cy], i) => (
          <G key={`place${i}`}>
            <Ellipse cx={cx + 1} cy={cy + 3} rx={17} ry={5} fill="rgba(31,42,90,0.12)" />
            <Ellipse cx={cx} cy={cy} rx={17} ry={7} fill="#DDE3F2" />
            <Ellipse cx={cx} cy={cy - 1} rx={17} ry={7} fill={palette.white} />
            <Ellipse cx={cx} cy={cy - 1} rx={10} ry={4} fill="#F4F6FC" />
          </G>
        ))}
      </Svg>
      <View style={styles.dish} pointerEvents="none">
        <VocabIcon id={recipeGlyph[recipeId]} size={width * 0.3} />
      </View>
    </View>
  );
}

function Diner({ seat, delay }: { seat: { id: CharacterId; name: string }; delay: number }) {
  const bounce = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    bounce.value = withDelay(
      delay,
      withRepeat(withSequence(withSpring(-10, springs.pop), withSpring(0, springs.bounce)), -1, false),
    );
  }, [bounce, delay, reduced]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.diner}>
      <Animated.View style={style}>
        <CharacterPortrait id={seat.id} emotion="happy" size={64} />
      </Animated.View>
      <Text variant="tiny" color={palette.navySoft}>
        {seat.name}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  tableWrap: { alignItems: 'center' },
  seatRow: { flexDirection: 'row', gap: spacing.xl },
  diner: { alignItems: 'center' },
  table: { alignItems: 'center', justifyContent: 'center', marginVertical: -6 },
  dish: { position: 'absolute', top: '4%', alignSelf: 'center' },
});
