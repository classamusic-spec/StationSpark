/**
 * The "this bit isn't built yet" card.
 *
 * Station Spark's hard rule is that a child can always finish. Whenever a beat
 * cannot render — the mini-game is not registered yet, its generator threw, the
 * kitchen has not landed — we show this friendly card instead of a dead end,
 * and tapping it completes the beat with full marks.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { palette, radii, shadows, spacing } from '@/theme';
import { Button, Panel, Text } from '@/ui';
import { CharacterPortrait } from '@/characters';

/** A traffic cone + planks: "under construction", Spark City style. */
function ConeSign() {
  return (
    <Svg width={132} height={104} viewBox="0 0 132 104">
      <Path d="M 18 92 h 96 a 7 7 0 0 1 0 12 H 18 a 7 7 0 0 1 0 -12 z" fill="rgba(31,42,90,0.12)" />
      {/* cone */}
      <Path d="M 40 92 L 56 22 q 4 -8 8 0 L 80 92 Z" fill={palette.orange} />
      <Path d="M 47 62 L 73 62 L 76 76 L 44 76 Z" fill={palette.white} />
      <Path d="M 52 38 L 68 38 L 70 48 L 50 48 Z" fill={palette.white} />
      <Rect x={30} y={88} width={60} height={9} rx={4.5} fill={palette.orangeDark} />
      <Path d="M 56 24 q 4 -8 8 0 z" fill="rgba(255,255,255,0.4)" />
      {/* barrier plank */}
      <Rect x={84} y={52} width={44} height={14} rx={5} fill={palette.white} />
      {[0, 1, 2].map((i) => (
        <Path key={i} d={`M ${90 + i * 14} 52 l 10 0 l -10 14 l -10 0 z`} fill={palette.engineRed} />
      ))}
      <Rect x={102} y={52} width={7} height={42} rx={3.5} fill={palette.slate} />
    </Svg>
  );
}

export interface UnderConstructionCardProps {
  title?: string;
  note?: string;
  ctaLabel?: string;
  onContinue: () => void;
  /** who is standing next to the sign */
  character?: 'beacon' | 'pepper' | 'bea' | 'rookie';
}

export function UnderConstructionCard({
  title = 'This station is being built',
  note = 'The crew is still putting this one together. Tap to carry on with the mission!',
  ctaLabel = 'Tap to continue ›',
  onContinue,
  character = 'beacon',
}: UnderConstructionCardProps) {
  return (
    <View style={styles.wrap}>
      <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.inner}>
        <Panel tone="white" radius="panel" style={[styles.card, shadows.card]}>
          <ConeSign />
          <Text variant="h1" center>
            {title}
          </Text>
          <Text variant="body" color={palette.navySoft} center>
            {note}
          </Text>
          <View style={styles.row}>
            <CharacterPortrait id={character} emotion="happy" size={64} />
            <Button label={ctaLabel} tone="green" size="lg" onPress={onContinue} style={styles.cta} />
          </View>
        </Panel>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  inner: { width: '100%', maxWidth: 480 },
  card: { alignItems: 'center', gap: spacing.sm, borderRadius: radii.panel },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  cta: { flex: 1 },
});
