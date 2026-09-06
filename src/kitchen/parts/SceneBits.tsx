import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { FadeIn, useAnimatedStyle } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { ChevronRightIcon } from '@/ui/icons';
import { useRise } from './motion';

/* ------------------------------------------------------------------ */
/* Wooden peel (the board the pizza sits on)                             */
/* ------------------------------------------------------------------ */

/**
 * The wooden peel, redrawn to the reference (critique #18): a rounded board in
 * the same top-down projection as the pizza, with a stubby handle at the
 * bottom — not a disc on a lollipop stick. No keylines: the rim, the grain and
 * the handle are separated by value only.
 */
export function WoodPeel({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.24} viewBox="0 0 100 124">
      <Defs>
        <LinearGradient id="peelWood" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#DCA76B" />
          <Stop offset="1" stopColor="#B87C41" />
        </LinearGradient>
      </Defs>
      {/* contact shadow on the counter */}
      <Ellipse cx={50} cy={112} rx={44} ry={8} fill="rgba(31,42,90,0.12)" />
      {/* handle */}
      <Rect x={40} y={92} width={20} height={30} rx={10} fill="#A96C33" />
      <Rect x={43} y={95} width={6} height={24} rx={3} fill="rgba(255,255,255,0.32)" />
      {/* board — a rounded square, matching the reference's cutting board */}
      <Rect x={2} y={2} width={96} height={100} rx={26} fill="#A96C33" />
      <Rect x={2} y={2} width={96} height={96} rx={26} fill="url(#peelWood)" />
      {/* grain */}
      <Path d="M18 16 q 32 -6 64 0" stroke="#C08B4E" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M12 40 q 38 -7 76 0" stroke="#C08B4E" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.55} />
      <Path d="M14 68 q 36 -6 72 0" stroke="#C08B4E" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.45} />
      <Path d="M16 88 q 34 -5 68 0" stroke="#C08B4E" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.35} />
      {/* lit edge */}
      <Path d="M2 28 a 26 26 0 0 1 26 -26 h 14 c -22 4 -36 14 -40 34 z" fill="rgba(255,255,255,0.32)" />
      <Path d="M98 74 a 26 26 0 0 1 -26 24 h -12 c 20 -4 34 -12 38 -26 z" fill="rgba(31,42,90,0.14)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Pizza cutter                                                          */
/* ------------------------------------------------------------------ */

export function PizzaCutter({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.62} viewBox="0 0 120 74">
      <Ellipse cx={56} cy={68} rx={44} ry={5} fill="rgba(31,42,90,0.12)" />
      <Rect x={54} y={40} width={62} height={16} rx={8} fill={palette.engineRed} transform="rotate(18 60 48)" />
      <Rect x={56} y={42} width={54} height={5} rx={3} fill="rgba(255,255,255,0.32)" transform="rotate(18 60 48)" />
      <Rect x={40} y={30} width={26} height={11} rx={5} fill={palette.slate} transform="rotate(18 46 36)" />
      <Circle cx={30} cy={30} r={26} fill="#98A2C0" />
      <Circle cx={30} cy={28.5} r={24.5} fill="#C7CEE0" />
      <Circle cx={30} cy={30} r={7} fill="#7E8AAE" />
      <Circle cx={30} cy={29} r={3.4} fill="rgba(255,255,255,0.32)" />
      <Path d="M12 14a26 26 0 0 1 22-6c-11 1-19 6-24 14z" fill="rgba(255,255,255,0.55)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Equation strip: "8 ÷ 4 = 2"                                           */
/* ------------------------------------------------------------------ */

export function EquationStrip({ text, tone = 'white' }: { text: string; tone?: 'white' | 'gold' }) {
  return (
    <Animated.View
      entering={FadeIn}
      style={[styles.equation, shadows.soft, tone === 'gold' && { backgroundColor: '#FFE9A8' }]}
    >
      <Text variant="h2" center color={palette.navy}>
        {text}
      </Text>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* The red "Looks Delicious! ›" CTA                                      */
/* ------------------------------------------------------------------ */

export function CookCTA({
  label,
  onPress,
  disabled,
  tone = 'red',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'red' | 'green';
}) {
  return (
    <Button
      label={label}
      tone={tone}
      size="lg"
      block
      disabled={disabled}
      onPress={onPress}
      sound="pop"
      iconRight={<ChevronRightIcon size={26} />}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Bubbling pot                                                          */
/* ------------------------------------------------------------------ */

export function PotArt({ size, bubbling }: { size: number; bubbling?: boolean }) {
  const rise = useRise(1800);
  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbling ? 1 - rise.value : 0,
    transform: [{ translateY: -rise.value * 20 * (size / 120) }],
  }));
  return (
    <View style={{ width: size, height: size * 0.82 }}>
      <Animated.View style={[styles.bubbles, bubbleStyle]} pointerEvents="none">
        <Svg width={size * 0.5} height={size * 0.3} viewBox="0 0 60 36">
          <Circle cx={14} cy={22} r={7} fill="rgba(255,255,255,0.75)" />
          <Circle cx={32} cy={13} r={5} fill="rgba(255,255,255,0.65)" />
          <Circle cx={47} cy={24} r={6} fill="rgba(255,255,255,0.7)" />
        </Svg>
      </Animated.View>
      <View style={{ position: 'absolute', bottom: 0 }}>
        <Svg width={size} height={size * 0.62} viewBox="0 0 120 74">
          <Ellipse cx={60} cy={70} rx={52} ry={6} fill="rgba(31,42,90,0.12)" />
          <Rect x={14} y={12} width={92} height={58} rx={16} fill={palette.charcoal} />
          <Rect x={14} y={12} width={92} height={14} rx={7} fill={palette.slate} />
          <Rect x={0} y={26} width={18} height={10} rx={5} fill={palette.slate} />
          <Rect x={102} y={26} width={18} height={10} rx={5} fill={palette.slate} />
          <Rect x={26} y={17} width={68} height={7} rx={3.5} fill="#F0A24B" />
          <Rect x={30} y={40} width={54} height={8} rx={4} fill="rgba(255,255,255,0.16)" />
        </Svg>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Checkered cloth corner                                                */
/* ------------------------------------------------------------------ */

export function CheckerCloth({ width, height, style }: { width: number; height: number; style?: StyleProp<ViewStyle> }) {
  const cell = width / 5;
  const rows = Math.ceil(height / cell);
  const cells: React.ReactElement[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < 5; c += 1) {
      if ((r + c) % 2 === 0) {
        cells.push(<Rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#F2685C" />);
      }
    }
  }
  return (
    <View style={[{ width, height }, style]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Rect x={0} y={0} width={width} height={height} rx={12} fill={palette.white} />
        <G opacity={0.95}>{cells}</G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  equation: {
    alignSelf: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    minWidth: 160,
  },
  bubbles: { position: 'absolute', top: 0, alignSelf: 'center' },
});
