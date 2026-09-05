import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { Text } from '@/ui';
import { HIGHLIGHT, SHADE } from '../tone';

export type LadderTone = 'yellow' | 'ghost' | 'placed';

const tones: Record<LadderTone, { rail: string; cap: string; capShade: string; ink: string }> = {
  yellow: { rail: palette.safetyYellow, cap: palette.gold, capShade: palette.goldDark, ink: palette.navy },
  placed: { rail: palette.safetyYellow, cap: palette.gold, capShade: palette.goldDark, ink: palette.navy },
  ghost: { rail: palette.slateLight, cap: palette.slate, capShade: palette.slate, ink: palette.slate },
};

/* ------------------------------------------------------------------ */
/* Shapes — every rail and rung is base → navy shade → white highlight  */
/* ------------------------------------------------------------------ */

/** The light-away (right) half of a vertical capsule. */
const railShadePath = (x: number, w: number, h: number) => {
  const r = w / 2;
  return `M${x + r} 0a${r} ${r} 0 0 1 ${r} ${r}v${Math.max(0, h - 2 * r)}a${r} ${r} 0 0 1 -${r} ${r}z`;
};

/** The underside (bottom) half of a horizontal capsule. */
const rungShadePath = (x: number, y: number, w: number, h: number) => {
  const r = h / 2;
  return `M${x} ${y + r}a${r} ${r} 0 0 0 ${r} ${r}h${Math.max(0, w - 2 * r)}a${r} ${r} 0 0 0 ${r} -${r}z`;
};

/** A vertical rail: flat capsule, shaded right half, a highlight strip up the left. */
function Rail({ x, width, height, color }: { x: number; width: number; height: number; color: string }) {
  return (
    <G>
      <Rect x={x} y={0} width={width} height={height} rx={width / 2} fill={color} />
      <Path d={railShadePath(x, width, height)} fill={SHADE} />
      <Rect x={x + width * 0.2} y={width * 0.55} width={width * 0.24} height={Math.max(0, height - width * 1.1)} rx={width * 0.12} fill={HIGHLIGHT} />
    </G>
  );
}

/** A brass ferrule on the end of a rail. */
function EndCap({ x, y, width, height, color, shade }: { x: number; y: number; width: number; height: number; color: string; shade: string }) {
  return (
    <G>
      <Rect x={x} y={y} width={width} height={height} rx={Math.min(height, width) * 0.3} fill={color} />
      <Rect x={x} y={y + height * 0.55} width={width} height={height * 0.45} rx={Math.min(height, width) * 0.24} fill={shade} opacity={0.55} />
      <Rect x={x + width * 0.14} y={y + height * 0.14} width={width * 0.5} height={Math.max(1.4, height * 0.22)} rx={1} fill={HIGHLIGHT} />
    </G>
  );
}

/** A rung: flat capsule in the rail colour, a lighter top face, a shaded underside. */
function Rung({ x, y, width, height, color, mark }: { x: number; y: number; width: number; height: number; color: string; mark?: boolean }) {
  const r = height / 2;
  return (
    <G>
      <Rect x={x} y={y} width={width} height={height} rx={r} fill={mark ? palette.leafGreen : color} />
      <Path d={rungShadePath(x, y, width, height)} fill={SHADE} />
      <Rect x={x + r} y={y + height * 0.14} width={Math.max(0, width - 2 * r)} height={height * 0.36} rx={height * 0.18} fill={HIGHLIGHT} />
    </G>
  );
}

/* ------------------------------------------------------------------ */

export interface LadderPieceProps {
  /** how many wall units tall this piece is (also the number of rungs) */
  units: number;
  /** px per wall unit */
  unitPx: number;
  /** overall width of the ladder in px */
  width?: number;
  tone?: LadderTone;
  /** show the big number badge (tray pieces do, stacked ones show it smaller) */
  showLabel?: boolean;
  labelSize?: 'sm' | 'lg';
  /**
   * Position in a stack (0 = bottom). Adds the seam shade under the piece
   * above so a built ladder reads as sections; `placed` pieces get it too.
   */
  stackIndex?: number;
}

/**
 * A chunky yellow ladder segment: two rails with brass end caps and one rung
 * per unit, with the number painted on a round badge so the length is
 * readable at a glance. Rungs are spaced exactly `unitPx` apart, so the
 * piece stays crisp at any length.
 */
export function LadderPiece({ units, unitPx, width = 68, tone = 'yellow', showLabel = true, labelSize = 'lg', stackIndex }: LadderPieceProps) {
  const n = Math.max(1, Math.round(units));
  const height = n * unitPx;
  const t = tones[tone];
  const rail = Math.max(7, width * 0.17);
  const rungH = Math.max(5, unitPx * 0.26);
  const capH = Math.max(5, Math.min(rail * 0.95, unitPx * 0.32));
  const seam = tone === 'placed' || stackIndex !== undefined;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height}>
        <Rail x={0} width={rail} height={height} color={t.rail} />
        <Rail x={width - rail} width={rail} height={height} color={t.rail} />
        {Array.from({ length: n }, (_, i) => (
          <Rung key={i} x={rail * 0.5} y={height - (i + 0.5) * unitPx - rungH / 2} width={width - rail} height={rungH} color={t.rail} />
        ))}
        {/* brass ferrules top and bottom */}
        <EndCap x={-1} y={0} width={rail + 2} height={capH} color={t.cap} shade={t.capShade} />
        <EndCap x={width - rail - 1} y={0} width={rail + 2} height={capH} color={t.cap} shade={t.capShade} />
        <EndCap x={-1} y={height - capH} width={rail + 2} height={capH} color={t.cap} shade={t.capShade} />
        <EndCap x={width - rail - 1} y={height - capH} width={rail + 2} height={capH} color={t.cap} shade={t.capShade} />
        {seam ? <Rect x={0} y={0} width={width} height={Math.min(6, unitPx * 0.22)} fill={SHADE} /> : null}
      </Svg>
      {showLabel ? (
        <View style={[styles.badge, { backgroundColor: t.ink === palette.slate ? palette.white : palette.navy }]}>
          <Text variant={labelSize === 'lg' ? 'h2' : 'buttonSmall'} color={t.ink === palette.slate ? palette.slate : palette.white}>
            {n}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * A tall ladder used as a number line: rungs land exactly ON the numbers, so
 * rung `i` is at `height - i * unitPx`. Labels are drawn by the caller.
 */
export function LadderRails({
  width,
  height,
  rungs,
  unitPx,
  markAt,
}: {
  width: number;
  height: number;
  /** how many rungs (0..rungs inclusive) */
  rungs: number;
  unitPx: number;
  /** rung index to paint green (the goal) */
  markAt?: number;
}) {
  const rail = Math.max(8, width * 0.16);
  const rungH = Math.max(6, unitPx * 0.3);
  const capH = Math.max(6, rail * 0.9);
  return (
    <Svg width={width} height={height}>
      <Rail x={0} width={rail} height={height} color={palette.safetyYellow} />
      <Rail x={width - rail} width={rail} height={height} color={palette.safetyYellow} />
      {Array.from({ length: rungs + 1 }, (_, i) => {
        const y = height - i * unitPx - rungH / 2;
        if (y < -rungH || y > height) return null;
        return <Rung key={i} x={rail * 0.4} y={y} width={width - rail * 0.8} height={rungH} color={palette.safetyYellow} mark={markAt === i} />;
      })}
      <EndCap x={-1} y={0} width={rail + 2} height={capH} color={palette.gold} shade={palette.goldDark} />
      <EndCap x={width - rail - 1} y={0} width={rail + 2} height={capH} color={palette.gold} shade={palette.goldDark} />
      <EndCap x={-1} y={height - capH} width={rail + 2} height={capH} color={palette.gold} shade={palette.goldDark} />
      <EndCap x={width - rail - 1} y={height - capH} width={rail + 2} height={capH} color={palette.gold} shade={palette.goldDark} />
    </Svg>
  );
}

/**
 * The tall wall the ladder leans on, with a tick per unit. Numbers are drawn
 * by the caller (they need the app type scale).
 */
export function UnitWall({ width, height, units, unitPx }: { width: number; height: number; units: number; unitPx: number }) {
  /* critique: this is a *building*, not a tan rectangle — cornice, shaded side
     plane, windows with sills and lintels, and a plinth at the bottom. The tick
     column stays clear on the left so the number line still reads. */
  const winW = Math.max(14, width * 0.2);
  const winH = Math.max(16, Math.min(34, unitPx * 1.4));
  const rows = Math.max(1, Math.floor((height - 60) / (winH + Math.max(16, unitPx))));
  const colXs = [width * 0.42, width * 0.68].filter((x) => x + winW < width - 8);
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="ss-wall-brick" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#E9B48F" />
          <Stop offset="1" stopColor="#D19A73" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} rx={14} fill="url(#ss-wall-brick)" />
      <Rect x={0} y={0} width={width * 0.22} height={height} fill={palette.white} opacity={0.1} />
      <Rect x={width - width * 0.16} y={0} width={width * 0.16} height={height} fill="rgba(31,42,90,0.14)" />

      {/* cornice + soffit shadow */}
      <Rect x={-6} y={0} width={width + 12} height={16} rx={8} fill={palette.engineRed} />
      <Rect x={-6} y={12} width={width + 12} height={7} rx={3.5} fill={palette.engineRedDark} />
      <Rect x={0} y={19} width={width} height={7} fill="rgba(31,42,90,0.14)" />

      {/* windows with sills and lintels */}
      {Array.from({ length: rows }, (_, r) =>
        colXs.map((x, c) => {
          const y = 44 + r * (winH + Math.max(18, unitPx));
          if (y + winH > height - 40) return null;
          return (
            <React.Fragment key={`w${r}-${c}`}>
              <Rect x={x - 4} y={y - 8} width={winW + 8} height={6} rx={3} fill={palette.creamDeep} />
              <Rect x={x} y={y} width={winW} height={winH} rx={5} fill="#33477A" />
              <Rect
                x={x + winW * 0.12}
                y={y + winH * 0.1}
                width={winW * 0.34}
                height={winH * 0.72}
                rx={3}
                fill={palette.white}
                opacity={0.18}
              />
              <Rect x={x - 5} y={y + winH + 1} width={winW + 10} height={5} rx={2.5} fill="rgba(31,42,90,0.14)" />
            </React.Fragment>
          );
        }),
      )}

      {/* plinth */}
      <Rect x={0} y={height - 22} width={width} height={22} fill="rgba(31,42,90,0.08)" />
      <Rect x={0} y={height - 24} width={width} height={5} rx={2.5} fill={palette.white} opacity={0.22} />

      {/* unit ticks (the number line) */}
      {Array.from({ length: units + 1 }, (_, i) => {
        const y = height - i * unitPx;
        if (y < 0) return null;
        const major = i % 5 === 0;
        return (
          <Rect
            key={i}
            x={0}
            y={y - 2}
            width={major ? width * 0.34 : width * 0.2}
            height={major ? 5 : 3.5}
            rx={2}
            fill={palette.white}
            opacity={major ? 0.85 : 0.5}
          />
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 6,
  },
});
