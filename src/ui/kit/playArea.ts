/**
 * PLAY-AREA ANCHORS
 *
 * the hint bubble used to sit at the bottom of the screen, which put it
 * straight over the answer row on six games (Vocab Tap, Gear Sort, Hydrant
 * Match, Dispatch Decoder, Spray Patterns, Hose Path) — a blocking defect in
 * the art critique.
 *
 * The bubble and the `<Tray/>` are siblings in some games and cousins in
 * others (`GameFrame` puts the bubble in its own lane), so the bubble cannot
 * assume anything about its parent. Instead the tray publishes **where its top
 * edge is on screen** and the bubble measures itself against that, lifting only
 * by the overlap. That is correct in every layout and needs no game changes.
 *
 * Exactly one mini-game is on screen at a time, so a module singleton is safe.
 */
import { useSyncExternalStore } from 'react';

export interface TrayAnchor {
  /** measured tray height in px — 0 when the screen has no tray */
  height: number;
  /** the tray's top edge in window coordinates; Infinity when there is no tray */
  top: number;
}

const NO_TRAY: TrayAnchor = { height: 0, top: Number.POSITIVE_INFINITY };
let anchor: TrayAnchor = NO_TRAY;
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((l) => l());
};

/** Called by `<Tray/>` once it knows where it is. */
export function setTrayAnchor(next: TrayAnchor | null): void {
  const value = next ?? NO_TRAY;
  if (Math.abs(value.height - anchor.height) < 1 && Math.abs(value.top - anchor.top) < 1) return;
  anchor = value;
  emit();
}

/** Where the tray is right now. */
export const getTrayAnchor = (): TrayAnchor => anchor;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Re-renders the caller whenever the tray moves, is measured, or is removed. */
export function useTrayAnchor(): TrayAnchor {
  return useSyncExternalStore(subscribe, getTrayAnchor, getTrayAnchor);
}

/* Back-compat with the first cut of this module. */
export const setTrayHeight = (height: number): void => setTrayAnchor(height > 0 ? { height, top: anchor.top } : null);
export const getTrayHeight = (): number => anchor.height;
export const useTrayHeight = (): number => useTrayAnchor().height;
