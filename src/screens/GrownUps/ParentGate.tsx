import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { hit, palette, radii, shadows, spacing, springs, timings } from '@/theme';
import { CheckIcon, GlyphIcon, Panel, Text } from '@/ui';
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
const EDGE = 4;

const BackspaceIcon = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M8.6 5h10.4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8.6a2 2 0 0 1-1.5-.7L2.6 13a1.6 1.6 0 0 1 0-2l4.5-5.3A2 2 0 0 1 8.6 5z" fill={palette.navy} />
    <Path d="M11 9.5l5 5M16 9.5l-5 5" stroke={palette.white} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

/** One keypad key: a face resting on a darker edge that sinks when pressed. */
function Key({ label, onPress }: { label: string; onPress: () => void }) {
  const isClear = label === 'clear';
  const isEnter = label === 'enter';
  const pressed = useSharedValue(0);
  const faceStyle = useAnimatedStyle(() => ({ transform: [{ translateY: pressed.value * EDGE }] }));
  const edge = isEnter ? palette.leafGreenDark : isClear ? palette.tanDark : palette.slateLight;
  const face = isEnter ? palette.leafGreen : isClear ? palette.creamDeep : palette.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isClear ? 'Delete' : isEnter ? 'Check answer' : label}
      onPressIn={() => {
        pressed.value = withTiming(1, timings.fast);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, springs.pop);
      }}
      onPress={() => {
        sfx.play('tap-soft');
        haptics.select();
        onPress();
      }}
      style={[styles.keyEdge, { backgroundColor: edge }]}
    >
      <Animated.View style={[styles.keyFace, { backgroundColor: face }, faceStyle]}>
        {isClear ? (
          <BackspaceIcon />
        ) : isEnter ? (
          <CheckIcon size={28} color={palette.white} />
        ) : (
          <Text variant="button" color={palette.navy} style={styles.keyLabel}>
            {label}
          </Text>
        )}
      </Animated.View>
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
          <View style={styles.display} accessible accessibilityLabel={entry ? `Entered ${entry}` : 'Nothing entered yet'}>
            <Text variant="numeral" color={entry ? palette.navy : palette.slate} center>
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
          <View style={styles.failRow}>
            <GlyphIcon id="wave" size={26} label="" />
            <Text variant="h3" center>
              Ask a grown-up!
            </Text>
          </View>
          <Text variant="small" color={palette.navySoft} center>
            Taking you back to the station.
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const KEY_W = 78;

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md, gap: spacing.md },
  head: { gap: 4, alignItems: 'center' },
  card: { gap: spacing.md, width: 330, maxWidth: '100%', alignItems: 'center' },
  display: {
    alignSelf: 'stretch',
    minHeight: 66,
    borderRadius: radii.card,
    backgroundColor: palette.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center', width: KEY_W * 3 + spacing.xs * 2 },
  keyEdge: { width: KEY_W, height: hit.min + EDGE, borderRadius: radii.tile, ...shadows.soft },
  keyFace: {
    width: KEY_W,
    height: hit.min,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  keyLabel: { includeFontPadding: false },
  failCard: { backgroundColor: palette.white, borderRadius: radii.card, padding: spacing.md, gap: 2, alignItems: 'center' },
  failRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
