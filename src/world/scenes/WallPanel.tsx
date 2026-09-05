/**
 * WALL PANEL — a plain slice of town building for games that need something
 * real to lean a ladder, a board or a shelf against (art critique: "a tan
 * gradient rectangle in the sky" is not a wall).
 *
 * 2.5D as the house rules demand: cornice, soffit shadow, a shaded return down
 * one side, recessed windows with sills and lintels, and a plinth at the foot.
 */
import React, { memo } from 'react';
import Svg, { Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';

const SHADE = 'rgba(31,42,90,0.14)';
const SHADE_SOFT = 'rgba(31,42,90,0.08)';
const HILITE = 'rgba(255,255,255,0.32)';

export interface WallPanelProps {
  width: number;
  height: number;
  /** wall colour (defaults to warm brick) */
  wall?: string;
  wallShade?: string;
  /** cornice / roof band colour */
  trim?: string;
  trimShade?: string;
  /** columns of windows (default 2) */
  cols?: number;
  /** where the window grid starts as a fraction of the width (keeps a clear lane) */
  startX?: number;
}

export const WallPanel = memo(function WallPanel({
  width,
  height,
  wall = '#E9B48F',
  wallShade = '#D19A73',
  trim = palette.engineRed,
  trimShade = palette.engineRedDark,
  cols = 2,
  startX = 0.14,
}: WallPanelProps) {
  const winW = Math.max(16, (width * (0.94 - startX)) / (cols * 1.7));
  const winH = Math.min(46, Math.max(20, height * 0.08));
  const gap = winH * 0.85;
  const rows = Math.max(1, Math.floor((height - 92) / (winH + gap)));
  const gid = `wp-${Math.round(width)}-${Math.round(height)}`;
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={wall} />
          <Stop offset="1" stopColor={wallShade} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={10} width={width} height={height - 10} rx={16} fill={`url(#${gid})`} />
      <Rect x={0} y={10} width={width * 0.15} height={height - 10} fill={HILITE} opacity={0.5} />
      <Rect x={width * 0.86} y={10} width={width * 0.14} height={height - 10} fill={SHADE} />

      {/* cornice + soffit */}
      <Rect x={-8} y={0} width={width + 16} height={18} rx={9} fill={trim} />
      <Rect x={-8} y={13} width={width + 16} height={8} rx={4} fill={trimShade} />
      <Rect x={0} y={21} width={width} height={8} fill={SHADE} />

      {/* windows */}
      {Array.from({ length: rows }, (_, r) => (
        <G key={`r${r}`}>
          {Array.from({ length: cols }, (_, c) => {
            const x = width * startX + c * winW * 1.7;
            const y = 46 + r * (winH + gap);
            if (x + winW > width - 8 || y + winH > height - 44) return null;
            return (
              <G key={`c${c}`}>
                <Rect x={x - 5} y={y - 9} width={winW + 10} height={7} rx={3.5} fill={palette.creamDeep} />
                <Rect x={x} y={y} width={winW} height={winH} rx={6} fill="#33477A" />
                <Rect x={x + winW * 0.1} y={y + winH * 0.1} width={winW * 0.3} height={winH * 0.74} rx={4} fill={palette.white} opacity={0.18} />
                <Rect x={x + winW * 0.47} y={y} width={winW * 0.06} height={winH} fill={palette.creamDeep} opacity={0.55} />
                <Rect x={x - 6} y={y + winH + 1} width={winW + 12} height={6} rx={3} fill={SHADE} />
              </G>
            );
          })}
        </G>
      ))}

      {/* plinth */}
      <Rect x={0} y={height - 26} width={width} height={26} fill={SHADE_SOFT} />
      <Rect x={0} y={height - 29} width={width} height={6} rx={3} fill={HILITE} />
    </Svg>
  );
});
