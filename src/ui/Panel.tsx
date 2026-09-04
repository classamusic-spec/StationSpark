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
}

/** A rounded surface floating over the sky. Dispatch slips, recipe cards and boards build on this. */
export function Panel({ tone = 'white', padding = 'md', radius = 'card', shadow = 'card', style, children, ...rest }: PanelProps) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        toneStyle[tone],
        { borderRadius: radii[radius], padding: padding === 0 ? 0 : spacing[padding] },
        shadow !== 'none' && shadows[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'visible' },
});
