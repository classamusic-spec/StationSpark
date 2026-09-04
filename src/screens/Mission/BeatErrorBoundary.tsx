/**
 * A crash in one mini-game must never take the mission (or the app) down. This
 * boundary swaps the broken beat for the friendly "being built" card, which
 * still completes the beat, so the child carries on none the wiser.
 */
import React from 'react';

interface Props {
  children: React.ReactNode;
  /** rendered instead of the children when they throw */
  fallback: React.ReactNode;
  /** changing this remounts the boundary (e.g. a new beat) */
  resetKey?: string | number;
  onError?: (error: Error) => void;
}

interface State {
  failed: boolean;
  resetKey?: string | number;
}

export class BeatErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { failed: false, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(error: Error) {
    console.warn('[mission] beat crashed; showing the friendly fallback.', error);
    this.props.onError?.(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
