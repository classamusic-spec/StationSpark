/**
 * THE DISPATCH CONSOLE — the object the child reads the call from.
 *
 * It used to be a green rectangle on a navy slab. It is now a piece of station
 * equipment: a brushed bezel, a perforated speaker, two rotary dials with tick
 * rings, a signal meter, three toggles and a channel strip. Everything is drawn
 * in the console's own pixel box, so it scales with the play area instead of
 * being letterboxed inside a fixed sprite.
 *
 * House rules: no outlines, three tones per object, radii from the theme, no
 * emoji, and the whole thing is decorative — the LCD text on top is the only
 * thing that carries information, and it comes from `@/ui` `<Text>`.
 */
import React, { memo } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { palette } from '@/theme';

const SHEEN = 'rgba(255,255,255,0.22)';
const SHEEN_STRONG = 'rgba(255,255,255,0.5)';
const DEEP = 'rgba(0,0,0,0.22)';

/** The speaker grille that sits in the console's head, beside the lamp. */
export const ConsoleGrille = memo(function ConsoleGrille({ width, height }: { width: number; height: number }) {
  const cols = Math.max(4, Math.round(width / 9));
  const rows = Math.max(2, Math.round(height / 9));
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={0} width={width} height={height} rx={height * 0.34} fill={palette.charcoalDark} />
      <Rect x={0} y={0} width={width} height={height * 0.4} rx={height * 0.3} fill={SHEEN} opacity={0.35} />
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <Circle
            key={`g${r}-${c}`}
            cx={((c + 0.5) * width) / cols}
            cy={((r + 0.5) * height) / rows}
            r={Math.max(1, Math.min(width / cols, height / rows) * 0.24)}
            fill={palette.navySoft}
            opacity={0.85}
          />
        )),
      )}
    </Svg>
  );
});

/** One rotary dial: knurled ring, pointer, tick marks. */
function Dial({ cx, cy, r, angle, tint }: { cx: number; cy: number; r: number; angle: number; tint: string }) {
  const ticks = 10;
  return (
    <G>
      {Array.from({ length: ticks }, (_, i) => {
        const a = (-140 + (280 / (ticks - 1)) * i) * (Math.PI / 180);
        return (
          <Circle
            key={`t${i}`}
            cx={cx + Math.sin(a) * r * 1.34}
            cy={cy - Math.cos(a) * r * 1.34}
            r={Math.max(0.9, r * 0.09)}
            fill={palette.slate}
            opacity={0.8}
          />
        );
      })}
      <Circle cx={cx} cy={cy + r * 0.1} r={r} fill={palette.charcoalDark} />
      <Circle cx={cx} cy={cy} r={r} fill={palette.slate} />
      <Circle cx={cx} cy={cy} r={r * 0.78} fill={palette.slateLight} />
      <Circle cx={cx} cy={cy} r={r * 0.5} fill={tint} />
      <Path
        d={`M ${cx} ${cy} L ${cx + Math.sin((angle * Math.PI) / 180) * r * 0.86} ${cy - Math.cos((angle * Math.PI) / 180) * r * 0.86}`}
        stroke={palette.charcoalDark}
        strokeWidth={Math.max(1.6, r * 0.16)}
        strokeLinecap="round"
      />
      <Circle cx={cx - r * 0.32} cy={cy - r * 0.34} r={r * 0.2} fill={SHEEN_STRONG} />
    </G>
  );
}

/**
 * The control strip under the LCD. `lit` follows the console's live lamp so the
 * whole panel reads as powered up.
 */
export const ConsoleControls = memo(function ConsoleControls({
  width,
  height,
  lit = true,
}: {
  width: number;
  height: number;
  lit?: boolean;
}) {
  const r = Math.min(height * 0.3, width * 0.07);
  const midX = width * 0.38;
  const midW = width * 0.3;
  const meterX = width * 0.74;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* the face plate the controls are mounted on */}
      <Rect x={0} y={0} width={width} height={height} rx={height * 0.22} fill={palette.charcoal} />
      <Rect x={0} y={0} width={width} height={height * 0.22} rx={height * 0.18} fill={SHEEN} />
      <Rect x={0} y={height * 0.86} width={width} height={height * 0.14} rx={height * 0.1} fill={DEEP} />

      {/* two rotary dials */}
      <Dial cx={width * 0.1} cy={height * 0.5} r={r} angle={-42} tint={palette.engineRed} />
      <Dial cx={width * 0.25} cy={height * 0.5} r={r} angle={38} tint={palette.safetyYellow} />

      {/* perforated speaker */}
      <G>
        <Rect x={midX} y={height * 0.16} width={midW} height={height * 0.68} rx={height * 0.16} fill={palette.charcoalDark} />
        {Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: Math.max(4, Math.round(midW / 11)) }, (_, col) => {
            const cols = Math.max(4, Math.round(midW / 11));
            return (
              <Circle
                key={`sp${row}-${col}`}
                cx={midX + ((col + 0.5) * midW) / cols}
                cy={height * (0.24 + row * 0.16)}
                r={Math.max(0.9, midW / cols / 3.4)}
                fill={palette.navySoft}
              />
            );
          }),
        )}
        <Rect x={midX} y={height * 0.16} width={midW} height={height * 0.1} rx={height * 0.08} fill={SHEEN} opacity={0.3} />
      </G>

      {/* signal meter */}
      <G>
        <Rect x={meterX} y={height * 0.2} width={width * 0.16} height={height * 0.6} rx={height * 0.14} fill={palette.charcoalDark} />
        {[0.24, 0.4, 0.56, 0.72].map((f, i) => (
          <Rect
            key={`bar${i}`}
            x={meterX + width * 0.028 + i * width * 0.026}
            y={height * (0.68 - i * 0.1)}
            width={width * 0.016}
            height={height * (0.1 + i * 0.1)}
            rx={width * 0.008}
            fill={lit && i < 3 ? '#5CE08A' : palette.navySoft}
            opacity={lit && i < 3 ? 0.95 : 0.6}
          />
        ))}
      </G>

      {/* three toggles on the far right */}
      {[0, 1, 2].map((i) => (
        <G key={`tg${i}`}>
          <Rect x={width * (0.93 + 0 * i)} y={height * (0.18 + i * 0.26)} width={width * 0.05} height={height * 0.18} rx={height * 0.08} fill={palette.charcoalDark} />
          <Circle
            cx={width * 0.955}
            cy={height * (0.24 + i * 0.26)}
            r={Math.max(1.6, height * 0.05)}
            fill={i === 1 ? palette.engineRedLight : palette.slateLight}
          />
        </G>
      ))}
    </Svg>
  );
});
