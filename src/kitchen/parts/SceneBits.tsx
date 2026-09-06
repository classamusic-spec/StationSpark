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
/* Rolling pin — the tool the dough is flattened with                    */
/* ------------------------------------------------------------------ */

/**
 * A rolling pin in the same chunky, outline-free language as the cutter: one
 * pale barrel, two darker handles, a single lit edge. It is drawn lying flat
 * across the dough, so the child sees the axle they are meant to push.
 */
export function RollingPin({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.42} viewBox="0 0 140 58">
      <Ellipse cx={70} cy={50} rx={54} ry={6} fill="rgba(31,42,90,0.14)" />
      {/* handles */}
      <Rect x={2} y={20} width={26} height={13} rx={6.5} fill="#A96C33" />
      <Rect x={112} y={20} width={26} height={13} rx={6.5} fill="#A96C33" />
      {/* barrel */}
      <Rect x={24} y={9} width={92} height={35} rx={17} fill="#C08B4E" />
      <Rect x={24} y={9} width={92} height={26} rx={13} fill="#DCA76B" />
      <Rect x={34} y={14} width={72} height={7} rx={3.5} fill="rgba(255,255,255,0.45)" />
      {/* flour dusted on the barrel */}
      <Circle cx={52} cy={33} r={3} fill="rgba(255,255,255,0.6)" />
      <Circle cx={82} cy={30} r={2.4} fill="rgba(255,255,255,0.55)" />
      <Circle cx={96} cy={35} r={2} fill="rgba(255,255,255,0.5)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Chef's knife — the tool a portion is cut free with                    */
/* ------------------------------------------------------------------ */

export function ChefKnife({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.44} viewBox="0 0 120 53">
      <Ellipse cx={58} cy={47} rx={44} ry={5} fill="rgba(31,42,90,0.12)" />
      <Rect x={78} y={14} width={40} height={15} rx={7.5} fill={palette.charcoal} />
      <Rect x={82} y={17} width={30} height={5} rx={2.5} fill="rgba(255,255,255,0.28)" />
      <Path d="M6 30 L78 14 v16 c-26 6 -50 8 -72 6 z" fill="#C7CEE0" />
      <Path d="M6 30 L78 20 v6 c-26 6 -50 6 -72 4 z" fill="#98A2C0" />
      <Path d="M14 20 L74 15 v4 L18 25 z" fill="rgba(255,255,255,0.5)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Wooden spoon — the tool a pot is stirred with                         */
/* ------------------------------------------------------------------ */

export function WoodenSpoon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 2.1} viewBox="0 0 44 92">
      <Rect x={17} y={2} width={10} height={62} rx={5} fill="#C08B4E" />
      <Rect x={19} y={5} width={4} height={54} rx={2} fill="rgba(255,255,255,0.4)" />
      <Ellipse cx={22} cy={74} rx={17} ry={15} fill="#A96C33" />
      <Ellipse cx={22} cy={72} rx={15} ry={13} fill="#DCA76B" />
      <Ellipse cx={18} cy={68} rx={6} ry={4.5} fill="rgba(255,255,255,0.4)" />
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
