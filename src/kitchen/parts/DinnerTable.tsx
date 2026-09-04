import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring } from 'react-native-reanimated';
import type { CharacterId } from '@/content/types';
import { palette, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useReducedMotion } from '@/hooks';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { VocabIcon } from '@/ui/kit/VocabIcon';
import { CharacterPortrait } from '@/characters/CharacterPortrait';
import { BeggingPepper } from './SceneBits';
import { recipeGlyph } from '../food';

const SEATS: { id: CharacterId; name: string }[] = [
  { id: 'rookie', name: 'You' },
  { id: 'bea', name: 'Captain Bea' },
  { id: 'beacon', name: 'Beacon' },
  { id: 'pepper', name: 'Pepper' },
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
  recipeId: string;
  recipeName: string;
  onNext: () => void;
}) {
  useEffect(() => {
    sfx.play('fanfare');
    haptics.celebrate();
    speech.say(`Dinner is served! ${recipeName} for everyone.`, { speaker: 'bea' });
    return () => speech.stop();
  }, [recipeName]);

  return (
    <Animated.View entering={FadeIn} style={styles.root}>
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
          <Svg width={260} height={110} viewBox="0 0 260 110">
            <Ellipse cx={130} cy={104} rx={92} ry={6} fill="rgba(31,42,90,0.14)" />
            <Rect x={44} y={54} width={16} height={48} rx={7} fill={palette.woodDark} />
            <Rect x={200} y={54} width={16} height={48} rx={7} fill={palette.woodDark} />
            <Ellipse cx={130} cy={50} rx={124} ry={34} fill={palette.wood} />
            <Ellipse cx={130} cy={45} rx={124} ry={34} fill="#D9A164" />
            <Ellipse cx={130} cy={42} rx={92} ry={22} fill={palette.white} />
          </Svg>
          <Animated.View entering={FadeInDown.delay(240).springify().damping(11)} style={styles.dish}>
            <VocabIcon id={recipeGlyph[recipeId] ?? 'soup'} size={76} />
          </Animated.View>
        </View>

        <View style={styles.seatRow}>
          {SEATS.slice(2).map((seat, i) => (
            <Diner key={seat.id} seat={seat} delay={360 + i * 180} />
          ))}
        </View>

        <BeggingPepper size={92} style={styles.pepper} />
      </View>

      <Button label="Nice work!" tone="green" size="lg" onPress={onNext} sound="pop" />
    </Animated.View>
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
  dish: { position: 'absolute', top: 4 },
  pepper: { position: 'absolute', right: -30, bottom: -14 },
});
