/**
 * PLAY-AREA ANCHORS
 *
 * Beacon's hint bubble used to sit at the bottom of the screen, which put it
 * straight over the answer row on six games (Vocab Tap, Gear Sort, Hydrant
 * Match, Dispatch Decoder, Spray Patterns, Hose Path) — a blocking defect in
 * the art critique.
 *
 * The bubble and the `<Tray/>` are siblings inside each game's frame, and the
 * frames belong to the game engineers, so the two talk through this tiny
 * module-level store instead of a context provider someone would have to add.
 * Exactly one mini-game is on screen at a time, so a singleton is safe.
 */
import { useSyncExternalStore } from 'react';

let trayHeight = 0;
const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((l) => l());
};

/** Called by `<Tray/>` on layout. Pass 0 when the tray unmounts. */
export function setTrayHeight(height: number): void {
  const next = Math.max(0, Math.round(height));
  if (next === trayHeight) return;
  trayHeight = next;
  emit();
}

/** Current tray height in px — 0 when the screen has no tray. */
export const getTrayHeight = (): number => trayHeight;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Re-renders the caller whenever the tray is measured or removed. */
export function useTrayHeight(): number {
  return useSyncExternalStore(subscribe, getTrayHeight, getTrayHeight);
}
