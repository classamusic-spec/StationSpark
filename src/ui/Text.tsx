import React from 'react';
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { palette, typeScale, type TypeVariant } from '@/theme';

export interface SparkTextProps extends TextProps {
  variant?: TypeVariant;
  color?: string;
  center?: boolean;
  /** white text with a navy outline feel (used on the sky) */
  outlined?: boolean;
}

/** The only Text component used in the app — guarantees kid-scale rounded type. */
export function Text({ variant = 'body', color = palette.navy, center, outlined, style, ...rest }: SparkTextProps) {
  const base = typeScale[variant] as TextStyle;
  return (
    <RNText
      allowFontScaling={false}
      {...rest}
      style={[
        base,
        { color },
        center && styles.center,
        outlined && styles.outlined,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  outlined: {
    textShadowColor: 'rgba(31,42,90,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
});
