import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import type { Emotion } from '@/content/types';
import { ink } from './palettes';
import { specFor } from './faceSpec';

export interface FaceProps {
  /** face centre in viewBox units (eyes sit just above this point) */
  cx: number;
  cy: number;
  /** multiplies every face metric — 1 ≈ a 54-unit-wide head */
  scale?: number;
  emotion?: Emotion;
  /** true while the eyes are shut */
  blink?: boolean;
  /** brow / eyelash colour — usually the hair shade */
  browColor: string;
  blushColor: string;
  eyeColor?: string;
  mouthColor?: string;
  /** hide brows (Beacon, Pepper) */
  brows?: boolean;
}

const EYE_DX = 11.5;
const EYE_R = 7.4;

/**
 * The shared human face: two big navy eyes with white highlights, soft brows,
 * a rosy cheek dot each side and an emotion-driven mouth. No outlines.
 * Used by Rookie, Captain Bea and every NPC so they stay siblings.
 */
export function Face({
  cx,
  cy,
  scale = 1,
  emotion = 'happy',
  blink = false,
  browColor,
  blushColor,
  eyeColor = ink.eye,
  mouthColor = ink.mouth,
  brows = true,
}: FaceProps) {
  const s = scale;
  const spec = specFor(emotion);
  const dx = EYE_DX * s;
  const r = EYE_R * s;
  const eyeY = cy;
  const browY = cy - 13.2 * s + spec.browLift * s;
  const mouthY = cy + 13 * s;
  const lookX = spec.lookX * s;
  const lookY = spec.lookY * s;

  const eye = (sign: 1 | -1) => {
    const x = cx + sign * dx;
    if (blink) {
      return (
        <Path
          key={`blink${sign}`}
          d={`M ${x - r * 0.92} ${eyeY - r * 0.1} Q ${x} ${eyeY + r * 0.62} ${x + r * 0.92} ${eyeY - r * 0.1}`}
          stroke={eyeColor}
          strokeWidth={r * 0.48}
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    if (spec.eye === 'arc') {
      return (
        <Path
          key={`arc${sign}`}
          d={`M ${x - r * 0.95} ${eyeY + r * 0.34} Q ${x} ${eyeY - r * 0.85} ${x + r * 0.95} ${eyeY + r * 0.34}`}
          stroke={eyeColor}
          strokeWidth={r * 0.56}
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    const ry = spec.eye === 'soft' ? r * 0.84 : spec.eye === 'half' ? r * 0.58 : spec.eye === 'wide' ? r * 1.12 : r;
    const rx = spec.eye === 'wide' ? r * 1.0 : r * 0.92;
    return (
      <G key={`eye${sign}`}>
        {spec.eye === 'wide' ? <Ellipse cx={x} cy={eyeY} rx={rx * 1.1} ry={ry * 1.06} fill="#FFFFFF" /> : null}
        <Ellipse cx={x + lookX} cy={eyeY + lookY} rx={spec.eye === 'wide' ? rx * 0.8 : rx} ry={spec.eye === 'wide' ? ry * 0.8 : ry} fill={eyeColor} />
        <Circle cx={x + lookX + rx * 0.34} cy={eyeY + lookY - ry * 0.36} r={r * 0.3} fill="#FFFFFF" />
        <Circle cx={x + lookX - rx * 0.34} cy={eyeY + lookY + ry * 0.34} r={r * 0.14} fill="#FFFFFF" opacity={0.85} />
        {spec.eye === 'half' ? (
          <Path
            d={`M ${x - r} ${eyeY - r * 0.72} Q ${x} ${eyeY - r * 1.15} ${x + r} ${eyeY - r * 0.72}`}
            stroke={browColor}
            strokeWidth={r * 0.3}
            strokeLinecap="round"
            fill="none"
            opacity={0.8}
          />
        ) : null}
      </G>
    );
  };

  const brow = (sign: 1 | -1) => {
    const x = cx + sign * dx;
    const w = 10.4 * s;
    const lift = spec.browAsymmetric && sign === -1 ? -2.6 * s : 0;
    // positive browTilt drops the inner end (worried); negative raises it
    const deg = spec.browTilt * -sign;
    return (
      <Path
        key={`brow${sign}`}
        d={`M ${x - w / 2} ${browY + lift} Q ${x} ${browY - 2.4 * s + lift} ${x + w / 2} ${browY + lift}`}
        stroke={browColor}
        strokeWidth={2.9 * s}
        strokeLinecap="round"
        fill="none"
        transform={`rotate(${deg} ${x} ${browY + lift})`}
      />
    );
  };

  const mouth = () => {
    const w = 9.2 * s;
    switch (spec.mouth) {
      case 'open-smile':
      case 'big-smile': {
        const depth = (spec.mouth === 'big-smile' ? 15.5 : 12.5) * s;
        const width = (spec.mouth === 'big-smile' ? 10.4 : 9.2) * s;
        return (
          <G>
            <Path d={`M ${cx - width} ${mouthY} Q ${cx} ${mouthY + depth} ${cx + width} ${mouthY} Z`} fill={mouthColor} />
            <Path d={`M ${cx - width * 0.82} ${mouthY + 0.2 * s} L ${cx + width * 0.82} ${mouthY + 0.2 * s} L ${cx + width * 0.7} ${mouthY + 2.4 * s} L ${cx - width * 0.7} ${mouthY + 2.4 * s} Z`} fill={ink.tooth} />
            <Ellipse cx={cx} cy={mouthY + depth * 0.62} rx={width * 0.5} ry={depth * 0.26} fill={ink.tongue} />
          </G>
        );
      }
      case 'smile':
        return <Path d={`M ${cx - w * 0.78} ${mouthY} Q ${cx} ${mouthY + 6.4 * s} ${cx + w * 0.78} ${mouthY}`} stroke={mouthColor} strokeWidth={2.9 * s} strokeLinecap="round" fill="none" />;
      case 'grin':
        return (
          <G>
            <Path d={`M ${cx - w} ${mouthY - 1 * s} Q ${cx} ${mouthY + 9 * s} ${cx + w} ${mouthY - 1 * s}`} stroke={mouthColor} strokeWidth={3.2 * s} strokeLinecap="round" fill="none" />
            <Path d={`M ${cx - w * 0.62} ${mouthY + 3.4 * s} Q ${cx} ${mouthY + 8.2 * s} ${cx + w * 0.62} ${mouthY + 3.4 * s}`} stroke={ink.tongue} strokeWidth={2.2 * s} strokeLinecap="round" fill="none" opacity={0.75} />
          </G>
        );
      case 'thinking':
        return <Path d={`M ${cx - w * 0.55} ${mouthY + 1.4 * s} Q ${cx - w * 0.05} ${mouthY + 4.2 * s} ${cx + w * 0.66} ${mouthY - 1.2 * s}`} stroke={mouthColor} strokeWidth={2.8 * s} strokeLinecap="round" fill="none" />;
      case 'worried':
        return <Path d={`M ${cx - w * 0.62} ${mouthY + 2.6 * s} Q ${cx} ${mouthY - 1.6 * s} ${cx + w * 0.62} ${mouthY + 2.6 * s}`} stroke={mouthColor} strokeWidth={2.8 * s} strokeLinecap="round" fill="none" />;
      case 'oh':
      default:
        return (
          <G>
            <Ellipse cx={cx} cy={mouthY + 2.6 * s} rx={4.6 * s} ry={5.8 * s} fill={mouthColor} />
            <Ellipse cx={cx} cy={mouthY + 4.6 * s} rx={2.8 * s} ry={2.2 * s} fill={ink.tongue} />
          </G>
        );
    }
  };

  return (
    <G>
      <Ellipse cx={cx - 20.5 * s} cy={cy + 6.5 * s} rx={6.2 * s} ry={4.2 * s} fill={blushColor} opacity={spec.blush} />
      <Ellipse cx={cx + 20.5 * s} cy={cy + 6.5 * s} rx={6.2 * s} ry={4.2 * s} fill={blushColor} opacity={spec.blush} />
      {brows ? brow(-1) : null}
      {brows ? brow(1) : null}
      {eye(-1)}
      {eye(1)}
      {mouth()}
      {spec.sparkle ? (
        <G>
          <Path d={`M ${cx - 27 * s} ${cy - 8 * s} l ${1.6 * s} ${3.4 * s} l ${3.4 * s} ${1.6 * s} l ${-3.4 * s} ${1.6 * s} l ${-1.6 * s} ${3.4 * s} l ${-1.6 * s} ${-3.4 * s} l ${-3.4 * s} ${-1.6 * s} l ${3.4 * s} ${-1.6 * s} z`} fill="#FFE07A" />
          <Path d={`M ${cx + 27 * s} ${cy - 3 * s} l ${1.2 * s} ${2.6 * s} l ${2.6 * s} ${1.2 * s} l ${-2.6 * s} ${1.2 * s} l ${-1.2 * s} ${2.6 * s} l ${-1.2 * s} ${-2.6 * s} l ${-2.6 * s} ${-1.2 * s} l ${2.6 * s} ${-1.2 * s} z`} fill="#FFE07A" opacity={0.85} />
        </G>
      ) : null}
    </G>
  );
}
