/**
 * THE SKY OVER THE DRIVE.
 *
 * Truck Run's camera is level, so the horizon sits exactly halfway up the play
 * area and everything above it was raw, empty blue — the single biggest dead
 * area in the game. The 3D canvas is transparent and the 2D road paints only
 * from the horizon down, so one drawn sky serves both renderers: a graded sky,
 * a sun, a hazed range of hills, the rest of Spark City stepping along the
 * skyline, and clouds that drift.
 *
 * It is scenery and only scenery: no touch targets, nothing that moves fast
 * enough to pull an eye off the road, and it stops at the horizon the
 * projection reports so it can never disagree with the tarmac.
 */
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { palette } from '@/theme';
import { useLoop } from '@/hooks';
import { horizonY } from './projection';

function Cloud({ w, size, y, periodMs, opacity }: { w: number; size: number; y: number; periodMs: number; opacity: number }) {
  const t = useLoop(periodMs);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -size + t.value * (w + size * 2) }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.layer, { top: y }, style]}>
      <Svg width={size} height={size * 0.5}>
        <Ellipse cx={size * 0.36} cy={size * 0.3} rx={size * 0.3} ry={size * 0.2} fill={palette.white} opacity={opacity} />
        <Ellipse cx={size * 0.6} cy={size * 0.26} rx={size * 0.24} ry={size * 0.17} fill={palette.white} opacity={opacity} />
        <Ellipse cx={size * 0.48} cy={size * 0.37} rx={size * 0.36} ry={size * 0.15} fill={palette.white} opacity={opacity * 0.92} />
      </Svg>
    </Animated.View>
  );
}

/** A stepped roofline that turns the far distance into a town, not a void. */
function skyline(w: number, y: number, seed: number, tint: string, scale: number) {
  const n = Math.max(6, Math.round(w / (86 * scale)));
  const parts: React.ReactElement[] = [];
  for (let i = 0; i < n; i += 1) {
    const bw = (48 + ((i * 31 + seed * 17) % 44)) * scale;
    const x = (i / n) * (w + 70) - 35;
    const bh = (34 + ((i * 43 + seed * 11) % 58)) * scale;
    parts.push(
      <G key={i}>
        <Rect x={x} y={y - bh} width={bw} height={bh + 20} rx={6 * scale} fill={tint} />
        {i % 3 === 0 ? <Path d={`M ${x - 5} ${y - bh} L ${x + bw / 2} ${y - bh - 17 * scale} L ${x + bw + 5} ${y - bh} Z`} fill={tint} /> : null}
        {i % 4 === 1 ? <Rect x={x + bw * 0.32} y={y - bh - 22 * scale} width={bw * 0.32} height={24 * scale} rx={4 * scale} fill={tint} /> : null}
      </G>,
    );
  }
  return <G>{parts}</G>;
}

export interface SkyBackdropProps {
  width: number;
  height: number;
  /** stop every ambient loop when the child asked for less motion */
  reduced?: boolean;
}

export const SkyBackdrop = memo(function SkyBackdrop({ width, height, reduced }: SkyBackdropProps) {
  const hy = horizonY({ w: width, h: height });
  const s = Math.max(0.7, Math.min(1.6, width / 390));
  const sunX = width * 0.82;
  const sunY = Math.max(30 * s, hy * 0.24);
  const sunR = 23 * s;

  return (
    <>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id="ss-run-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.skyTop} />
            <Stop offset="0.62" stopColor={palette.skyMid} />
            <Stop offset="1" stopColor={palette.skyBottom} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={hy + 2} fill="url(#ss-run-sky)" />

        {/* the sun, with the soft halo the reference frames give it */}
        <Circle cx={sunX} cy={sunY} r={sunR * 2.2} fill={palette.safetyYellow} opacity={0.07} />
        <Circle cx={sunX} cy={sunY} r={sunR * 1.7} fill={palette.safetyYellow} opacity={0.08} />
        <Circle cx={sunX} cy={sunY} r={sunR * 1.28} fill={palette.safetyYellow} opacity={0.1} />
        <Circle cx={sunX} cy={sunY} r={sunR} fill="#FFDE6A" />
        <Path d={`M ${sunX - sunR * 0.62} ${sunY - sunR * 0.3} a ${sunR} ${sunR} 0 0 1 ${sunR * 0.75} ${-sunR * 0.5}`} stroke={palette.white} strokeWidth={sunR * 0.2} fill="none" strokeLinecap="round" opacity={0.7} />

        {/* two ranges of hills fading into the haze */}
        <Path
          d={`M -20 ${hy + 4} Q ${width * 0.2} ${hy - 88 * s} ${width * 0.46} ${hy - 18 * s} Q ${width * 0.68} ${hy - 74 * s} ${width + 20} ${hy - 6 * s} L ${width + 20} ${hy + 8} Z`}
          fill="#9BC7E8"
          opacity={0.55}
        />
        {/* the rest of Spark City on the skyline */}
        {skyline(width, hy + 2, 3, '#A9C6E4', s)}
        {skyline(width, hy + 4, 7, '#BCD6EE', s * 0.72)}
        {/* haze so nothing on the horizon has a hard edge */}
        <Rect x={0} y={hy - 46 * s} width={width} height={48 * s} fill={palette.skyBottom} opacity={0.45} />

        {/* birds, drawn not animated: two strokes at the top of the frame */}
        <G opacity={0.4}>
          <Path d={`M ${width * 0.16} ${hy * 0.42} q ${7 * s} ${-8 * s} ${14 * s} 0 q ${7 * s} ${-8 * s} ${14 * s} 0`} stroke={palette.navySoft} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
          <Path d={`M ${width * 0.3} ${hy * 0.3} q ${5 * s} ${-6 * s} ${10 * s} 0 q ${5 * s} ${-6 * s} ${10 * s} 0`} stroke={palette.navySoft} strokeWidth={2 * s} fill="none" strokeLinecap="round" />
        </G>
      </Svg>
      {reduced ? null : (
        <>
          <Cloud w={width} size={150 * s} y={hy * 0.16} periodMs={64000} opacity={0.9} />
          <Cloud w={width} size={104 * s} y={hy * 0.46} periodMs={92000} opacity={0.7} />
          <Cloud w={width} size={78 * s} y={hy * 0.68} periodMs={118000} opacity={0.5} />
        </>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0 },
});
