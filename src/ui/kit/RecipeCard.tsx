import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { hit, palette, radii, roles, shadows, spacing, stagger, type SubjectId } from '@/theme';
import { useFeedbackAnim } from '@/hooks';
import { Text } from '../Text';
import { SubjectLine, subjectSentence } from '../SubjectPill';
import { ChevronRightIcon } from '../icons';
import { Chip } from './Chip';

export interface RecipeCardProps {
  title: string;
  /** Spanish name on the tab, e.g. "Panqueques" */
  titleEs?: string;
  blurb?: string;
  subjects?: readonly SubjectId[];
  /** the dish art — a `<VocabIcon/>`, a plate illustration… */
  art?: React.ReactNode;
  /** "Cooked 3 times" */
  meta?: string;
  /**
   * Further up the shelf than the child has reached. A LOOK, NOT A GATE: the
   * card still opens. `src/kitchen/progress.ts` has always promised that every
   * recipe stays playable, and this card was quietly breaking the promise —
   * `disabled` on the press meant a child with nothing cooked could open two
   * recipes out of thirteen and got a padlock on the rest.
   */
  resting?: boolean;
  cooked?: boolean;
  onPress?: () => void;
  index?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * A cream index card with a red header tab — the firehouse recipe box.
 * The tab carries the dish name; the card body holds the blurb, the subjects
 * it practises and whatever the kitchen wants to show inside.
 */
export function RecipeCard({ title, titleEs, blurb, subjects, art, meta, resting = false, cooked = false, onPress, index = 0, children, style }: RecipeCardProps) {
  const { style: anim, press } = useFeedbackAnim();

  const content = (
    <View style={[styles.card, shadows.card, resting && styles.resting]}>
      {/* red header tab */}
      <View style={styles.tabRow}>
        <View style={styles.tab}>
          <Text variant="buttonSmall" color={palette.white} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {cooked ? <Chip label="Cooked" tone="green" glyph="check" /> : null}
      </View>

      {/* ruled index-card body */}
      <View style={styles.body}>
        {art ? <View style={styles.art}>{art}</View> : null}
        <View style={styles.text}>
          {blurb ? (
            <Text variant="body" color={roles.ink.secondary} numberOfLines={2}>
              {blurb}
            </Text>
          ) : null}
          {(subjects && subjects.length) || meta ? (
            <View style={styles.foot}>
              {subjects && subjects.length ? <SubjectLine subjects={subjects} /> : null}
              {meta ? (
                <Text variant="tiny" color={roles.ink.muted}>
                  {meta}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        {onPress ? (
          <View style={styles.go}>
            {/* always a chevron: the card always opens, so it must never wear
                a padlock */}
            <View style={styles.chevron}>
              <ChevronRightIcon size={28} />
            </View>
          </View>
        ) : null}
      </View>

      {children ? <View style={styles.extra}>{children}</View> : null}

      {/* the three ruled lines that make it an index card */}
      <View pointerEvents="none" style={styles.rules}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.rule} />
        ))}
      </View>
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * stagger.card).springify().damping(16)} style={style}>
      <Animated.View style={anim}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${blurb ?? ''}${subjects?.length ? ` Practises ${subjectSentence(subjects)}.` : ''}`}
          accessibilityHint={resting ? 'Further up the shelf, but you can cook it now if you like.' : undefined}
          onPressIn={() => press(true)}
          onPressOut={() => press(false)}
          onPress={onPress}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.cream,
    borderRadius: radii.card,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: palette.creamDeep,
  },
  /* "you have not got here yet", not "you may not" — it must still read as
     something a child is allowed to touch */
  resting: { opacity: 0.86 },
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: -spacing.xs - 2, marginLeft: -2 },
  tab: {
    backgroundColor: palette.engineRed,
    borderBottomLeftRadius: radii.tag,
    borderBottomRightRadius: radii.tag,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: palette.engineRedDark,
    maxWidth: '72%',
  },
  body: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, zIndex: 1 },
  art: { width: 64, alignItems: 'center' },
  text: { flex: 1, gap: 3 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, marginTop: 2 },
  go: { width: hit.min, alignItems: 'flex-end' },
  chevron: {
    width: hit.min,
    height: hit.min,
    borderRadius: hit.min / 2,
    backgroundColor: palette.leafGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  extra: { zIndex: 1, gap: spacing.xs },
  rules: { ...StyleSheet.absoluteFill, top: 74, paddingHorizontal: spacing.sm, gap: 26, opacity: 0.5 },
  rule: { height: 2, backgroundColor: palette.tan, borderRadius: 1 },
});
