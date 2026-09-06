/**
 * ONBOARDING — three short beats under the station sign.
 *
 * The stage (bunting, sign, crew on the apron) stays put; the sheet below it
 * carries the words, the pickers and the one big button. The child's Rookie
 * updates live on the stage while they choose, and the whole crew throws a
 * confetti welcome at the end.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, radii, shadows, spacing } from '@/theme';
import { Button, ChevronRightIcon, GlyphIcon, Panel, ScreenFrame, Text } from '@/ui';
import { CelebrationOverlay } from '@/characters';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useGame } from '@/state/store';
import { TownBackdrop } from '@/world';
import { useScaledLayout } from '@/screens/shared';
import { AgeBandCards, AvatarPickers, NameTag } from '@/screens/Locker/LockerScreen';
import { BellSteps } from './parts/BellSteps';
import { StationStage } from './parts/StationStage';

const BEATS = [
  {
    id: 'welcome',
    title: 'Welcome to Station Spark!',
    body: 'I am Captain Bea. Our little station helps the whole town — and you are our newest crew member.',
    es: '¡Bienvenido a Station Spark!',
  },
  {
    id: 'rookie',
    title: 'Now — who are you?',
    body: 'Pick your look, write your name, and tell us how old you are so the games fit you just right.',
    es: '¿Cómo te llamas?',
  },
  {
    id: 'safety',
    title: 'One important thing',
    body: 'In real life, trained grown-ups handle emergencies — here, we practise helping!',
    es: 'En la vida real, los adultos ayudan en emergencias.',
  },
] as const;

/** A beat's words — on a card of their own, or bare on the sheet. */
function Prose({ card, title, body, es }: { card: boolean; title: string; body: string; es: string }) {
  const inner = (
    <>
      <Text variant="h2" center accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body" color={palette.navySoft} center>
        {body}
      </Text>
      <View style={styles.esRow}>
        <GlyphIcon id="subject-spanish" size={18} label="en español" ink={palette.purple} />
        <Text variant="small" color={palette.purple} center>
          {es}
        </Text>
      </View>
    </>
  );
  if (!card) return <View style={styles.prose}>{inner}</View>;
  return (
    <Panel tone="white" padding="md" radius="panel" style={styles.card}>
      {inner}
    </Panel>
  );
}

export function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const layout = useScaledLayout();
  const profile = useGame((s) => s.profile);
  const setProfile = useGame((s) => s.setProfile);
  const setAvatar = useGame((s) => s.setAvatar);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name === 'Rookie' ? '' : profile.name);
  const [celebrating, setCelebrating] = useState(false);

  const beat = BEATS[Math.min(step, BEATS.length - 1)] ?? BEATS[0];
  const last = step === BEATS.length - 1;

  const speakBeat = useCallback((index: number) => {
    const b = BEATS[index];
    if (!b) return;
    speech.say(b.title, { speaker: index === 2 ? 'rookie' : 'bea' });
  }, []);

  useEffect(() => {
    speakBeat(step);
  }, [speakBeat, step]);

  /**
   * Every look change sparkles on the Rookie standing on the stage.
   * `SparkleBurst` only needs the number to CHANGE, so derive it from the look
   * itself — setting state from an effect just to count the changes cost an
   * extra render per tap (and fired a burst on mount that nobody asked for).
   */
  const sparkle = useMemo(() => {
    const look = `${profile.avatar.skin}|${profile.avatar.hair}|${profile.avatar.helmet}`;
    let hash = 0;
    for (let i = 0; i < look.length; i += 1) hash = (hash * 31 + look.charCodeAt(i)) % 100000;
    return hash;
  }, [profile.avatar]);

  const next = useCallback(() => {
    if (step < BEATS.length - 1) {
      sfx.play('whoosh');
      haptics.tap();
      setStep((s) => s + 1);
      return;
    }
    setProfile({ name: name.trim() || 'Rookie', onboarded: true });
    sfx.play('fanfare');
    sfx.play('confetti');
    haptics.celebrate();
    setCelebrating(true);
  }, [name, setProfile, step]);

  /* the scene takes a little under half the screen; taller on tablets so the sheet never yawns */
  const stageH = Math.round(Math.max(300, Math.min(layout.height * 0.46, 600)));
  const hills = layout.height - stageH + 40;

  return (
    <ScreenFrame safeBottom={false} backdrop={<TownBackdrop hills={hills} cloudCount={4} />}>
      <StationStage height={stageH - insets.top} step={step} avatar={profile.avatar} sparkle={sparkle} />

      <View style={[styles.sheet, shadows.card]}>
        <ScrollView
          contentContainerStyle={[styles.content, { maxWidth: layout.contentWidth, paddingBottom: insets.bottom + spacing.lg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BellSteps step={step} total={BEATS.length} />

          <Animated.View key={beat.id} entering={FadeIn.duration(220)} exiting={FadeOut.duration(140)} style={styles.beat}>
            {/* On the picker beat the words are a heading on the sheet itself,
                not a fourth white card above three more. A card only earns its
                surface when something inside it can be touched. */}
            <Prose card={step !== 1} title={beat.title} body={beat.body} es={beat.es} />

            {step === 1 ? (
              <Animated.View entering={FadeInDown.springify().damping(17)} style={styles.pickers}>
                <NameTag value={name} onChange={setName} />
                <Panel tone="white" padding="md" radius="panel" style={styles.card}>
                  <Text variant="h3">Pick your look</Text>
                  <AvatarPickers avatar={profile.avatar} onChange={setAvatar} compact />
                </Panel>
                <Panel tone="white" padding="md" radius="panel" style={styles.card}>
                  <Text variant="h3">How old are you?</Text>
                  <AgeBandCards value={profile.ageBand} onChange={(b) => setProfile({ ageBand: b })} compact />
                </Panel>
              </Animated.View>
            ) : null}

            {step === 2 ? (
              <Panel tone="tan" padding="md" radius="panel" style={styles.card}>
                <Text variant="bodyStrong" center>
                  In a real emergency: get away from danger, tell a grown-up, and call your local emergency number.
                </Text>
              </Panel>
            ) : null}
          </Animated.View>

          <Button
            label={last ? "Let's go!" : 'Next'}
            size="xl"
            tone={last ? 'green' : 'red'}
            block
            glow
            iconRight={<ChevronRightIcon size={28} />}
            onPress={next}
            style={styles.cta}
          />
        </ScrollView>
      </View>

      <CelebrationOverlay
        visible={celebrating}
        title="Welcome to the crew!"
        subtitle={`${name.trim() || 'Rookie'}, your helmet is ready.`}
        ctaLabel="Start helping"
        onNext={() => {
          setCelebrating(false);
          router.replace('/');
        }}
      />
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: palette.panel,
    borderTopLeftRadius: radii.panel + 6,
    borderTopRightRadius: radii.panel + 6,
    overflow: 'hidden',
  },
  /** short beats sit centred in the sheet; the picker beat scrolls as normal */
  content: { width: '100%', alignSelf: 'center', flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
  beat: { gap: spacing.sm },
  card: { gap: 6 },
  prose: { gap: 6, paddingHorizontal: spacing.xs, paddingTop: spacing.xs },
  esRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  pickers: { gap: spacing.sm },
  cta: { marginTop: spacing.xs, alignSelf: 'stretch' },
});
