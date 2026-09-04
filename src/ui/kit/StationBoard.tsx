import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '../Text';

export interface StationBoardProps {
  /** board heading, e.g. "Your Badges" */
  title?: string;
  /** right-hand meta, e.g. "3 of 12 Earned" */
  meta?: string;
  /** pinned tiles — laid out in a wrapping grid unless `plain` */
  children?: React.ReactNode;
  /** wood frame thickness (default 12) */
  frame?: number;
  /** stack children instead of gridding them */
  plain?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

const SCREW_POSITIONS: ViewStyle[] = [
  { left: 4, top: 4 },
  { right: 4, top: 4 },
  { left: 4, bottom: 4 },
  { right: 4, bottom: 4 },
];

const Screw = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14">
    <Circle cx={7} cy={7.4} r={6} fill={palette.woodDark} />
    <Circle cx={7} cy={6.6} r={5.2} fill="#C6CDE0" />
    <Path d="M 4.2 6.6 h 5.6" stroke="#7C86A8" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

/**
 * The station notice board: a cream cork face inside a wood frame with brass
 * screws in the corners. Everything the firehouse keeps a list of — badges,
 * upgrades, the shift board — is pinned to one of these.
 */
export function StationBoard({ title, meta, children, frame = 12, plain = false, style, contentStyle }: StationBoardProps) {
  return (
    <Animated.View entering={FadeIn.duration(260)} style={[styles.frame, shadows.card, { borderWidth: frame }, style]}>
      <View style={styles.board}>
        {SCREW_POSITIONS.map((pos, i) => (
          <View key={i} pointerEvents="none" style={[styles.screw, pos]}>
            <Screw />
          </View>
        ))}
        {title || meta ? (
          <View style={styles.head}>
            {title ? <Text variant="h2">{title}</Text> : <View />}
            {meta ? (
              <Text variant="small" color={palette.navyMuted}>
                {meta}
              </Text>
            ) : null}
          </View>
        ) : null}
        {title || meta ? <View style={styles.divider} /> : null}
        <View style={[plain ? styles.stack : styles.grid, contentStyle]}>{children}</View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderColor: palette.wood,
    borderRadius: radii.panel,
    backgroundColor: palette.panel,
  },
  board: {
    backgroundColor: palette.panel,
    borderRadius: radii.tile,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  divider: { height: 2, backgroundColor: palette.creamDeep, borderRadius: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'flex-start' },
  stack: { gap: spacing.sm },
  screw: { position: 'absolute', zIndex: 3 },
});
