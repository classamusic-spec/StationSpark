/**
 * PAPER — a sheet from the station office: white, squared-off softly, with a
 * small tab label along the top edge. Every grown-ups section is one sheet.
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '@/ui';

export interface PaperProps {
  /** the little tab, e.g. "SETTINGS" */
  tab?: string;
  tabColor?: string;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Paper({ tab, tabColor = palette.tan, title, subtitle, children, style }: PaperProps) {
  return (
    <View style={[styles.wrap, style]}>
      {tab ? (
        <View style={[styles.tab, { backgroundColor: tabColor }]}>
          <Text variant="tiny" color={palette.navy}>
            {tab}
          </Text>
        </View>
      ) : null}
      <View style={[styles.sheet, shadows.soft, tab ? styles.sheetWithTab : null]}>
        {title ? <Text variant="h3">{title}</Text> : null}
        {subtitle ? (
          <Text variant="small" color={palette.navySoft}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>
    </View>
  );
}

/** A thin tan rule between rows on a sheet. */
export const Rule = () => <View style={styles.rule} />;

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  tab: {
    alignSelf: 'flex-start',
    marginLeft: spacing.md,
    paddingHorizontal: 12,
    paddingTop: 5,
    paddingBottom: 4,
    borderTopLeftRadius: radii.tag,
    borderTopRightRadius: radii.tag,
  },
  sheet: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sheetWithTab: { borderTopLeftRadius: radii.tag },
  rule: { height: 2, backgroundColor: palette.creamDeep, borderRadius: 1, marginVertical: 2 },
});
