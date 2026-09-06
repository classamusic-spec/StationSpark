import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { ActivityFrame } from '@/ui';
import { DragArena } from './DragArena';

export interface GameFrameProps {
  /** the task — the one instruction, shown once in the TaskBar */
  title: string;
  /** one quiet line of "how", kept in the same surface as the task */
  subtitle?: string;
  es?: string;
  compact?: boolean;
  /** back out of the activity; the host passes this so there is only one bar */
  onBack?: () => void;
  /** hear the task again */
  onReplay?: () => void;
  progress?: { done: number; total: number };
  /** scene dressing drawn behind everything (a `<Stage variant=… />`) */
  backdrop?: React.ReactNode;
  /** the play area — gets all the space the chrome does not need */
  children: React.ReactNode;
  tray?: React.ReactNode;
  trayTone?: 'white' | 'glass' | 'cream';
  trayStyle?: StyleProp<ViewStyle>;
  /** Captain Bea's bubble: hints and reactions only, never the task again */
  hint?: { text: string; es?: string; visible: boolean; onDismiss?: () => void };
  /** absolute layer above everything (AskQuestion, celebration) */
  overlay?: React.ReactNode;
  bodyStyle?: StyleProp<ViewStyle>;
}

/**
 * Shared shell for every logic mini-game.
 *
 * It is now a thin adapter over `ActivityFrame`, so logic games, tactile games
 * and the kitchen all inherit the same top/play/controls structure — and the
 * same tablet behaviour, where the tray becomes a rail beside a bigger play
 * area instead of a wider strip beneath it.
 *
 * The whole frame stays one drag arena so tray tokens and play-area slots
 * share a coordinate space.
 */
export function GameFrame({
  title,
  subtitle,
  es,
  compact,
  onBack,
  onReplay,
  progress,
  backdrop,
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
      <ActivityFrame
        task={title}
        detail={subtitle}
        es={es}
        compact={compact}
        onBack={onBack}
        onReplay={onReplay}
        progress={progress}
        backdrop={backdrop}
        controls={tray}
        controlsTone={trayTone}
        controlsStyle={trayStyle}
        hint={hint}
        overlay={overlay}
        playStyle={bodyStyle}
      >
        {children}
      </ActivityFrame>
    </DragArena>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
