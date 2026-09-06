/**
 * AnswerTile — the answer state a child can read without seeing colour.
 *
 * Red is never "wrong" in this app and a miss is warm rather than grey, which
 * makes the fill alone a weak signal: a colour-blind child, a screen reader, a
 * washed-out screen in sunlight. So every state has to survive losing its
 * colour, through two channels this file pins down:
 *
 *   - a **drawn mark** in the corner — a tick for right, a go-again arrow for a
 *     miss — which are different shapes, not two colours of the same shape;
 *   - the **accessibility state**, so the same information reaches VoiceOver.
 *
 * The tests deliberately do not assert which artwork is used: only that a mark
 * is drawn, that the two states draw different ones, and that a tile with
 * nothing to report draws none.
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { AnswerTile, type AnswerState } from '../AnswerTile';
import { drawnMark, nodeMatching, renderKit, tree } from './harness';

const LABEL = '18';
const tile = () => screen.getByRole('button', { name: LABEL });

describe('the drawn mark', () => {
  it('marks a correct answer', async () => {
    await renderKit(<AnswerTile label={LABEL} state="correct" />);
    expect(drawnMark(tree())).not.toBeNull();
  });

  it('marks a miss', async () => {
    await renderKit(<AnswerTile label={LABEL} state="wrong" />);
    expect(drawnMark(tree())).not.toBeNull();
  });

  it('draws a different shape for a miss than for a correct answer', async () => {
    // Side by side in one tree, so the two marks are compared as a child would
    // see them: on the same board, at the same moment.
    await renderKit(
      <>
        <AnswerTile label="right" state="correct" />
        <AnswerTile label="miss" state="wrong" />
      </>,
    );

    const correct = drawnMark(nodeMatching(tree(), (n) => n.props.accessibilityLabel === 'right'));
    const wrong = drawnMark(nodeMatching(tree(), (n) => n.props.accessibilityLabel === 'miss'));

    expect(correct).not.toBeNull();
    expect(wrong).not.toBeNull();
    // If these ever converge, the tile is signalling by colour alone.
    expect(correct).not.toEqual(wrong);
  });

  it.each<AnswerState>(['idle', 'disabled', 'highlight'])('draws no mark for %s — there is nothing to report yet', async (state) => {
    await renderKit(<AnswerTile label={LABEL} state={state} />);
    expect(drawnMark(tree())).toBeNull();
  });
});

describe('the accessibility state', () => {
  it('reports a correct answer as selected', async () => {
    await renderKit(<AnswerTile label={LABEL} state="correct" />);
    expect(tile()).toBeSelected();
  });

  it('reports a disabled tile as disabled', async () => {
    await renderKit(<AnswerTile label={LABEL} state="disabled" />);
    expect(tile()).toBeDisabled();
  });

  it('says "try again" on a miss rather than announcing an error', async () => {
    await renderKit(<AnswerTile label={LABEL} state="wrong" />);
    expect(tile().props.accessibilityHint).toBe('Not that one — try again');
  });

  it.each<AnswerState>(['idle', 'wrong', 'highlight'])('leaves %s neither selected nor disabled', async (state) => {
    await renderKit(<AnswerTile label={LABEL} state={state} />);

    expect(tile()).not.toBeSelected();
    expect(tile()).not.toBeDisabled();
  });
});

describe('what a child can still touch', () => {
  it.each<AnswerState>(['idle', 'wrong', 'highlight'])('lets them tap a %s tile', async (state) => {
    const onPress = jest.fn();
    await renderKit(<AnswerTile label={LABEL} state={state} onPress={onPress} />);

    fireEvent.press(tile());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each<AnswerState>(['correct', 'disabled'])('does not let them tap a %s tile twice', async (state) => {
    const onPress = jest.fn();
    await renderKit(<AnswerTile label={LABEL} state={state} onPress={onPress} />);

    fireEvent.press(tile());
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('the accessible name', () => {
  it('is the label a child reads', async () => {
    await renderKit(<AnswerTile label={LABEL} />);
    expect(screen.getByRole('button', { name: LABEL })).toBeOnTheScreen();
  });

  it('can be spelled out for a tile that draws a picture instead of a word', async () => {
    await renderKit(<AnswerTile accessibilityLabel="a red fire hydrant" />);
    expect(screen.getByRole('button', { name: 'a red fire hydrant' })).toBeOnTheScreen();
  });
});
