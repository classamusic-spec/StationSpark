import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Rect } from 'react-native-svg';
import { palette, radii, roles, shadows, spacing } from '@/theme';
import { Text } from '../Text';
import { useActivityChrome } from './activityChrome';
import { setTrayAnchor } from './playArea';

interface RailState {
  readonly rail: boolean;
  readonly progress?: { done: number; total: number } | undefined;
}
const RailCtx = createContext<RailState>({ rail: false });

/**
 * Marks the column a tray is standing in as a RAIL rather than the foot of the
 * screen.
 *
 * On a tablet the controls move beside the play area, and the tray was still
 * drawing itself as a bottom sheet: a short white card floating halfway up an
 * otherwise empty third of the screen, with bare backdrop above and below it.
 * The play area's drawn room stopped at the column's edge, so a 1024 px window
 * showed a detailed kitchen in two thirds and a flat field in the last one —
 * the single most "unfinished" thing left on a tablet, and it was in the shared
 * shell, so it was on all 27 activities at once.
 *
 * Inside a rail the tray fills its column instead: a full-height panel with the
 * controls centred on it. The right third becomes deliberate chrome rather than
 * leftover space, and no game has to know about it.
 */
export function TrayRail({
  children,
  progress,
}: {
  children: React.ReactNode;
  /** moved off the task bar and into the rail's head — see `RailHead` */
  progress?: { done: number; total: number } | undefined;
}) {
  const value = useMemo<RailState>(() => ({ rail: true, progress }), [progress]);
  return <RailCtx.Provider value={value}>{children}</RailCtx.Provider>;
}

/* ------------------------------------------------------------------ *
 * What fills a rail that its controls do not
 * ------------------------------------------------------------------ */

/**
 * A rail is 320 px wide and as tall as the screen, and most activities put
 * three buttons in it. Centring them left a third of a tablet as blank white —
 * technically a panel, visually an unfinished page, on all 27 activities.
 *
 * So the column gets a head and a foot of its own. The head takes the step
 * progress off the task bar, where at 1024 px it was a row of 8 px dots an arm's
 * length from the child's eye, and draws it at rail scale. The foot is the
 * truck's safety chevron, quiet enough to read as material rather than
 * decoration. Both are scenery: no shadow, no touch target, nothing to learn.
 */
function RailHead({ done, total }: { done: number; total: number }) {
  return (
    <View
      style={styles.railHead}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${Math.min(done + 1, total)} of ${total}`}
    >
      <View style={styles.railDots}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              styles.railDot,
              i < done && styles.railDotDone,
              i === done && styles.railDotNow,
            ]}
          />
        ))}
      </View>
      <Text variant="small" color={roles.ink.muted} center>
        {`Step ${Math.min(done + 1, total)} of ${total}`}
      </Text>
    </View>
  );
}

/** The chevron off the truck's tail, at the weight of a watermark. */
function RailFoot() {
  return (
    <View style={styles.railFoot} pointerEvents="none">
      <Svg width="100%" height={26} viewBox="0 0 120 26" preserveAspectRatio="none">
        <G opacity={0.16}>
          {Array.from({ length: 9 }, (_, i) => (
            <Rect
              key={i}
              x={i * 16 - 10}
              y={-8}
              width={7}
              height={42}
              fill={i % 2 === 0 ? palette.engineRed : palette.safetyYellow}
              transform={`rotate(24 ${i * 16 - 10} -8)`}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

/**
 * Bottom tray that holds draggable items / answer tiles / action buttons.
 * White with big rounded top corners; safe-area aware.
 *
 * It reports its measured height so the hint bubble can float *above* the
 * tray instead of on top of the answer tiles (see `playArea.ts`).
 */
export function Tray({
  children,
  style,
  tone = 'white',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'white' | 'glass' | 'cream';
}) {
  const insets = useSafeAreaInsets();
  const { rail, progress } = useContext(RailCtx);
  /* an activity may declare its steps on the frame OR on the chrome context;
     the rail head has to honour both, exactly as the task bar does */
  const chrome = useActivityChrome();
  const steps = progress ?? chrome.progress;
  const bg =
    tone === 'white' ? palette.white : tone === 'cream' ? palette.panel : 'rgba(255,255,255,0.86)';

  const ref = useRef<View>(null);
  useEffect(() => () => setTrayAnchor(null), []);

  /**
   * Publish the tray's top edge in WINDOW space, not just its height: the hint
   * bubble is a sibling in some games and a cousin in others, so only a screen
   * coordinate lets it work out whether it would actually overlap.
   */
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const height = e.nativeEvent.layout.height;
    const node = ref.current;
    if (!node?.measureInWindow) {
      setTrayAnchor({ height, top: Number.POSITIVE_INFINITY });
      return;
    }
    node.measureInWindow((_x, y) => setTrayAnchor({ height, top: y }));
  }, []);

  return (
    /*
     * A plain View wraps the animated tray purely so it can be measured:
     * Reanimated's `Animated.View` ref does not expose `measureInWindow`.
     */
    <View ref={ref} onLayout={onLayout} collapsable={false} style={rail ? styles.railWrap : undefined}>
      <Animated.View
        entering={FadeInUp.springify().damping(18)}
        style={[
          rail ? styles.trayRail : styles.tray,
          shadows.card,
          { backgroundColor: bg, paddingBottom: Math.max(insets.bottom, spacing.md) },
          style,
        ]}
      >
        {rail ? (
          <>
            {steps && steps.total > 1 ? <RailHead done={steps.done} total={steps.total} /> : null}
            <View style={styles.railBody}>{children}</View>
            <RailFoot />
          </>
        ) : (
          children
        )}
      </Animated.View>
    </View>
  );
}

/** Horizontal row of equal-width cells for tray content. */
export function TrayRow({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  tray: {
    borderTopLeftRadius: radii.panel + 8,
    borderTopRightRadius: radii.panel + 8,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  railWrap: { flex: 1 },
  /* a column, not a sheet: rounded all round, with a head, a centred body and
     a foot, so the height is composed rather than merely filled */
  trayRail: {
    flex: 1,
    borderRadius: radii.panel + 8,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  railHead: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: roles.border.hairline,
  },
  railDots: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 7 },
  railDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: roles.state.disabledFill },
  railDotDone: { backgroundColor: palette.leafGreen },
  railDotNow: { backgroundColor: palette.safetyYellow, width: 28 },
  /* the controls take the room the head and foot leave, and sit in the middle
     of it — so a single button lands on the column's optical centre */
  railBody: { flex: 1, justifyContent: 'center' },
  railFoot: { marginHorizontal: -spacing.md, marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
