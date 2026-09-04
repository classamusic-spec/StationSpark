import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '@/theme';
import { Text } from '../Text';

const glyph: Record<string, string> = {
  water: '💧', help: '🆘', open: '🟢', closed: '🔴', red: '🟥', blue: '🟦', one: '1️⃣', two: '2️⃣', three: '3️⃣',
  ladder: '🪜', hose: '🧵', truck: '🚒', hydrant: '🚰', cone: '🔶', flashlight: '🔦', helmet: '⛑️', radio: '📻',
  boots: '🥾', 'first-aid': '🧰', bucket: '🪣', extinguisher: '🧯', rope: '🪢', axe: '🪓',
  tomato: '🍅', cheese: '🧀', milk: '🥛', apple: '🍎', bread: '🍞', egg: '🥚', flour: '🌾', butter: '🧈', sugar: '🍬',
  strawberry: '🍓', banana: '🍌', mushroom: '🍄', pepper: '🫑', olive: '🫒', basil: '🌿', taco: '🌮', pizza: '🍕', soup: '🍲',
  cat: '🐱', dog: '🐶', bunny: '🐰', duck: '🦆', turtle: '🐢',
  bakery: '🥐', school: '🏫', library: '📚', park: '🌳', 'pet-shop': '🐾', market: '🧺', house: '🏠', tree: '🌲',
  sun: '☀️', cloud: '☁️', rain: '🌧️', left: '⬅️', right: '➡️', up: '⬆️', down: '⬇️', happy: '😊', sad: '😢',
};

/** STUB (emoji) — replaced by SVG vocabulary art with the same props. Unknown ids render a friendly "?". */
export function VocabIcon({ id, size = 64 }: { id: string; size?: number }) {
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size * 0.25 }]}>
      <Text style={{ fontSize: size * 0.6, lineHeight: size * 0.8 }}>{glyph[id] ?? '❔'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', backgroundColor: palette.panel },
});
