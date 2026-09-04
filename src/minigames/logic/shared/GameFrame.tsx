import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '@/theme';
import { HintBubble, PromptBanner, Tray } from '@/ui';
import { DragArena } from './DragArena';

export interface GameFrameProps {
  title: string;
  subtitle?: string;
  es?: string;
  compact?: boolean;
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
  children,
  tray,
  trayTone = 'white',
  trayStyle,
  hint,
  overlay,
  bodyStyle,
}: GameFrameProps) {
  return (
    <DragArena style={styles.root}>
      <View style={[styles.banner, compact && styles.bannerCompact]}>
        <PromptBanner title={title} subtitle={subtitle} es={es} compact={compact} />
      </View>
      <View style={[styles.body, bodyStyle]}>{children}</View>
      {tray ? (
        <Tray tone={trayTone} style={trayStyle}>
          {tray}
        </Tray>
      ) : null}
      {hint ? <HintBubble text={hint.text} es={hint.es} visible={hint.visible} onDismiss={hint.onDismiss} /> : null}
      {overlay}
    </DragArena>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { paddingTop: spacing.xs, paddingBottom: spacing.sm },
  bannerCompact: { paddingTop: 2, paddingBottom: spacing.xs },
  body: { flex: 1, justifyContent: 'center' },
});
