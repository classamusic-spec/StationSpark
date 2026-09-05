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
      <Rect x={x} y={y} width={w} height={h} rx={radii.tile} fill={palette.wood} />
      <Rect x={x} y={y} width={w} height={10} rx={5} fill={HILITE} />
      <Rect x={x} y={y + h - 12} width={w} height={12} rx={6} fill={SHADE} />

      {Array.from({ length: cols * rows }, (_, i) => (
        <Circle
          key={i}
          cx={x + w * ((i % cols) + 0.5) / cols}
          cy={y + 16 + (h - 30) * (Math.floor(i / cols) + 0.3) / rows}
          r={2}
          fill={palette.woodDark}
        />
      ))}

      {/* wrench */}
      <G>
        <Path d={`M ${x + w * 0.16} ${y + h * 0.32} l ${w * 0.1} ${h * 0.34}`} stroke={SHADE} strokeWidth={9} strokeLinecap="round" />
        <Path d={`M ${x + w * 0.15} ${y + h * 0.3} l ${w * 0.1} ${h * 0.34}`} stroke={palette.slate} strokeWidth={8} strokeLinecap="round" />
        <Circle cx={x + w * 0.15} cy={y + h * 0.3} r={9} fill={palette.slate} />
        <Circle cx={x + w * 0.15} cy={y + h * 0.3} r={4} fill={palette.woodDark} />
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
  const doorW = (w - 12) / 2;
  const helmetR = w * 0.2;
  return (
    <G>
      <Ellipse cx={x + w / 2} cy={floorY + 4} rx={w * 0.66} ry={w * 0.15} fill={GROUND} />
      {/* carcass + a shaded side plane so it reads 2.5D */}
      <Path d={`M ${x + w} ${y + 8} l ${w * 0.13} -8 l 0 ${h - 4} l -${w * 0.13} 8 z`} fill={SHADE} />
      <Rect x={x} y={y} width={w} height={h} rx={radii.tag} fill={palette.slate} />
      <Rect x={x} y={y} width={w} height={7} rx={3.5} fill={HILITE} />

      {[0, 1].map((i) => {
        const dx = x + 4 + i * (doorW + 4);
        return (
          <G key={i}>
            <Rect x={dx} y={y + 9} width={doorW} height={h - 18} rx={10} fill={palette.slateLight} />
            <Rect x={dx} y={y + 9} width={doorW} height={5} rx={2.5} fill={HILITE} />
            {[0, 1, 2].map((v) => (
              <Rect key={v} x={dx + doorW * 0.24} y={y + h * 0.12 + v * h * 0.045} width={doorW * 0.52} height={h * 0.018} rx={h * 0.009} fill={SHADE} />
            ))}
            <Rect x={dx + doorW * 0.26} y={y + h * 0.31} width={doorW * 0.48} height={h * 0.07} rx={h * 0.03} fill={palette.cream} />
            <Rect x={dx + doorW * 0.36} y={y + h * 0.335} width={doorW * 0.28} height={h * 0.02} rx={h * 0.01} fill={palette.navySoft} />
            <Rect x={dx + doorW * 0.7} y={y + h * 0.52} width={doorW * 0.14} height={h * 0.13} rx={doorW * 0.07} fill={palette.navySoft} />
            <Rect x={dx} y={y + h - 18} width={doorW} height={9} rx={4.5} fill={SHADE} />
          </G>
        );
      })}

      {/* spare helmet, fully in frame, resting on the lockers */}
      <G>
        <Ellipse cx={x + w * 0.5} cy={y - 2} rx={helmetR * 1.2} ry={helmetR * 0.26} fill={SHADE} />
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
        <Ellipse cx={x + w * 0.5} cy={y - 4} rx={helmetR * 1.32} ry={helmetR * 0.3} fill={palette.engineRedDark} />
        <Circle cx={x + w * 0.5} cy={y - helmetR * 0.82} r={helmetR * 0.28} fill={palette.safetyYellow} />
      </G>
    </G>
  );
}

/** Workbench: wooden top, two drawers, a toolbox and a little task lamp. */
function Workbench({ x, y, w, floorY }: { x: number; y: number; w: number; floorY: number }) {
  const h = floorY - y;
  const legW = w * 0.08;
  const boxW = w * 0.26;
  const lampX = x + w * 0.86;
  return (
    <G>
      <Ellipse cx={x + w / 2} cy={floorY + 4} rx={w * 0.58} ry={w * 0.1} fill={GROUND} />
      {/* task lamp, clamped to the right end so it never reaches past the bench */}
      <G>
        <Rect x={lampX - w * 0.07} y={y - h * 0.04} width={w * 0.14} height={h * 0.1} rx={h * 0.05} fill={palette.slate} />
        <Path
          d={`M ${lampX} ${y - h * 0.02} l 0 -${h * 0.34} l -${w * 0.16} -${h * 0.1}`}
          stroke={palette.slate}
          strokeWidth={w * 0.06}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d={`M ${lampX - w * 0.1} ${y - h * 0.5} l -${w * 0.17} -${h * 0.05} l -${w * 0.03} ${h * 0.19} l ${w * 0.15} ${h * 0.02} z`}
          fill={palette.safetyYellow}
        />
        <Path d={`M ${lampX - w * 0.13} ${y - h * 0.48} l -${w * 0.13} -${h * 0.03} l -${w * 0.01} ${h * 0.06} l ${w * 0.12} ${h * 0.02} z`} fill={HILITE} />
      </G>
      {/* legs */}
      <Rect x={x + w * 0.06} y={y + h * 0.16} width={legW} height={h * 0.86} rx={legW / 2} fill={palette.woodDark} />
      <Rect x={x + w - w * 0.14} y={y + h * 0.16} width={legW} height={h * 0.86} rx={legW / 2} fill={palette.woodDark} />
      {/* drawer block */}
      <Rect x={x + w * 0.34} y={y + h * 0.16} width={w * 0.54} height={h * 0.8} rx={radii.tag} fill={palette.wood} />
      {[0, 1].map((i) => (
        <G key={i}>
          <Rect x={x + w * 0.38} y={y + h * 0.24 + i * h * 0.34} width={w * 0.46} height={h * 0.26} rx={h * 0.09} fill={palette.woodDark} />
          <Rect x={x + w * 0.53} y={y + h * 0.34 + i * h * 0.34} width={w * 0.16} height={h * 0.05} rx={h * 0.025} fill={palette.slateLight} />
        </G>
      ))}
      {/* top */}
      <Rect x={x} y={y + h * 0.08} width={w} height={h * 0.13} rx={h * 0.065} fill={palette.woodDark} />
      <Rect x={x} y={y + h * 0.02} width={w} height={h * 0.13} rx={h * 0.065} fill={palette.wood} />
      <Rect x={x + w * 0.03} y={y + h * 0.04} width={w * 0.94} height={h * 0.04} rx={h * 0.02} fill={HILITE} />

      {/* toolbox on the bench */}
      <G>
        <Ellipse cx={x + w * 0.3} cy={y + h * 0.03} rx={boxW * 0.62} ry={h * 0.03} fill={SHADE} />
        <Rect x={x + w * 0.3 - boxW / 2} y={y - h * 0.24} width={boxW} height={h * 0.27} rx={h * 0.06} fill={palette.engineRed} />
        <Rect x={x + w * 0.3 - boxW / 2} y={y - h * 0.24} width={boxW} height={h * 0.07} rx={h * 0.035} fill={HILITE} />
        <Path
          d={`M ${x + w * 0.3 - boxW * 0.22} ${y - h * 0.24} a ${boxW * 0.22} ${boxW * 0.22} 0 0 1 ${boxW * 0.44} 0`}
          stroke={palette.slate}
          strokeWidth={w * 0.03}
          fill="none"
        />
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

/** A fire extinguisher on its wall bracket — instantly readable, on theme. */
function Extinguisher({ cx, y, h }: { cx: number; y: number; h: number }) {
  const w = h * 0.34;
  return (
    <G>
      <Rect x={cx - w / 2 + 3} y={y + 5} width={w} height={h} rx={w * 0.4} fill={WALL_SHADOW} />
      {/* bracket */}
      <Rect x={cx - w * 0.72} y={y + h * 0.5} width={w * 1.44} height={h * 0.11} rx={h * 0.055} fill={palette.slate} />
      {/* body */}
      <Rect x={cx - w / 2} y={y + h * 0.16} width={w} height={h * 0.84} rx={w * 0.34} fill={palette.engineRed} />
      <Rect x={cx - w * 0.34} y={y + h * 0.22} width={w * 0.2} height={h * 0.6} rx={w * 0.1} fill={HILITE} />
      <Rect x={cx - w * 0.42} y={y + h * 0.62} width={w * 0.84} height={h * 0.18} rx={h * 0.05} fill={palette.cream} />
      {/* neck, handle and hose */}
      <Rect x={cx - w * 0.16} y={y + h * 0.04} width={w * 0.32} height={h * 0.16} rx={w * 0.1} fill={palette.slate} />
      <Rect x={cx - w * 0.36} y={y} width={w * 0.78} height={h * 0.08} rx={h * 0.04} fill={palette.slateLight} />
      <Path
        d={`M ${cx + w * 0.3} ${y + h * 0.08} q ${w * 0.6} ${h * 0.16} ${w * 0.28} ${h * 0.4}`}
        stroke={palette.charcoal}
        strokeWidth={w * 0.13}
        strokeLinecap="round"
        fill="none"
      />
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
  /** Nothing hangs above this: the back button, title banner and strapline live there. */
  const sill = clamp(Math.round(h * 0.185), 120, 220);

  /** Life: the lamps sway, their glow breathes, a sheen crosses the wet floor. */
  const sway = useIdleBob(1.4, 5200);
  const sway2 = useIdleBob(1.1, 6100, Math.PI);
  const glow = usePulse(3800, 0.55);
  const sheen = useLoop(26000);

  const lampX = useMemo(() => [w * 0.27, w * 0.85] as const, [w]);
  const lampH = floorY + 40;

  const lampAStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value}deg` }] }));
  const lampBStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway2.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.42 + glow.value * 0.34 }));
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

        {/* ceiling beam */}
        <Rect x={0} y={0} width={w} height={22} fill={palette.charcoal} />
        <Rect x={0} y={18} width={w} height={5} fill={SHADE} />
        <Rect x={0} y={2} width={w} height={4} fill={HILITE} />

        {/* ── wall furniture ───────────────────────────────── */}
        <Extinguisher cx={w * 0.245} y={sill + 6} h={clamp(h * 0.062, 44, 76)} />
        <HoseReel cx={w * 0.9} cy={sill + 22} r={clamp(w * 0.052, 16, 26)} />
        <Pegboard x={w * 0.6} y={sill + 58} w={w * 0.34} h={clamp(floorY - sill - 96, 54, 92)} />

        {/* ── floor ─────────────────────────────────────────── */}
        <Rect x={0} y={floorY} width={w} height={h - floorY} fill="url(#bayFloor)" />
        {/* the soft lip where the floor meets the wall — never a hard seam */}
        <Rect x={0} y={floorY - 4} width={w} height={9} rx={4.5} fill={palette.slateLight} opacity={0.75} />
        <Rect x={0} y={floorY + 5} width={w} height={5} fill={SHADE} opacity={0.5} />

        {/* painted bay guide lines, opening toward the viewer */}
        <Path d={`M ${w * 0.2} ${floorY + 26} L ${w * 0.02} ${h} L ${w * 0.09} ${h} L ${w * 0.26} ${floorY + 26} Z`} fill={palette.safetyYellow} opacity={0.5} />
        <Path d={`M ${w * 0.8} ${floorY + 26} L ${w * 0.98} ${h} L ${w * 0.91} ${h} L ${w * 0.74} ${floorY + 26} Z`} fill={palette.safetyYellow} opacity={0.5} />

        {/* tyre marks curving out of the bay */}
        <Path
          d={`M ${w * 0.3} ${floorY + 30} q ${w * 0.06} ${(h - floorY) * 0.2} -${w * 0.04} ${(h - floorY) * 0.42}`}
          stroke={palette.navy}
          strokeWidth={7}
          strokeLinecap="round"
          opacity={0.06}
          fill="none"
        />
        <Path
          d={`M ${w * 0.66} ${floorY + 30} q ${w * 0.07} ${(h - floorY) * 0.2} ${w * 0.02} ${(h - floorY) * 0.42}`}
          stroke={palette.navy}
          strokeWidth={7}
          strokeLinecap="round"
          opacity={0.06}
          fill="none"
        />

        {/* oil stain + puddle, in the open floor in front of the bay */}
        <Ellipse cx={w * 0.78} cy={floorY + (h - floorY) * 0.24} rx={w * 0.09} ry={(h - floorY) * 0.035} fill={palette.navy} opacity={0.07} />
        <G>
          <Ellipse cx={w * 0.3} cy={floorY + (h - floorY) * 0.2} rx={w * 0.15} ry={(h - floorY) * 0.05} fill={palette.waterCyan} opacity={0.24} />
          <Ellipse cx={w * 0.3} cy={floorY + (h - floorY) * 0.192} rx={w * 0.11} ry={(h - floorY) * 0.034} fill={palette.waterCyanLight} opacity={0.36} />
          <Ellipse cx={w * 0.255} cy={floorY + (h - floorY) * 0.182} rx={w * 0.045} ry={(h - floorY) * 0.012} fill="#FFFFFF" opacity={0.5} />
        </G>

        {/* ── things standing on the floor ─────────────────── */}
        <Lockers x={w * 0.02} y={sill} w={clamp(w * 0.16, 54, 84)} floorY={floorY} />
        <TyreStack cx={w * 0.205} floorY={floorY + 26} rx={clamp(w * 0.066, 22, 34)} />
        <Workbench x={w * 0.72} y={floorY + 34} w={clamp(w * 0.26, 92, 150)} floorY={floorY + 112} />
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
            <Rect x={lampW / 2 - 2.5} y={0} width={5} height={20} rx={2.5} fill={palette.charcoalDark} />
            <Path d={`M ${lampW / 2 - 28} 44 Q ${lampW / 2} 14 ${lampW / 2 + 28} 44 Z`} fill={palette.engineRed} />
            <Path d={`M ${lampW / 2 - 19} 37 Q ${lampW / 2 - 6} 21 ${lampW / 2 + 2} 20`} stroke={HILITE} strokeWidth={5} strokeLinecap="round" fill="none" />
            <Ellipse cx={lampW / 2} cy={44} rx={28} ry={6.5} fill={palette.engineRedDark} />
            <Ellipse cx={lampW / 2} cy={43} rx={21} ry={4.6} fill={palette.safetyYellow} />
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
              d={`M ${lampW / 2 - 26} 46 L ${lampW / 2 - lampW * 0.46} ${lampH} L ${lampW / 2 + lampW * 0.46} ${lampH} L ${lampW / 2 + 26} 46 Z`}
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
