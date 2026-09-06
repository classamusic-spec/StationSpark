/**
 * TaskBar — THE one instruction area.
 *
 * Every activity in the app says its task through this bar and nowhere else, so
 * what is tested here is the promise the bar makes to a child: the instruction
 * is there, exactly once; there is always a way to hear it again; there is a way
 * out when the screen has one; and the progress dots say how far through you
 * are.
 *
 * Spanish is the case worth pinning down, because the rule changed and the
 * temptation to "fix" it back will be strong: the bar no longer *prints* the
 * Spanish line (it put a second line of text a five-year-old cannot read
 * between them and the game, on all 27 screens) but it must still *speak* it,
 * after the English, when the child asks to hear the task again.
 */
import React from 'react';
import * as Speech from 'expo-speech';
import { fireEvent, screen } from '@testing-library/react-native';
import { ActivityChromeProvider } from '../activityChrome';
import { TaskBar } from '../TaskBar';
import { flushSpeech, type JsonNode, pathTo, renderKit, tree } from './harness';

const TASK = 'Put out the fire';
const ES = 'Apaga el fuego';
const spoken = jest.mocked(Speech.speak);

/** The dot row, read straight out of the tree: it is a View, not a focusable control. */
function progressBar(): JsonNode | null {
  const path = pathTo(tree(), (n) => n.props.accessibilityRole === 'progressbar');
  return path?.[path.length - 1] ?? null;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('the instruction', () => {
  it('shows the task once — nothing else on the screen may restate it', async () => {
    await renderKit(<TaskBar task={TASK} />);
    expect(screen.getAllByText(TASK)).toHaveLength(1);
  });

  it('marks the task as the screen heading', async () => {
    await renderKit(<TaskBar task={TASK} />);
    expect(screen.getByRole('header')).toHaveTextContent(TASK);
  });

  it('carries one quiet line of scaffolding under the task when asked', async () => {
    await renderKit(<TaskBar task={TASK} detail="Drag the hose to the flames" />);
    expect(screen.getByText('Drag the hose to the flames')).toBeOnTheScreen();
  });
});

describe('hear it again', () => {
  it('offers the button with no onReplay prop at all, and reads the task aloud', async () => {
    // 18 of the 25 activities never passed a handler; a child who cannot read
    // the line must still be able to get it back.
    await renderKit(<TaskBar task={TASK} />);

    const button = screen.getByLabelText('Hear it again');
    expect(button).toBeOnTheScreen();

    fireEvent.press(button);
    await flushSpeech();
    expect(spoken).toHaveBeenCalledWith(TASK, expect.objectContaining({ language: 'en-US' }));
  });

  it('disappears only when the activity says it is silent with onReplay={null}', async () => {
    await renderKit(<TaskBar task={TASK} onReplay={null} />);
    expect(screen.queryByLabelText('Hear it again')).not.toBeOnTheScreen();
  });

  it('prefers the activity’s own handler over reading the task', async () => {
    const onReplay = jest.fn();
    await renderKit(<TaskBar task={TASK} onReplay={onReplay} />);

    fireEvent.press(screen.getByLabelText('Hear it again'));
    await flushSpeech(); // so a queued line would have landed if there were one
    expect(onReplay).toHaveBeenCalledTimes(1);
    expect(spoken).not.toHaveBeenCalled();
  });

  it('takes the host’s replay when the game passes none', async () => {
    const onReplay = jest.fn();
    await renderKit(
      <ActivityChromeProvider value={{ onReplay }}>
        <TaskBar task={TASK} />
      </ActivityChromeProvider>,
    );

    fireEvent.press(screen.getByLabelText('Hear it again'));
    expect(onReplay).toHaveBeenCalledTimes(1);
  });
});

describe('the way out', () => {
  it('draws no back button when nobody can handle it', async () => {
    await renderKit(<TaskBar task={TASK} />);
    expect(screen.queryByLabelText('Back')).not.toBeOnTheScreen();
  });

  it('draws one for the activity’s own handler', async () => {
    const onBack = jest.fn();
    await renderKit(<TaskBar task={TASK} onBack={onBack} />);

    fireEvent.press(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('draws one for the host’s, so the host needs no bar of its own', async () => {
    const onBack = jest.fn();
    await renderKit(
      <ActivityChromeProvider value={{ onBack }}>
        <TaskBar task={TASK} />
      </ActivityChromeProvider>,
    );

    fireEvent.press(screen.getByLabelText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('progress dots', () => {
  it('draws one dot per step and announces where the child is', async () => {
    await renderKit(<TaskBar task={TASK} progress={{ done: 2, total: 5 }} />);

    expect(progressBar()?.children).toHaveLength(5);
    expect(screen.getByLabelText('Step 3 of 5')).toBeOnTheScreen();
  });

  it('never announces past the end on the last step', async () => {
    await renderKit(<TaskBar task={TASK} progress={{ done: 4, total: 4 }} />);
    expect(screen.getByLabelText('Step 4 of 4')).toBeOnTheScreen();
  });

  it('stays away for a one-step activity — a single dot is not progress', async () => {
    await renderKit(<TaskBar task={TASK} progress={{ done: 0, total: 1 }} />);
    expect(progressBar()).toBeNull();
  });

  it('reads the host’s progress when the game passes none', async () => {
    await renderKit(
      <ActivityChromeProvider value={{ progress: { done: 1, total: 3 } }}>
        <TaskBar task={TASK} />
      </ActivityChromeProvider>,
    );

    expect(progressBar()?.children).toHaveLength(3);
    expect(screen.getByLabelText('Step 2 of 3')).toBeOnTheScreen();
  });
});

describe('Spanish — spoken, not printed', () => {
  it('keeps the Spanish off the screen: the bar prints one line, in one language', async () => {
    await renderKit(<TaskBar task={TASK} es={ES} />);

    expect(screen.queryByText(ES)).not.toBeOnTheScreen();
    expect(screen.getAllByText(TASK)).toHaveLength(1);
  });

  it('reads the Spanish after the English, so neither is cut off mid-word', async () => {
    await renderKit(<TaskBar task={TASK} es={ES} />);
    fireEvent.press(screen.getByLabelText('Hear it again'));
    await flushSpeech();

    const first = spoken.mock.calls[0];
    expect(first?.[0]).toBe(TASK);

    // `speech.say` interrupts whatever is speaking, so the Spanish is queued on
    // the English line's `onDone` rather than fired alongside it.
    const onDone = first?.[1]?.onDone;
    expect(onDone).toEqual(expect.any(Function));

    jest.useFakeTimers();
    try {
      onDone?.();
      jest.runOnlyPendingTimers();
    } finally {
      jest.useRealTimers();
    }
    await flushSpeech();

    expect(spoken).toHaveBeenLastCalledWith(ES, expect.objectContaining({ language: 'es-MX' }));
  });

  it('does not say the same words twice when the two languages agree', async () => {
    await renderKit(<TaskBar task="Pizza" es="Pizza" />);
    fireEvent.press(screen.getByLabelText('Hear it again'));
    await flushSpeech();

    expect(spoken).toHaveBeenCalledTimes(1);
    expect(spoken.mock.calls[0]?.[1]?.onDone).toBeUndefined();
  });
});

describe('compact mode', () => {
  it('keeps every control — a short screen loses padding, not function', async () => {
    await renderKit(<TaskBar task={TASK} onBack={jest.fn()} compact progress={{ done: 0, total: 3 }} />);

    expect(screen.getByText(TASK)).toBeOnTheScreen();
    expect(screen.getByLabelText('Back')).toBeOnTheScreen();
    expect(screen.getByLabelText('Hear it again')).toBeOnTheScreen();
    expect(progressBar()?.children).toHaveLength(3);
  });
});
