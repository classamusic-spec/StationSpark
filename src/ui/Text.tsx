import React from 'react';
import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { fontScaleCap, palette, typeScale, type TypeVariant } from '@/theme';

export interface SparkTextProps extends TextProps {
  variant?: TypeVariant;
  color?: string;
  center?: boolean;
  /** white text with a navy outline feel (used on the sky) */
  outlined?: boolean;
}

/**
 * The only Text component used in the app — guarantees kid-scale rounded type.
 *
 * It honours the device's text-size setting, capped per variant (see
 * `fontScaleCap`). It used to refuse it outright, which kept every layout safe
 * and left a low-vision reader with no recourse at all. Somewhere genuinely
 * fitted — a numeral inside drawn artwork — can still pass its own
 * `maxFontSizeMultiplier`, or `allowFontScaling={false}` to opt out.
 */
export function Text({ variant = 'body', color = palette.navy, center, outlined, style, ...rest }: SparkTextProps) {
  const base = typeScale[variant] as TextStyle;
  return (
    <RNText
      maxFontSizeMultiplier={fontScaleCap[variant]}
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
