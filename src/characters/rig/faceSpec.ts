/**
 * Emotion → face shape table.
 *
 * The rigs only ever swap eye / brow / mouth *shapes*; the head, hair and
 * costume never change. That is what keeps every character on-model.
 */
import type { Emotion } from '@/content/types';

export type EyeShape =
  /** big round eye, the default */
  | 'round'
  /** slightly narrowed, calm */
  | 'soft'
  /** wide open with white showing */
  | 'wide'
  /** happy upward arc ^ ^ */
  | 'arc'
  /** half-lidded, thinking */
  | 'half';

export type MouthShape =
  /** open smile with a tongue */
  | 'open-smile'
  /** big open smile */
  | 'big-smile'
  /** soft closed curve */
  | 'smile'
  /** wide closed curve, corners up */
  | 'grin'
  /** small off-centre line */
  | 'thinking'
  /** gentle small wave */
  | 'worried'
  /** small O */
  | 'oh';

export interface FaceSpec {
  eye: EyeShape;
  mouth: MouthShape;
  /** brow rotation in degrees; positive tilts the INNER end down (cross) */
  browTilt: number;
  /** brow lift in viewBox units (negative = higher) */
  browLift: number;
  /** pupil offset, for a "looking away while thinking" feel */
  lookX: number;
  lookY: number;
  /** rosy cheeks are stronger when excited/proud */
  blush: number;
  /** draw a little sparkle beside the eyes */
  sparkle: boolean;
  /** an asymmetric brow (thinking) raises only the left one */
  browAsymmetric: boolean;
}

export const faceSpecs: Record<Emotion, FaceSpec> = {
  happy: { eye: 'round', mouth: 'open-smile', browTilt: -4, browLift: 0, lookX: 0, lookY: 0, blush: 0.62, sparkle: false, browAsymmetric: false },
  excited: { eye: 'wide', mouth: 'big-smile', browTilt: -9, browLift: -2.4, lookX: 0, lookY: -0.4, blush: 0.8, sparkle: true, browAsymmetric: false },
  think: { eye: 'half', mouth: 'thinking', browTilt: -6, browLift: -1, lookX: -1.8, lookY: -1.4, blush: 0.45, sparkle: false, browAsymmetric: true },
  calm: { eye: 'soft', mouth: 'smile', browTilt: -2, browLift: 0.8, lookX: 0, lookY: 0, blush: 0.5, sparkle: false, browAsymmetric: false },
  worried: { eye: 'round', mouth: 'worried', browTilt: 15, browLift: -0.6, lookX: 0, lookY: 0.5, blush: 0.4, sparkle: false, browAsymmetric: false },
  proud: { eye: 'arc', mouth: 'grin', browTilt: -7, browLift: -1.8, lookX: 0, lookY: 0, blush: 0.72, sparkle: true, browAsymmetric: false },
  surprised: { eye: 'wide', mouth: 'oh', browTilt: -12, browLift: -3.2, lookX: 0, lookY: 0, blush: 0.5, sparkle: false, browAsymmetric: false },
};

export const allEmotions: readonly Emotion[] = ['happy', 'excited', 'think', 'calm', 'worried', 'proud', 'surprised'];

export const specFor = (emotion: Emotion | undefined): FaceSpec => faceSpecs[emotion ?? 'happy'];
