/**
 * SCENE CREW — the resident characters, parked just above whatever tray the
 * game is showing.
 *
 * `GameCrew` takes a fixed distance from the bottom edge, and trays range from
 * ~120 px (a single button row) to ~300 px (a two-row drag tray), so a constant
 * put the crew *on top of* the answer tiles in half the games. The
 * tray publishes its measured height (`@/ui/kit/playArea`), so the crew can
 * stand on its top edge instead — correct in every game, one line each.
 */
import React from 'react';
import { GameCrew, type GameCrewProps } from '@/characters';
import { useTrayAnchor } from '@/ui/kit/playArea';

export interface SceneCrewProps extends Omit<GameCrewProps, 'bottom'> {
  /** clear air between the crew's feet and the top of the tray */
  lift?: number;
}

/** clearance for a count strip / equation footer when a game has no tray */
const FOOTER = 64;

export function SceneCrew({ lift = 6, ...props }: SceneCrewProps) {
  const tray = useTrayAnchor();
  const bottom = tray.height > 0 ? tray.height + lift : FOOTER + lift;
  return <GameCrew {...props} bottom={bottom} />;
}
