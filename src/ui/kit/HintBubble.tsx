import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { palette, radii, shadows, spacing } from '@/theme';
import { CharacterPortrait } from '@/characters/CharacterPortrait';
import { Text } from '../Text';
import { useTrayAnchor } from './playArea';

/** How long a hint stays up before it gets out of the child's way. */
const AUTO_DISMISS_MS = 4000;
/** Clear air between the bubble and the tray it is standing on. */
const GAP = 10;

export interface HintBubbleProps {
  text: string;
  es?: string;
  visible: boolean;
  onDismiss?: () => void;
  /**
   * `auto` (default) sits at the bottom of whatever container it is given and
   * then lifts itself clear of the `<Tray/>` if — and only if — it would
   * actually overlap it. `top` pins it to the top of the play area instead.
   */
  placement?: 'auto' | 'top';
  /** extra px between the bubble and the edge it is clearing */
  offset?: number;
  /** set false to keep the bubble up until it is tapped */
  autoDismiss?: boolean;
}

/**
 * BEACON'S HINT — one bubble, one job (consistency rule 10).
 *
 * It never covers anything the child can touch. Some games render it as a
 * sibling of the tray, others inside a lane that already stops above the tray,
 * so instead of trusting its parent it measures its own bottom edge against the
 * tray's top edge on screen and lifts by exactly the overlap — correct in both
 * layouts, and zero when there is no tray at all. Touches pass through
 * everywhere except the bubble itself, and it takes itself away after four
 * seconds; tap it to dismiss it sooner.
 *
 * Optional `es` shows the Spanish line under the English one (radio-card style).
 */
export function HintBubble({
  text,
  es,
  visible,
  onDismiss,
  placement = 'auto',
  offset = spacing.xs,
  autoDismiss = true,
}: HintBubbleProps) {
  const tray = useTrayAnchor();
  const ref = useRef<View>(null);
  const [lift, setLift] = useState(0);

  useEffect(() => {
    if (!visible || !autoDismiss || !onDismiss) return;
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [autoDismiss, onDismiss, text, visible]);

  /*
   * When the tray moves, forget the old lift and measure again from scratch.
   * Adjusted during render (React's documented pattern) rather than in an
   * effect, so it never cascades an extra commit.
   */
  const [measuredAgainst, setMeasuredAgainst] = useState(tray.top);
  if (measuredAgainst !== tray.top) {
    setMeasuredAgainst(tray.top);
    setLift(0);
  }

  const measure = useCallback(
    (_e: LayoutChangeEvent) => {
      if (placement === 'top' || !Number.isFinite(tray.top)) return;
      const node = ref.current;
      if (!node?.measureInWindow) return;
      node.measureInWindow((_x, y, _w, h) => {
        // measure where we would sit with no lift, so this can never oscillate
        const restingBottom = y + h + lift;
        const overlap = restingBottom - tray.top + GAP;
        const next = Math.max(0, Math.round(overlap));
        if (Math.abs(next - lift) > 1) setLift(next);
      });
    },
    [lift, placement, tray.top],
  );

  if (!visible) return null;

  /*
   * If the platform gives us no window measurement, clear the whole tray
   * height instead. Floating a little high is harmless; sitting on the answer
   * tiles is the blocking defect we are here to fix, so we always err upward.
   */
  const blindLift = Number.isFinite(tray.top) ? lift : tray.height;
  const anchor =
    placement === 'top' ? { top: offset + spacing.sm } : { bottom: offset + blindLift };

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(14)}
      exiting={FadeOutDown}
      style={[styles.wrap, anchor]}
      pointerEvents="box-none"
    >
      {/* a plain View so `measureInWindow` is available on every platform */}
      <View ref={ref} onLayout={measure} collapsable={false}>
        <Pressable
          onPress={onDismiss}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel={`Hint: ${text}. Tap to close.`}
        >
          <View style={styles.portrait}>
            <CharacterPortrait id="bea" emotion="think" size={56} />
          </View>
          <View style={[styles.bubble, shadows.card]}>
            {/* the tail, pointing back at whoever is speaking — the one hint motif, everywhere */}
            <View style={styles.tail} pointerEvents="none">
              <Svg width={14} height={18} viewBox="0 0 14 18">
                <Path d="M 14 3 L 0 10 L 13 18 Z" fill={palette.white} />
              </Svg>
            </View>
            <Text variant="bodyStrong">{text}</Text>
            {es ? (
              <Text variant="small" color={palette.purple}>
                {es}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 40 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  portrait: { marginBottom: 2 },
  bubble: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderBottomLeftRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  tail: { position: 'absolute', left: -12, bottom: 14 },
});
