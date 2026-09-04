import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { palette, radii, shadows, spacing } from '@/theme';
import { Text } from '@/ui/Text';
import { CheckIcon } from '@/ui/icons';

/**
 * The kitchen's card motif (ART_DIRECTION: "Recipes = cream index cards with a
 * red header tab"). Used for the shelf cards, the step tracker, the shopping
 * list in Count Ingredients and the Serves-4 card in Recipe Scale.
 */
export function RecipeCardFrame({
  title,
  titleEs,
  badge,
  children,
  style,
  compact,
  dim,
}: {
  title: string;
  titleEs?: string;
  /** small pill on the right of the header tab, e.g. "cooked ✓" */
  badge?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  dim?: boolean;
}) {
  return (
    <View style={[styles.card, shadows.card, dim && styles.dim, style]}>
      <View style={[styles.tab, compact && styles.tabCompact]}>
        <View style={styles.tabText}>
          <Text variant={compact ? 'buttonSmall' : 'h3'} color={palette.white} numberOfLines={1}>
            {title}
          </Text>
          {titleEs ? (
            <Text variant="tiny" color="rgba(255,255,255,0.9)" numberOfLines={1}>
              {titleEs}
            </Text>
          ) : null}
        </View>
        {badge}
      </View>
      <View style={styles.rules} pointerEvents="none">
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.rule} />
        ))}
      </View>
      <View style={[styles.body, compact && styles.bodyCompact]}>{children}</View>
    </View>
  );
}

export interface RecipeStep {
  label: string;
  done: boolean;
  current: boolean;
}

/** Steps as little checkboxes on a recipe card — the runner's progress strip. */
export function RecipeStepStrip({ title, steps }: { title: string; steps: RecipeStep[] }) {
  return (
    <Animated.View entering={FadeIn} style={styles.stripWrap}>
      <RecipeCardFrame title={title} compact>
        <View style={styles.stripRow}>
          {steps.map((step, i) => (
            <View key={`${step.label}-${i}`} style={[styles.stepChip, step.current && styles.stepChipCurrent]}>
              <View style={[styles.box, step.done && styles.boxDone]}>
                {step.done ? (
                  <Animated.View entering={ZoomIn.springify().damping(11)}>
                    <CheckIcon size={15} color={palette.white} />
                  </Animated.View>
                ) : (
                  <Text variant="tiny" color={palette.navyMuted}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text variant="tiny" color={step.current ? palette.navy : palette.navyMuted} numberOfLines={1}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>
      </RecipeCardFrame>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.cream,
    borderRadius: radii.card,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: palette.creamDeep,
  },
  dim: { opacity: 0.62 },
  tab: {
    backgroundColor: palette.engineRed,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabCompact: { paddingVertical: 4, paddingHorizontal: spacing.sm },
  tabText: { flex: 1 },
  body: { padding: spacing.md, gap: spacing.xs },
  bodyCompact: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  rules: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 52, justifyContent: 'space-evenly', paddingHorizontal: 14 },
  rule: { height: 2, backgroundColor: 'rgba(31,42,90,0.06)', borderRadius: 1 },
  stripWrap: { alignSelf: 'stretch' },
  stripRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, alignItems: 'center' },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stepChipCurrent: { borderColor: palette.safetyYellow },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: palette.panel,
    borderWidth: 2,
    borderColor: palette.slateLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { backgroundColor: palette.leafGreen, borderColor: palette.leafGreenDark },
});
