/**
 * MissionSlip — a dispatch slip card.
 *
 * FOUR THINGS, IN THIS ORDER: the picture of the place, the name of the job,
 * one line about it, and the big green GO. Everything else — which subjects it
 * practises, how long it takes, how many stars are already on it — is support,
 * printed once and quietly, or left to the detail views.
 *
 * The slip used to carry a title, a tagline, a thumbnail and a stack of three
 * colour-coded subject pills at the same weight, which on a phone made the
 * pills the tallest thing on the card and pushed the tagline into an ellipsis.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import type { MissionDef } from '@/content/types';
import type { Stars } from '@/minigames/types';
import { easings, palette, radii, roles, spacing, springs, stagger } from '@/theme';
import { useShowTranslation } from '@/hooks';
import { LockIcon, StarIcon } from '@/ui/icons';
import { SubjectLine, subjectSentence } from '@/ui/SubjectPill';
import { Text } from '@/ui/Text';
import { SceneThumb } from '@/screens/Mission/SceneHero';

/** The green "go" chevron on the right of every slip — the selection action. */
function GoChevron({ dim, size }: { dim?: boolean; size: number }) {
  return (
    <View style={[styles.chevron, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 54 54">
        <Circle cx={27} cy={29} r={25} fill={dim ? palette.slate : palette.leafGreenDark} />
        <Circle cx={27} cy={26} r={25} fill={dim ? palette.lockedGrey : palette.leafGreen} />
        <Circle cx={27} cy={26} r={25} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2.5} />
        <Path d="M 22 15 L 34 26 L 22 37" stroke={palette.white} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}

/** Tiny earned-stars row. Absent until the child has actually earned one. */
function EarnedStars({ stars }: { stars: Stars }) {
  return (
    <View style={styles.stars} accessibilityLabel={`${stars} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <StarIcon
          key={i}
          size={16}
          color={i < stars ? palette.safetyYellow : palette.lockedGrey}
          stroke={i < stars ? palette.goldDark : palette.slate}
        />
      ))}
    </View>
  );
}

/** The red "DISPATCHED" stamp that slams down when a slip is chosen. */
function DispatchedStamp({ on }: { on: boolean }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!on) {
      t.value = 0;
      return;
    }
    t.value = withSequence(withTiming(1, { duration: 170, easing: easings.in }), withSpring(1, springs.bounce));
  }, [on, t]);

  const a = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ rotate: '-13deg' }, { scale: 2.4 - 1.4 * t.value }],
  }));

  if (!on) return null;
  return (
    <View style={styles.stampWrap} pointerEvents="none">
      <Animated.View style={[styles.stamp, a]}>
        <Text variant="h2" color={palette.engineRed} center style={styles.stampText}>
          DISPATCHED
        </Text>
      </Animated.View>
    </View>
  );
}

export interface MissionSlipProps {
  mission: MissionDef;
  /** stagger index for the entrance */
  index?: number;
  /** best stars the child has earned on this mission */
  stars?: Stars;
  locked?: boolean;
  /** e.g. "Complete Bakery Bell first" */
  lockLabel?: string;
  /** show the DISPATCHED stamp (the parent navigates once it lands) */
  dispatched?: boolean;
  /** roomier art and type once the card has a board's worth of width */
  roomy?: boolean;
  onPress?: () => void;
}

export function MissionSlip({ mission, index = 0, stars = 0, locked, lockLabel, dispatched, roomy, onPress }: MissionSlipProps) {
  const press = useSharedValue(0);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.025 }] }));
  const showEs = useShowTranslation();
  const es = showEs && mission.titleEs && mission.titleEs !== mission.title ? mission.titleEs : undefined;

  /* narrow cards trade a little picture for a tagline that finishes its sentence */
  const thumbW = roomy ? 128 : 98;
  const thumbH = roomy ? 108 : 86;

  return (
    /* grow to the height of the tallest slip in the row, so a board of cards
       reads as one shelf rather than a ragged edge */
    <Animated.View
      style={styles.grow}
      entering={FadeInDown.delay(index * stagger.card)
        .springify()
        .damping(15)}
    >
      <Animated.View style={[a, styles.grow]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            locked
              ? `${mission.title}. Not open yet. ${lockLabel ?? ''}`
              : `${mission.title}. ${mission.tagline} Practises ${subjectSentence(mission.subjects)}.`
          }
          accessibilityState={{ disabled: !!locked }}
          disabled={locked || dispatched}
          onPressIn={() => {
            press.value = withSpring(1, springs.pop);
          }}
          onPressOut={() => {
            press.value = withSpring(0, springs.pop);
          }}
          onPress={onPress}
          style={[styles.card, roles.lift.interactive, locked && styles.cardLocked]}
        >
          <View>
            <SceneThumb scene={mission.scene} width={thumbW} height={thumbH} style={locked ? styles.thumbLocked : undefined} />
            {locked ? (
              <View style={styles.lockBadge}>
                <LockIcon size={24} color={palette.white} />
              </View>
            ) : null}
          </View>

          <View style={styles.body}>
            <Text variant={roomy ? 'h2' : 'h3'} numberOfLines={2} color={locked ? palette.slate : roles.ink.primary}>
              {mission.title}
            </Text>
            {es ? (
              <Text variant="small" color={roles.ink.translation} numberOfLines={2}>
                {es}
              </Text>
            ) : null}
            <Text variant="small" color={locked ? palette.slate : roles.ink.secondary} numberOfLines={roomy ? 2 : 3}>
              {locked ? (lockLabel ?? 'Finish an earlier mission first') : mission.tagline}
            </Text>
            {!locked ? (
              <View style={styles.foot}>
                <SubjectLine subjects={mission.subjects} max={roomy ? 3 : 2} />
                {stars > 0 ? <EarnedStars stars={stars} /> : null}
              </View>
            ) : null}
          </View>

          <GoChevron dim={locked} size={roomy ? 58 : 50} />
          <DispatchedStamp on={!!dispatched} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grow: { flexGrow: 1 },
  card: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: roles.surface.card,
    borderRadius: radii.card,
    padding: spacing.sm,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  cardLocked: { backgroundColor: '#F2F4FA' },
  thumbLocked: { opacity: 0.55 },
  lockBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.slate,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: palette.white,
  },
  body: { flex: 1, gap: 3, paddingVertical: 2 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 3 },
  chevron: { alignItems: 'center', justifyContent: 'center' },
  stampWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  stamp: {
    borderWidth: 5,
    borderColor: palette.engineRed,
    borderRadius: radii.tag,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  stampText: { letterSpacing: 2 },
});
