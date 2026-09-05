import React from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { PromptBanner } from '@/ui';
import { spacing } from '@/theme';
import { BeaconHint } from './BeaconHint';
import type { HintText } from './useHintLadder';

export interface GameShellProps {
  prompt: string;
  subtitle?: string;
  es?: string;
  compact?: boolean;
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
 * The common tactile-game frame: prompt banner on top, a measured play area in
 * the middle, an optional tray at the bottom, and Beacon's hint bubble on top
 * of everything. The host draws the sky and the top chrome above us.
 */
export function GameShell({
  prompt,
  subtitle,
  es,
  compact,
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
  return (
    <View style={styles.root}>
      {backdrop}
      <View style={[styles.top, { paddingTop: compact ? spacing.xs : spacing.sm }]} pointerEvents="box-none">
        <PromptBanner title={prompt} subtitle={subtitle} es={es} compact={compact} />
        {hud}
      </View>

      <View style={styles.stage} onLayout={onStageLayout}>
        {children}
      </View>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: compact ? spacing.xs : spacing.sm }]} pointerEvents="box-none">
          {footer}
        </View>
      ) : null}

      {tray}
      {overlay}
      {onDismissHint ? <BeaconHint hint={hint ?? null} onDismiss={onDismissHint} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  stage: { flex: 1, overflow: 'hidden' },
  footer: { alignItems: 'center', paddingTop: spacing.xs },
});
