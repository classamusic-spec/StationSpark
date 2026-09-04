import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { palette, radii, shadows, spacing } from '@/theme';
import { Button, ChevronRightIcon, Logo, Panel, ScreenFrame, Text } from '@/ui';
import { CelebrationOverlay } from '@/characters';
import { CaptainBea } from '@/characters/CaptainBea';
import { Beacon } from '@/characters/Beacon';
import { Rookie } from '@/characters/Rookie';
import { Pepper } from '@/characters/Pepper';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';
import { useGame } from '@/state/store';
import { TownBackdrop } from '@/world';
import { useScaledLayout } from '@/screens/shared';
import { AgeBandCards, AvatarPickers, NameTag } from '@/screens/Locker/LockerScreen';

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

export function OnboardingScreen() {
  const router = useRouter();
  const layout = useScaledLayout();
  const profile = useGame((s) => s.profile);
  const setProfile = useGame((s) => s.setProfile);
  const setAvatar = useGame((s) => s.setAvatar);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name === 'Rookie' ? '' : profile.name);
  const [celebrating, setCelebrating] = useState(false);

  const beat = BEATS[Math.min(step, BEATS.length - 1)] ?? BEATS[0];

  const speakBeat = useCallback((index: number) => {
    const b = BEATS[index];
    if (!b) return;
    speech.say(b.title, { speaker: index === 2 ? 'beacon' : 'bea' });
  }, []);

  React.useEffect(() => {
    speakBeat(step);
  }, [speakBeat, step]);

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

  const crewSize = useMemo(() => Math.max(150, Math.min(240, layout.s(196))), [layout]);

  return (
    <ScreenFrame backdrop={<TownBackdrop hills={200} cloudCount={4} />}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { maxWidth: layout.contentWidth }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Logo size={Math.min(layout.s(196), 240)} />
        </View>

        {/* progress dots */}
        <View style={styles.dots}>
          {BEATS.map((b, i) => (
            <View key={b.id} style={[styles.dot, i === step && styles.dotOn, i < step && styles.dotDone]} />
          ))}
        </View>

        <Animated.View key={beat.id} entering={FadeIn.duration(220)} exiting={FadeOut.duration(140)} style={styles.beat}>
          <View style={styles.crew}>
            {step === 0 ? <CaptainBea size={crewSize} emotion="happy" pose="wave" /> : null}
            {step === 1 ? (
              <View style={styles.crewRow}>
                <Rookie size={crewSize} avatar={profile.avatar} pose="stand" emotion="happy" />
                <Pepper size={crewSize * 0.55} emotion="happy" wag />
              </View>
            ) : null}
            {step === 2 ? <Beacon size={crewSize * 0.9} emotion="calm" /> : null}
          </View>

          <Panel tone="white" padding="md" radius="panel" style={styles.card}>
            <Text variant="h2" center>
              {beat.title}
            </Text>
            <Text variant="body" color={palette.navySoft} center>
              {beat.body}
            </Text>
            <Text variant="small" color={palette.purple} center>
              {beat.es}
            </Text>
          </Panel>

          {step === 1 ? (
            <Animated.View entering={FadeInDown.springify().damping(17)} style={styles.pickers}>
              <NameTag value={name} onChange={setName} />
              <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
                <AvatarPickers avatar={profile.avatar} onChange={setAvatar} compact />
              </Panel>
              <Panel tone="cream" padding="md" radius="panel" style={styles.card}>
                <Text variant="h3">How old are you?</Text>
                <AgeBandCards value={profile.ageBand} onChange={(b) => setProfile({ ageBand: b })} />
              </Panel>
            </Animated.View>
          ) : null}

          {step === 2 ? (
            <Panel tone="cream" padding="md" radius="panel" style={[styles.card, styles.safety]}>
              <Text variant="bodyStrong" center>
                In a real emergency: get away from danger, tell a grown-up, and call your local emergency number.
              </Text>
            </Panel>
          ) : null}
        </Animated.View>

        <Button
          label={step === BEATS.length - 1 ? "Let's go!" : 'Next'}
          size="xl"
          tone={step === BEATS.length - 1 ? 'green' : 'red'}
          block
          iconRight={<ChevronRightIcon size={28} />}
          onPress={next}
          style={[styles.cta, shadows.glowGold]}
        />
        <View style={styles.footerSpace} />
      </ScrollView>

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
  scroll: { flex: 1 },
  content: { width: '100%', alignSelf: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  logo: { alignItems: 'center', marginTop: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: spacing.xs },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotOn: { backgroundColor: palette.engineRed, width: 30 },
  dotDone: { backgroundColor: palette.leafGreen },
  beat: { gap: spacing.sm },
  crew: { alignItems: 'center', minHeight: 150 },
  crewRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  card: { gap: 6 },
  pickers: { gap: spacing.sm },
  safety: { borderWidth: 3, borderColor: palette.tanDark, borderRadius: radii.panel },
  cta: { marginTop: spacing.xs },
  footerSpace: { height: spacing.lg },
});
