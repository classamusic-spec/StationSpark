import React, { useCallback, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activity, spacing } from '@/theme';
import { HintBubble } from './HintBubble';
import { TaskBar } from './TaskBar';
import { Tray } from './Tray';

export interface ActivityFrameProps {
  /** the one instruction, owned by the TaskBar and repeated nowhere else */
  task: string;
  es?: string;
  /** one quiet line of scaffolding under the task, in the same surface */
  detail?: string;
  onBack?: () => void;
  /** omit to let the bar read the task itself; `null` for a silent activity */
  onReplay?: (() => void) | null;
  progress?: { done: number; total: number };
  /** scenery behind everything; never interactive, never shadowed */
  backdrop?: React.ReactNode;
  /** the play area — takes every pixel the chrome does not need */
  children: React.ReactNode;
  /** answer choices, tools and completion controls */
  controls?: React.ReactNode;
  controlsTone?: 'white' | 'glass' | 'cream';
  controlsStyle?: StyleProp<ViewStyle>;
  /** Captain Bea's bubble — hints and reactions only, never the task again */
  hint?: { text: string; es?: string; visible: boolean; onDismiss?: () => void };
  /** absolute layer above everything (a question card, a celebration) */
  overlay?: React.ReactNode;
  compact?: boolean;
  playStyle?: StyleProp<ViewStyle>;
}

/**
 * The shape every activity shares.
 *
 *   top     one task bar: back, the task, hear-it-again, progress
 *   middle  the play area, as large as the screen allows
 *   bottom  the controls — or, on a wide tablet, a rail beside the play area
 *
 * On a tablet the controls move to the side rather than stretching across the
 * foot of the screen, so the play area grows instead of the buttons. That is
 * the whole point of the extra room: bigger activity, not wider chrome.
 *
 * The hint bubble is lifted clear of whatever is beneath it, so a hint can
 * never cover the thing it is telling the child to touch.
 */
export function ActivityFrame({
  task,
  es,
  detail,
  onBack,
  onReplay,
  progress,
  backdrop,
  children,
  controls,
  controlsTone = 'white',
  controlsStyle,
  hint,
  overlay,
  compact,
  playStyle,
}: ActivityFrameProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const side = width >= activity.sideLayoutMinWidth && !!controls;

  /* Measure the controls so the hint bubble can sit above them. */
  const [controlsH, setControlsH] = useState(0);
  const onControlsLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setControlsH((p) => (Math.abs(p - h) < 1 ? p : h));
  }, []);

  const controlSurface = controls ? (
    <View onLayout={side ? undefined : onControlsLayout} style={side ? styles.rail : undefined}>
      <Tray tone={controlsTone} style={controlsStyle}>
        {controls}
      </Tray>
    </View>
  ) : null;

  return (
    <View style={styles.root}>
      {backdrop}

      {/* the bar clears the notch itself, so hosts need no top chrome at all */}
      <View style={{ height: insets.top }} pointerEvents="none" />
      <TaskBar
        task={task}
        detail={detail}
        es={es}
        onBack={onBack}
        onReplay={onReplay}
        progress={progress}
        compact={compact}
      />

      {side ? (
        <View style={styles.splitBody}>
          <View style={[styles.play, playStyle]}>{children}</View>
          {controlSurface}
        </View>
      ) : (
        <>
          <View style={[styles.play, playStyle]}>{children}</View>
          {controlSurface}
        </>
      )}

      {hint ? (
        <View style={[styles.hintLane, { bottom: side ? spacing.md : controlsH }]} pointerEvents="box-none">
          <HintBubble text={hint.text} es={hint.es} visible={hint.visible} onDismiss={hint.onDismiss} />
        </View>
      ) : null}

      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splitBody: { flex: 1, flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm, paddingHorizontal: spacing.sm },
  play: { flex: 1, justifyContent: 'flex-end', paddingTop: activity.playGutter },
  rail: { width: activity.sidePanelWidth, justifyContent: 'center' },
  hintLane: { position: 'absolute', left: 0, right: 0, zIndex: 20 },
});

/** True when the current window is wide enough for the side-rail activity layout. */
export function useSideRail(): boolean {
  const { width } = useWindowDimensions();
  return width >= activity.sideLayoutMinWidth;
}
