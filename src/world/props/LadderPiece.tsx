import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { Text } from '@/ui';

export type LadderTone = 'yellow' | 'ghost' | 'placed';

const tones: Record<LadderTone, { rail: string; railShade: string; rung: string; ink: string }> = {
  yellow: { rail: palette.safetyYellow, railShade: palette.goldDark, rung: '#FFE07A', ink: palette.navy },
  placed: { rail: palette.safetyYellow, railShade: palette.gold, rung: '#FFEBA8', ink: palette.navy },
  ghost: { rail: palette.slateLight, railShade: palette.slate, rung: '#EDF0F8', ink: palette.slate },
};

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
}

/**
 * A chunky yellow ladder segment: two rails and one rung per unit, with the
 * number painted on a round badge so the length is readable at a glance.
 */
export function LadderPiece({ units, unitPx, width = 68, tone = 'yellow', showLabel = true, labelSize = 'lg' }: LadderPieceProps) {
  const n = Math.max(1, Math.round(units));
  const height = n * unitPx;
  const t = tones[tone];
  const rail = Math.max(7, width * 0.17);
  const rungH = Math.max(5, unitPx * 0.26);
  const gid = `lp-${tone}`;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={t.rail} />
            <Stop offset="1" stopColor={t.railShade} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={rail} height={height} rx={rail / 2} fill={`url(#${gid})`} />
        <Rect x={width - rail} y={0} width={rail} height={height} rx={rail / 2} fill={`url(#${gid})`} />
        <Rect x={rail * 0.25} y={0} width={rail * 0.3} height={height} rx={rail * 0.15} fill={palette.white} opacity={0.35} />
        {Array.from({ length: n }, (_, i) => (
          <Rect
            key={i}
            x={rail * 0.5}
            y={height - (i + 0.5) * unitPx - rungH / 2}
            width={width - rail}
            height={rungH}
            rx={rungH / 2}
            fill={t.rung}
          />
        ))}
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
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="ss-rail" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={palette.safetyYellow} />
          <Stop offset="1" stopColor={palette.goldDark} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={rail} height={height} rx={rail / 2} fill="url(#ss-rail)" />
      <Rect x={width - rail} y={0} width={rail} height={height} rx={rail / 2} fill="url(#ss-rail)" />
      <Rect x={rail * 0.24} y={0} width={rail * 0.3} height={height} rx={rail * 0.15} fill={palette.white} opacity={0.35} />
      {Array.from({ length: rungs + 1 }, (_, i) => {
        const y = height - i * unitPx - rungH / 2;
        if (y < -rungH || y > height) return null;
        const isMark = markAt === i;
        return (
          <Rect
            key={i}
            x={rail * 0.4}
            y={y}
            width={width - rail * 0.8}
            height={rungH}
            rx={rungH / 2}
            fill={isMark ? palette.leafGreen : '#FFE07A'}
          />
        );
      })}
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
