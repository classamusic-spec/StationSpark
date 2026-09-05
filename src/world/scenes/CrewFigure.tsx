/**
 * CREW FIGURE — a full character rig sized to a scene slot.
 *
 * Art critique #23: `CharacterPortrait` heads-in-circles were being used as
 * *actors* inside games (a head in a basket, a head on a plate card). Anywhere
 * a character stands in the world it must be the whole rig; portraits stay for
 * dialogue chrome only. This is the one-line swap for those places.
 */
import React, { memo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { CharacterId, Emotion } from '@/content/types';
import { Beacon, CaptainBea, Npc, Pepper, Rookie, type NpcVariant } from '@/characters';

export interface CrewFigureProps {
  id: CharacterId;
  /** total height in px */
  size?: number;
  emotion?: Emotion;
  /** which neighbour to draw when `id` is 'npc' */
  npc?: NpcVariant;
  /** loop the happy jump (celebrations) */
  jumping?: boolean;
  bobPhase?: number;
  style?: StyleProp<ViewStyle>;
}

export const CrewFigure = memo(function CrewFigure({
  id,
  size = 96,
  emotion = 'happy',
  npc = 'rosa',
  jumping,
  bobPhase = 0,
  style,
}: CrewFigureProps) {
  switch (id) {
    case 'beacon':
      // Beacon hovers, so his rig reads best a little smaller than the humans
      return <Beacon size={size * 0.78} emotion={emotion} spinning={jumping} style={style} />;
    case 'pepper':
      return <Pepper size={size * 0.72} emotion={emotion} wag jumping={jumping} bobPhase={bobPhase} style={style} />;
    case 'bea':
      return <CaptainBea size={size} emotion={emotion} pose={jumping ? 'cheer' : 'stand'} bobPhase={bobPhase} style={style} />;
    case 'npc':
      return <Npc variant={npc} size={size} emotion={emotion} pose={jumping ? 'cheer' : 'stand'} bobPhase={bobPhase} style={style} />;
    case 'rookie':
    default:
      return <Rookie size={size} emotion={emotion} pose={jumping ? 'cheer' : 'stand'} jumping={jumping} bobPhase={bobPhase} style={style} />;
  }
});
