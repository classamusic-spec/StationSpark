/**
 * THE ANSWERS, IN THE APP'S OWN TYPE.
 *
 * Gate labels are the one thing a child must actually *read* while driving, so
 * they are real `@/ui` `<Text>` in Fredoka — not painted into the SVG, not
 * baked into a texture. This layer floats above whichever road is drawing
 * (3D canvas or 2D SVG) and places each label with the shared projection, so it
 * lands on the banner in both.
 *
 * Font scaling is switched off here alone: the label has to fit inside a drawn
 * banner that is 2.35 road units wide, exactly like a numeral inside artwork.
 */
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, roles } from '@/theme';
import { Text } from '@/ui';
import { VIEW_DEPTH, type RunFrame } from './run';
import { gateLabelSpot } from './RoadView2D';
import { roadView } from './projection';

const LABEL_BOX = 140;

export interface GateLabelsProps {
  frame: RunFrame;
  width: number;
  height: number;
}

export const GateLabels = memo(function GateLabels({ frame, width, height }: GateLabelsProps) {
  const gates = frame.items.filter((item) => item.kind === 'gate');
  if (gates.length === 0) return null;
  const view = roadView({ w: width, h: height }, frame.lane);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {gates.map((gate) => {
        const spot = gateLabelSpot(view, gate.lane, gate.ahead, gate.label ?? '');
        /* fades up over the last third of the approach, so it never pops in */
        const opacity = Math.max(0, Math.min(1, (VIEW_DEPTH - gate.ahead) / (VIEW_DEPTH * 0.4)));
        const helped = frame.assistLane === gate.lane;
        return (
          <View
            key={gate.id}
            style={[
              styles.label,
              { left: spot.x - LABEL_BOX / 2, top: spot.y - spot.size * 0.72, width: LABEL_BOX, opacity },
            ]}
          >
            <Text
              variant="h2"
              center
              allowFontScaling={false}
              numberOfLines={1}
              color={helped ? palette.navy : roles.ink.primary}
              style={{ fontSize: spot.size, lineHeight: spot.size * 1.16 }}
              accessibilityLabel={`Gate ${gate.lane + 1}: ${gate.label}`}
            >
              {gate.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
