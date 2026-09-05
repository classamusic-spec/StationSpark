import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { hit, palette, radii, shadows, spacing } from '@/theme';
import { Panel, Text } from '@/ui';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { useFeedbackAnim } from '@/hooks';

interface Question {
  prompt: string;
  answer: number;
}

const QUESTIONS: Question[] = [
  { prompt: 'What is 7 × 6?', answer: 42 },
  { prompt: 'What is 8 × 9?', answer: 72 },
  { prompt: 'What is 12 × 4?', answer: 48 },
  { prompt: 'What is 15 + 27?', answer: 42 },
  { prompt: 'What is 9 × 7?', answer: 63 },
  { prompt: 'What is 96 ÷ 8?', answer: 12 },
];

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'] as const;

function Key({ label, onPress, wide }: { label: string; onPress: () => void; wide?: boolean }) {
  const isAction = label === 'clear' || label === 'enter';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === 'clear' ? 'Clear' : label === 'enter' ? 'Check answer' : label}
      onPress={() => {
        sfx.play('tap-soft');
        haptics.select();
        onPress();
      }}
      style={[styles.key, shadows.soft, isAction && styles.keyAction, label === 'enter' && styles.keyEnter, wide && styles.keyWide]}
    >
      <Text variant="button" color={label === 'enter' ? palette.white : palette.navy}>
        {label === 'clear' ? '⌫' : label === 'enter' ? '✓' : label}
      </Text>
    </Pressable>
  );
}

/**
 * The friendly gate in front of the grown-ups area. One arithmetic question,
 * randomised, with a big numeric keypad. A wrong answer says "Ask a grown-up!"
 * and hands the tablet back to the child.
 */
export function ParentGate({ onPass, onFail }: { onPass: () => void; onFail: () => void }) {
  // A fresh random question per mount (lazy initializer, so it only runs once).
  const [question] = useState(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)] ?? QUESTIONS[0]);
  const [entry, setEntry] = useState('');
  const [failed, setFailed] = useState(false);
  const { style, wobble } = useFeedbackAnim();

  const check = useCallback(() => {
    if (!question) return;
    if (Number(entry) === question.answer) {
      sfx.play('success');
      haptics.success();
      onPass();
      return;
    }
    wobble();
    setEntry('');
    setFailed(true);
    setTimeout(onFail, 1600);
  }, [entry, onFail, onPass, question, wobble]);

  return (
    <View style={styles.wrap}>
      <Animated.View entering={FadeInDown.springify().damping(17)} style={styles.head}>
        <Text variant="h1" center>
          For Grown-Ups
        </Text>
        <Text variant="body" color={palette.navySoft} center>
          Just checking a grown-up is here.
        </Text>
      </Animated.View>

      <Animated.View style={style}>
        <Panel tone="white" padding="lg" radius="panel" style={styles.card}>
          <Text variant="h2" center>
            {question?.prompt ?? ''}
          </Text>
          <View style={styles.display}>
            <Text variant="numeral" color={palette.navy} center>
              {entry || '—'}
            </Text>
          </View>

          <View style={styles.pad}>
            {KEYS.map((k) => (
              <Key
                key={k}
                label={k}
                onPress={() => {
                  if (k === 'clear') setEntry((v) => v.slice(0, -1));
                  else if (k === 'enter') check();
                  else setEntry((v) => (v.length >= 4 ? v : v + k));
                }}
              />
            ))}
          </View>
        </Panel>
      </Animated.View>

      {failed ? (
        <Animated.View entering={FadeIn} style={[styles.failCard, shadows.card]}>
          <Text variant="h3" center>
            Ask a grown-up! 👋
          </Text>
          <Text variant="small" color={palette.navySoft} center>
            Taking you back to the station.
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md, gap: spacing.md },
  head: { gap: 4, alignItems: 'center' },
  card: { gap: spacing.md, width: 320, maxWidth: '100%', alignItems: 'center' },
  display: {
    alignSelf: 'stretch',
    minHeight: 66,
    borderRadius: radii.card,
    backgroundColor: palette.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  key: {
    width: 76,
    height: hit.min,
    borderRadius: radii.tile,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.slateLight,
  },
  keyAction: { backgroundColor: palette.creamDeep, borderColor: palette.tanDark },
  keyEnter: { backgroundColor: palette.leafGreen, borderColor: palette.leafGreenDark },
  keyWide: { width: 158 },
  failCard: { backgroundColor: palette.white, borderRadius: radii.card, padding: spacing.md, gap: 2 },
});
