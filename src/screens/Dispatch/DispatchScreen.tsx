/**
 * DISPATCH — "Choose a mission to help our community!"
 *
 * The bell rings, Captain Bea says hello, and today's dispatch slips fan in.
 * Tapping a slip stamps it DISPATCHED and rolls the truck out to /mission/[id].
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { MissionDef } from '@/content/types';
import type { Stars } from '@/minigames/types';
import { missions } from '@/content/missions';
import { palette, radii, shadows, spacing, springs } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useShift } from '@/hooks/useShift';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useGame } from '@/state/store';
import { Button, Logo, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { StarCounter } from '@/screens/Mission/StarCounter';
import { useScaledLayout } from '@/screens/shared';
import { BellTower, DispatchBackdrop, DispatchDesk, deskHeight, heroHeight } from './DispatchBackdrop';
import { MissionSlip } from './MissionSlip';

const STAMP_MS = 560;

/**
 * Meal break. After every second call Captain Bea points at the firehouse
 * kitchen — with a "not now" that always works, because nothing here is a wall.
 */
function MealBreakCard({ onCook, onSkip }: { onCook: () => void; onSkip: () => void }) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(15)}>
      <Panel tone="cream" radius="panel" style={styles.meal}>
        <Text variant="h2" center>
          Meal break!
        </Text>
        <Text variant="body" color={palette.navySoft} center>
          The crew is hungry. Fancy cooking something in the firehouse kitchen?
        </Text>
        <View style={styles.mealRow}>
          <Button label="Let's cook ›" tone="green" size="md" style={styles.mealBtn} onPress={onCook} />
          <Button label="Not now" tone="white" size="md" style={styles.mealBtn} onPress={onSkip} sound="tap-soft" />
        </View>
      </Panel>
    </Animated.View>
  );
}

/** The "DING DING!" burst over the bell tower. */
function DingDing({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(300)} style={styles.ding} pointerEvents="none">
      <Text variant="h3" color={palette.engineRed} center style={styles.dingText}>
        DING DING!
      </Text>
    </Animated.View>
  );
}

export function DispatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const layout = useScaledLayout();

  const shift = useShift();
  const progressMissions = useGame((s) => s.progress.missions);
  const completedIds = useMemo(() => Object.keys(progressMissions), [progressMissions]);

  const [showAll, setShowAll] = useState(false);
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);
  const [ding, setDing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greeted = useRef(false);

  const swing = useSharedValue(0);

  /* ---- make sure the board has work on it ------------------------- */
  useEffect(() => {
    if (shift.board.length === 0 || shift.complete) shift.startShift();
    // only on mount: a shift already in progress keeps its board
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- arrival: bell + greeting ----------------------------------- */
  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;

    sfx.play('bell');
    haptics.select();
    setDing(true);
    const stopDing = setTimeout(() => setDing(false), 1500);

    if (reduced) {
      swing.value = 0;
    } else {
      swing.value = withSequence(
        withRepeat(withSequence(withTiming(16, { duration: 150 }), withTiming(-16, { duration: 300 })), 4, true),
        withSpring(0, springs.soft),
        withDelay(1200, withRepeat(withSequence(withTiming(3, { duration: 1400 }), withTiming(-3, { duration: 1400 })), -1, true)),
      );
    }

    const speak = setTimeout(() => {
      speech.say('Choose a job, Rookie!', { speaker: 'bea' });
      shift.greeted();
    }, 900);

    return () => {
      clearTimeout(stopDing);
      clearTimeout(speak);
      speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /* ---- the slips --------------------------------------------------- */
  const all = useMemo<MissionDef[]>(() => missions, []);
  const board = shift.boardMissions.length > 0 ? shift.boardMissions : all.slice(0, shift.target);
  const list = showAll ? all : board;

  const lockInfo = useCallback(
    (m: MissionDef): { locked: boolean; label?: string } => {
      const missing = (m.requires ?? []).filter((r) => !completedIds.includes(r));
      if (missing.length === 0) return { locked: false };
      const firstId = missing[0];
      const name = all.find((x) => x.id === firstId)?.title ?? 'an earlier mission';
      return { locked: true, label: `Complete ${name} first` };
    },
    [all, completedIds],
  );

  const choose = useCallback(
    (m: MissionDef) => {
      if (dispatchedId) return;
      sfx.play('stamp');
      haptics.thud();
      setDispatchedId(m.id);
      timer.current = setTimeout(
        () => {
          shift.pickMission(m.id);
          router.push({ pathname: '/mission/[id]', params: { id: m.id } });
          // let the stamp clear if the child comes straight back
          setDispatchedId(null);
        },
        reduced ? 180 : STAMP_MS,
      );
    },
    [dispatchedId, reduced, router, shift],
  );

  const beaLine = shift.mealTime
    ? 'Nice work! Fancy a snack in the kitchen?'
    : shift.missionsDone > 0
      ? 'Great shift so far. Pick the next one!'
      : 'Choose a job, Rookie!';

  const hero = heroHeight(layout.isTablet);
  const desk = deskHeight(layout.isTablet) + insets.bottom;
  /** on a tablet the slips run two-up, so the board never ends in dead space */
  const twoUp = layout.isTablet && !layout.landscape ? true : layout.isTablet;

  return (
    <ScreenFrame backdrop={<DispatchBackdrop hero={hero} />} chrome={<TopBar right={<StarCounter stars={shift.starsEarned} />} />} safeBottom={false}>
      <BellTower swing={swing} top={hero - 182} />
      <DingDing visible={ding} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: desk + spacing.lg, paddingTop: spacing.sm }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoRow} pointerEvents="none">
          <Logo size={layout.isTablet ? 168 : 144} tagline={false} />
        </View>

        {/* cream header board on a tan plate */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.headerWrap}>
          <View style={styles.headerPlate} />
          <Panel tone="cream" radius="panel" padding="sm" style={styles.headerPanel}>
            <Text variant="hero" center>
              Dispatch
            </Text>
            <Text variant="body" color={palette.navySoft} center>
              Choose a mission to help our community!
            </Text>
          </Panel>
        </Animated.View>

        {shift.mealTime ? (
          <MealBreakCard
            onCook={() => {
              shift.goKitchen();
              router.push('/kitchen');
            }}
            onSkip={shift.kitchenDone}
          />
        ) : null}

        {list.length === 0 ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.emptyWrap}>
            <Panel tone="white" radius="panel" style={styles.empty}>
              <Text variant="h2" center>
                The board is being written!
              </Text>
              <Text variant="body" color={palette.navySoft} center>
                Captain Bea is still writing today&apos;s jobs. Try the Training Yard while you wait.
              </Text>
              <Button label="Training Yard ›" tone="green" size="lg" onPress={() => router.push('/training')} />
            </Panel>
          </Animated.View>
        ) : (
          <View style={[styles.list, twoUp && styles.grid]}>
            {list.map((m, i) => {
              const lock = lockInfo(m);
              return (
                <View key={m.id} style={twoUp ? styles.gridCell : undefined}>
                  <MissionSlip
                    mission={m}
                    index={i}
                    stars={(progressMissions[m.id]?.stars ?? 0) as Stars}
                    locked={lock.locked}
                    lockLabel={lock.label}
                    dispatched={dispatchedId === m.id}
                    onPress={() => choose(m)}
                  />
                </View>
              );
            })}
          </View>
        )}

        {all.length > board.length ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showAll ? "Show today's board" : 'See all missions'}
            onPress={() => {
              sfx.play('tap-soft');
              haptics.select();
              setShowAll((v) => !v);
            }}
            style={styles.toggle}
          >
            <Text variant="bodyStrong" color={palette.navy} center>
              {showAll ? "◂ Today's board" : 'See all missions ▸'}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <DispatchDesk line={beaLine} safeBottom={insets.bottom} />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  logoRow: { alignItems: 'center', marginTop: 0, marginBottom: -spacing.xxs },
  headerWrap: { alignItems: 'center', marginBottom: spacing.xs },
  headerPlate: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: -8,
    bottom: 14,
    backgroundColor: palette.tan,
    borderRadius: radii.panel,
  },
  headerPanel: { alignSelf: 'stretch', ...shadows.card },
  list: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCell: { width: '48.8%' },
  meal: { gap: spacing.xs },
  mealRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xxs },
  mealBtn: { flex: 1 },
  emptyWrap: { paddingTop: spacing.md },
  empty: { gap: spacing.sm, alignItems: 'center' },
  toggle: {
    alignSelf: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 56,
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.86)',
    ...shadows.soft,
  },
  beaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md },
  beaBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  beaBubble: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    borderBottomLeftRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  ding: {
    position: 'absolute',
    right: Platform.OS === 'web' ? 12 : 8,
    top: 96,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    zIndex: 40,
    ...shadows.card,
  },
  dingText: { letterSpacing: 0.6 },
});
