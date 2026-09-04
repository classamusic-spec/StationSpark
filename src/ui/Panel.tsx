import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { palette, radii, shadows, spacing } from '@/theme';

export type PanelTone = 'white' | 'cream' | 'tan' | 'navy' | 'glass';

const toneStyle: Record<PanelTone, ViewStyle> = {
  white: { backgroundColor: palette.white },
  cream: { backgroundColor: palette.panel },
  tan: { backgroundColor: palette.tan, borderColor: palette.tanDark, borderWidth: 3 },
  navy: { backgroundColor: palette.charcoal },
  glass: { backgroundColor: 'rgba(255,255,255,0.82)' },
};

export interface PanelProps extends ViewProps {
  tone?: PanelTone;
  padding?: keyof typeof spacing | 0;
  radius?: keyof typeof radii;
  shadow?: keyof typeof shadows | 'none';
  style?: StyleProp<ViewStyle>;
  /** 2 px inner white rim — the "toy" sheen from the art direction */
  sheen?: boolean;
  /** a coloured accent bar across the top of the panel */
  accent?: string;
}

/** A rounded surface floating over the sky. Dispatch slips, recipe cards and boards build on this. */
export function Panel({ tone = 'white', padding = 'md', radius = 'card', shadow = 'card', style, sheen = false, accent, children, ...rest }: PanelProps) {
  const r = radii[radius];
  return (
    <View
      {...rest}
      style={[
        styles.base,
        toneStyle[tone],
        { borderRadius: r, padding: padding === 0 ? 0 : spacing[padding] },
        shadow !== 'none' && shadows[shadow],
        style,
      ]}
    >
      {accent ? (
        <View pointerEvents="none" style={[styles.accent, { backgroundColor: accent, borderTopLeftRadius: r, borderTopRightRadius: r }]} />
      ) : null}
      {children}
      {sheen ? <View pointerEvents="none" style={[styles.sheen, { borderRadius: r }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'visible' },
  sheen: {
    ...StyleSheet.absoluteFill,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  accent: { position: 'absolute', left: 0, right: 0, top: 0, height: 6 },
});
