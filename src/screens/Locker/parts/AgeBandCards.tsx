/**
 * AGE BAND CARDS — three playful illustrated choices: a small helmet for
 * 5–6, a bigger one for 7–8, the biggest for 9–10, each with its stars.
 * The chosen card fills with its colour and gets a navy ring; nothing is
 * ever wrong here, only "yours".
 */
import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';
import type { AgeBand } from '@/learning/types';
import { hit, palette, radii, shadows, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { GlyphIcon, Text } from '@/ui';
import { mix } from '@/characters/rig/palettes';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '@/world/tone';

export const AGE_BANDS: { value: AgeBand; label: string; sub: string; color: string; stars: number; helmet: number }[] = [
  { value: 'A', label: 'I am 5–6', sub: 'Counting & first words', color: palette.leafGreen, stars: 1, helmet: 0.72 },
  { value: 'B', label: 'I am 7–8', sub: 'Adding, reading, fractions', color: palette.safetyYellow, stars: 2, helmet: 0.88 },
  { value: 'C', label: 'I am 9–10', sub: 'Times tables & longer reads', color: palette.waterCyan, stars: 3, helmet: 1.04 },
];

/** A fire helmet, front on, in the sticker language — scaled per band. */
const HelmetMark = memo(function HelmetMark({ size, scale, shield }: { size: number; scale: number; shield: string }) {
  const s = 100 * scale;
  const off = (100 - s) / 2;
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 100 80" pointerEvents="none">
      <Ellipse cx={50} cy={74} rx={34 * scale} ry={shadowRy(34 * scale)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      <Path
        d="M 22 58 C 22 34 34 20 50 20 C 66 20 78 34 78 58 Z"
        fill={palette.engineRed}
        transform={`translate(${off} ${off * 0.7}) scale(${scale})`}
      />
      <Path
        d="M 50 20 C 66 20 78 34 78 58 L 62 58 C 62 36 58 24 50 20 Z"
        fill={SHADE}
        transform={`translate(${off} ${off * 0.7}) scale(${scale})`}
      />
      <Path d="M 34 38 C 38 30 44 26 50 25" stroke={HIGHLIGHT} strokeWidth={5} strokeLinecap="round" fill="none" transform={`translate(${off} ${off * 0.7}) scale(${scale})`} />
      <Path d="M 50 32 L 59 36 v 9 c 0 6 -4 9 -9 11 c -5 -2 -9 -5 -9 -11 v -9 z" fill={shield} transform={`translate(${off} ${off * 0.7}) scale(${scale})`} />
      <Path d="M 50 37 c 3 3 4 5 0 9 c -4 -4 -3 -6 0 -9 z" fill={palette.engineRed} transform={`translate(${off} ${off * 0.7}) scale(${scale})`} />
      <Ellipse cx={50} cy={60} rx={34} ry={9} fill={palette.engineRed} transform={`translate(${off} ${off * 0.7}) scale(${scale})`} />
      <Ellipse cx={50} cy={62} rx={34} ry={7} fill={palette.engineRedDark} transform={`translate(${off} ${off * 0.7}) scale(${scale})`} />
      <Ellipse cx={50} cy={57.5} rx={28} ry={4.6} fill={HIGHLIGHT} transform={`translate(${off} ${off * 0.7}) scale(${scale})`} />
    </Svg>
  );
});

function AgeCard({
  band,
  active,
  compact,
  onPress,
}: {
  band: (typeof AGE_BANDS)[number];
  active: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const edge = mix(band.color, palette.navy, 0.28);
  const soft = mix(band.color, '#FFFFFF', 0.78);
  return (
    <Animated.View style={[styles.cardWrap, compact && styles.cardWrapCompact, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={`${band.label}. ${band.sub}`}
        onPressIn={() => {
          scale.value = withSpring(0.96, springs.pop);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springs.bounce);
        }}
        onPress={() => {
          sfx.play('pop');
          haptics.select();
          onPress();
        }}
        style={[styles.edge, shadows.soft, { backgroundColor: active ? edge : palette.slateLight }, active && styles.edgeOn]}
      >
        <View style={[styles.face, compact && styles.faceCompact, { backgroundColor: active ? band.color : soft }]}>
          <View style={styles.art}>
            <HelmetMark size={compact ? 46 : 64} scale={band.helmet} shield={active ? palette.white : band.color} />
          </View>
          <View style={styles.text}>
            <Text variant={compact ? 'buttonSmall' : 'h3'} color={palette.navy}>
              {band.label}
            </Text>
            {!compact ? (
              <Text variant="small" color={active ? palette.navy : palette.navySoft}>
                {band.sub}
              </Text>
            ) : null}
            <View style={styles.stars}>
              {Array.from({ length: band.stars }, (_, i) => (
                <GlyphIcon key={i} id="star" size={14} label="" />
              ))}
            </View>
          </View>
          {active ? (
            <View style={styles.tick}>
              <GlyphIcon id="check" size={22} label="chosen" />
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function AgeBandCards({ value, onChange, compact }: { value: AgeBand; onChange: (b: AgeBand) => void; compact?: boolean }) {
  return (
    <View style={compact ? styles.row : styles.column} accessibilityRole="radiogroup">
      {AGE_BANDS.map((b) => (
        <AgeCard key={b.value} band={b} active={b.value === value} compact={compact} onPress={() => onChange(b.value)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.xs },
  cardWrap: { alignSelf: 'stretch' },
  cardWrapCompact: { flex: 1 },
  edge: { borderRadius: radii.card, paddingBottom: 5, borderWidth: 3, borderColor: 'transparent' },
  edgeOn: { borderColor: palette.navy },
  face: {
    borderRadius: radii.card - 2,
    minHeight: hit.big,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  faceCompact: { flexDirection: 'column', minHeight: hit.min, gap: 2, paddingHorizontal: 4 },
  art: { alignItems: 'center', justifyContent: 'center' },
  text: { flexShrink: 1, gap: 2, alignItems: 'flex-start' },
  stars: { flexDirection: 'row', gap: 2, marginTop: 2 },
  tick: { marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: radii.pill, padding: 6 },
});
