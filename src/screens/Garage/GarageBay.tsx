import React, { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette, radii } from '@/theme';
import { useIdleBob, useLoop, usePulse } from '@/hooks';

/**
 * Bay 1 — the room the truck lives in.
 *
 * Built to the ten consistency rules in docs/ART_CRITIQUE.md: no outlines, one
 * shade tone and one highlight per object, a shadow ellipse under everything
 * that touches the floor, palette tokens only, navy-tinted greys, a ground
 * plane with a soft lip rather than a seam, and three things that never stop
 * moving (the work lamps sway, their glow breathes, a slow sheen crosses the
 * wet floor) — all of which stop when the child asks for less motion.
 *
 * Stays 2D: the truck itself is a transparent GL canvas layered on top.
 */

/** The three tones every solid in here is built from (critique rule 2). */
const SHADE = 'rgba(31,42,90,0.14)';
const HILITE = 'rgba(255,255,255,0.32)';
/** Contact shadow for anything standing on the floor (rule 3). */
const GROUND = 'rgba(31,42,90,0.12)';
/** A softer version, for things hanging on the wall. */
const WALL_SHADOW = 'rgba(31,42,90,0.1)';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/* ------------------------------------------------------------------ */
/* Props on the wall                                                    */
/* ------------------------------------------------------------------ */

/** A pegboard of tools: board, holes, hooks and five drawn tools. */
function Pegboard({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const cols = 7;
  const rows = 4;
  return (
    <G>
      {/* the board casts onto the wall */}
      <Rect x={x + 4} y={y + 6} width={w} height={h} rx={radii.tile} fill={WALL_SHADOW} />
      <Rect x={x} y={y} width={w} height={h} rx={radii.tile} fill={palette.creamDeep} />
      <Rect x={x} y={y} width={w} height={10} rx={5} fill={HILITE} />
      <Rect x={x} y={y + h - 12} width={w} height={12} rx={6} fill={SHADE} />

      {Array.from({ length: cols * rows }, (_, i) => (
        <Circle
          key={i}
          cx={x + w * ((i % cols) + 0.5) / cols}
          cy={y + 16 + (h - 30) * (Math.floor(i / cols) + 0.3) / rows}
          r={2}
          fill={SHADE}
        />
      ))}

      {/* wrench */}
      <G>
        <Path d={`M ${x + w * 0.16} ${y + h * 0.32} l ${w * 0.1} ${h * 0.34}`} stroke={SHADE} strokeWidth={9} strokeLinecap="round" />
        <Path d={`M ${x + w * 0.15} ${y + h * 0.3} l ${w * 0.1} ${h * 0.34}`} stroke={palette.slate} strokeWidth={8} strokeLinecap="round" />
        <Circle cx={x + w * 0.15} cy={y + h * 0.3} r={9} fill={palette.slate} />
        <Circle cx={x + w * 0.15} cy={y + h * 0.3} r={4} fill={palette.creamDeep} />
      </G>
      {/* screwdriver */}
      <G>
        <Rect x={x + w * 0.3} y={y + h * 0.26} width={9} height={h * 0.24} rx={4.5} fill={palette.engineRed} />
        <Rect x={x + w * 0.3 + 1.6} y={y + h * 0.27} width={3} height={h * 0.2} rx={1.5} fill={HILITE} />
        <Rect x={x + w * 0.3 + 2} y={y + h * 0.5} width={5} height={h * 0.24} rx={2.5} fill={palette.slate} />
      </G>
      {/* hammer */}
      <G>
        <Rect x={x + w * 0.45} y={y + h * 0.34} width={7} height={h * 0.4} rx={3.5} fill={palette.wood} />
        <Path d={`M ${x + w * 0.41} ${y + h * 0.3} h 22 a 6 6 0 0 1 6 6 v 6 a 6 6 0 0 1 -6 6 h -22 z`} fill={palette.slate} />
        <Rect x={x + w * 0.41} y={y + h * 0.3} width={20} height={4} rx={2} fill={HILITE} />
      </G>
      {/* pliers */}
      <G>
        <Path
          d={`M ${x + w * 0.66} ${y + h * 0.28} l ${w * 0.05} ${h * 0.2} l -3 ${h * 0.22}`}
          stroke={palette.slate}
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`M ${x + w * 0.74} ${y + h * 0.28} l -${w * 0.05} ${h * 0.2} l 3 ${h * 0.22}`}
          stroke={palette.slate}
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx={x + w * 0.7} cy={y + h * 0.48} r={5} fill={palette.slateLight} />
      </G>
      {/* spanner */}
      <G>
        <Rect x={x + w * 0.85} y={y + h * 0.3} width={8} height={h * 0.42} rx={4} fill={palette.slateLight} />
        <Path d={`M ${x + w * 0.85 - 4} ${y + h * 0.3} h 16 v 8 h -5 v 5 h -6 v -5 h -5 z`} fill={palette.slateLight} />
      </G>
    </G>
  );
}

/** Wall hose reel: bracket, red drum, coiled yellow line and a hanging tail. */
function HoseReel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx + 4} cy={cy + 6} r={r} fill={WALL_SHADOW} />
      {/* bracket */}
      <Rect x={cx - 7} y={cy - r - 16} width={14} height={20} rx={6} fill={palette.slate} />
      <Rect x={cx - r * 0.5} y={cy - r - 20} width={r} height={9} rx={4.5} fill={palette.slateLight} />
      {/* drum */}
      <Circle cx={cx} cy={cy} r={r} fill={palette.engineRed} />
      <Path d={`M ${cx - r} ${cy} a ${r} ${r} 0 0 1 ${r} -${r} l 0 4 a ${r - 4} ${r - 4} 0 0 0 -${r - 4} ${r - 4} z`} fill={HILITE} />
      <Circle cx={cx} cy={cy} r={r * 0.78} fill={palette.engineRedDark} />
      {/* coiled hose */}
      <Circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={palette.safetyYellow} strokeWidth={r * 0.2} />
      <Circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke={palette.gold} strokeWidth={r * 0.16} />
      <Circle cx={cx} cy={cy} r={r * 0.18} fill={palette.slateLight} />
      {/* the tail, hanging down the wall */}
      <Path
        d={`M ${cx + r * 0.62} ${cy} q ${r * 0.7} ${r * 0.7} ${r * 0.2} ${r * 1.5} q -${r * 0.4} ${r * 0.7} ${r * 0.2} ${r * 1.1}`}
        stroke={palette.safetyYellow}
        strokeWidth={r * 0.18}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={cx + r * 1.04} cy={cy + r * 2.6} r={r * 0.15} fill={palette.slate} />
    </G>
  );
}

/** A bank of two tall lockers with a spare helmet resting on top. */
function Lockers({ x, y, w, floorY }: { x: number; y: number; w: number; floorY: number }) {
  const h = floorY - y;
  const doorW = (w - 14) / 2;
  const helmetR = Math.min(22, w * 0.26);
  return (
    <G>
      <Ellipse cx={x + w / 2} cy={floorY + 6} rx={w * 0.62} ry={w * 0.14} fill={GROUND} />
      {/* carcass + a shaded side plane so it reads 2.5D */}
      <Path d={`M ${x + w} ${y + 10} l 12 -10 l 0 ${h - 4} l -12 10 z`} fill={SHADE} />
      <Rect x={x} y={y} width={w} height={h} rx={radii.tag} fill={palette.slate} />
      <Rect x={x} y={y} width={w} height={9} rx={4.5} fill={HILITE} />

      {[0, 1].map((i) => {
        const dx = x + 5 + i * (doorW + 4);
        return (
          <G key={i}>
            <Rect x={dx} y={y + 12} width={doorW} height={h - 24} rx={12} fill={palette.slateLight} />
            <Rect x={dx} y={y + 12} width={doorW} height={7} rx={3.5} fill={HILITE} />
            {/* vents */}
            {[0, 1, 2].map((v) => (
              <Rect key={v} x={dx + doorW * 0.22} y={y + 26 + v * 8} width={doorW * 0.56} height={3.4} rx={1.7} fill={SHADE} />
            ))}
            {/* number plate */}
            <Rect x={dx + doorW * 0.28} y={y + 58} width={doorW * 0.44} height={14} rx={6} fill={palette.cream} />
            <Rect x={dx + doorW * 0.38} y={y + 63} width={doorW * 0.24} height={4} rx={2} fill={palette.navySoft} />
            {/* handle */}
            <Rect x={dx + doorW * 0.72} y={y + h * 0.52} width={7} height={22} rx={3.5} fill={palette.navySoft} />
            <Rect x={dx} y={y + h - 30} width={doorW} height={18} rx={8} fill={SHADE} />
          </G>
        );
      })}

      {/* spare helmet, fully in frame, sitting on the lockers */}
      <G>
        <Ellipse cx={x + w * 0.5} cy={y - 2} rx={helmetR * 1.15} ry={helmetR * 0.24} fill={SHADE} />
        <Path
          d={`M ${x + w * 0.5 - helmetR} ${y - 4} c 0 -${helmetR * 1.25} ${helmetR * 0.55} -${helmetR * 1.5} ${helmetR} -${helmetR * 1.5} c ${helmetR * 0.45} 0 ${helmetR} ${helmetR * 0.25} ${helmetR} ${helmetR * 1.5} z`}
          fill={palette.engineRed}
        />
        <Path
          d={`M ${x + w * 0.5 - helmetR * 0.62} ${y - 8} c 0 -${helmetR * 0.85} ${helmetR * 0.3} -${helmetR} ${helmetR * 0.5} -${helmetR}`}
          stroke={HILITE}
          strokeWidth={helmetR * 0.3}
          strokeLinecap="round"
          fill="none"
        />
        <Ellipse cx={x + w * 0.5} cy={y - 4} rx={helmetR * 1.3} ry={helmetR * 0.3} fill={palette.engineRedDark} />
        <Circle cx={x + w * 0.5} cy={y - helmetR * 0.85} r={helmetR * 0.3} fill={palette.safetyYellow} />
      </G>
    </G>
  );
}

/** Workbench: wooden top, two drawers, a toolbox and a little task lamp. */
function Workbench({ x, y, w, floorY }: { x: number; y: number; w: number; floorY: number }) {
  const h = floorY - y;
  const boxW = w * 0.3;
  return (
    <G>
      <Ellipse cx={x + w / 2} cy={floorY + 5} rx={w * 0.56} ry={w * 0.1} fill={GROUND} />
      {/* legs */}
      <Rect x={x + 10} y={y + 26} width={12} height={h - 20} rx={6} fill={palette.woodDark} />
      <Rect x={x + w - 22} y={y + 26} width={12} height={h - 20} rx={6} fill={palette.woodDark} />
      {/* drawer block */}
      <Rect x={x + w * 0.34} y={y + 24} width={w * 0.52} height={h - 30} rx={radii.tag} fill={palette.wood} />
      {[0, 1].map((i) => (
        <G key={i}>
          <Rect x={x + w * 0.37} y={y + 32 + i * (h * 0.3)} width={w * 0.46} height={h * 0.24} rx={9} fill={palette.woodDark} />
          <Rect x={x + w * 0.52} y={y + 40 + i * (h * 0.3)} width={w * 0.16} height={6} rx={3} fill={palette.slateLight} />
        </G>
      ))}
      {/* top */}
      <Rect x={x} y={y + 12} width={w} height={16} rx={8} fill={palette.woodDark} />
      <Rect x={x} y={y + 6} width={w} height={16} rx={8} fill={palette.wood} />
      <Rect x={x + 4} y={y + 8} width={w - 8} height={5} rx={2.5} fill={HILITE} />

      {/* toolbox on the bench */}
      <G>
        <Ellipse cx={x + w * 0.24} cy={y + 6} rx={boxW * 0.6} ry={4} fill={SHADE} />
        <Rect x={x + w * 0.24 - boxW / 2} y={y - 20} width={boxW} height={26} rx={8} fill={palette.engineRed} />
        <Rect x={x + w * 0.24 - boxW / 2} y={y - 20} width={boxW} height={7} rx={3.5} fill={HILITE} />
        <Path
          d={`M ${x + w * 0.24 - boxW * 0.22} ${y - 20} a ${boxW * 0.22} ${boxW * 0.22} 0 0 1 ${boxW * 0.44} 0`}
          stroke={palette.slate}
          strokeWidth={4}
          fill="none"
        />
      </G>

      {/* task lamp */}
      <G>
        <Rect x={x + w * 0.74} y={y - 4} width={18} height={10} rx={5} fill={palette.slate} />
        <Path
          d={`M ${x + w * 0.74 + 9} ${y - 2} l 0 -26 l 20 -14`}
          stroke={palette.slate}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path d={`M ${x + w * 0.74 + 22} ${y - 46} l 22 -8 l 6 16 l -22 8 z`} fill={palette.safetyYellow} />
        <Path d={`M ${x + w * 0.74 + 24} ${y - 44} l 18 -6 l 2 5 l -18 6 z`} fill={HILITE} />
      </G>
    </G>
  );
}

/** Three tyres, stacked and slightly offset, standing on the floor. */
function TyreStack({ cx, floorY, rx }: { cx: number; floorY: number; rx: number }) {
  const ry = rx * 0.36;
  return (
    <G>
      <Ellipse cx={cx} cy={floorY + 4} rx={rx * 1.12} ry={ry * 0.6} fill={GROUND} />
      {[0, 1, 2].map((i) => {
        const cy = floorY - ry - i * ry * 1.35;
        return (
          <G key={i}>
            <Ellipse cx={cx + (i % 2 ? 3 : -3)} cy={cy + ry * 0.34} rx={rx} ry={ry} fill={palette.charcoalDark} />
            <Ellipse cx={cx + (i % 2 ? 3 : -3)} cy={cy} rx={rx} ry={ry} fill={palette.charcoal} />
            <Ellipse cx={cx + (i % 2 ? 3 : -3)} cy={cy - ry * 0.24} rx={rx * 0.82} ry={ry * 0.6} fill={SHADE} />
            <Ellipse cx={cx + (i % 2 ? 3 : -3)} cy={cy} rx={rx * 0.42} ry={ry * 0.44} fill={palette.charcoalDark} />
          </G>
        );
      })}
    </G>
  );
}

/** The one plaque motif: cream sign board on a tan edge. */
function BaySign({ x, y, w }: { x: number; y: number; w: number }) {
  const h = w * 0.4;
  return (
    <G>
      <Rect x={x + 3} y={y + 5} width={w} height={h} rx={radii.tag} fill={WALL_SHADOW} />
      <Rect x={x} y={y} width={w} height={h} rx={radii.tag} fill={palette.tanDark} />
      <Rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={radii.tag - 4} fill={palette.cream} />
      {/* "BAY 1" as drawn marks — no type inside the world layer */}
      <Rect x={x + w * 0.16} y={y + h * 0.4} width={w * 0.4} height={h * 0.16} rx={h * 0.08} fill={palette.navySoft} />
      <Rect x={x + w * 0.62} y={y + h * 0.32} width={h * 0.12} height={h * 0.34} rx={h * 0.06} fill={palette.engineRed} />
      <Rect x={x + w * 0.16} y={y + h * 0.66} width={w * 0.28} height={h * 0.1} rx={h * 0.05} fill={palette.slateLight} />
    </G>
  );
}

/* ------------------------------------------------------------------ */
/* The bay                                                              */
/* ------------------------------------------------------------------ */

export const GarageBay = memo(function GarageBay() {
  const { width, height } = useWindowDimensions();
  const w = Math.max(360, width);
  const h = Math.max(600, height);
  /** The floor meets the wall behind the truck, so the truck stands in front of it. */
  const floorY = clamp(Math.round(h * 0.37), 210, 420);

  /** Life: the lamps sway, their glow breathes, a sheen crosses the wet floor. */
  const sway = useIdleBob(1.4, 5200);
  const sway2 = useIdleBob(1.1, 6100, Math.PI);
  const glow = usePulse(3800, 0.55);
  const sheen = useLoop(26000);

  const lampX = useMemo(() => [w * 0.2, w * 0.8] as const, [w]);
  const lampH = floorY + 40;

  const lampAStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value}deg` }] }));
  const lampBStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway2.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.34 + glow.value * 0.3 }));
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: 0.1 + Math.sin(sheen.value * Math.PI) * 0.12,
    transform: [{ translateX: -w * 0.5 + sheen.value * w * 1.6 }],
  }));

  const lampW = Math.min(220, w * 0.46);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id="bayWall" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.tanDark} />
            <Stop offset="0.35" stopColor={palette.tan} />
            <Stop offset="1" stopColor={palette.creamDeep} />
          </LinearGradient>
          <LinearGradient id="bayFloor" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.slate} />
            <Stop offset="0.18" stopColor={palette.slateLight} />
            <Stop offset="1" stopColor="#B9C0D4" />
          </LinearGradient>
          <LinearGradient id="bayVignette" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.navy} stopOpacity={0.16} />
            <Stop offset="0.3" stopColor={palette.navy} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* ── wall ──────────────────────────────────────────── */}
        <Rect x={0} y={0} width={w} height={floorY + 2} fill="url(#bayWall)" />
        {/* brick courses + staggered joints, kept faint */}
        {Array.from({ length: 8 }, (_, i) => {
          const y = 34 + i * ((floorY - 34) / 8);
          return (
            <G key={i}>
              <Rect x={0} y={y} width={w} height={2} fill={SHADE} opacity={0.45} />
              {Array.from({ length: 6 }, (_, j) => (
                <Rect key={j} x={((j + (i % 2) * 0.5) * w) / 6} y={y} width={2} height={(floorY - 34) / 8} fill={SHADE} opacity={0.28} />
              ))}
            </G>
          );
        })}
        <Rect x={0} y={0} width={w} height={floorY * 0.45} fill="url(#bayVignette)" />

        {/* red hazard band along the wall */}
        <Rect x={0} y={floorY - 62} width={w} height={16} rx={8} fill={palette.engineRed} opacity={0.9} />
        <Rect x={0} y={floorY - 62} width={w} height={5} rx={2.5} fill={HILITE} />

        {/* ceiling beam */}
        <Rect x={0} y={0} width={w} height={22} fill={palette.charcoal} />
        <Rect x={0} y={18} width={w} height={5} fill={SHADE} />
        <Rect x={0} y={2} width={w} height={4} fill={HILITE} />

        {/* ── wall furniture ───────────────────────────────── */}
        <BaySign x={w * 0.04} y={38} w={Math.min(120, w * 0.3)} />
        <HoseReel cx={w * 0.72} cy={clamp(floorY * 0.32, 76, 130)} r={Math.min(30, w * 0.075)} />
        <Pegboard x={w * 0.56} y={clamp(floorY * 0.52, 118, 210)} w={w * 0.4} h={clamp(floorY * 0.3, 84, 130)} />

        {/* ── floor ─────────────────────────────────────────── */}
        <Rect x={0} y={floorY} width={w} height={h - floorY} fill="url(#bayFloor)" />
        {/* the soft lip where the floor meets the wall — never a hard seam */}
        <Rect x={0} y={floorY - 4} width={w} height={9} rx={4.5} fill={palette.slateLight} opacity={0.75} />
        <Rect x={0} y={floorY + 5} width={w} height={5} fill={SHADE} opacity={0.5} />

        {/* painted bay guide lines, opening toward the viewer */}
        <Path d={`M ${w * 0.2} ${floorY + 26} L ${w * 0.02} ${h} L ${w * 0.09} ${h} L ${w * 0.26} ${floorY + 26} Z`} fill={palette.safetyYellow} opacity={0.5} />
        <Path d={`M ${w * 0.8} ${floorY + 26} L ${w * 0.98} ${h} L ${w * 0.91} ${h} L ${w * 0.74} ${floorY + 26} Z`} fill={palette.safetyYellow} opacity={0.5} />

        {/* oil stain + puddle */}
        <Ellipse cx={w * 0.36} cy={floorY + (h - floorY) * 0.34} rx={w * 0.1} ry={(h - floorY) * 0.05} fill={palette.navy} opacity={0.07} />
        <G>
          <Ellipse cx={w * 0.63} cy={floorY + (h - floorY) * 0.3} rx={w * 0.16} ry={(h - floorY) * 0.06} fill={palette.waterCyan} opacity={0.22} />
          <Ellipse cx={w * 0.63} cy={floorY + (h - floorY) * 0.29} rx={w * 0.12} ry={(h - floorY) * 0.04} fill={palette.waterCyanLight} opacity={0.35} />
          <Ellipse cx={w * 0.58} cy={floorY + (h - floorY) * 0.275} rx={w * 0.05} ry={(h - floorY) * 0.014} fill="#FFFFFF" opacity={0.45} />
        </G>

        {/* ── things standing on the floor ─────────────────── */}
        <Lockers x={w * 0.025} y={clamp(floorY * 0.34, 84, 150)} w={Math.min(104, w * 0.2)} floorY={floorY} />
        <TyreStack cx={w * 0.15} floorY={floorY + (h - floorY) * 0.2} rx={Math.min(46, w * 0.1)} />
        <Workbench
          x={w * 0.6}
          y={floorY + (h - floorY) * 0.06}
          w={Math.min(180, w * 0.37)}
          floorY={floorY + (h - floorY) * 0.28}
        />
      </Svg>

      {/* ── the two work lamps, swaying on their cables ────── */}
      {lampX.map((x, i) => (
        <Animated.View
          key={x}
          style={[
            styles.lamp,
            { left: x - lampW / 2, width: lampW, height: lampH },
            i === 0 ? lampAStyle : lampBStyle,
          ]}
        >
          <Svg width={lampW} height={lampH} viewBox={`0 0 ${lampW} ${lampH}`}>
            <Rect x={lampW / 2 - 2.5} y={0} width={5} height={30} rx={2.5} fill={palette.charcoalDark} />
            <Path d={`M ${lampW / 2 - 30} 52 Q ${lampW / 2} 20 ${lampW / 2 + 30} 52 Z`} fill={palette.engineRed} />
            <Path d={`M ${lampW / 2 - 20} 44 Q ${lampW / 2 - 6} 27 ${lampW / 2 + 2} 26`} stroke={HILITE} strokeWidth={5} strokeLinecap="round" fill="none" />
            <Ellipse cx={lampW / 2} cy={52} rx={30} ry={7} fill={palette.engineRedDark} />
            <Ellipse cx={lampW / 2} cy={51} rx={22} ry={5} fill={palette.safetyYellow} />
          </Svg>
        </Animated.View>
      ))}

      {/* their light pools, breathing */}
      {lampX.map((x, i) => (
        <Animated.View key={`cone${x}`} style={[styles.lamp, { left: x - lampW / 2, width: lampW, height: lampH }, glowStyle]}>
          <Svg width={lampW} height={lampH} viewBox={`0 0 ${lampW} ${lampH}`}>
            <Defs>
              <LinearGradient id={`cone${i}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.flameCore} stopOpacity={0.72} />
                <Stop offset="1" stopColor={palette.flameCore} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path
              d={`M ${lampW / 2 - 28} 54 L ${lampW / 2 - lampW * 0.44} ${lampH} L ${lampW / 2 + lampW * 0.44} ${lampH} L ${lampW / 2 + 28} 54 Z`}
              fill={`url(#cone${i})`}
            />
          </Svg>
        </Animated.View>
      ))}

      {/* a slow sheen crossing the wet floor */}
      <Animated.View style={[styles.sheen, { top: floorY + 6, width: w * 0.5, height: (h - floorY) * 0.5 }, sheenStyle]}>
        <Svg width={w * 0.5} height={(h - floorY) * 0.5}>
          <Ellipse cx={w * 0.25} cy={(h - floorY) * 0.25} rx={w * 0.24} ry={(h - floorY) * 0.22} fill="#FFFFFF" />
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  lamp: { position: 'absolute', top: 0, transformOrigin: 'top center' },
  sheen: { position: 'absolute', left: 0 },
});
