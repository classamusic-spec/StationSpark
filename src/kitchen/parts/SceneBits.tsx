import React, { useMemo } from 'react';
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
 * pale barrel, two darker handles, a single lit edge, and — because it is held
 * a little above the board and the light is top-left — a soft shadow thrown
 * DOWN-RIGHT onto the wood rather than a hard ellipse glued to its feet.
 */
export function RollingPin({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 0.52} viewBox="0 0 140 72">
      {/* cast shadow on the board: two ellipses, offset down-right, soft */}
      <Ellipse cx={76} cy={55} rx={52} ry={6} fill="rgba(31,42,90,0.05)" />
      <Ellipse cx={74} cy={53} rx={45} ry={4} fill="rgba(31,42,90,0.09)" />
      {/* handles */}
      <Rect x={2} y={20} width={26} height={13} rx={6.5} fill="#A96C33" />
      <Rect x={112} y={20} width={26} height={13} rx={6.5} fill="#A96C33" />
      <Rect x={5} y={22} width={16} height={4} rx={2} fill="rgba(255,255,255,0.32)" />
      {/* barrel */}
      <Rect x={24} y={9} width={92} height={35} rx={17} fill="#C08B4E" />
      <Rect x={24} y={9} width={92} height={26} rx={13} fill="#DCA76B" />
      <Rect x={34} y={14} width={72} height={7} rx={3.5} fill="rgba(255,255,255,0.45)" />
      <Rect x={30} y={36} width={80} height={6} rx={3} fill="rgba(31,42,90,0.10)" />
      {/* flour dusted on the barrel */}
      <Circle cx={52} cy={33} r={3} fill="rgba(255,255,255,0.6)" />
      <Circle cx={82} cy={30} r={2.4} fill="rgba(255,255,255,0.55)" />
      <Circle cx={96} cy={35} r={2} fill="rgba(255,255,255,0.5)" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* The pastry board — the wood the dough is rolled out ON                */
/* ------------------------------------------------------------------ */

/**
 * THE PASTRY BOARD.
 *
 * The dough used to be flattened on `WoodPeel`: a tan rounded square, drawn the
 * same value as the tan wall behind it, with no thickness and no ground. It
 * read exactly as the note said — a ball of dough being rolled UP A WALL.
 *
 * This is a board resting on the counter, seen at the same slight top-down
 * angle the rest of the kitchen uses, so everything that makes a horizontal
 * surface horizontal is drawn:
 *
 *   - a stadium-shaped board, much wider than the dough, foreshortened
 *   - a darker RETURN under the front edge, so the board has real thickness
 *   - two contact shadows on the worktop: a tight dark one and a wide soft one
 *   - grain: a few long strokes that bow with the board's length, not stripes
 *   - a floured, worn middle, a lit top-left rim and a shaded lower-right one
 *   - flour dusted across the wood, heavier where the dough has been worked
 *
 * The drawing box is square (262 × 262 units) and holds a board 260 wide, so a
 * caller can centre a circle of radius 100 at (131, 112) — the dough — and get
 * thirty units of visible wood at each end.
 */
export function PastryBoard({ size, flour = 1 }: { size: number; flour?: number }) {
  const dust = useMemo(() => {
    const n = 26;
    return Array.from({ length: n }, (_, i) => {
      /* a golden-angle spiral keeps it even without looking like a grid */
      const a = i * 2.399963;
      const rr = 118 * Math.sqrt((i + 0.6) / n);
      return {
        cx: 131 + Math.cos(a) * rr,
        cy: 112 + Math.sin(a) * rr * 0.8,
        r: 1.6 + ((i * 7) % 5) * 0.6,
        soft: i % 3 === 0,
      };
    });
  }, []);
  return (
    <Svg width={size} height={size} viewBox="0 0 262 262">
      <Defs>
        <LinearGradient id="pbFace" x1="0.1" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#BA813F" />
          <Stop offset="0.52" stopColor="#A46B2E" />
          <Stop offset="1" stopColor="#8C5722" />
        </LinearGradient>
      </Defs>

      {/* what the board lays on the worktop */}
      <Ellipse cx={135} cy={247} rx={138} ry={15} fill="rgba(31,42,90,0.06)" />
      <Ellipse cx={133} cy={244} rx={126} ry={10} fill="rgba(31,42,90,0.15)" />

      {/* the board's thickness — the same shape, dropped, in the dark return */}
      <Rect x={1} y={8} width={260} height={230} rx={105} fill="#6B3D14" />
      <Rect x={1} y={8} width={260} height={222} rx={105} fill="#7E4B1C" />

      {/* the top face */}
      <Rect x={1} y={8} width={260} height={210} rx={105} fill="url(#pbFace)" />

      {/* grain: long soft strokes bowing with the length of the board */}
      <Path d="M34 44 q 97 -13 194 2" stroke="#7C4A19" strokeWidth={3.6} opacity={0.5} fill="none" strokeLinecap="round" />
      <Path d="M22 78 q 109 -12 218 3" stroke="#7C4A19" strokeWidth={3} opacity={0.36} fill="none" strokeLinecap="round" />
      <Path d="M20 148 q 111 12 222 -3" stroke="#7C4A19" strokeWidth={3.2} opacity={0.34} fill="none" strokeLinecap="round" />
      <Path d="M34 182 q 97 13 194 -2" stroke="#7C4A19" strokeWidth={2.8} opacity={0.42} fill="none" strokeLinecap="round" />
      <Path d="M40 62 q 91 -8 182 1" stroke="rgba(255,255,255,0.2)" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d="M40 166 q 91 8 182 -1" stroke="rgba(255,255,255,0.14)" strokeWidth={2.2} fill="none" strokeLinecap="round" />

      {/* the worn, floured middle a board gets from being used */}
      <Ellipse cx={128} cy={110} rx={100} ry={72} fill="rgba(255,240,214,0.11)" />

      {/* one light direction: lit along the top-left lip, shaded lower-right */}
      <Path
        d="M106 8h-1a105 105 0 0 0 -104 105h11a94 94 0 0 1 94 -94z"
        fill="rgba(255,255,255,0.3)"
      />
      <Path
        d="M156 218h1a105 105 0 0 0 104 -105h-11a94 94 0 0 1 -94 94z"
        fill="rgba(31,42,90,0.16)"
      />
      {/* the lit front lip of the return, where the face rolls over the edge */}
      <Rect x={92} y={214} width={80} height={5} rx={2.5} fill="rgba(255,255,255,0.24)" />

      {/* the hanging hole every pastry board has, at the far end */}
      <Circle cx={25} cy={112} r={9} fill="#5E3411" />
      <Circle cx={25} cy={110} r={7.5} fill="#4E2B0C" />
      <Path d="M18 106a9 9 0 0 1 12 -3" stroke="rgba(255,255,255,0.18)" strokeWidth={2.4} fill="none" strokeLinecap="round" />

      {/* flour */}
      {dust.map((d, i) => (
        <Circle
          key={`fd${i}`}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill={d.soft ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.68)'}
          opacity={flour}
        />
      ))}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Serving tray — the wood a portion is cut free on                      */
/* ------------------------------------------------------------------ */

/**
 * A serving tray: a wooden rim with a lit top edge, two cut-out handles, a
 * cream surface with a soft inner shadow where the rim meets it, and its own
 * contact shadow. It used to be a flat tan rectangle with a 5 px border, which
 * gave the row of food nothing to stand on.
 */
export function ServingTray({ width, height }: { width: number; height: number }) {
  const r = Math.min(26, height * 0.34);
  const rim = Math.max(9, Math.min(16, height * 0.12));
  return (
    <Svg width={width} height={height + 12} viewBox={`0 0 ${width} ${height + 12}`}>
      {/* what the tray lays on the counter */}
      <Ellipse cx={width / 2 + 4} cy={height + 5} rx={width * 0.46} ry={7} fill="rgba(31,42,90,0.07)" />
      <Ellipse cx={width / 2 + 2} cy={height + 2} rx={width * 0.42} ry={5} fill="rgba(31,42,90,0.13)" />
      {/* the rim, and its return under the front edge */}
      <Rect x={0} y={6} width={width} height={height} rx={r} fill="#9E6A36" />
      <Rect x={0} y={0} width={width} height={height} rx={r} fill={palette.wood} />
      <Rect x={0} y={0} width={width} height={height * 0.16} rx={r * 0.5} fill="rgba(255,255,255,0.34)" />
      {/* the surface */}
      <Rect x={rim} y={rim * 0.8} width={width - rim * 2} height={height - rim * 1.8} rx={r * 0.62} fill="#F7E3BE" />
      <Rect x={rim} y={rim * 0.8} width={width - rim * 2} height={rim * 0.5} rx={r * 0.3} fill="rgba(31,42,90,0.08)" />
      <Rect
        x={rim + 3}
        y={rim * 0.8 + 3}
        width={width - rim * 2 - 6}
        height={height - rim * 1.8 - 6}
        rx={r * 0.55}
        fill="none"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={2.5}
      />
      {/* cut-out handles at both ends */}
      <Rect x={rim * 0.28} y={height * 0.4} width={rim * 0.44} height={height * 0.2} rx={rim * 0.22} fill="#84551F" />
      <Rect x={width - rim * 0.72} y={height * 0.4} width={rim * 0.44} height={height * 0.2} rx={rim * 0.22} fill="#84551F" />
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
