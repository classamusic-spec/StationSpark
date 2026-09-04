import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { FadeIn, useAnimatedStyle } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { ChevronRightIcon } from '@/ui/icons';
import { useRise, useSwing } from './motion';

/* ------------------------------------------------------------------ */
/* Wooden peel (the board the pizza sits on)                             */
/* ------------------------------------------------------------------ */

export function WoodPeel({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.24} viewBox="0 0 100 124">
      <Defs>
        <LinearGradient id="peelWood" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#D9A164" />
          <Stop offset="1" stopColor="#B87C41" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={50} cy={54} rx={49} ry={49} fill="rgba(31,42,90,0.12)" />
      <Rect x={42} y={86} width={16} height={36} rx={8} fill="#C08B4E" />
      <Rect x={44} y={88} width={5} height={30} rx={3} fill="rgba(255,255,255,0.28)" />
      <Circle cx={50} cy={51} r={49} fill="url(#peelWood)" />
      <Circle cx={50} cy={51} r={49} fill="none" stroke="#A96C33" strokeWidth={3} />
      <Path d="M14 24a48 48 0 0 1 42-22c-18 4-32 15-38 30z" fill="rgba(255,255,255,0.25)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Pizza cutter                                                          */
/* ------------------------------------------------------------------ */

export function PizzaCutter({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.62} viewBox="0 0 120 74">
      <Rect x={54} y={40} width={62} height={16} rx={8} fill={palette.engineRed} transform="rotate(18 60 48)" />
      <Rect x={56} y={42} width={54} height={5} rx={3} fill="rgba(255,255,255,0.35)" transform="rotate(18 60 48)" />
      <Rect x={40} y={30} width={26} height={11} rx={5} fill={palette.slate} transform="rotate(18 46 36)" />
      <Circle cx={30} cy={30} r={26} fill="#C7CEE0" />
      <Circle cx={30} cy={30} r={26} fill="none" stroke="#98A2C0" strokeWidth={3} />
      <Circle cx={30} cy={30} r={6} fill="#7E8AAE" />
      <Path d="M12 14a26 26 0 0 1 22-6c-11 1-19 6-24 14z" fill="rgba(255,255,255,0.6)" />
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

/* ------------------------------------------------------------------ */
/* Pepper begging under the table                                        */
/* ------------------------------------------------------------------ */

export function BeggingPepper({ size = 84, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const wag = useSwing(9, 620);
  const tail = useAnimatedStyle(() => ({ transform: [{ rotate: `${wag.value}deg` }] }));
  return (
    <View style={[{ width: size, height: size * 0.8 }, style]} pointerEvents="none">
      <Animated.View style={[{ position: 'absolute', left: size * 0.02, top: size * 0.3 }, tail]}>
        <Svg width={size * 0.3} height={size * 0.3} viewBox="0 0 24 24">
          <Path d="M22 20C14 20 6 16 2 8" stroke={palette.white} strokeWidth={7} strokeLinecap="round" fill="none" />
          <Path d="M22 20C14 20 6 16 2 8" stroke="#E4E8F5" strokeWidth={3} strokeLinecap="round" fill="none" />
        </Svg>
      </Animated.View>
      <Svg width={size} height={size * 0.8} viewBox="0 0 100 80">
        <Ellipse cx={52} cy={74} rx={30} ry={5} fill="rgba(31,42,90,0.12)" />
        <Ellipse cx={46} cy={54} rx={26} ry={19} fill={palette.white} />
        <Circle cx={38} cy={50} r={4} fill={palette.navy} opacity={0.85} />
        <Circle cx={54} cy={60} r={3} fill={palette.navy} opacity={0.85} />
        <Circle cx={72} cy={40} r={20} fill={palette.white} />
        <Circle cx={64} cy={33} r={4} fill={palette.navy} opacity={0.8} />
        <Ellipse cx={60} cy={44} rx={7} ry={9} fill={palette.white} />
        <Circle cx={68} cy={38} r={3.2} fill={palette.navy} />
        <Circle cx={69} cy={37} r={1.1} fill={palette.white} />
        <Circle cx={80} cy={38} r={3.2} fill={palette.navy} />
        <Circle cx={81} cy={37} r={1.1} fill={palette.white} />
        <Ellipse cx={74} cy={47} rx={4} ry={3} fill={palette.navy} />
        <Path d="M74 50c0 4 4 5 6 3" stroke={palette.engineRedLight} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Ellipse cx={88} cy={30} rx={7} ry={11} fill={palette.navy} opacity={0.85} />
        <Rect x={56} y={54} width={30} height={7} rx={3.5} fill={palette.engineRed} />
        <Circle cx={71} cy={61} r={4} fill={palette.gold} />
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
