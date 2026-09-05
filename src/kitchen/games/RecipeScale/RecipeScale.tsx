import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { palette, radii, shadows, spacing, springs } from '@/theme';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useFeedbackAnim } from '@/hooks';
import { Text } from '@/ui/Text';
import { Button } from '@/ui/Button';
import { PromptBanner } from '@/ui/kit/PromptBanner';
import { GrownUpChip } from '@/ui/kit/Chip';
import { HintBubble } from '@/ui/kit/HintBubble';
import { Tray } from '@/ui/kit/Tray';
import { VocabIcon } from '@/ui/kit/VocabIcon';
import { CharacterPortrait } from '@/characters/CharacterPortrait';
import { RecipeCardFrame } from '../../parts/RecipeCardFrame';
import { CookCTA, PotArt } from '../../parts/SceneBits';
import { pluralEn } from '../../spanish';
import { scaleExplanation, scaleRatioText } from '../../shareMath';
import { kitchenFeel, useBeaconHint } from '../useKitchenGame';

const CREW = ['rookie', 'bea', 'beacon', 'pepper'] as const;

export function RecipeScale({
  challenge,
  onComplete,
  onEvent,
  compact,
}: MiniGameProps<'recipe-scale'>) {
  const session = useMiniGameSession('recipe-scale', onComplete, onEvent);
  const beacon = useBeaconHint(session);

  const [values, setValues] = useState<number[]>(() => challenge.lines.map((l) => l.amount));
  const [bumps, setBumps] = useState<number[]>(() => challenge.lines.map(() => 0));
  const [cooking, setCooking] = useState(false);

  const allCorrect = useMemo(
    () => challenge.lines.every((l, i) => (values[i] ?? 0) === l.scaled),
    [challenge.lines, values],
  );

  useEffect(() => {
    speech.say(
      `This recipe serves ${challenge.serves}, but ${challenge.eating} are eating. Fix the amounts!`,
      {
        speaker: 'bea',
      },
    );
    return () => speech.stop();
  }, [challenge.eating, challenge.serves]);

  const step = useCallback(
    (index: number, delta: number) => {
      if (cooking) return;
      setValues((v) => v.map((n, i) => (i === index ? Math.max(0, Math.min(99, n + delta)) : n)));
      sfx.play(delta > 0 ? 'pop' : 'tap-soft');
      haptics.select();
      const line = challenge.lines[index];
      if (line) session.learnedWord(line.item.es);
    },
    [challenge.lines, cooking, session],
  );

  const finish = useCallback(() => {
    setCooking(true);
    kitchenFeel.finish();
    sfx.play('sizzle');
    speech.say('Enough for everyone. Into the pot!', { speaker: 'bea' });
    setTimeout(() => session.complete(), 1500);
  }, [session]);

  const check = useCallback(() => {
    if (cooking) return;
    if (allCorrect) {
      session.correct('scaled');
      beacon.cheer('Perfect amounts for everybody!');
      setTimeout(finish, 420);
      return;
    }
    const wrongIndex = challenge.lines.findIndex((l, i) => (values[i] ?? 0) !== l.scaled);
    const line = challenge.lines[wrongIndex];
    setBumps((b) =>
      b.map((v, i) => ((values[i] ?? 0) !== (challenge.lines[i]?.scaled ?? 0) ? v + 1 : v)),
    );
    if (line) {
      beacon.nudge(
        scaleExplanation(
          pluralEn(line.item.en, line.amount),
          line.amount,
          challenge.serves,
          challenge.eating,
          line.scaled,
        ),
        line.item.es,
      );
    }
  }, [
    allCorrect,
    beacon,
    challenge.eating,
    challenge.lines,
    challenge.serves,
    cooking,
    finish,
    session,
    values,
  ]);

  const showMe = useCallback(() => {
    beacon.askedForHelp();
    const idx = challenge.lines.findIndex((l, i) => (values[i] ?? 0) !== l.scaled);
    const line = challenge.lines[idx];
    if (!line) return;
    setValues((v) => v.map((n, i) => (i === idx ? line.scaled : n)));
    sfx.play('pop');
    haptics.drop();
  }, [beacon, challenge.lines, values]);

  return (
    <View style={styles.root}>
      <PromptBanner
        title={`${challenge.eating} are eating!`}
        subtitle={`This recipe serves ${challenge.serves}. Set the new amounts.`}
        compact={compact}
      />

      <View style={styles.ratio}>
        <CrewRow label={`Serves ${challenge.serves}`} count={challenge.serves} />
        <Text variant="h2" color={palette.engineRed}>
          →
        </Text>
        <CrewRow
          label={`${challenge.eating} eating`}
          count={challenge.eating}
          extraFrom={challenge.serves}
        />
      </View>

      <View style={styles.cardWrap}>
        <RecipeCardFrame
          title={`Serves ${challenge.serves} → ${challenge.eating}`}
          titleEs={scaleRatioText(challenge.serves, challenge.eating)}
          badge={<GrownUpChip />}
        >
          {challenge.lines.map((line, i) => (
            <ScaleLine
              key={line.item.id}
              index={i}
              icon={line.item.id}
              en={line.item.en}
              es={line.item.es}
              was={line.amount}
              value={values[i] ?? 0}
              correct={(values[i] ?? 0) === line.scaled}
              bump={bumps[i] ?? 0}
              disabled={cooking}
              onStep={(d) => step(i, d)}
            />
          ))}
        </RecipeCardFrame>
      </View>

      <View style={styles.potRow}>
        <PotArt size={140} bubbling={cooking} />
      </View>

      <Tray tone="cream">
        <View style={styles.trayRow}>
          {beacon.offerHelp && !cooking ? (
            <Button label="Show me" tone="yellow" size="sm" onPress={showMe} sound="tap-soft" />
          ) : null}
        </View>
        <CookCTA
          label={cooking ? 'Simmering…' : 'Into the pot!'}
          tone={cooking ? 'green' : 'red'}
          onPress={check}
          disabled={cooking}
        />
      </Tray>

      <HintBubble
        text={beacon.text}
        es={beacon.es}
        visible={beacon.visible}
        onDismiss={beacon.dismiss}
      />
    </View>
  );
}

function CrewRow({
  label,
  count,
  extraFrom,
}: {
  label: string;
  count: number;
  extraFrom?: number;
}) {
  return (
    <View style={styles.crewCol}>
      <View style={styles.crewRow}>
        {Array.from({ length: Math.min(count, 8) }, (_, i) => (
          <Animated.View
            key={i}
            entering={ZoomIn.delay(i * 50)
              .springify()
              .damping(13)}
            style={extraFrom !== undefined && i >= extraFrom ? styles.crewExtra : undefined}
          >
            <CharacterPortrait id={CREW[i % CREW.length] ?? 'rookie'} size={26} />
          </Animated.View>
        ))}
      </View>
      <Text variant="tiny" color={palette.navySoft}>
        {label}
      </Text>
    </View>
  );
}

function ScaleLine({
  index,
  icon,
  en,
  es,
  was,
  value,
  correct,
  bump,
  disabled,
  onStep,
}: {
  index: number;
  icon: string;
  en: string;
  es: string;
  was: number;
  value: number;
  correct: boolean;
  bump: number;
  disabled?: boolean;
  onStep: (delta: number) => void;
}) {
  const fb = useFeedbackAnim();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (bump > 0) fb.wobble({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump]);

  useEffect(() => {
    pulse.value = withSequence(withSpring(1.12, springs.pop), withSpring(1, springs.gentle));
  }, [pulse, value]);

  const numStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  // Outer node owns the entrance (layout) animation, inner node owns the wobble
  // transform — Reanimated warns and can drop one of them if they share a node.
  return (
    <Animated.View entering={FadeInDown.delay(index * 70).springify()}>
      <Animated.View style={fb.style}>
        <View style={[styles.line, correct && styles.lineDone]}>
          <VocabIcon id={icon} size={38} />
          <View style={styles.lineText}>
            <Text variant="bodyStrong" color={palette.navy} numberOfLines={1}>
              {pluralEn(en, value)}
            </Text>
            <Text variant="tiny" color={palette.purple} numberOfLines={1}>
              {es} · was {was}
            </Text>
          </View>
          <Stepper label="−" onPress={() => onStep(-1)} disabled={disabled || value <= 0} />
          <Animated.View style={[styles.value, numStyle]}>
            <Text variant="h1" color={correct ? palette.leafGreenDark : palette.navy}>
              {value}
            </Text>
          </Animated.View>
          <Stepper label="+" onPress={() => onStep(1)} disabled={disabled} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function Stepper({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'One more' : 'One less'}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={[styles.stepper, disabled && styles.stepperOff]}
    >
      <Text variant="h1" color={palette.white}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  ratio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  crewCol: { alignItems: 'center' },
  crewRow: { flexDirection: 'row', gap: 2 },
  crewExtra: { borderRadius: 999, borderWidth: 2, borderColor: palette.safetyYellow },
  cardWrap: { paddingHorizontal: spacing.md, marginTop: spacing.xs },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.white,
    borderRadius: radii.tile,
    paddingVertical: 6,
    paddingHorizontal: spacing.xs,
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadows.soft,
  },
  lineDone: { borderColor: palette.leafGreen, backgroundColor: palette.mint },
  lineText: { flex: 1 },
  value: { minWidth: 46, alignItems: 'center' },
  stepper: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: palette.engineRed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  stepperOff: { backgroundColor: palette.lockedGrey },
  potRow: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.xs },
  trayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 4,
  },
});
