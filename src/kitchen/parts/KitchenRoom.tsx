import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { palette } from '@/theme';
import { at } from './Stage';
import { useSwing } from './motion';

/**
 * THE FIREHOUSE KITCHEN, DRAWN.
 *
 * Every kitchen game used to stand on `@/world`'s generic counter backdrop: a
 * screen-sized layer that knew nothing about the play area, so its chalkboard
 * was sliced by the task bar, its tea towel floated behind the pot, and the
 * middle of the screen was a bare beige field.
 *
 * This kit is the room instead, and it is drawn *inside the stage* in design
 * units — so the wall, the counter and the dressing scale with the activity and
 * can never collide with it. Rules, from docs/ART_DIRECTION.md:
 *
 *  - flat vector, rounded, no keylines: shapes are separated by value
 *  - one light direction (top-left), so every highlight is up-left and every
 *    shade tone is down-right
 *  - a restrained palette: cream and tan wall, wood counter, navy at 8–16 %
 *    for shade, white at 25–45 % for the lit edge
 *  - considered detail — a jar has a lid AND a label, tiles have grout, a board
 *    has crumbs — never noise, never clip-art, never an emoji
 */

const GROUT = 'rgba(31,42,90,0.055)';
const SHADE = 'rgba(31,42,90,0.13)';
const LIT = 'rgba(255,255,255,0.42)';

/* ------------------------------------------------------------------ */
/* The wall behind everything                                           */
/* ------------------------------------------------------------------ */

/**
 * The full-bleed wall: warm cream, a tiled splashback with real grout, and a
 * soft corner vignette so the room has air in it. Deliberately quiet — the
 * furniture and the food are drawn on the stage above it, where they scale
 * with the activity.
 */
export function KitchenWall({ tone = 'warm', style }: { tone?: 'warm' | 'cool'; style?: StyleProp<ViewStyle> }) {
  const top = tone === 'cool' ? '#F3F7FF' : '#FFF3DC';
  const bottom = tone === 'cool' ? '#DCE6F7' : '#F6E2BE';
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="kwall" x1="0" y1="0" x2="0.35" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
          <LinearGradient id="kvig" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="rgba(31,42,90,0.10)" />
            <Stop offset="0.35" stopColor="rgba(31,42,90,0)" />
            <Stop offset="1" stopColor="rgba(31,42,90,0.09)" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#kwall)" />
        <Rect x={0} y={0} width={100} height={100} fill="url(#kvig)" />
      </Svg>
      <TileField />
    </View>
  );
}

/** The grout grid. Drawn as explicit lines so it reads the same on every platform. */
function TileField() {
  const cols = 9;
  const rows = 14;
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 90 140">
      {Array.from({ length: rows }, (_, r) => (
        <Rect key={`r${r}`} x={0} y={r * 10} width={90} height={0.9} fill={GROUT} />
      ))}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols + 1 }, (_, c) => (
          <Rect key={`c${r}-${c}`} x={c * 10 + (r % 2 ? 5 : 0) - 0.45} y={r * 10} width={0.9} height={10} fill={GROUT} />
        )),
      )}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* The counter the whole room stands on                                 */
/* ------------------------------------------------------------------ */

/**
 * A counter run: butcher-block top with a lit front nose, a shadow gap, and
 * cabinet doors with real handles underneath. `y` is where the worktop
 * *surface* sits — the thing standing on it should have its feet on that line.
 */
export function CounterRun({ s, w, y, h }: { s: number; w: number; y: number; h: number }) {
  const topH = Math.min(20, h * 0.34);
  return (
    <View style={at(s, 0, y - topH * 0.35, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox={`0 0 ${w} ${h}`}>
        {/* the shadow the worktop throws on the cabinet fronts */}
        <Rect x={0} y={topH} width={w} height={9} fill="rgba(31,42,90,0.16)" />
        {/* cabinet fronts */}
        <Rect x={0} y={topH + 4} width={w} height={h - topH - 4} fill="#E6C89A" />
        {Array.from({ length: Math.max(2, Math.round(w / 130)) }, (_, i) => {
          const n = Math.max(2, Math.round(w / 130));
          const dw = w / n;
          return (
            <G key={`door${i}`}>
              <Rect x={i * dw + 6} y={topH + 12} width={dw - 12} height={h - topH - 20} rx={9} fill="#EFD6AC" />
              <Rect x={i * dw + 12} y={topH + 18} width={dw - 24} height={h - topH - 32} rx={6} fill="none" stroke={LIT} strokeWidth={2.5} />
              <Rect x={i * dw + dw / 2 - 16} y={topH + 20} width={32} height={6} rx={3} fill="#B99A6A" />
            </G>
          );
        })}
        {/* the worktop itself */}
        <Rect x={0} y={0} width={w} height={topH} rx={4} fill={palette.wood} />
        <Rect x={0} y={0} width={w} height={topH * 0.44} fill="#D89A5D" />
        <Rect x={0} y={0} width={w} height={3.5} fill="rgba(255,255,255,0.5)" />
        {/* grain */}
        {Array.from({ length: 4 }, (_, i) => (
          <Rect key={`g${i}`} x={w * (0.06 + i * 0.23)} y={topH * 0.16} width={w * 0.16} height={2} rx={1} fill="rgba(255,255,255,0.22)" />
        ))}
        <Rect x={0} y={topH - 5} width={w} height={5} fill={palette.woodDark} />
      </Svg>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Wall furniture                                                       */
/* ------------------------------------------------------------------ */

/** A shelf plank on two brackets, with a lit top lip. `y` is the plank's top. */
export function Shelf({ s, x, y, w, thickness = 11 }: { s: number; x: number; y: number; w: number; thickness?: number }) {
  const h = thickness + 16;
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox={`0 0 ${w} ${h}`}>
        <Rect x={0} y={thickness} width={w} height={5} fill="rgba(31,42,90,0.10)" />
        <Path d={`M22 ${thickness} h13 l-13 15 z`} fill={palette.woodDark} />
        <Path d={`M${w - 22} ${thickness} h-13 l13 15 z`} fill={palette.woodDark} />
        <Rect x={0} y={0} width={w} height={thickness} rx={thickness / 2} fill={palette.wood} />
        <Rect x={0} y={0} width={w} height={thickness * 0.4} rx={thickness * 0.2} fill="rgba(255,255,255,0.34)" />
      </Svg>
    </View>
  );
}

const jarTones: Record<string, { body: string; lid: string; fill: string }> = {
  honey: { body: '#F7DFAE', lid: '#D98E00', fill: '#F0A93C' },
  jam: { body: '#F8CFC7', lid: '#B9261C', fill: '#E4574A' },
  herbs: { body: '#D7EDC8', lid: '#3B8E3F', fill: '#6FBF57' },
  beans: { body: '#E4D6BC', lid: '#9E6A36', fill: '#B98B54' },
  oats: { body: '#F1E4C8', lid: '#8C94B3', fill: '#E0CB9E' },
  berry: { body: '#F4CBDE', lid: '#C2427A', fill: '#E36FA2' },
};
export type JarTone = keyof typeof jarTones;
const JAR_ORDER: JarTone[] = ['honey', 'herbs', 'jam', 'oats', 'beans', 'berry'];

/**
 * A storage jar: glass body, a screw lid with a rim, contents that stop short
 * of the top, and a paper label with two ruled lines on it. Small enough to
 * repeat along a shelf without turning into noise.
 */
export function StoreJar({ s, x, y, h, tone }: { s: number; x: number; y: number; h: number; tone: JarTone }) {
  const t = jarTones[tone] ?? jarTones.oats;
  const w = h * 0.62;
  if (!t) return null;
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 62 100">
        <Ellipse cx={31} cy={96} rx={26} ry={4} fill="rgba(31,42,90,0.10)" />
        <Rect x={4} y={16} width={54} height={80} rx={13} fill={t.body} />
        <Rect x={9} y={44} width={44} height={50} rx={10} fill={t.fill} />
        <Rect x={9} y={21} width={9} height={62} rx={4.5} fill="rgba(255,255,255,0.55)" />
        {/* label */}
        <Rect x={7} y={54} width={48} height={26} rx={6} fill="#FFF8EA" />
        <Rect x={13} y={61} width={30} height={3.4} rx={1.7} fill="rgba(31,42,90,0.30)" />
        <Rect x={13} y={69} width={22} height={3} rx={1.5} fill="rgba(31,42,90,0.18)" />
        {/* lid */}
        <Rect x={1} y={4} width={60} height={16} rx={7} fill={t.lid} />
        <Rect x={5} y={0} width={52} height={10} rx={5} fill={t.lid} />
        <Rect x={8} y={6} width={22} height={4} rx={2} fill="rgba(255,255,255,0.38)" />
        <Rect x={1} y={15} width={60} height={5} rx={2.5} fill="rgba(31,42,90,0.14)" />
      </Svg>
    </View>
  );
}

/** A row of jars along a shelf — never the same jar twice in a row. */
export function JarRow({
  s,
  x,
  y,
  w,
  h,
  seed = 0,
  count,
}: {
  s: number;
  x: number;
  y: number;
  w: number;
  h: number;
  seed?: number;
  count?: number;
}) {
  const n = count ?? Math.max(2, Math.floor(w / (h * 0.78)));
  const step = w / n;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const tone = JAR_ORDER[(i + seed) % JAR_ORDER.length] ?? 'oats';
        const jh = h * (i % 3 === 1 ? 0.84 : i % 3 === 2 ? 0.95 : 1);
        return (
          <StoreJar key={`jar${i}`} s={s} x={x + i * step + (step - jh * 0.62) / 2} y={y - jh} h={jh} tone={tone} />
        );
      })}
    </>
  );
}

/** A tall tin canister — flour, sugar, rice — with a band label and a knob lid. */
export function Canister({
  s,
  x,
  y,
  h,
  tone = '#9FC9E8',
  band = '#FFF8EA',
}: {
  s: number;
  x: number;
  y: number;
  h: number;
  tone?: string;
  band?: string;
}) {
  const w = h * 0.58;
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 58 100">
        <Ellipse cx={29} cy={96} rx={25} ry={4} fill="rgba(31,42,90,0.10)" />
        <Rect x={3} y={14} width={52} height={82} rx={12} fill={tone} />
        <Rect x={8} y={20} width={9} height={68} rx={4.5} fill="rgba(255,255,255,0.40)" />
        <Rect x={45} y={20} width={7} height={68} rx={3.5} fill={SHADE} />
        <Rect x={3} y={46} width={52} height={26} fill={band} />
        <Rect x={12} y={53} width={26} height={3.6} rx={1.8} fill="rgba(31,42,90,0.28)" />
        <Rect x={12} y={61} width={18} height={3} rx={1.5} fill="rgba(31,42,90,0.16)" />
        <Rect x={0} y={5} width={58} height={12} rx={6} fill={palette.slateLight} />
        <Rect x={4} y={7} width={22} height={4} rx={2} fill="rgba(255,255,255,0.6)" />
        <Rect x={23} y={0} width={12} height={7} rx={3.5} fill={palette.slate} />
      </Svg>
    </View>
  );
}

/** The rail of hanging tools every real kitchen has over the counter. */
export function UtensilRail({ s, x, y, w }: { s: number; x: number; y: number; w: number }) {
  const h = w * 0.42;
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 200 84">
        {/* the rail */}
        <Rect x={2} y={6} width={196} height={8} rx={4} fill={palette.slate} />
        <Rect x={2} y={6} width={196} height={3} rx={1.5} fill="rgba(255,255,255,0.45)" />
        <Rect x={0} y={2} width={9} height={16} rx={4} fill={palette.slateLight} />
        <Rect x={191} y={2} width={9} height={16} rx={4} fill={palette.slateLight} />

        {/* ladle */}
        <Path d="M40 12v34a14 14 0 0 0 28 0" stroke="#C7CEE0" strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path d="M46 46a12 12 0 0 0 22 0z" fill="#98A2C0" />
        {/* whisk */}
        <Rect x={94} y={10} width={8} height={22} rx={4} fill={palette.charcoal} />
        <Path d="M98 30c-13 6-15 22-4 30 11-8 9-24 4-30z" fill="#C7CEE0" />
        <Path d="M98 30c13 6 15 22 4 30-11-8-9-24-4-30z" fill="#98A2C0" />
        {/* wooden spoon */}
        <Rect x={140} y={10} width={8} height={40} rx={4} fill="#C08B4E" />
        <Ellipse cx={144} cy={60} rx={13} ry={11} fill="#DCA76B" />
        <Ellipse cx={141} cy={57} rx={5} ry={4} fill="rgba(255,255,255,0.4)" />
        {/* spatula */}
        <Rect x={176} y={10} width={7} height={32} rx={3.5} fill={palette.engineRedDark} />
        <Rect x={169} y={40} width={21} height={26} rx={7} fill={palette.engineRed} />
        <Rect x={173} y={44} width={6} height={18} rx={3} fill="rgba(255,255,255,0.32)" />
      </Svg>
    </View>
  );
}

/** A folded tea towel on a rail, with the station's stripe. It sways. */
export function TeaTowel({ s, x, y, w, tone = palette.engineRed }: { s: number; x: number; y: number; w: number; tone?: string }) {
  const h = w * 1.35;
  const sway = useSwing(1.1, 5200, 400);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value}deg` }] }));
  return (
    <Animated.View style={[at(s, x, y, w, h), style, { transformOrigin: 'top center' }]} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 60 81">
        <Rect x={2} y={0} width={56} height={7} rx={3.5} fill={palette.slate} />
        <Path d="M8 5h44v66a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#FFFDF6" />
        <Rect x={8} y={22} width={44} height={7} fill={tone} />
        <Rect x={8} y={34} width={44} height={4} fill={tone} opacity={0.55} />
        <Rect x={8} y={60} width={44} height={7} fill={tone} />
        <Path d="M8 5h11v70H12a4 4 0 0 1-4-4z" fill="rgba(255,255,255,0.55)" />
        <Path d="M41 5h11v66a4 4 0 0 1-4 4h-7z" fill={SHADE} />
      </Svg>
    </Animated.View>
  );
}

/** A window onto the station yard: sky, hill, the engine's roof, and a bird. */
export function KitchenWindow({ s, x, y, w }: { s: number; x: number; y: number; w: number }) {
  const h = w * 0.82;
  const drift = useSwing(3, 14000);
  const birdStyle = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * 5 }] }));
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 120 98">
        <Defs>
          <LinearGradient id="winsky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.skyTop} />
            <Stop offset="1" stopColor={palette.skyBottom} />
          </LinearGradient>
        </Defs>
        {/* reveal + frame */}
        <Rect x={0} y={0} width={120} height={92} rx={12} fill="#E8CFA3" />
        <Rect x={5} y={5} width={110} height={78} rx={8} fill="url(#winsky)" />
        {/* hills and the firehouse next door */}
        <Path d="M5 62c18-14 30-6 44 2 14 8 30 2 66-8v27H5z" fill={palette.grass} />
        <Path d="M5 74c22-8 40-2 60 4 18 5 34 3 50-2v7H5z" fill={palette.grassDark} />
        <Rect x={20} y={40} width={26} height={26} rx={4} fill="#FFEBC8" />
        <Path d="M17 41l16-13 16 13z" fill={palette.engineRed} />
        <Rect x={27} y={52} width={9} height={14} rx={2} fill={palette.charcoal} />
        <Rect x={72} y={52} width={34} height={14} rx={5} fill={palette.engineRed} />
        <Rect x={72} y={52} width={34} height={5} rx={2.5} fill={palette.engineRedLight} />
        <Circle cx={80} cy={67} r={5} fill={palette.charcoal} />
        <Circle cx={99} cy={67} r={5} fill={palette.charcoal} />
        {/* mullions */}
        <Rect x={57} y={5} width={6} height={78} fill="#E8CFA3" />
        <Rect x={5} y={41} width={110} height={6} fill="#E8CFA3" />
        <Rect x={5} y={5} width={110} height={78} rx={8} fill="none" stroke="#E8CFA3" strokeWidth={8} />
        <Rect x={9} y={9} width={102} height={20} rx={5} fill="rgba(255,255,255,0.22)" />
        {/* sill */}
        <Rect x={-4} y={86} width={128} height={12} rx={5} fill={palette.wood} />
        <Rect x={-4} y={86} width={128} height={4} rx={2} fill="rgba(255,255,255,0.35)" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, birdStyle]} pointerEvents="none">
        <Svg width={w * s} height={h * s} viewBox="0 0 120 98">
          <Path d="M74 24q5-5 10 0" stroke={palette.navySoft} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Path d="M86 20q4-4 8 0" stroke={palette.navySoft} strokeWidth={2} fill="none" strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** The station's chalkboard menu. Real chalk lines, no placeholder text. */
export function ChalkMenu({ s, x, y, w, lines = 3 }: { s: number; x: number; y: number; w: number; lines?: number }) {
  const h = w * 0.72;
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 110 79">
        <Rect x={0} y={0} width={110} height={74} rx={9} fill="#9E6A36" />
        <Rect x={5} y={5} width={100} height={60} rx={5} fill="#2F3A4E" />
        <Rect x={5} y={5} width={100} height={14} rx={5} fill="rgba(255,255,255,0.06)" />
        {/* "TODAY" underline */}
        <Rect x={16} y={14} width={34} height={4} rx={2} fill="rgba(255,255,255,0.75)" />
        <Rect x={16} y={21} width={48} height={2} rx={1} fill="rgba(255,255,255,0.35)" />
        {Array.from({ length: lines }, (_, i) => (
          <G key={`ln${i}`}>
            <Circle cx={19} cy={33 + i * 11} r={2.6} fill="rgba(255,255,255,0.55)" />
            <Rect x={26} y={31 + i * 11} width={60 - i * 13} height={3.4} rx={1.7} fill="rgba(255,255,255,0.5)" />
          </G>
        ))}
        <Rect x={0} y={66} width={110} height={9} rx={4} fill="#8A5A2C" />
        <Rect x={44} y={69} width={22} height={4} rx={2} fill="#F4EEE0" />
      </Svg>
    </View>
  );
}

/** A terracotta pot of basil on the sill. It breathes. */
export function HerbPot({ s, x, y, h }: { s: number; x: number; y: number; h: number }) {
  const w = h * 0.78;
  const sway = useSwing(1.6, 4200, 900);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value}deg` }] }));
  return (
    <Animated.View style={[at(s, x, y, w, h), style, { transformOrigin: 'bottom center' }]} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 62 80">
        <Ellipse cx={31} cy={77} rx={22} ry={4} fill="rgba(31,42,90,0.12)" />
        <Path d="M24 30q-14-6-12-18 13-2 16 12z" fill={palette.leafGreen} />
        <Path d="M38 30q14-6 12-18-13-2-16 12z" fill={palette.leafGreenDark} />
        <Path d="M31 32q-4-16 0-26 6 10 2 26z" fill={palette.grassDark} />
        <Path d="M25 34q-12 2-18-4 10-8 20 0z" fill={palette.leafGreen} />
        <Path d="M37 34q12 2 18-4-10-8-20 0z" fill={palette.grassDark} />
        <Path d="M12 38h38l-5 34a5 5 0 0 1-5 4H22a5 5 0 0 1-5-4z" fill="#C97A4E" />
        <Rect x={9} y={32} width={44} height={11} rx={5} fill="#E08A57" />
        <Path d="M14 43h7l4 33h-6z" fill="rgba(255,255,255,0.28)" />
        <Path d="M42 43h6l-5 33h-5z" fill={SHADE} />
      </Svg>
    </Animated.View>
  );
}

/** A wooden board with a crumb or two on it — the thing a counter is *for*. */
export function CuttingBoard({ s, x, y, w }: { s: number; x: number; y: number; w: number }) {
  const h = w * 0.5;
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 120 60">
        <Ellipse cx={60} cy={54} rx={52} ry={5} fill="rgba(31,42,90,0.10)" />
        <Rect x={4} y={12} width={112} height={40} rx={13} fill="#B87C41" />
        <Rect x={4} y={12} width={112} height={33} rx={13} fill="#DCA76B" />
        <Path d="M18 22q42-6 84 0" stroke="#C08B4E" strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.7} />
        <Path d="M18 34q42-5 84 0" stroke="#C08B4E" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.5} />
        <Circle cx={100} cy={8} r={5} fill="none" stroke="#B87C41" strokeWidth={4} />
        {/* crumbs */}
        <Circle cx={36} cy={40} r={2.4} fill="rgba(255,255,255,0.7)" />
        <Circle cx={47} cy={44} r={1.7} fill="rgba(255,255,255,0.6)" />
        <Circle cx={62} cy={39} r={2} fill="rgba(255,255,255,0.55)" />
        <Circle cx={78} cy={43} r={1.5} fill="rgba(255,255,255,0.5)" />
      </Svg>
    </View>
  );
}

/** Two nested mixing bowls, the way they actually live on a counter. */
export function MixingBowls({ s, x, y, w }: { s: number; x: number; y: number; w: number }) {
  const h = w * 0.72;
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 100 72">
        <Ellipse cx={50} cy={66} rx={40} ry={5} fill="rgba(31,42,90,0.10)" />
        <Path d="M6 28h88c0 24-16 38-44 38S6 52 6 28z" fill="#2E63B8" />
        <Ellipse cx={50} cy={28} rx={44} ry={9} fill="#5AA0E8" />
        <Ellipse cx={50} cy={28} rx={36} ry={6} fill="#2B5FB0" opacity={0.5} />
        <Path d="M17 40c4 11 14 19 25 20-15 1-27-7-31-18z" fill="rgba(255,255,255,0.26)" />
        <Path d="M22 14h56c0 13-9 20-28 20S22 27 22 14z" fill="#FFF3DC" />
        <Ellipse cx={50} cy={14} rx={28} ry={6} fill={palette.white} />
        <Ellipse cx={50} cy={14} rx={22} ry={4} fill="#F0DFBE" />
        <Path d="M28 20c3 6 9 10 16 11-9 1-16-4-19-11z" fill="rgba(255,255,255,0.55)" />
      </Svg>
    </View>
  );
}

/** Salt and pepper, drawn as a pair so the counter never has one lonely prop. */
export function SaltAndPepper({ s, x, y, h }: { s: number; x: number; y: number; h: number }) {
  const w = h * 1.15;
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 46 40">
        <Ellipse cx={23} cy={37} rx={20} ry={3.5} fill="rgba(31,42,90,0.10)" />
        <Rect x={2} y={12} width={18} height={25} rx={7} fill="#FFF8EA" />
        <Rect x={4} y={6} width={14} height={9} rx={4} fill={palette.slateLight} />
        <Circle cx={8} cy={10} r={1.2} fill={palette.slate} />
        <Circle cx={13} cy={10} r={1.2} fill={palette.slate} />
        <Rect x={5} y={16} width={5} height={16} rx={2.5} fill="rgba(255,255,255,0.7)" />
        <Rect x={25} y={14} width={18} height={23} rx={7} fill="#6B76A8" />
        <Rect x={27} y={8} width={14} height={9} rx={4} fill={palette.slateLight} />
        <Circle cx={31} cy={12} r={1.2} fill={palette.slate} />
        <Circle cx={36} cy={12} r={1.2} fill={palette.slate} />
        <Rect x={28} y={18} width={5} height={15} rx={2.5} fill="rgba(255,255,255,0.35)" />
      </Svg>
    </View>
  );
}

/** Flour dust and crumbs scattered on the worktop. Cheap, and it sells the room. */
export function CounterCrumbs({ s, x, y, w, seed = 0 }: { s: number; x: number; y: number; w: number; seed?: number }) {
  const h = 18;
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const t = (i * 2.399963 + seed) % 1;
        return { cx: ((i * 37 + seed * 13) % 100) + t, cy: 4 + ((i * 53) % 11), r: 1.2 + ((i + seed) % 3) * 0.7 };
      }),
    [seed],
  );
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 102 18">
        {dots.map((d, i) => (
          <Circle key={`c${i}`} cx={d.cx} cy={d.cy} r={d.r} fill={i % 3 === 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)'} />
        ))}
      </Svg>
    </View>
  );
}

/** A pinned paper note — the recipe somebody stuck on the wall. */
export function PinnedNote({ s, x, y, w, tone = '#FFF8EA' }: { s: number; x: number; y: number; w: number; tone?: string }) {
  const h = w * 1.18;
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 70 83">
        <Path d="M6 8h58v66l-9 7H6z" fill="rgba(31,42,90,0.10)" transform="translate(2,3)" />
        <Path d="M6 8h58v66l-9 7H6z" fill={tone} />
        <Path d="M64 74l-9 7v-7z" fill="#EAD9B8" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect key={`l${i}`} x={14} y={26 + i * 10} width={i % 2 ? 30 : 42} height={3.2} rx={1.6} fill="rgba(31,42,90,0.20)" />
        ))}
        <Rect x={14} y={15} width={26} height={5} rx={2.5} fill={palette.engineRed} />
        <Circle cx={35} cy={8} r={6} fill={palette.engineRed} />
        <Circle cx={33} cy={6} r={2} fill="rgba(255,255,255,0.6)" />
      </Svg>
    </View>
  );
}

/**
 * The splashback: the panel of pale tiles that protects the wall behind a
 * worktop, capped by one accent course. It is the one place a kitchen is
 * allowed a pattern, and it puts a line of colour into a room that would
 * otherwise be entirely cream. `y` is the top of the accent course; the panel
 * runs `depth` units down from there, to the worktop.
 */
export function SplashbackBand({ s, x, y, w, depth = 34 }: { s: number; x: number; y: number; w: number; depth?: number }) {
  const band = 22;
  const h = Math.max(band + 2, depth);
  const cell = 30;
  const n = Math.max(2, Math.round(w / cell));
  const step = w / n;
  const tones = [palette.engineRed, palette.safetyYellow, palette.leafGreen, palette.waterCyan];
  const rows = Math.max(1, Math.round((h - band) / 18));
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox={`0 0 ${w} ${h}`}>
        {/* the plain tile field under the accent course */}
        <Rect x={0} y={band} width={w} height={h - band} fill="#FDF3E0" />
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: n * 2 + 1 }, (_, c) => (
            <Rect
              key={`sp${r}-${c}`}
              x={c * (step / 2) + (r % 2 ? step / 4 : 0) - 0.6}
              y={band + r * ((h - band) / rows)}
              width={1.2}
              height={(h - band) / rows}
              fill={GROUT}
            />
          )),
        )}
        {Array.from({ length: rows }, (_, r) => (
          <Rect key={`sr${r}`} x={0} y={band + r * ((h - band) / rows)} width={w} height={1.2} fill={GROUT} />
        ))}
        {/* the accent course */}
        <Rect x={0} y={0} width={w} height={band} fill="#FFF8EA" />
        {Array.from({ length: n }, (_, i) => {
          const c = tones[i % tones.length] ?? palette.engineRed;
          const cx = i * step + step / 2;
          return (
            <G key={`t${i}`}>
              <Rect x={i * step + 1} y={1} width={step - 2} height={band - 2} rx={2.5} fill="#FFFDF6" />
              <Path d={`M${cx} 5 L${cx + 6.5} ${band / 2} L${cx} ${band - 5} L${cx - 6.5} ${band / 2} Z`} fill={c} opacity={0.9} />
            </G>
          );
        })}
        <Rect x={0} y={0} width={w} height={2.5} rx={1.25} fill="rgba(255,255,255,0.55)" />
        <Rect x={0} y={band - 2} width={w} height={2.5} fill="rgba(31,42,90,0.10)" />
      </Svg>
    </View>
  );
}

/**
 * The hob the pot stands on: an enamel deck with two rings, a lit one under the
 * pan, and two control knobs on the fascia. The kitchen's only heat, and it is
 * drawn contained — no flames, per the safety direction.
 */
export function Hob({ s, x, y, w, lit = false }: { s: number; x: number; y: number; w: number; lit?: boolean }) {
  const h = w * 0.36;
  return (
    <View style={at(s, x, y, w, h)} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 240 86">
        <Ellipse cx={120} cy={78} rx={112} ry={8} fill="rgba(31,42,90,0.14)" />
        {/* deck */}
        <Rect x={4} y={10} width={232} height={48} rx={12} fill="#5A648A" />
        <Rect x={4} y={10} width={232} height={30} rx={12} fill="#767FA3" />
        <Rect x={10} y={14} width={90} height={5} rx={2.5} fill="rgba(255,255,255,0.3)" />
        {/* rings */}
        <Ellipse cx={84} cy={30} rx={54} ry={15} fill="#3B4460" />
        <Ellipse cx={84} cy={28} rx={46} ry={12} fill={lit ? '#F0A24B' : '#4B5573'} />
        <Ellipse cx={84} cy={28} rx={30} ry={7.5} fill={lit ? '#FFC463' : '#5A648A'} />
        <Ellipse cx={186} cy={32} rx={30} ry={9} fill="#3B4460" />
        <Ellipse cx={186} cy={30} rx={24} ry={7} fill="#4B5573" />
        {/* fascia + knobs */}
        <Rect x={4} y={52} width={232} height={22} rx={9} fill="#3B4460" />
        <Circle cx={196} cy={63} r={9} fill="#D9DDEC" />
        <Rect x={195} y={56} width={3} height={7} rx={1.5} fill={palette.navy} />
        <Circle cx={220} cy={63} r={9} fill="#D9DDEC" />
        <Rect x={219} y={57} width={3} height={7} rx={1.5} fill={palette.navy} />
        <Rect x={16} y={58} width={140} height={9} rx={4.5} fill="rgba(255,255,255,0.14)" />
      </Svg>
    </View>
  );
}

/** Steam curling up off something hot. Slow, and it stops for reduced motion. */
export function Steam({ s, x, y, w, strength = 1 }: { s: number; x: number; y: number; w: number; strength?: number }) {
  const rise = useSwing(1, 3200);
  const style = useAnimatedStyle(() => ({
    opacity: 0.3 + (rise.value + 1) * 0.2 * strength,
    transform: [{ translateY: -rise.value * 5 * s }, { scaleX: 1 + rise.value * 0.05 }],
  }));
  const h = w * 0.62;
  return (
    <Animated.View style={[at(s, x, y, w, h), style]} pointerEvents="none">
      <Svg width={w * s} height={h * s} viewBox="0 0 120 74">
        <Path d="M28 72c-12-14 10-19 0-33s12-21 12-21" stroke="rgba(255,255,255,0.85)" strokeWidth={8} strokeLinecap="round" fill="none" />
        <Path d="M62 72c-12-16 12-21 2-35s10-19 10-19" stroke="rgba(255,255,255,0.7)" strokeWidth={8} strokeLinecap="round" fill="none" />
        <Path d="M94 72c-10-13 9-17 1-29s9-16 9-16" stroke="rgba(255,255,255,0.55)" strokeWidth={7} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Composites                                                           */
/* ------------------------------------------------------------------ */

export interface WallDressProps {
  s: number;
  /** the play area, in design units */
  w: number;
  /** the band of wall to dress: from `top` down to `bottom` */
  top: number;
  bottom: number;
  /** leave this middle slice clear — the activity lives there */
  keepOut?: { x: number; w: number };
  variant?: 'window' | 'menu' | 'shelf';
}

/**
 * Dresses a band of wall down BOTH sides of the play area, leaving the middle
 * for the activity. This is what replaces "a big band of counter that does
 * nothing": whatever room the hero object does not need becomes a window, a
 * shelf of jars, a rail of tools or a chalk menu — things that belong in a
 * kitchen and give the eye somewhere to go.
 */
export function WallDressing({ s, w, top, bottom, variant = 'window' }: WallDressProps) {
  const band = bottom - top;
  if (band < 54) return null;
  const side = Math.min(112, w * 0.27);
  const railW = Math.min(150, side * 1.28);

  return (
    <>
      {/* LEFT: a shelf of jars over a folded tea towel */}
      <Shelf s={s} x={6} y={top + band * 0.34} w={side} />
      <JarRow s={s} x={10} y={top + band * 0.34} w={side - 8} h={Math.min(52, band * 0.32)} seed={1} />
      {band > 150 ? <TeaTowel s={s} x={10} y={top + band * 0.62} w={Math.min(40, side * 0.36)} /> : null}
      {band > 150 ? <HerbPot s={s} x={side * 0.52} y={top + band * 0.60} h={Math.min(60, band * 0.3)} /> : null}

      {/* RIGHT: the window (or the menu), with the utensil rail under it */}
      {variant === 'menu' ? (
        <ChalkMenu s={s} x={w - side - 6} y={top + 4} w={side} />
      ) : variant === 'shelf' ? (
        <>
          <Shelf s={s} x={w - side - 6} y={top + band * 0.34} w={side} />
          <JarRow s={s} x={w - side - 2} y={top + band * 0.34} w={side - 8} h={Math.min(52, band * 0.32)} seed={4} />
        </>
      ) : (
        <KitchenWindow s={s} x={w - side - 6} y={top + 2} w={side} />
      )}
      {band > 140 ? <UtensilRail s={s} x={w - railW - 4} y={top + band * 0.66} w={railW} /> : null}
    </>
  );
}

/**
 * The whole room, as a screen-sized BACKDROP — for the kitchen screens whose
 * activity is a card rather than an object (Recipe Scale's ingredient list, the
 * recipe runner's dialogue). It measures itself and draws the wall, a dressed
 * shelf, a window, a rail of tools and a counter across the foot, so the card
 * floats in a kitchen instead of on a flat beige field.
 *
 * `counterAt` is the fraction of the height the worktop sits at.
 */
export function KitchenRoomBackdrop({ counterAt = 0.8 }: { counterAt?: number }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((b) => (Math.abs(b.w - width) < 1 && Math.abs(b.h - height) < 1 ? b : { w: width, h: height }));
  }, []);

  const { w, h } = box;
  const counterY = h * counterAt;
  const side = Math.min(150, w * 0.3);
  const shelfY = Math.min(h * 0.2, counterY - 200);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      <KitchenWall />
      {w > 0 && h > 0 ? (
        <>
          {shelfY > 60 ? (
            <>
              <Shelf s={1} x={10} y={shelfY} w={side} />
              <StoreJar s={1} x={16} y={shelfY - 46} h={44} tone="honey" />
              <Canister s={1} x={54} y={shelfY - 50} h={48} tone="#E8C89B" />
              <StoreJar s={1} x={96} y={shelfY - 42} h={40} tone="herbs" />
            </>
          ) : null}
          <KitchenWindow s={1} x={w - side - 10} y={Math.max(8, shelfY - 130)} w={side} />
          <UtensilRail s={1} x={w / 2 - 70} y={Math.max(6, shelfY - 70)} w={140} />
          <SplashbackBand s={1} x={0} y={counterY - 62} w={w} depth={62} />
          <CounterRun s={1} w={w} y={counterY} h={h - counterY + 20} />
          <CounterCrumbs s={1} x={w * 0.3} y={counterY - 12} w={w * 0.4} seed={7} />
          <HerbPot s={1} x={16} y={counterY - 54} h={52} />
          <MixingBowls s={1} x={w - 92} y={counterY - 48} w={72} />
          <TeaTowel s={1} x={w - 150} y={counterY - 116} w={38} />
        </>
      ) : null}
    </View>
  );
}
