import React, { useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { palette } from '@/theme';
import { at } from './parts/Stage';
import {
  Canister,
  ChalkMenu,
  ContactPatch,
  CounterCrumbs,
  CounterRun,
  HerbPot,
  KitchenWall,
  KitchenWindow,
  MixingBowls,
  PinnedNote,
  SaltAndPepper,
  Shelf,
  SplashbackBand,
  StoreJar,
  TeaTowel,
  UtensilRail,
} from './parts/KitchenRoom';
import { POT_ASPECT, StockPot } from './parts/Cookware';
import { useRise, useSwing } from './parts/motion';

/* ------------------------------------------------------------------ */
/* Hanging pendant lamp — sways from the ceiling                        */
/* ------------------------------------------------------------------ */

/** How far below the ceiling the shade hangs, in design units. */
const LAMP_LEN = 190;

function PendantLamp({ x, len, periodMs, delayMs }: { x: number; len: number; periodMs: number; delayMs: number }) {
  const sway = useSwing(2.6, periodMs, delayMs);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value}deg` }] }));
  const w = 96;
  const flex = len / LAMP_LEN;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x - w / 2, top: -len, width: w, height: len * 2 }, style]}
    >
      <View style={{ position: 'absolute', top: len, width: w, height: len }}>
        <Svg width={w} height={len} viewBox={`0 0 ${w} ${LAMP_LEN}`}>
          <Defs>
            <LinearGradient id="lampShade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={palette.engineRedLight} />
              <Stop offset="1" stopColor={palette.engineRedDark} />
            </LinearGradient>
          </Defs>
          <Rect x={w / 2 - 2.5} y={0} width={5} height={LAMP_LEN - 56} rx={2.5} fill={palette.charcoal} />
          <Rect x={w / 2 - 9} y={LAMP_LEN - 60} width={18} height={12} rx={5} fill={palette.charcoalDark} />
          <Path d={`M ${w / 2 - 44} ${LAMP_LEN} Q ${w / 2} ${LAMP_LEN - 60} ${w / 2 + 44} ${LAMP_LEN} Z`} fill="url(#lampShade)" />
          <Path d={`M ${w / 2 - 44} ${LAMP_LEN} Q ${w / 2} ${LAMP_LEN - 60} ${w / 2 - 20} ${LAMP_LEN} Z`} fill="rgba(255,255,255,0.22)" />
          <Ellipse cx={w / 2} cy={LAMP_LEN} rx={44} ry={7} fill={palette.engineRedDark} />
          <Ellipse cx={w / 2} cy={LAMP_LEN - 1} rx={31} ry={5} fill="#FFF3C4" />
          {/* the pool of warm light the shade throws down the wall */}
          <Ellipse cx={w / 2} cy={LAMP_LEN + 26} rx={40} ry={20} fill="rgba(255,220,140,0.22)" opacity={flex} />
        </Svg>
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Steam wisps from the pot                                             */
/* ------------------------------------------------------------------ */

function Wisp({ x, y, periodMs, delayMs = 0, scale = 1 }: { x: number; y: number; periodMs: number; delayMs?: number; scale?: number }) {
  const t = useRise(periodMs, delayMs);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.15 ? t.value / 0.15 : 1 - (t.value - 0.15) / 0.85,
    transform: [{ translateY: -t.value * 62 }, { scale: 0.7 + t.value * 0.6 }],
  }));
  const w = 26 * scale;
  const h = 46 * scale;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h }, style]}>
      <Svg width={w} height={h} viewBox="0 0 26 46">
        <Path
          d="M13 46c-7-6-9-12-4-18 4-5 5-9 1-13 6 3 8 8 4 14-3 5-3 9 3 12 4 2 3 4-4 5z"
          fill="rgba(255,255,255,0.72)"
        />
      </Svg>
    </Animated.View>
  );
}

/** The COOK · LEARN · HELP! board, drawn rather than lettered. */
function CookBoard({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <View style={{ position: 'absolute', left: x, top: y, width: size, height: size }} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Rect x={2} y={6} width={116} height={112} rx={18} fill={palette.tanDark} />
        <Rect x={2} y={0} width={116} height={112} rx={18} fill={palette.cream} />
        <Rect x={2} y={0} width={116} height={34} rx={18} fill="rgba(255,255,255,0.4)" />
        {/* a friendly flame badge — the station's own mark */}
        <Path d="M60 26c14 13 20 22 20 31a20 20 0 0 1-40 0c0-9 6-18 20-31z" fill={palette.flameOuter} />
        <Path d="M60 42c7 7 10 12 10 16a10 10 0 0 1-20 0c0-4 3-9 10-16z" fill={palette.flameCore} />
        {/* three ruled lines, the way a pinned card reads from across a room */}
        <Rect x={26} y={86} width={68} height={5} rx={2.5} fill="rgba(31,42,90,0.22)" />
        <Rect x={34} y={97} width={52} height={5} rx={2.5} fill="rgba(31,42,90,0.15)" />
      </Svg>
    </View>
  );
}

export interface KitchenBackdropProps {
  /** hide the animated life (used behind dense reading UI) */
  still?: boolean;
}

/**
 * THE FIREHOUSE KITCHEN, BEHIND THE RECIPE BOX.
 *
 * This used to be a 390 × 700 picture letterboxed into whatever screen it got.
 * On a phone that was fine; on a tablet it was a narrow strip of drawn room
 * marooned in the middle of a metre of bare tile, with the pendant lamps
 * sliced off and the sign hanging over a pinned note. A backdrop cannot be a
 * fixed picture — it has to be a room that is laid out for the wall it is
 * given.
 *
 * So everything here is placed as a fraction of the measured box, and the room
 * is zoned around the furniture that sits on top of it:
 *
 *   - the top-centre stays clear: the FIREHOUSE KITCHEN plaque swings in there
 *   - the lamps hang at the far left and right, well clear of the plaque
 *   - the middle band carries the window, the chalk menu and the pinned notes
 *   - the foot is a real worktop — deck, splashback, nose, cabinets — with the
 *     pot, the bowls and the herbs standing on it and steaming
 */
export function KitchenBackdrop({ still }: KitchenBackdropProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((b) => (Math.abs(b.w - width) < 1 && Math.abs(b.h - height) < 1 ? b : { w: width, h: height }));
  }, []);

  const { w, h } = box;
  const ready = w > 0 && h > 0;

  /* the worktop across the foot */
  const counterH = Math.max(38, Math.min(96, h * 0.1));
  const counterY = h - counterH;
  const deck = Math.max(70, Math.min(180, h * 0.17));
  const deckTop = counterY - deck;
  const baseY = counterY - deck * 0.34;

  /* the wall band above it, and the strip of it the plaque needs kept clear */
  const side = Math.min(200, w * 0.24);
  const midY = Math.max(70, deckTop - 210);
  const lampLen = Math.max(90, Math.min(210, h * 0.2));

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none" onLayout={onLayout}>
      <KitchenWall />
      {ready ? (
        <>
          {/* ---- the wall ------------------------------------------- */}
          <SplashbackBand s={1} x={0} y={Math.max(0, deckTop - 96)} w={w} depth={Math.min(96, deckTop)} />

          {/* left: a pinned recipe over a shelf of jars */}
          <PinnedNote s={1} x={w * 0.035} y={midY - 118} w={Math.min(96, side * 0.6)} />
          <Shelf s={1} x={w * 0.03} y={midY + 46} w={side} />
          <StoreJar s={1} x={w * 0.035} y={midY - 2} h={48} tone="jam" />
          <Canister s={1} x={w * 0.035 + 54} y={midY - 6} h={52} tone="#C9DDF2" />
          <StoreJar s={1} x={w * 0.035 + 104} y={midY + 2} h={44} tone="berry" />
          <CookBoard x={w * 0.04} y={midY + 74} size={Math.min(112, side * 0.62)} />

          {/* right: the window onto the yard, the chalk menu and the tools */}
          <KitchenWindow s={1} x={w - side - w * 0.03} y={midY - 130} w={side} />
          <ChalkMenu s={1} x={w - side - w * 0.03} y={midY + 44} w={Math.min(170, side * 0.9)} />
          <UtensilRail s={1} x={w * 0.5 - Math.min(190, w * 0.22)} y={deckTop - 132} w={Math.min(190, w * 0.22) * 2} />
          <TeaTowel s={1} x={w - side - w * 0.03 - 56} y={deckTop - 120} w={44} />

          {/* ---- the worktop ---------------------------------------- */}
          <CounterRun s={1} w={w} y={counterY} h={counterH + 40} deck={deck} />
          <CounterCrumbs s={1} x={w * 0.3} y={counterY - 26} w={w * 0.4} seed={7} />

          {/* ---- what stands on it ---------------------------------- */}
          <HerbPot s={1} x={w * 0.05} y={baseY - 62} h={60} />
          <MixingBowls s={1} x={w * 0.16} y={baseY - 52} w={84} />
          <SaltAndPepper s={1} x={w * 0.74} y={baseY - 30} h={30} />
          <ContactPatch s={1} cx={w * 0.62} y={baseY - 2} rx={62} strength={0.85} />
          {/* the station's one stock pot — the hub used to simmer a charcoal
              pan nobody cooks in anywhere else in the kitchen */}
          <View style={at(1, w * 0.62 - 66, baseY - 132 / POT_ASPECT + 4)}>
            <StockPot size={132} bubbling={!still} level="low" />
          </View>
          {still ? null : (
            <>
              <Wisp x={w * 0.6} y={baseY - 86} periodMs={3400} />
              <Wisp x={w * 0.63} y={baseY - 90} periodMs={4100} delayMs={900} scale={0.8} />
              <Wisp x={w * 0.66} y={baseY - 84} periodMs={3800} delayMs={1800} scale={0.6} />
              <PendantLamp x={w * 0.11} len={lampLen} periodMs={4600} delayMs={0} />
              <PendantLamp x={w * 0.89} len={lampLen} periodMs={5400} delayMs={700} />
            </>
          )}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
});
