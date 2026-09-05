import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { palette, radii, shadows, spacing } from '@/theme';
import { CharacterPortrait } from '@/characters/CharacterPortrait';
import { Text } from '../Text';
import { useTrayHeight } from './playArea';

/** How long a hint stays up before it gets out of the child's way. */
const AUTO_DISMISS_MS = 4000;

export interface HintBubbleProps {
  text: string;
  es?: string;
  visible: boolean;
  onDismiss?: () => void;
  /**
   * `above-tray` (default) floats the bubble just clear of the measured `<Tray/>`,
   * so it can never cover the answer tiles; `top` pins it to the top-right of
   * the play area for screens with no tray.
   */
  placement?: 'above-tray' | 'top';
  /** extra px between the bubble and whatever it is clearing */
  offset?: number;
  /** set false to keep the bubble up until it is tapped */
  autoDismiss?: boolean;
}

/**
 * BEACON'S HINT — one bubble, one job (consistency rule 10).
 *
 * It never covers anything the child can touch: it measures the tray and floats
 * above it, it lets touches through everywhere except the bubble itself, and it
 * takes itself away after four seconds. Tap it to dismiss it sooner.
 * Optional `es` shows the Spanish line under the English one (radio-card style).
 */
export function HintBubble({ text, es, visible, onDismiss, placement = 'above-tray', offset = spacing.xs, autoDismiss = true }: HintBubbleProps) {
  const trayHeight = useTrayHeight();

  useEffect(() => {
    if (!visible || !autoDismiss || !onDismiss) return;
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [autoDismiss, onDismiss, text, visible]);

  if (!visible) return null;

  const anchor = placement === 'top' ? { top: offset + spacing.sm } : { bottom: trayHeight + offset };

  return (
    <Animated.View entering={FadeInUp.springify().damping(14)} exiting={FadeOutDown} style={[styles.wrap, anchor]} pointerEvents="box-none">
      <Pressable onPress={onDismiss} style={styles.row} accessibilityRole="button" accessibilityLabel={`Hint: ${text}. Tap to close.`}>
        <View style={styles.portrait}>
          <CharacterPortrait id="beacon" emotion="think" size={56} />
        </View>
        <View style={[styles.bubble, shadows.card]}>
          {/* the tail, pointing back at Beacon — the one hint motif, everywhere */}
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
