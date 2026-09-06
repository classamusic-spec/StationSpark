/**
 * ActivityFrame — the shape all 27 activities stand in.
 *
 *   top     one task bar
 *   middle  the play area, as large as the screen allows
 *   bottom  the controls — or, past `activity.sideLayoutMinWidth`, a rail beside
 *           the play area, so a tablet buys a bigger activity and not wider chrome
 *
 * These tests read the host tree rather than any component internals: where the
 * controls end up relative to the play area, and where the hint lane is allowed
 * to reach. The hint bubble is the fiddly one — it must never cover the thing it
 * is telling the child to touch, which means standing under the play area on a
 * phone and stopping at the rail's edge on a tablet.
 */
import React from 'react';
import { View } from 'react-native';
import { screen } from '@testing-library/react-native';
import { activity, spacing } from '@/theme';
import { ActivityFrame } from '../ActivityFrame';
import { atWindowWidth, byTestID, contains, drawnBefore, type JsonNode, nodeMatching, pathTo, renderKit, styleOf, tree } from './harness';

const PLAY = 'play-area';
const CONTROLS = 'controls';
const HINT = 'Try the blue hydrant';

const TABLET = activity.sideLayoutMinWidth;
const PHONE = 390;

async function frame(width: number, opts: { controls?: boolean; hint?: boolean } = {}) {
  const { controls = true, hint = false } = opts;
  atWindowWidth(width);
  await renderKit(
    <ActivityFrame
      task="Pick the number"
      controls={controls ? <View testID={CONTROLS} /> : undefined}
      hint={hint ? { text: HINT, visible: true } : undefined}
    >
      <View testID={PLAY} />
    </ActivityFrame>,
  );
}

/** The rail: the fixed-width column the controls stand in on a wide screen. */
const isRail = (n: JsonNode) => styleOf(n).width === activity.sidePanelWidth;
/** The split body: the one row that holds the play area and the rail side by side. */
const isRow = (n: JsonNode) => styleOf(n).flexDirection === 'row' && styleOf(n).flex === 1;
/** The absolute lane the hint bubble lives in. */
const isHintLane = (n: JsonNode) => styleOf(n).position === 'absolute' && styleOf(n).zIndex === 20;

/** Every node between the root and `testID`, nearest ancestor last. */
function ancestorsOf(testID: string): JsonNode[] {
  const path = pathTo(tree(), byTestID(testID));
  if (!path) throw new Error(`${testID} is not in the tree`);
  return path.slice(0, -1);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('one bar, one task', () => {
  it('draws the instruction once, and lets the game keep its play area clean', async () => {
    await frame(PHONE);

    expect(screen.getAllByText('Pick the number')).toHaveLength(1);
    expect(screen.getByTestId(PLAY)).toBeOnTheScreen();
  });
});

describe('on a phone', () => {
  it('puts the controls below the play area, not beside it', async () => {
    await frame(PHONE);

    expect(ancestorsOf(CONTROLS).some(isRail)).toBe(false);
    expect(ancestorsOf(CONTROLS).some(isRow)).toBe(false);
    // "below" = drawn after, in a column: they are siblings under the frame.
    expect(drawnBefore(tree(), byTestID(PLAY), byTestID(CONTROLS))).toBe(true);
  });

  it('gives the play area the room the controls do not need', async () => {
    await frame(PHONE);
    const play = ancestorsOf(PLAY).at(-1);
    expect(styleOf(play as JsonNode).flex).toBe(1);
  });
});

describe('on a tablet', () => {
  it('moves the controls into a side rail beside the play area', async () => {
    await frame(TABLET);

    const rail = ancestorsOf(CONTROLS).find(isRail);
    expect(rail).toBeDefined();
    // The rail and the play area share one row — side by side, not stacked.
    expect(ancestorsOf(CONTROLS).some(isRow)).toBe(true);
    expect(ancestorsOf(PLAY).some(isRow)).toBe(true);
  });

  it('stays stacked one pixel below the threshold', async () => {
    await frame(TABLET - 1);
    expect(ancestorsOf(CONTROLS).some(isRail)).toBe(false);
  });

  it('splits exactly at the threshold', async () => {
    await frame(TABLET);
    expect(ancestorsOf(CONTROLS).some(isRail)).toBe(true);
  });

  it('grows no rail for an activity that has no controls', async () => {
    await frame(TABLET, { controls: false });

    expect(pathTo(tree(), isRail)).toBeNull();
    expect(screen.getByTestId(PLAY)).toBeOnTheScreen();
  });
});

describe('the hint lane', () => {
  it('stands under the play area on a phone, over the full width', async () => {
    await frame(PHONE, { hint: true });

    const lane = nodeMatching(tree(), isHintLane);
    const style = styleOf(lane);
    // anchored to the foot of the frame, never pinned to the top over the play
    expect(style.bottom).toBeDefined();
    expect(style.top).toBeUndefined();
    expect(style.right).toBe(0);
    // it is an overlay beside the play area, not something drawn inside it
    expect(contains(tree(), byTestID(PLAY), isHintLane)).toBe(false);
    expect(drawnBefore(tree(), byTestID(PLAY), isHintLane)).toBe(true);
    expect(screen.getByText(HINT)).toBeOnTheScreen();
  });

  it('stands under the play area on a tablet too, and stops at the rail', async () => {
    await frame(TABLET, { hint: true });

    const style = styleOf(nodeMatching(tree(), isHintLane));
    expect(style.bottom).toBeDefined();
    expect(style.top).toBeUndefined();
    // Full-height rail: letting the bubble measure against it threw it into the
    // middle of the play area, across the Clock Watch dial. The lane ends where
    // the play column ends instead.
    expect(style.right).toBe(activity.sidePanelWidth + spacing.sm * 2);
    expect(contains(tree(), byTestID(PLAY), isHintLane)).toBe(false);
  });

  it('draws no lane at all when the activity has no hint', async () => {
    await frame(PHONE);
    expect(pathTo(tree(), isHintLane)).toBeNull();
  });
});

describe('the safe area', () => {
  it('clears the notch itself, so a host needs no top chrome', async () => {
    await frame(PHONE);

    // The first thing in the frame is a spacer the height of the top inset.
    const root = tree();
    const spacer = pathTo(root, (n) => styleOf(n).height === 47);
    expect(spacer).not.toBeNull();
  });
});
