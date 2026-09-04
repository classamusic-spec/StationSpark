import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { fontFamily, palette } from '@/theme';
import { Text } from './Text';

export interface LogoProps {
  /** total width in px */
  size?: number;
  /** show "Learn. Help. Rescue. Grow." underneath (default true) */
  tagline?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The STATION SPARK wordmark.
 *
 * Built the way the reference art is: a gold ray fan, then a navy sticker
 * outline around a red plaque, then the two stacked words in white with a red
 * and a navy outline, with the flame badge riding on top.
 *
 * The outlines are drawn as three stacked `<Text>` passes (widest stroke first,
 * plain white fill last). Stroke widths are kept to ~15 % of the font size so
 * they never close the counters of the O, A and R.
 */
export function Logo({ size = 240, tagline = true, style }: LogoProps) {
  const w = size;
  const h = size * 0.86;
  const cx = w / 2;

  const fs1 = size * 0.155; // STATION
  const fs2 = size * 0.235; // SPARK

  const plaque = { x: w * 0.045, y: h * 0.245, w: w * 0.91, h: h * 0.71, r: h * 0.21 };
  const out = size * 0.028; // navy sticker outline thickness

  const rect = (x: number, y: number, width: number, height: number, r: number) =>
    `M ${x + r} ${y} H ${x + width - r} A ${r} ${r} 0 0 1 ${x + width} ${y + r} V ${y + height - r} A ${r} ${r} 0 0 1 ${x + width - r} ${y + height} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + height - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;

  /** A tapered gold swoosh sweeping out from behind the flame. */
  const wing = (dir: 1 | -1) =>
    `M ${cx + dir * w * 0.05} ${h * 0.1}
     C ${cx + dir * w * 0.2} ${h * 0.0} ${cx + dir * w * 0.36} ${h * 0.05} ${cx + dir * w * 0.45} ${h * 0.2}
     C ${cx + dir * w * 0.34} ${h * 0.14} ${cx + dir * w * 0.2} ${h * 0.13} ${cx + dir * w * 0.06} ${h * 0.19} Z`;

  const flameCx = cx;
  const flameCy = h * 0.13;
  const fr = size * 0.1;

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} accessibilityLabel="Station Spark">
        <Defs>
          <LinearGradient id="ssGold" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFE07A" />
            <Stop offset="1" stopColor={palette.gold} />
          </LinearGradient>
          <LinearGradient id="ssRed" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF6F4E" />
            <Stop offset="0.55" stopColor={palette.engineRed} />
            <Stop offset="1" stopColor="#D0301F" />
          </LinearGradient>
          <LinearGradient id="ssFlame" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFD75E" />
            <Stop offset="0.5" stopColor={palette.flameOuter} />
            <Stop offset="1" stopColor={palette.engineRed} />
          </LinearGradient>
        </Defs>

        {/* gold ray fan */}
        <Path d={wing(-1)} fill={palette.goldDark} />
        <Path d={wing(1)} fill={palette.goldDark} />
        <Path d={wing(-1)} fill="url(#ssGold)" transform={`translate(0 ${-size * 0.006})`} />
        <Path d={wing(1)} fill="url(#ssGold)" transform={`translate(0 ${-size * 0.006})`} />

        {/* navy sticker outline + red plaque */}
        <Path d={rect(plaque.x - out, plaque.y - out, plaque.w + out * 2, plaque.h + out * 2, plaque.r + out)} fill={palette.navy} />
        <Path d={rect(plaque.x, plaque.y, plaque.w, plaque.h, plaque.r)} fill="url(#ssRed)" />
        <Path
          d={rect(plaque.x + out * 0.5, plaque.y + out * 0.5, plaque.w - out, plaque.h - out, plaque.r - out * 0.4)}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={size * 0.008}
        />
        <Ellipse cx={cx - w * 0.16} cy={plaque.y + h * 0.1} rx={w * 0.2} ry={h * 0.05} fill="#FFFFFF" opacity={0.16} />

        {/* flame badge */}
        <Path
          d={`M ${flameCx} ${flameCy - fr * 0.95} C ${flameCx + fr * 0.72} ${flameCy - fr * 0.1} ${flameCx + fr * 0.55} ${flameCy + fr * 0.5} ${flameCx} ${flameCy + fr * 1.05} C ${flameCx - fr * 0.55} ${flameCy + fr * 0.5} ${flameCx - fr * 0.72} ${flameCy - fr * 0.1} ${flameCx} ${flameCy - fr * 0.95} Z`}
          fill={palette.navy}
          transform={`translate(${flameCx} ${flameCy}) scale(1.17) translate(${-flameCx} ${-flameCy})`}
        />
        <Path
          d={`M ${flameCx} ${flameCy - fr * 0.95} C ${flameCx + fr * 0.72} ${flameCy - fr * 0.1} ${flameCx + fr * 0.55} ${flameCy + fr * 0.5} ${flameCx} ${flameCy + fr * 1.05} C ${flameCx - fr * 0.55} ${flameCy + fr * 0.5} ${flameCx - fr * 0.72} ${flameCy - fr * 0.1} ${flameCx} ${flameCy - fr * 0.95} Z`}
          fill="url(#ssFlame)"
        />
        <Path
          d={`M ${flameCx} ${flameCy - fr * 0.2} C ${flameCx + fr * 0.3} ${flameCy + fr * 0.16} ${flameCx + fr * 0.22} ${flameCy + fr * 0.5} ${flameCx} ${flameCy + fr * 0.78} C ${flameCx - fr * 0.22} ${flameCy + fr * 0.5} ${flameCx - fr * 0.3} ${flameCy + fr * 0.16} ${flameCx} ${flameCy - fr * 0.2} Z`}
          fill={palette.flameCore}
        />

        {/* STATION */}
        {[
          { stroke: palette.navy, sw: fs1 * 0.15 },
          { stroke: '#B9261C', sw: fs1 * 0.075 },
          { stroke: 'none', sw: 0 },
        ].map((l, i) => (
          <SvgText
            key={`s${i}`}
            x={cx}
            y={h * 0.535}
            fontFamily={fontFamily.display}
            fontSize={fs1}
            fontWeight="700"
            fill={palette.white}
            stroke={l.stroke}
            strokeWidth={l.sw}
            strokeLinejoin="round"
            textAnchor="middle"
            letterSpacing={size * 0.004}
          >
            STATION
          </SvgText>
        ))}

        {/* SPARK */}
        {[
          { stroke: palette.navy, sw: fs2 * 0.17 },
          { stroke: '#B9261C', sw: fs2 * 0.08 },
          { stroke: 'none', sw: 0 },
        ].map((l, i) => (
          <SvgText
            key={`p${i}`}
            x={cx}
            y={h * 0.85}
            fontFamily={fontFamily.display}
            fontSize={fs2}
            fontWeight="700"
            fill={palette.white}
            stroke={l.stroke}
            strokeWidth={l.sw}
            strokeLinejoin="round"
            textAnchor="middle"
            letterSpacing={size * 0.004}
          >
            SPARK
          </SvgText>
        ))}

        <SvgText x={w * 0.955} y={h * 0.99} fontFamily={fontFamily.body} fontSize={size * 0.045} fill={palette.navy} textAnchor="end">
          ™
        </SvgText>
      </Svg>

      {tagline ? (
        <Text variant="small" color={palette.navy} style={{ marginTop: 2 }}>
          Learn. Help. Rescue. Grow.
        </Text>
      ) : null}
    </View>
  );
}
