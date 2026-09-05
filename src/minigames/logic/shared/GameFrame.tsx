import React, { useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '@/theme';
import { HintBubble, PromptBanner, Tray } from '@/ui';
import { DragArena } from './DragArena';

export interface GameFrameProps {
  title: string;
  subtitle?: string;
  es?: string;
  compact?: boolean;
  /** scene dressing drawn behind everything (a `<Stage variant=… />`) */
  backdrop?: React.ReactNode;
  /** the play area — gets all the space between the banner and the tray */
  children: React.ReactNode;
  tray?: React.ReactNode;
  trayTone?: 'white' | 'glass' | 'cream';
  trayStyle?: StyleProp<ViewStyle>;
  hint?: { text: string; es?: string; visible: boolean; onDismiss?: () => void };
  /** absolute layer above everything (AskQuestion, celebration) */
  overlay?: React.ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
}

/**
 * Shared shell for every logic mini-game: PromptBanner on top, play area in the
 * middle, Tray at the bottom, Beacon's hint bubble floating above the tray.
 * The whole frame is one drag arena so tray tokens and play-area slots share
 * a coordinate space.
 */
export function GameFrame({
  title,
  subtitle,
  es,
  compact,
  backdrop,
  children,
  tray,
  trayTone = 'white',
  trayStyle,
  hint,
  overlay,
  bodyStyle,
}: GameFrameProps) {
  /**
   * Blocking defect: Beacon's hint bubble sits at `bottom: 16` of the frame,
   * so on six games it landed straight on top of the answer row. Measure the
   * tray and lift the bubble clear of it — the child can always see and reach
   * every answer while a hint is open.
   */
  const [trayH, setTrayH] = useState(0);
  const onTrayLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setTrayH((p) => (Math.abs(p - h) < 1 ? p : h));
  }, []);

  return (
    <DragArena style={styles.root}>
      {backdrop}
      <View style={[styles.banner, compact && styles.bannerCompact]}>
        <PromptBanner title={title} subtitle={subtitle} es={es} compact={compact} />
      </View>
      <View style={[styles.body, bodyStyle]}>{children}</View>
      {tray ? (
        <View onLayout={onTrayLayout}>
          <Tray tone={trayTone} style={trayStyle}>
            {tray}
          </Tray>
        </View>
      ) : null}
      {hint ? (
        <View style={[styles.hintLane, { bottom: trayH }]} pointerEvents="box-none">
          <HintBubble text={hint.text} es={hint.es} visible={hint.visible} onDismiss={hint.onDismiss} />
        </View>
      ) : null}
      {overlay}
    </DragArena>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { paddingTop: spacing.xs, paddingBottom: spacing.sm },
  bannerCompact: { paddingTop: 2, paddingBottom: spacing.xs },
  body: { flex: 1, justifyContent: 'center' },
  hintLane: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 40 },
});
