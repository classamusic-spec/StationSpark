import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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
  /** hear something the bar cannot see; omit and it reads the task itself */
  onReplay?: (() => void) | null;
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
  /**
   * An absolute layer over the PLAY AREA only.
   *
   * `overlay` covers the whole frame, which is right for a celebration and
   * wrong for a question: the card centred itself on the screen and landed on
   * top of the tray — in Equipment Check it covered the very row of items
   * ("x3 x4 x3") the question was asking the child to count. A question is
   * about what is in the play area, so it belongs in the play area, with the
   * things it is asking about still visible beneath and beside it.
   */
  playOverlay?: React.ReactNode;
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
  playOverlay,
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
        {playOverlay ? (
          <View style={styles.playOverlay} pointerEvents="box-none">
            {playOverlay}
          </View>
        ) : null}
      </ActivityFrame>
    </DragArena>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  /* under the task bar (zIndex 100) so the way out is never covered */
  playOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 80 },
});
