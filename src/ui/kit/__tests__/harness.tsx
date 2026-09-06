/**
 * The render harness for the three shared shells.
 *
 * Every mini-game in the app is drawn inside `TaskBar`, `ActivityFrame` and
 * `AnswerTile`, so a break in any of them breaks all 27 at once. These helpers
 * exist so those tests can assert on what a child would actually see — is the
 * instruction there once, are the controls beside the play area or under it,
 * does a wrong answer draw a mark and not just turn orange — rather than on
 * how the components are written.
 *
 * Two things need pinning down before a layout assertion means anything:
 *
 *   - the **window width**, because `ActivityFrame` switches to a side rail
 *     past `activity.sideLayoutMinWidth`. `useWindowDimensions` seeds itself
 *     from `Dimensions.get('window')`, so that is what `atWindowWidth` fakes.
 *   - the **safe-area insets**, because the frame owns the notch inset itself.
 *     `SafeAreaProvider` takes fixed metrics, which keeps the numbers in the
 *     tests real rather than zero.
 *
 * The tree walkers below read `screen.toJSON()` — the host-level output, after
 * styles are flattened — so they see what the renderer would hand the platform.
 */
import React from 'react';
import { Dimensions, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, screen } from '@testing-library/react-native';

/** A 390×844 phone with a notch — the default device these screens are drawn for. */
export const PHONE_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * Pin the window width for this test. Returns nothing; call `jest.restoreAllMocks()`
 * (or rely on the suite's `afterEach`) to put the real `Dimensions` back.
 */
export function atWindowWidth(width: number, height = 800): void {
  jest.spyOn(Dimensions, 'get').mockReturnValue({ width, height, scale: 2, fontScale: 1 });
}

/** Render inside a safe-area provider with real, fixed insets. */
export async function renderKit(ui: React.ReactElement): Promise<void> {
  await render(<SafeAreaProvider initialMetrics={PHONE_METRICS}>{ui}</SafeAreaProvider>);
}

/**
 * Let a queued spoken line actually reach `expo-speech`.
 *
 * `services/speech.ts` awaits `Speech.stop()` before it speaks — on Android the
 * two race into the same engine and a same-tick stop can cancel the *new*
 * utterance — so `Speech.speak` lands a microtask after the button is pressed,
 * not inside `fireEvent.press`. Anything asserting on what was said has to
 * drain that queue first.
 *
 * Deliberately NOT `act()`: speaking updates no React state, and opening a
 * second act scope inside the one `render` already holds trips React's
 * "overlapping act() calls" and leaves the renderer wedged for the rest of the
 * file. A turn of the event loop is all this needs.
 */
export async function flushSpeech(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

/* ------------------------------------------------------------------ */
/* Reading the rendered tree                                            */
/* ------------------------------------------------------------------ */

export interface JsonNode {
  type: string;
  props: Record<string, unknown>;
  children: (JsonNode | string)[] | null;
}

/** The host tree as plain JSON. */
export function tree(): JsonNode {
  const json = screen.toJSON() as unknown as JsonNode | null;
  if (!json) throw new Error('nothing rendered');
  return json;
}

const kids = (node: JsonNode): (JsonNode | string)[] => node.children ?? [];

/** A node's flattened style — what the platform would actually be given. */
export function styleOf(node: JsonNode): ViewStyle {
  return (StyleSheet.flatten(node.props.style as ViewStyle) ?? {}) as ViewStyle;
}

/** Every node from the root down to, and including, the first match. */
export function pathTo(root: JsonNode, match: (n: JsonNode) => boolean, trail: JsonNode[] = []): JsonNode[] | null {
  const here = [...trail, root];
  if (match(root)) return here;
  for (const child of kids(root)) {
    if (typeof child === 'string') continue;
    const found = pathTo(child, match, here);
    if (found) return found;
  }
  return null;
}

/** Like `pathTo`, but the child indices — so two nodes can be put in drawing order. */
export function indexPathTo(root: JsonNode, match: (n: JsonNode) => boolean, trail: number[] = []): number[] | null {
  if (match(root)) return trail;
  const children = kids(root);
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    if (!child || typeof child === 'string') continue;
    const found = indexPathTo(child, match, [...trail, i]);
    if (found) return found;
  }
  return null;
}

/** The single node matching, or a clear failure. */
export function nodeMatching(root: JsonNode, match: (n: JsonNode) => boolean): JsonNode {
  const path = pathTo(root, match);
  if (!path) throw new Error('no node matched');
  const last = path[path.length - 1];
  if (!last) throw new Error('no node matched');
  return last;
}

export const byTestID = (id: string) => (n: JsonNode) => n.props.testID === id;

/** True when `a` is drawn before `b` — i.e. `b` sits below / on top of `a`. */
export function drawnBefore(root: JsonNode, a: (n: JsonNode) => boolean, b: (n: JsonNode) => boolean): boolean {
  const pa = indexPathTo(root, a);
  const pb = indexPathTo(root, b);
  if (!pa || !pb) throw new Error('one of the nodes is not in the tree');
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const x = pa[i] ?? -1;
    const y = pb[i] ?? -1;
    if (x !== y) return x < y;
  }
  return false;
}

/** True when `outer` contains `inner`. */
export function contains(root: JsonNode, outer: (n: JsonNode) => boolean, inner: (n: JsonNode) => boolean): boolean {
  const path = pathTo(root, outer);
  if (!path) return false;
  const node = path[path.length - 1];
  return !!node && !!pathTo(node, inner);
}

/* ------------------------------------------------------------------ */
/* State that can be seen without colour                                */
/* ------------------------------------------------------------------ */

/**
 * A fingerprint of the mark drawn on an `AnswerTile` — the little badge in the
 * corner, not the fill behind it. Returns `null` when the tile draws no mark at
 * all, so a test can say "correct and retry draw *different* marks, and idle
 * draws none" without pinning down the artwork itself.
 */
export function drawnMark(root: JsonNode): string | null {
  const badge = pathTo(root, (n) => {
    const s = styleOf(n);
    return s.position === 'absolute' && s.width === 28 && s.height === 28 && s.borderRadius === 14;
  });
  if (!badge) return null;
  const node = badge[badge.length - 1];
  if (!node) return null;

  const shapes: string[] = [];
  const walk = (n: JsonNode | string): void => {
    if (typeof n === 'string') return;
    if (n.type.startsWith('RNSVG') && typeof n.props.d === 'string') shapes.push(`${n.type}:${n.props.d}`);
    for (const c of kids(n)) walk(c);
  };
  walk(node);
  return shapes.length ? shapes.join('|') : null;
}
