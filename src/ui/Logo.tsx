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
 * The STATION SPARK wordmark, drawn to the reference lock-up.
 *
 * Four layers, back to front:
 *  1. a true gold **ray-arc** — a tapered elliptical band that rises out from
 *     behind the plaque's shoulders and seats onto its top edge;
 *  2. an **organic sticker plaque** — a rounded blob with softly bowed edges
 *     and four slightly different corner radii, in a navy sticker outline;
 *  3. the **flame nested into the arc**, sitting in its cradle rather than
 *     floating above it;
 *  4. the two stacked words, white with a red then a navy outline.
 *
 * The outlines are three stacked `<Text>` passes (widest stroke first, plain
 * white fill last) — kept to ~15 % of the font size so they never close the
 * counters of the O, A and R. Verified rendering in the web export.
 */
export function Logo({ size = 240, tagline = true, style }: LogoProps) {
  const w = size;
  const h = size * 0.86;
  const cx = w / 2;

  const fs1 = size * 0.152; // STATION
  const fs2 = size * 0.232; // SPARK

  const plaque = { x: w * 0.075, y: h * 0.275, w: w * 0.85, h: h * 0.665, r: h * 0.2 };
  const out = size * 0.03; // navy sticker outline thickness

  /**
   * An organic sticker: rounded corners of four slightly different radii, with
   * every edge bowed outward a little. Never a rounded rect.
   */
  const sticker = (x: number, y: number, width: number, height: number, r: number, bow: number) => {
    const r1 = r;
    const r2 = r * 0.87;
    const r3 = r * 1.06;
    const r4 = r * 0.93;
    return [
      `M ${x + r1} ${y}`,
      `Q ${x + width * 0.5} ${y - bow} ${x + width - r2} ${y}`,
      `A ${r2} ${r2} 0 0 1 ${x + width} ${y + r2}`,
      `Q ${x + width + bow} ${y + height * 0.5} ${x + width} ${y + height - r3}`,
      `A ${r3} ${r3} 0 0 1 ${x + width - r3} ${y + height}`,
      `Q ${x + width * 0.5} ${y + height + bow * 1.2} ${x + r4} ${y + height}`,
      `A ${r4} ${r4} 0 0 1 ${x} ${y + height - r4}`,
      `Q ${x - bow} ${y + height * 0.5} ${x} ${y + r1}`,
      `A ${r1} ${r1} 0 0 1 ${x + r1} ${y}`,
      'Z',
    ].join(' ');
  };

  /**
   * The ray-arc: a tapered elliptical band sweeping over the plaque's top.
   * `t` is the band thickness; the tips are pointed because the inner arc is
   * shorter than the outer one.
   */
  const arcCy = h * 0.44;
  const arcRx = w * 0.5;
  const arcRy = h * 0.31;
  const arcBand = (t: number, grow: number) => {
    const rxO = arcRx + grow;
    const ryO = arcRy + grow;
    const rxI = rxO - t;
    const ryI = ryO - t;
    const pt = (deg: number, rx: number, ry: number) => {
      const a = (deg * Math.PI) / 180;
      return `${cx + rx * Math.cos(a)} ${arcCy + ry * Math.sin(a)}`;
    };
    return [
      `M ${pt(184, rxO, ryO)}`,
      `A ${rxO} ${ryO} 0 0 1 ${pt(356, rxO, ryO)}`,
      `L ${pt(350, rxI, ryI)}`,
      `A ${rxI} ${ryI} 0 0 0 ${pt(190, rxI, ryI)}`,
      'Z',
    ].join(' ');
  };

  const flameCy = h * 0.155;
  const fr = size * 0.108;
  /** a teardrop flame with one lick, drawn from its centre */
  const flame = (k: number) =>
    `M ${cx} ${flameCy - fr * 1.05 * k}
     C ${cx + fr * 0.44 * k} ${flameCy - fr * 0.5 * k} ${cx + fr * 0.86 * k} ${flameCy - fr * 0.16 * k} ${cx + fr * 0.72 * k} ${flameCy + fr * 0.42 * k}
     C ${cx + fr * 0.62 * k} ${flameCy + fr * 0.92 * k} ${cx + fr * 0.2 * k} ${flameCy + fr * 1.1 * k} ${cx} ${flameCy + fr * 1.1 * k}
     C ${cx - fr * 0.2 * k} ${flameCy + fr * 1.1 * k} ${cx - fr * 0.62 * k} ${flameCy + fr * 0.92 * k} ${cx - fr * 0.72 * k} ${flameCy + fr * 0.42 * k}
     C ${cx - fr * 0.86 * k} ${flameCy - fr * 0.16 * k} ${cx - fr * 0.3 * k} ${flameCy - fr * 0.44 * k} ${cx} ${flameCy - fr * 1.05 * k} Z`;

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} accessibilityLabel="Station Spark">
        <Defs>
          <LinearGradient id="ssGold" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFE99B" />
            <Stop offset="0.55" stopColor={palette.safetyYellow} />
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

        {/* the ray-arc: navy sticker edge, gold band, one highlight along the top */}
        <Path d={arcBand(h * 0.085 + out * 1.6, out * 0.8)} fill={palette.navy} />
        <Path d={arcBand(h * 0.085, 0)} fill={palette.goldDark} />
        <Path d={arcBand(h * 0.072, -h * 0.008)} fill="url(#ssGold)" />
        <Path d={arcBand(h * 0.026, -h * 0.012)} fill="#FFF3C4" opacity={0.75} />

        {/* the plaque: organic sticker, navy outline, red face, inner sheen */}
        <Path d={sticker(plaque.x - out, plaque.y - out, plaque.w + out * 2, plaque.h + out * 2, plaque.r + out, h * 0.022)} fill={palette.navy} />
        <Path d={sticker(plaque.x, plaque.y, plaque.w, plaque.h, plaque.r, h * 0.02)} fill="url(#ssRed)" />
        <Path
          d={sticker(plaque.x + out * 0.55, plaque.y + out * 0.55, plaque.w - out * 1.1, plaque.h - out * 1.1, plaque.r - out * 0.4, h * 0.018)}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={size * 0.008}
        />
        <Ellipse cx={cx - w * 0.15} cy={plaque.y + h * 0.095} rx={w * 0.2} ry={h * 0.048} fill="#FFFFFF" opacity={0.17} />

        {/* the flame, nested down into the arc's cradle */}
        <Path d={flame(1.24)} fill={palette.navy} />
        <Path d={flame(1)} fill="url(#ssFlame)" />
        <Path
          d={`M ${cx} ${flameCy - fr * 0.24} C ${cx + fr * 0.34} ${flameCy + fr * 0.18} ${cx + fr * 0.26} ${flameCy + fr * 0.6} ${cx} ${flameCy + fr * 0.86} C ${cx - fr * 0.26} ${flameCy + fr * 0.6} ${cx - fr * 0.34} ${flameCy + fr * 0.18} ${cx} ${flameCy - fr * 0.24} Z`}
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
            y={h * 0.555}
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
            y={h * 0.862}
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

        <SvgText x={w * 0.94} y={h * 0.985} fontFamily={fontFamily.body} fontSize={size * 0.045} fill={palette.navy} textAnchor="end">
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
