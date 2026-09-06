import React, { useCallback, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskBar } from '@/ui';
import { activity, spacing } from '@/theme';
import { CaptainHint } from './CaptainHint';
import type { HintText } from './useHintLadder';

export interface GameShellProps {
  /** the task — the one instruction, shown once in the TaskBar */
  prompt: string;
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
  /** the play area — the game measures it with `useMeasuredBox()` */
  onStageLayout?: (e: LayoutChangeEvent) => void;
  children?: React.ReactNode;
  /** strip between the banner and the play area (equations, fraction bars) */
  hud?: React.ReactNode;
  /** strip under the play area (count strips, totals) */
  footer?: React.ReactNode;
  /** bottom tray with draggables / buttons */
  tray?: React.ReactNode;
  /** absolutely positioned layers (AskQuestion, celebrations) */
  overlay?: React.ReactNode;
  hint?: HintText | null;
  onDismissHint?: () => void;
}

/**
 * The common tactile-game frame: one task bar on top, a measured play area in
 * the middle, an optional tray at the bottom, and the hint bubble above
 * everything. The host draws the sky behind us.
 *
 * On a wide tablet the tray becomes a rail beside the play area, so the extra
 * room grows the activity rather than stretching the buttons.
 */
export function GameShell({
  prompt,
  subtitle,
  es,
  compact,
  onBack,
  onReplay,
  progress,
  backdrop,
  onStageLayout,
  children,
  hud,
  footer,
  tray,
  overlay,
  hint,
  onDismissHint,
}: GameShellProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const side = width >= activity.sideLayoutMinWidth && !!tray;

  const [trayH, setTrayH] = useState(0);
  const onTrayLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setTrayH((p) => (Math.abs(p - h) < 1 ? p : h));
  }, []);

  return (
    <View style={styles.root}>
      {backdrop}
      <View style={[styles.top, { paddingTop: insets.top + (compact ? spacing.xs : spacing.sm) }]} pointerEvents="box-none">
        <TaskBar
          task={prompt}
          detail={subtitle}
          es={es}
          onBack={onBack}
          onReplay={onReplay}
          progress={progress}
          compact={compact}
        />
        {hud}
      </View>

      <View style={side ? styles.splitBody : styles.stageWrap}>
        <View style={styles.stage} onLayout={onStageLayout}>
          {children}
        </View>
        {side && tray ? <View style={styles.rail}>{tray}</View> : null}
      </View>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: compact ? spacing.xs : spacing.sm }]} pointerEvents="box-none">
          {footer}
        </View>
      ) : null}

      {tray && !side ? <View onLayout={onTrayLayout}>{tray}</View> : null}
      {overlay}
      {onDismissHint ? (
        /* the hint bubble is lifted clear of the tray so it can never cover an
           interactive tile (blocking defect in the art critique) */
        <View style={[styles.hintLane, { bottom: trayH }]} pointerEvents="box-none">
          <CaptainHint hint={hint ?? null} onDismiss={onDismissHint} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { alignItems: 'stretch', gap: spacing.xs, paddingHorizontal: spacing.xs },
  stageWrap: { flex: 1 },
  splitBody: { flex: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.sm },
  rail: { width: activity.sidePanelWidth, justifyContent: 'center' },
  stage: { flex: 1, overflow: 'hidden' },
  footer: { alignItems: 'center', paddingTop: spacing.xs },
  hintLane: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 40 },
});
