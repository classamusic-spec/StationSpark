import React, { useCallback, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskBar, TrayRail } from '@/ui';
import { activity, spacing } from '@/theme';
import { CaptainHint } from './CaptainHint';
import type { HintText } from './useHintLadder';

/**
 * How much chrome stands between the foot of the play area and the foot of the
 * window. A game paints its own near ground inside the play area, and the
 * shared `Stage` paints the whole screen behind it; unless the two agree on
 * where the ground line is, the pavement stops mid-screen and a band of the
 * backdrop's middle distance shows through under it. Passing `backdrop` as a
 * function of this number lets a game size `Stage`'s ground plane so it carries
 * the same floor on past the counter and the tray — one floor, top to bottom.
 */
export type BackdropFor = (chromeBelow: number) => React.ReactNode;

/**
 * How far ABOVE the foot of the play area the shared `Stage`'s ground plane
 * should start. The game paints its own near ground inside the play area; the
 * Stage only has to carry the same floor on down past the counter and the
 * tray. A small overlap is all that takes — pushing the Stage's ground all the
 * way up to the game's own horizon instead squeezed its sky, hills and middle
 * distance into a sliver and left a band of raw blue over the scene.
 */
export const GROUND_OVERLAP = 44;

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
  /** hear something the bar cannot see; omit and it reads the task itself */
  onReplay?: (() => void) | null;
  progress?: { done: number; total: number };
  /** scene dressing drawn behind everything (a `<Stage variant=… />`), or a
   *  function of the chrome height below the play area (see `BackdropFor`) */
  backdrop?: React.ReactNode | BackdropFor;
  /** the play area — the game measures it with `useMeasuredBox()` */
  onStageLayout?: (e: LayoutChangeEvent) => void;
  children?: React.ReactNode;
  /** strip between the banner and the play area (equations, fraction bars) */
  hud?: React.ReactNode;
  /** strip under the play area (count strips, totals) */
  footer?: React.ReactNode;
  /** bottom tray with draggables / buttons */
  tray?: React.ReactNode;
  /**
   * Keep the tray across the foot of the screen even on a tablet. A rail is the
   * right home for answer tiles and tools, but not for a two-button steering
   * bar: that turns a third of a 1024 px window into empty white panel while
   * the thing the child is looking at gets narrower. Wide chrome is the one
   * thing the extra room must never buy.
   */
  wideTray?: boolean;
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
  wideTray,
  overlay,
  hint,
  onDismissHint,
}: GameShellProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const side = width >= activity.sideLayoutMinWidth && !!tray && !wideTray;

  const [trayH, setTrayH] = useState(0);
  const onTrayLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setTrayH((p) => (Math.abs(p - h) < 1 ? p : h));
  }, []);

  const [footerH, setFooterH] = useState(0);
  const onFooterLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setFooterH((p) => (Math.abs(p - h) < 1 ? p : h));
  }, []);

  /* what stands between the play area and the bottom of the window */
  const chromeBelow = footerH + (side ? 0 : trayH);
  const scenery = typeof backdrop === 'function' ? backdrop(chromeBelow) : backdrop;

  return (
    <View style={styles.root}>
      {scenery}
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
        {side && tray ? <View style={styles.rail}><TrayRail>{tray}</TrayRail></View> : null}
      </View>

      {footer ? (
        <View
          style={[styles.footer, { paddingBottom: compact ? spacing.xs : spacing.sm }]}
          onLayout={onFooterLayout}
          pointerEvents="box-none"
        >
          {footer}
        </View>
      ) : null}

      {tray && !side ? <View onLayout={onTrayLayout}>{tray}</View> : null}
      {overlay}
      {onDismissHint ? (
        /* the hint bubble is lifted clear of the tray so it can never cover an
           interactive tile (blocking defect in the art critique) */
        <View style={[styles.hintLane, { bottom: side ? 0 : trayH }]} pointerEvents="box-none">
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
  rail: { width: activity.sidePanelWidth },
  stage: { flex: 1, overflow: 'hidden' },
  footer: { alignItems: 'center', paddingTop: spacing.xs },
  hintLane: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 40 },
});
