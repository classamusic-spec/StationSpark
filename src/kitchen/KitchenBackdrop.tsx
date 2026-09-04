import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { palette } from '@/theme';
import { Text } from '@/ui/Text';
import { Stage, at } from './parts/Stage';
import { useRise, useSwing } from './parts/motion';

const DESIGN = { w: 390, h: 700 };

/* ------------------------------------------------------------------ */
/* Hanging pendant lamp — sways from the ceiling                        */
/* ------------------------------------------------------------------ */

const LAMP_LEN = 110;

function PendantLamp({ s, x, periodMs, delayMs }: { s: number; x: number; periodMs: number; delayMs: number }) {
  const sway = useSwing(2.6, periodMs, delayMs);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value}deg` }] }));
  const w = 96;
  return (
    <Animated.View
      pointerEvents="none"
      style={[at(s, x - w / 2, -LAMP_LEN, w, LAMP_LEN * 2), style]}
    >
      <View style={{ position: 'absolute', top: LAMP_LEN * s, width: w * s, height: LAMP_LEN * s }}>
        <Svg width={w * s} height={LAMP_LEN * s} viewBox={`0 0 ${w} ${LAMP_LEN}`}>
          <Defs>
            <LinearGradient id="lampShade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.engineRedLight} />
              <Stop offset="1" stopColor={palette.engineRedDark} />
            </LinearGradient>
          </Defs>
          <Rect x={w / 2 - 2.5} y={0} width={5} height={54} rx={2.5} fill={palette.charcoal} />
          <Rect x={w / 2 - 9} y={48} width={18} height={12} rx={5} fill={palette.charcoalDark} />
          <Path d={`M ${w / 2 - 44} 104 Q ${w / 2} 44 ${w / 2 + 44} 104 Z`} fill="url(#lampShade)" />
          <Path d={`M ${w / 2 - 44} 104 Q ${w / 2} 44 ${w / 2 - 20} 104 Z`} fill="rgba(255,255,255,0.22)" />
          <Ellipse cx={w / 2} cy={104} rx={44} ry={7} fill={palette.engineRedDark} />
          <Ellipse cx={w / 2} cy={103} rx={31} ry={5} fill="#FFF3C4" />
        </Svg>
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Steam wisps from the pot                                             */
/* ------------------------------------------------------------------ */

function Wisp({ s, x, y, periodMs, delayMs = 0, scale = 1 }: { s: number; x: number; y: number; periodMs: number; delayMs?: number; scale?: number }) {
  const t = useRise(periodMs, delayMs);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.15 ? t.value / 0.15 : 1 - (t.value - 0.15) / 0.85,
    transform: [{ translateY: -t.value * 62 * s }, { scale: 0.7 + t.value * 0.6 }],
  }));
  const w = 26 * scale;
  const h = 46 * scale;
  return (
    <Animated.View pointerEvents="none" style={[at(s, x - w / 2, y - h, w, h), style]}>
      <Svg width={w * s} height={h * s} viewBox="0 0 26 46">
        <Path
          d="M13 46c-7-6-9-12-4-18 4-5 5-9 1-13 6 3 8 8 4 14-3 5-3 9 3 12 4 2 3 4-4 5z"
          fill="rgba(255,255,255,0.72)"
        />
      </Svg>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* The room                                                             */
/* ------------------------------------------------------------------ */

function Room({ s }: { s: number }) {
  const bricks: React.ReactElement[] = [];
  for (let row = 0; row < 9; row += 1) {
    const y = 300 + row * 26;
    const offset = row % 2 === 0 ? 0 : -26;
    for (let col = 0; col < 4; col += 1) {
      bricks.push(
        <Rect
          key={`b${row}-${col}`}
          x={offset + col * 52}
          y={y}
          width={48}
          height={22}
          rx={5}
          fill="#F0C9A0"
          opacity={0.55}
        />,
      );
    }
  }

  const checks: React.ReactElement[] = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      if ((row + col) % 2 === 0) {
        checks.push(<Rect key={`c${row}-${col}`} x={col * 26} y={556 + row * 26} width={26} height={26} fill="#F2685C" />);
      }
    }
  }

  return (
    <Svg width={DESIGN.w * s} height={DESIGN.h * s} viewBox={`0 0 ${DESIGN.w} ${DESIGN.h}`}>
      <Defs>
        <LinearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE6C7" />
          <Stop offset="0.65" stopColor="#FFF6E5" />
          <Stop offset="1" stopColor="#FBE7C6" />
        </LinearGradient>
        <LinearGradient id="winSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.skyTop} />
          <Stop offset="1" stopColor={palette.skyBottom} />
        </LinearGradient>
        <LinearGradient id="counter" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6DCB2" />
          <Stop offset="1" stopColor="#E2BC86" />
        </LinearGradient>
      </Defs>

      {/* wall */}
      <Rect x={0} y={0} width={DESIGN.w} height={DESIGN.h} fill="url(#wall)" />
      <G opacity={0.85}>{bricks}</G>

      {/* window with the sky and the truck */}
      <G>
        <Rect x={196} y={26} width={186} height={252} rx={26} fill={palette.white} />
        <Rect x={206} y={36} width={166} height={232} rx={19} fill="url(#winSky)" />
        <Circle cx={248} cy={84} r={17} fill="rgba(255,255,255,0.85)" />
        <Circle cx={268} cy={90} r={22} fill="rgba(255,255,255,0.85)" />
        <Circle cx={330} cy={70} r={14} fill="rgba(255,255,255,0.7)" />
        {/* fire truck parked outside */}
        <Rect x={230} y={188} width={128} height={54} rx={12} fill={palette.engineRed} />
        <Rect x={230} y={188} width={128} height={16} rx={8} fill={palette.engineRedLight} opacity={0.6} />
        <Rect x={242} y={200} width={38} height={26} rx={7} fill="#9BD3F5" />
        <Rect x={292} y={200} width={54} height={26} rx={7} fill="#9BD3F5" />
        <Rect x={230} y={230} width={128} height={9} rx={4} fill={palette.safetyYellow} />
        <Circle cx={258} cy={246} r={13} fill={palette.charcoal} />
        <Circle cx={258} cy={246} r={6} fill={palette.slateLight} />
        <Circle cx={334} cy={246} r={13} fill={palette.charcoal} />
        <Circle cx={334} cy={246} r={6} fill={palette.slateLight} />
        <Rect x={206} y={244} width={166} height={24} fill={palette.grass} opacity={0.9} />
        {/* mullions */}
        <Rect x={286} y={36} width={7} height={232} rx={3} fill={palette.white} opacity={0.95} />
        <Rect x={206} y={142} width={166} height={7} rx={3} fill={palette.white} opacity={0.95} />
        <Rect x={196} y={26} width={186} height={252} rx={26} fill="none" stroke={palette.creamDeep} strokeWidth={6} />
      </G>

      {/* shelf with jars */}
      <G>
        <Rect x={8} y={236} width={158} height={12} rx={6} fill={palette.wood} />
        <Rect x={8} y={236} width={158} height={5} rx={2.5} fill="rgba(255,255,255,0.35)" />
        <Rect x={26} y={198} width={34} height={38} rx={9} fill="#CFE9F8" />
        <Rect x={26} y={198} width={34} height={9} rx={4} fill={palette.leafGreen} />
        <Rect x={74} y={190} width={30} height={46} rx={9} fill="#FFE1B8" />
        <Rect x={74} y={190} width={30} height={9} rx={4} fill={palette.engineRed} />
        <Rect x={118} y={204} width={32} height={32} rx={9} fill="#E7D8FF" />
        <Rect x={118} y={204} width={32} height={9} rx={4} fill={palette.safetyYellow} />
      </G>

      {/* COOK · LEARN · HELP! poster board */}
      <G>
        <Rect x={16} y={54} width={124} height={120} rx={16} fill={palette.cream} />
        <Rect x={16} y={54} width={124} height={120} rx={16} fill="none" stroke={palette.tanDark} strokeWidth={4} />
        <Path d="M78 74c9 8 13 14 13 20a13 13 0 0 1-26 0c0-6 4-12 13-20z" fill={palette.flameOuter} />
        <Path d="M78 84c5 5 7 8 7 11a7 7 0 0 1-14 0c0-3 2-6 7-11z" fill={palette.flameCore} />
      </G>

      {/* counter + checkered cloth */}
      <G>
        <Rect x={0} y={520} width={DESIGN.w} height={180} fill="url(#counter)" />
        <Rect x={0} y={520} width={DESIGN.w} height={14} rx={7} fill="#FFF1D8" />
        <G opacity={0.92}>
          <Rect x={0} y={556} width={130} height={104} rx={10} fill={palette.white} />
          {checks}
        </G>
      </G>

      {/* pot on the counter */}
      <G>
        <Ellipse cx={305} cy={534} rx={46} ry={7} fill="rgba(31,42,90,0.12)" />
        <Rect x={262} y={478} width={86} height={54} rx={14} fill={palette.charcoal} />
        <Rect x={262} y={478} width={86} height={13} rx={6} fill={palette.slate} />
        <Rect x={250} y={490} width={16} height={9} rx={4} fill={palette.slate} />
        <Rect x={344} y={490} width={16} height={9} rx={4} fill={palette.slate} />
        <Rect x={278} y={500} width={54} height={8} rx={4} fill="rgba(255,255,255,0.18)" />
      </G>

      {/* sauce bottles bottom right (from the reference) */}
      <G>
        <Rect x={352} y={470} width={26} height={62} rx={11} fill={palette.engineRed} />
        <Rect x={358} y={458} width={14} height={16} rx={5} fill={palette.engineRedDark} />
        <Rect x={356} y={488} width={18} height={22} rx={7} fill="rgba(255,255,255,0.3)" />
      </G>
    </Svg>
  );
}

export interface KitchenBackdropProps {
  /** hide the animated life (used behind dense reading UI) */
  still?: boolean;
}

/**
 * The warm firehouse kitchen: cream + brick wall, a window onto the sky with
 * the truck parked outside, swaying red pendant lamps, a jar shelf, the
 * COOK · LEARN · HELP! poster, a checkered cloth counter and a pot that steams.
 *
 * Reusable behind every kitchen screen — pair with `<ScreenFrame mood="kitchen">`.
 */
export function KitchenBackdrop({ still }: KitchenBackdropProps) {
  return (
    <Stage design={DESIGN} fit="cover" style={StyleSheet.absoluteFill}>
      {(s) => (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Room s={s} />
          <View style={[at(s, 16, 88, 124, 80), styles.poster]}>
            <Text variant="tiny" center color={palette.navySoft} style={{ fontSize: 15 * s, lineHeight: 20 * s }}>
              {'COOK\nLEARN\nHELP!'}
            </Text>
          </View>
          {still ? null : (
            <>
              <Wisp s={s} x={292} y={480} periodMs={3400} />
              <Wisp s={s} x={310} y={476} periodMs={4100} delayMs={900} scale={0.8} />
              <Wisp s={s} x={324} y={482} periodMs={3800} delayMs={1800} scale={0.6} />
              <PendantLamp s={s} x={62} periodMs={4600} delayMs={0} />
              <PendantLamp s={s} x={330} periodMs={5400} delayMs={700} />
            </>
          )}
        </View>
      )}
    </Stage>
  );
}

const styles = StyleSheet.create({
  poster: { alignItems: 'center', justifyContent: 'center' },
});
