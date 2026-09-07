import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { palette } from '@/theme';
import { Text } from '@/ui/Text';
import { at, useStage } from './parts/Stage';
import { Canister, HerbPot, KitchenWall, PinnedNote, Shelf, StoreJar, UtensilRail } from './parts/KitchenRoom';
import { useRise, useSwing } from './parts/motion';

const DESIGN = { w: 390, h: 700 };
/** the colour the band below the room is painted, so the counter runs on */
const COUNTER_DEEP = '#E2BC86';

/* ------------------------------------------------------------------ */
/* Hanging pendant lamp — sways from the ceiling                        */
/* ------------------------------------------------------------------ */

/**
 * The pendants hang low enough to clear the FIREHOUSE KITCHEN sign that swings
 * in over them — before this their shades were cut in half by the plaque and
 * only two red slivers showed at the frame edges.
 */
const LAMP_LEN = 210;

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
          <Rect x={w / 2 - 2.5} y={0} width={5} height={154} rx={2.5} fill={palette.charcoal} />
          <Rect x={w / 2 - 9} y={148} width={18} height={12} rx={5} fill={palette.charcoalDark} />
          <Path d={`M ${w / 2 - 44} 204 Q ${w / 2} 144 ${w / 2 + 44} 204 Z`} fill="url(#lampShade)" />
          <Path d={`M ${w / 2 - 44} 204 Q ${w / 2} 144 ${w / 2 - 20} 204 Z`} fill="rgba(255,255,255,0.22)" />
          <Ellipse cx={w / 2} cy={204} rx={44} ry={7} fill={palette.engineRedDark} />
          <Ellipse cx={w / 2} cy={203} rx={31} ry={5} fill="#FFF3C4" />
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

      {/* ── wall furniture ──────────────────────────────────────────────
          Zoning matters as much as density: the upper-left wall is kept clear
          because the FIREHOUSE KITCHEN sign hangs there, and the recipe cards
          scroll over the lower half. Everything drawn here lives in the band
          between the window and the counter. */}

      {/* pot rack, hung under the window */}
      <G>
        <Rect x={198} y={300} width={172} height={9} rx={4.5} fill={palette.charcoal} />
        <Rect x={198} y={300} width={172} height={3.5} rx={1.75} fill="rgba(255,255,255,0.32)" />
        <Rect x={200} y={292} width={7} height={14} rx={3.5} fill={palette.charcoalDark} />
        <Rect x={361} y={292} width={7} height={14} rx={3.5} fill={palette.charcoalDark} />
        {[228, 282, 334].map((x, i) => (
          <G key={`pan${i}`}>
            <Rect x={x - 2} y={309} width={4} height={13} rx={2} fill={palette.charcoalDark} />
            <Path d={`M ${x - 22} 322 h 44 a 22 20 0 0 1 -44 0 z`} fill={i === 1 ? palette.slate : palette.charcoal} />
            <Path d={`M ${x - 14} 327 h 13 a 13 10 0 0 1 -13 0 z`} fill="rgba(255,255,255,0.32)" />
            <Rect x={x + 20} y={314} width={26} height={6} rx={3} fill={palette.charcoalDark} />
          </G>
        ))}
      </G>

      {/* chalkboard menu on the right */}
      <G>
        <Rect x={202} y={356} width={172} height={116} rx={12} fill={palette.woodDark} />
        <Rect x={210} y={364} width={156} height={92} rx={7} fill="#2E3A46" />
        <Rect x={210} y={364} width={156} height={26} rx={7} fill="rgba(255,255,255,0.18)" />
        <Rect x={206} y={460} width={164} height={9} rx={4.5} fill={palette.wood} />
        <Rect x={226} y={462} width={18} height={4} rx={2} fill={palette.white} opacity={0.85} />
        {[384, 402, 420, 438].map((y, i) => (
          <Rect key={`menu${i}`} x={224} y={y} width={i % 2 === 0 ? 114 : 86} height={5} rx={2.5} fill={palette.white} opacity={0.55} />
        ))}
      </G>

      {/* COOK · LEARN · HELP! poster board, clear of the hanging sign */}
      <G>
        <Rect x={14} y={292} width={112} height={112} rx={16} fill={palette.tanDark} />
        <Rect x={19} y={297} width={102} height={102} rx={13} fill={palette.cream} />
        <Rect x={19} y={297} width={102} height={30} rx={13} fill="rgba(255,255,255,0.32)" />
        <Path d="M70 314c9 8 13 14 13 20a13 13 0 0 1-26 0c0-6 4-12 13-20z" fill={palette.flameOuter} />
        <Path d="M70 324c5 5 7 8 7 11a7 7 0 0 1-14 0c0-3 2-6 7-11z" fill={palette.flameCore} />
      </G>

      {/* spice shelf under the poster */}
      <G>
        <Rect x={10} y={452} width={176} height={9} rx={4.5} fill={palette.wood} />
        <Rect x={10} y={452} width={176} height={3.5} rx={1.75} fill="rgba(255,255,255,0.32)" />
        <Path d="M28 461 l0 12 l10 -12 z" fill={palette.woodDark} />
        <Path d="M168 461 l-10 12 l10 0 z" fill={palette.woodDark} />
        {[
          { x: 20, h: 30, c: '#E7D8FF' },
          { x: 54, h: 24, c: '#FFE1B8' },
          { x: 86, h: 34, c: '#D9F2D2' },
          { x: 122, h: 26, c: '#FFD2E5' },
          { x: 152, h: 30, c: '#CFE9F8' },
        ].map((j, i) => (
          <G key={`spice${i}`}>
            <Rect x={j.x} y={452 - j.h} width={24} height={j.h} rx={6} fill={j.c} />
            <Rect x={j.x} y={452 - j.h} width={8} height={j.h} rx={4} fill="rgba(255,255,255,0.32)" />
            <Rect x={j.x - 2} y={452 - j.h - 6} width={28} height={7} rx={3.5} fill={palette.tanDark} />
          </G>
        ))}
      </G>

      {/* fire-shield tea towel on a rail */}
      <G>
        <Rect x={196} y={480} width={68} height={7} rx={3.5} fill={palette.slate} />
        <Path d="M204 486 h 52 v 36 q -26 8 -52 0 z" fill={palette.white} />
        <Path d="M204 486 h 17 v 34 q -8 2 -17 1 z" fill="rgba(31,42,90,0.08)" />
        <Path d="M230 494 c 7 6 10 10 10 14 a 10 10 0 0 1 -20 0 c 0 -4 3 -8 10 -14 z" fill={palette.engineRed} opacity={0.85} />
        <Path d="M230 502 c 4 4 5 6 5 8 a 5 5 0 0 1 -10 0 c 0 -2 1 -4 5 -8 z" fill={palette.safetyYellow} />
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
/**
 * Critique #20: the room used to be scaled with `fit="cover"`, which cropped the
 * lampshades off the top and pushed the wall sign half off the left edge. It is
 * now anchored to its design box and **letterboxed** — the room is always whole,
 * and the bands above and below it are painted wall and counter so the join is
 * invisible rather than a strip of sky.
 */
export function KitchenBackdrop({ still }: KitchenBackdropProps) {
  const stage = useStage(DESIGN.w, DESIGN.h, 'contain');
  const s = stage.s;
  /* Anchor the room to the FOOT of the screen, not the middle: a counter
     belongs on the floor, and it puts the whole letterbox band at the top where
     it can be dressed as wall instead of sitting as two flat stripes. */
  const roomTop = Math.max(0, stage.top * 2);
  const band = roomTop;
  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none" onLayout={stage.onLayout}>
      <KitchenWall />
      {stage.ready ? (
        <>
          {/* the band above the room is wall, and a wall in this kitchen is
              never bare: a rail of tools over a shelf of store jars */}
          {band > 60 ? (
            <View style={{ position: 'absolute', left: stage.left, top: 0, width: stage.width, height: band }}>
              <UtensilRail s={s} x={18} y={Math.max(4, band / s - 118)} w={Math.min(148, DESIGN.w * 0.36)} />
              <Shelf s={s} x={DESIGN.w - 160} y={Math.max(28, band / s - 30)} w={148} />
              <StoreJar s={s} x={DESIGN.w - 154} y={Math.max(28, band / s - 30) - 44} h={44} tone="honey" />
              <Canister s={s} x={DESIGN.w - 112} y={Math.max(28, band / s - 30) - 48} h={48} tone="#E8C89B" />
              <StoreJar s={s} x={DESIGN.w - 68} y={Math.max(28, band / s - 30) - 40} h={40} tone="herbs" />
            </View>
          ) : null}
          <View style={[styles.band, { top: roomTop + stage.height - 2, bottom: 0, backgroundColor: COUNTER_DEEP }]} />
          <View style={{ position: 'absolute', left: stage.left, top: roomTop, width: stage.width, height: stage.height }}>
            <Room s={s} />
            {/* the left wall used to be ~190 units of bare brick beside the
                window: a pinned recipe, a shelf of jars and a herb pot on the
                sill, so there is somewhere for the eye to go */}
            <PinnedNote s={s} x={34} y={38} w={92} />
            <Shelf s={s} x={16} y={238} w={158} />
            <StoreJar s={s} x={22} y={190} h={48} tone="jam" />
            <Canister s={s} x={64} y={186} h={52} tone="#C9DDF2" />
            <StoreJar s={s} x={110} y={194} h={44} tone="berry" />
            <HerbPot s={s} x={140} y={214} h={46} />
            <View style={[at(s, 19, 336, 102, 60), styles.poster]}>
              <Text variant="tiny" center color={palette.navySoft} style={{ fontSize: 14 * s, lineHeight: 19 * s }}>
                {'COOK\nLEARN\nHELP!'}
              </Text>
            </View>
            {still ? null : (
              <>
                <Wisp s={s} x={292} y={480} periodMs={3400} />
                <Wisp s={s} x={310} y={476} periodMs={4100} delayMs={900} scale={0.8} />
                <Wisp s={s} x={324} y={482} periodMs={3800} delayMs={1800} scale={0.6} />
                <PendantLamp s={s} x={54} periodMs={4600} delayMs={0} />
                <PendantLamp s={s} x={336} periodMs={5400} delayMs={700} />
              </>
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  band: { position: 'absolute', left: 0, right: 0 },
  poster: { alignItems: 'center', justifyContent: 'center' },
});
