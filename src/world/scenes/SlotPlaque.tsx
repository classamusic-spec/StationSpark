/**
 * SLOT PLAQUE — a drawn, numbered brass socket for ordering games.
 *
 * Replaces the literal `step 1 … step 4` placeholder strings the art director
 * flagged as a blocking defect in Firefighter Signals: an empty slot is now a
 * physical numbered plate on a clipboard rail, not a piece of debug text.
 */
import React, { memo } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';

const SHADE = 'rgba(31,42,90,0.14)';
const HILITE = 'rgba(255,255,255,0.32)';

export interface SlotPlaqueProps {
  /** 1-based position painted on the plate */
  index: number;
  width: number;
  height: number;
  /** the hint is pointing at this one */
  highlight?: boolean;
}

/** Digits drawn as paths so the plate never depends on a font or a glyph. */
function digit(n: number, cx: number, cy: number, s: number, color: string) {
  const strokes: Record<string, string> = {
    '1': `M ${cx - s * 0.2} ${cy - s * 0.4} L ${cx} ${cy - s * 0.62} L ${cx} ${cy + s * 0.62}`,
    '2': `M ${cx - s * 0.34} ${cy - s * 0.36} a ${s * 0.36} ${s * 0.3} 0 1 1 ${s * 0.66} ${s * 0.34} L ${cx - s * 0.34} ${cy + s * 0.6} L ${cx + s * 0.36} ${cy + s * 0.6}`,
    '3': `M ${cx - s * 0.32} ${cy - s * 0.5} L ${cx + s * 0.3} ${cy - s * 0.5} L ${cx - s * 0.04} ${cy - s * 0.06} a ${s * 0.34} ${s * 0.34} 0 1 1 ${-s * 0.22} ${s * 0.62}`,
    '4': `M ${cx + s * 0.16} ${cy + s * 0.62} L ${cx + s * 0.16} ${cy - s * 0.6} L ${cx - s * 0.36} ${cy + s * 0.2} L ${cx + s * 0.4} ${cy + s * 0.2}`,
    '5': `M ${cx + s * 0.32} ${cy - s * 0.58} L ${cx - s * 0.28} ${cy - s * 0.58} L ${cx - s * 0.32} ${cy - s * 0.06} a ${s * 0.36} ${s * 0.36} 0 1 1 ${-s * 0.02} ${s * 0.64}`,
    '6': `M ${cx + s * 0.28} ${cy - s * 0.58} a ${s * 0.44} ${s * 0.5} 0 0 0 ${-s * 0.62} ${s * 0.7} a ${s * 0.34} ${s * 0.34} 0 1 0 ${s * 0.62} ${-s * 0.16}`,
    '7': `M ${cx - s * 0.32} ${cy - s * 0.56} L ${cx + s * 0.34} ${cy - s * 0.56} L ${cx - s * 0.06} ${cy + s * 0.62}`,
    '8': `M ${cx} ${cy - s * 0.06} a ${s * 0.3} ${s * 0.28} 0 1 1 ${0.01} 0 m 0 0 a ${s * 0.34} ${s * 0.34} 0 1 0 ${-0.01} 0`,
  };
  const d = strokes[String(n)] ?? strokes['1'];
  return <Path d={d} stroke={color} strokeWidth={s * 0.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
}

/** One empty ordering socket: brass plate, engraved number, dashed drop guide. */
export const SlotPlaque = memo(function SlotPlaque({ index, width, height, highlight }: SlotPlaqueProps) {
  const r = Math.min(width, height) * 0.22;
  const badge = Math.min(width, height) * 0.3;
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Rect x={2} y={4} width={width - 4} height={height - 6} rx={r} fill={highlight ? palette.safetyYellow : palette.creamDeep} opacity={highlight ? 0.55 : 0.8} />
      <Rect x={2} y={4} width={width - 4} height={height * 0.34} rx={r} fill={HILITE} />
      <Rect
        x={7}
        y={9}
        width={width - 14}
        height={height - 16}
        rx={r * 0.8}
        fill="none"
        stroke={highlight ? palette.gold : palette.navyMuted}
        strokeWidth={3}
        strokeDasharray="9 8"
        opacity={0.75}
      />
      <G>
        <Circle cx={width / 2} cy={height / 2} r={badge} fill={palette.cream} />
        <Circle cx={width / 2} cy={height / 2 - badge * 0.18} r={badge * 0.82} fill={palette.white} opacity={0.55} />
        {digit(index, width / 2, height / 2, badge * 1.05, palette.navySoft)}
      </G>
      <Rect x={width * 0.24} y={height - 11} width={width * 0.52} height={5} rx={2.5} fill={SHADE} />
    </Svg>
  );
});
