/**
 * The 3D layer's safety net.
 *
 * Anything GL can fail for reasons we do not control — no WebGL context, a
 * blocklisted driver, a lost context after a background/foreground cycle, a
 * server render, or a Jest environment with no canvas at all. When that
 * happens the child must still see their truck, so every 3D entry point is
 * wrapped in this boundary and hands it a 2D fallback (the SVG `<FireTruck/>`
 * for the scene, `<BadgeArt/>` for the badge).
 *
 * Deliberately free of `three` — it must be able to render when three is the
 * thing that broke.
 */
import React from 'react';
import { WEBGL_AVAILABLE } from './webgl';

export interface ThreeBoundaryProps {
  children: React.ReactNode;
  /** what the child sees instead if GL is unavailable */
  fallback: React.ReactNode;
  /** render the fallback straight away — used by the dev route to prove it works */
  forceFallback?: boolean;
  /** called once, when the boundary trips */
  onError?: (error: Error) => void;
}

interface ThreeBoundaryState {
  failed: boolean;
}

export class ThreeBoundary extends React.Component<ThreeBoundaryProps, ThreeBoundaryState> {
  /*
   * Start already tripped when we know up front there is no GL context. three
   * throws during canvas setup, outside React's render, so waiting for the
   * catch would flash an empty canvas first (or, for a scene that never errors
   * cleanly, leave one). This protects the Garage turntable and the badge flip,
   * not just the games that remembered to probe.
   */
  state: ThreeBoundaryState = { failed: !WEBGL_AVAILABLE };

  static getDerivedStateFromError(): ThreeBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error): void {
    // One line, once — a device without GL is not an app error.
    console.warn('[three] falling back to 2D art:', error?.message ?? error);
    this.props.onError?.(error);
  }

  componentDidUpdate(prev: ThreeBoundaryProps): void {
    // Let the dev route toggle the fallback back off again — but never onto a
    // browser that has no GL context, where trying again just throws.
    if (prev.forceFallback && !this.props.forceFallback && this.state.failed && WEBGL_AVAILABLE) {
      this.setState({ failed: false });
    }
  }

  render(): React.ReactNode {
    if (this.state.failed || this.props.forceFallback) return this.props.fallback;
    return this.props.children;
  }
}
