/**
 * The Captain must not talk over the next screen.
 *
 * `say()` reports a cut-off line through `onStopped` as well as `onDone`,
 * because a chain that is interrupted still has to release whatever waits on
 * it. Callers used that callback to schedule the second half of a pair on a
 * bare `setTimeout` — and a timer knows nothing about having been cancelled.
 *
 * Tap "Hear it again", tap Back within 250 ms: unmount stops speech,
 * `onStopped` fires, and a quarter of a second later Captain Bea reads the
 * Spanish half of the previous screen's task over the new one. Four other call
 * sites had the same shape, the widest with a 1.6 s window.
 */
import { speech } from '../speech';

jest.useFakeTimers();

beforeEach(() => {
  jest.clearAllTimers();
  speech.stop(); // a known epoch to start from
});

describe('speech.later — a continuation that respects being stopped', () => {
  it('runs when nothing interrupted it', () => {
    const fn = jest.fn();
    speech.later(fn, 250);
    jest.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does NOT run when speech was stopped while it waited', () => {
    const fn = jest.fn();
    speech.later(fn, 250);
    speech.stop(); // the child tapped Back
    jest.advanceTimersByTime(250);
    expect(fn).not.toHaveBeenCalled();
  });

  it('does not run for the widest window either', () => {
    // GearSort chained its Spanish line 1.6 s out — the longest exposure
    const fn = jest.fn();
    speech.later(fn, 1600);
    jest.advanceTimersByTime(800);
    speech.stop();
    jest.advanceTimersByTime(800);
    expect(fn).not.toHaveBeenCalled();
  });

  it('a stop cancels every continuation outstanding at that moment', () => {
    const a = jest.fn();
    const b = jest.fn();
    speech.later(a, 100);
    speech.later(b, 900);
    speech.stop();
    jest.advanceTimersByTime(1000);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it('a continuation scheduled after the stop still runs', () => {
    // stopping must not poison the service for the screen that comes next
    const fn = jest.fn();
    speech.stop();
    speech.later(fn, 250);
    jest.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('the epoch itself', () => {
  it('advances on every stop, so a captured epoch can be compared', () => {
    const before = speech.epoch();
    expect(speech.isCurrent(before)).toBe(true);
    speech.stop();
    expect(speech.isCurrent(before)).toBe(false);
    expect(speech.isCurrent(speech.epoch())).toBe(true);
  });
});
