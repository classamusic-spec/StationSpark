/**
 * DISPATCH — "Choose a mission to help our community!"
 *
 * The bell rings, Captain Bea says hello, and today's dispatch slips fan in.
 * Tapping a slip stamps it DISPATCHED and rolls the truck out to /mission/[id].
 *
 * The screen says the task exactly once — on the board at the top. Captain Bea
 * reacts and encourages from the console; she no longer repeats the heading in
 * print, and the app's wordmark has left the scroll so the *missions* are the
 * first thing under the sky.
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
import { hit, palette, radii, roles, spacing, springs } from '@/theme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useShift } from '@/hooks/useShift';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useGame } from '@/state/store';
import { Button, Panel, ScreenFrame, Text, TopBar } from '@/ui';
import { StarCounter } from '@/screens/Mission/StarCounter';
import { GRID_GAP, useScaledLayout } from '@/screens/shared';
import { BellTower, DispatchBackdrop, DispatchDesk, deskHeight, heroHeight } from './DispatchBackdrop';
import { MissionSlip } from './MissionSlip';

const STAMP_MS = 560;
/** height of the corner-control row the scroll must start below */
const CHROME_ROOM = 68;

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
        <Text variant="body" color={roles.ink.secondary} center>
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

/**
 * Today's board or the whole book. A two-way switch, not a mystery link: the
 * side you are on is filled in and marked "•", so it never reads by colour alone.
 */
function BoardSwitch({ showAll, onChange }: { showAll: boolean; onChange: (all: boolean) => void }) {
  const opt = (all: boolean, label: string) => {
    const on = showAll === all;
    return (
      <Pressable
        key={label}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        accessibilityLabel={label}
        onPress={() => {
          if (on) return;
          sfx.play('tap-soft');
          haptics.select();
          onChange(all);
        }}
        style={[styles.switchOpt, on && styles.switchOptOn]}
      >
        <Text variant="buttonSmall" color={on ? roles.ink.primary : roles.ink.muted} center numberOfLines={1}>
          {on ? `• ${label}` : label}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={styles.switchWrap}>
      {opt(false, "Today's board")}
      {opt(true, 'All missions')}
    </View>
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
      return { locked: true, label: `Finish ${name} first` };
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

  /* Bea reacts; she does not restate the heading. */
  const beaLine = shift.mealTime
    ? 'Nice work! Fancy a snack in the kitchen?'
    : shift.missionsDone > 0
      ? `That's ${shift.missionsDone} done. The town says thank you!`
      : 'The bell just rang — I knew you would come.';

  const hero = heroHeight(layout.isTablet, layout.height);
  const desk = deskHeight(layout.isTablet, layout.height) + insets.bottom;

  /* A board grows sideways on a wide window: more slips, not fatter ones. */
  const cols = layout.columns(340, 3);
  const cellWidth = (layout.gridWidth - spacing.md * 2 - GRID_GAP * (cols - 1)) / cols;
  const roomy = cellWidth >= 400;

  return (
    <ScreenFrame backdrop={<DispatchBackdrop hero={hero} />} chrome={<TopBar right={<StarCounter stars={shift.starsEarned} />} />} safeBottom={false}>
      <BellTower swing={swing} top={hero - 182} />
      <DingDing visible={ding} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: desk + spacing.lg, maxWidth: layout.gridWidth }]}
        showsVerticalScrollIndicator={false}
      >
        {/* the one place the task is written */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.headerWrap}>
          <View style={styles.headerPlate} />
          <Panel tone="cream" radius="panel" padding="sm" style={styles.headerPanel}>
            <Text variant="h1" center accessibilityRole="header">
              Dispatch
            </Text>
            <Text variant="body" color={roles.ink.secondary} center>
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

        {all.length > board.length ? <BoardSwitch showAll={showAll} onChange={setShowAll} /> : null}

        {list.length === 0 ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.emptyWrap}>
            <Panel tone="white" radius="panel" style={styles.empty}>
              <Text variant="h2" center>
                The board is being written!
              </Text>
              <Text variant="body" color={roles.ink.secondary} center>
                Captain Bea is still writing today&apos;s jobs. Try the Training Yard while you wait.
              </Text>
              <Button label="Training Yard ›" tone="green" size="lg" onPress={() => router.push('/training')} />
            </Panel>
          </Animated.View>
        ) : (
          <View style={styles.grid}>
            {list.map((m, i) => {
              const lock = lockInfo(m);
              return (
                <View key={m.id} style={cols > 1 ? { width: cellWidth } : styles.fullCell}>
                  <MissionSlip
                    mission={m}
                    index={i}
                    stars={(progressMissions[m.id]?.stars ?? 0) as Stars}
                    locked={lock.locked}
                    lockLabel={lock.label}
                    dispatched={dispatchedId === m.id}
                    roomy={roomy}
                    onPress={() => choose(m)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <DispatchDesk line={beaLine} safeBottom={insets.bottom} />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.md,
    /* clear the back button and the star counter: the board never starts under them */
    paddingTop: CHROME_ROOM,
    gap: spacing.sm,
    width: '100%',
    alignSelf: 'center',
  },
  headerWrap: { alignItems: 'center', marginBottom: spacing.xxs, alignSelf: 'stretch' },
  headerPlate: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: -8,
    bottom: 12,
    backgroundColor: palette.tan,
    borderRadius: radii.panel,
  },
  headerPanel: { alignSelf: 'stretch', ...roles.lift.interactive },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, justifyContent: 'center' },
  fullCell: { width: '100%' },
  meal: { gap: spacing.xs },
  mealRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xxs },
  mealBtn: { flex: 1 },
  emptyWrap: { paddingTop: spacing.md },
  empty: { gap: spacing.sm, alignItems: 'center' },
  switchWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
    ...roles.lift.surface,
  },
  switchOpt: {
    minHeight: hit.min,
    minWidth: 138,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  switchOptOn: { backgroundColor: palette.creamDeep },
  ding: {
    position: 'absolute',
    right: Platform.OS === 'web' ? 12 : 8,
    top: 96,
    backgroundColor: palette.white,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    zIndex: 40,
    ...roles.lift.interactive,
  },
  dingText: { letterSpacing: 0.6 },
});
