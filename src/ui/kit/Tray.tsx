import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radii, shadows, spacing } from '@/theme';
import { setTrayAnchor } from './playArea';

const RailCtx = createContext(false);

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
export function TrayRail({ children }: { children: React.ReactNode }) {
  return <RailCtx.Provider value={true}>{children}</RailCtx.Provider>;
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
  const rail = useContext(RailCtx);
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
        {children}
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
  /* a column, not a sheet: rounded all round, and the controls sit in the
     middle of it rather than at the top of a stub */
  trayRail: {
    flex: 1,
    borderRadius: radii.panel + 8,
    justifyContent: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
