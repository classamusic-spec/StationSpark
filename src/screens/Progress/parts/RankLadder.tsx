/**
 * RANK LADDER — the seven ranks drawn as an actual ladder, Cadet at the foot,
 * Community Hero at the top. Rungs the child has climbed are gold; the rung
 * they stand on glows; the rungs above are pale wood, waiting.
 */
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import { palette, radii, shadows, spacing, stagger } from '@/theme';
import { usePulse } from '@/hooks';
import { GlyphIcon, Text } from '@/ui';
import { HIGHLIGHT, SHADE, SHADOW_FILL, SHADOW_OPACITY, shadowRy } from '@/world/tone';

export interface LadderRung {
  name: string;
  minXp: number;
  reached: boolean;
  current: boolean;
}

const ROW = 54;
const RAIL_W = 72;
const RAIL = { left: 12, right: 50, w: 10 } as const;

/** The two rails, drawn once behind every rung. */
const Rails = memo(function Rails({ height }: { height: number }) {
  return (
    <Svg width={RAIL_W} height={height} viewBox={`0 0 ${RAIL_W} ${height}`} pointerEvents="none">
      <Ellipse cx={RAIL_W / 2} cy={height - 4} rx={32} ry={shadowRy(32)} fill={SHADOW_FILL} opacity={SHADOW_OPACITY} />
      {[RAIL.left, RAIL.right].map((x) => (
        <React.Fragment key={x}>
          <Rect x={x + 1.5} y={8} width={RAIL.w} height={height - 14} rx={5} fill={palette.goldDark} />
          <Rect x={x} y={6} width={RAIL.w} height={height - 14} rx={5} fill={palette.gold} />
          <Rect x={x + 2} y={10} width={3} height={height - 22} rx={1.5} fill={HIGHLIGHT} />
        </React.Fragment>
      ))}
    </Svg>
  );
});

/** One rung across the rails. */
const Rung = memo(function Rung({ reached, current }: { reached: boolean; current: boolean }) {
  const face = reached ? palette.safetyYellow : palette.creamDeep;
  const edge = reached ? palette.goldDark : palette.tanDark;
  return (
    <Svg width={RAIL_W} height={ROW} viewBox={`0 0 ${RAIL_W} ${ROW}`} pointerEvents="none">
      <Rect x={RAIL.left + 4} y={ROW / 2 - 4} width={RAIL.right - RAIL.left + 2} height={12} rx={6} fill={edge} />
      <Rect x={RAIL.left + 4} y={ROW / 2 - 6} width={RAIL.right - RAIL.left + 2} height={11} rx={5.5} fill={face} />
      <Rect x={RAIL.left + 8} y={ROW / 2 - 4} width={RAIL.right - RAIL.left - 6} height={3} rx={1.5} fill={HIGHLIGHT} />
      {current ? (
        // the child's boots on the rung — a pair of little navy toes
        <Path
          d={`M ${RAIL_W / 2 - 13} ${ROW / 2 - 6} h 9 a 3 3 0 0 1 3 3 v 1 h -14 v -1 a 3 3 0 0 1 2 -3 z M ${RAIL_W / 2 + 4} ${ROW / 2 - 6} h 9 a 3 3 0 0 1 2 3 v 1 h -14 v -1 a 3 3 0 0 1 3 -3 z`}
          fill="#1A2246"
        />
      ) : null}
      {!reached ? <Rect x={RAIL.left + 4} y={ROW / 2 - 6} width={RAIL.right - RAIL.left + 2} height={11} rx={5.5} fill={SHADE} opacity={0.4} /> : null}
    </Svg>
  );
});

/** The glow behind the rung the child is standing on. */
function RungGlow() {
  const pulse = usePulse(1900, 0.5);
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.45,
    transform: [{ scale: 0.96 + pulse.value * 0.08 }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.glow, shadows.glowGold, style]} />;
}

export function RankLadder({ ladder }: { ladder: readonly LadderRung[] }) {
  // climb *up*: highest rank at the top of the ladder
  const rows = [...ladder].reverse();
  const height = rows.length * ROW + 12;
  return (
    <View style={[styles.wrap, { height }]}>
      <View style={styles.rails} pointerEvents="none">
        <Rails height={height} />
      </View>
      {rows.map((r, i) => (
        <Animated.View key={r.name} entering={FadeInDown.delay(i * stagger.tile).springify().damping(16)} style={styles.row}>
          <View style={styles.rungCell}>
            {r.current ? <RungGlow /> : null}
            <Rung reached={r.reached} current={r.current} />
          </View>
          <View style={[styles.label, r.current && styles.labelCurrent]}>
            <View style={styles.labelText}>
              <Text variant={r.current ? 'buttonSmall' : 'bodyStrong'} color={r.reached ? palette.navy : palette.navyMuted}>
                {r.name}
              </Text>
              <Text variant="tiny" color={r.current ? palette.goldDark : palette.navyMuted}>
                {`${r.minXp} XP`}
              </Text>
            </View>
            {r.current ? (
              <View style={styles.here}>
                <GlyphIcon id="star" size={16} label="you are here" />
                <Text variant="tiny" color={palette.navy}>
                  You are here
                </Text>
              </View>
            ) : r.reached ? (
              <GlyphIcon id="check" size={18} label="reached" />
            ) : null}
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', justifyContent: 'flex-start', paddingTop: 6 },
  rails: { position: 'absolute', left: 0, top: 0 },
  row: { flexDirection: 'row', alignItems: 'center', height: ROW },
  rungCell: { width: RAIL_W, height: ROW, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 10,
    bottom: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,199,44,0.55)',
  },
  label: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.tag,
    minHeight: ROW - 10,
  },
  labelCurrent: { backgroundColor: '#FFF1BF' },
  labelText: { flexShrink: 1 },
  here: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.safetyYellow, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
});
