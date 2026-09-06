/**
 * Can this environment actually give us a 3D context?
 *
 * `ThreeBoundary` catches a context that dies *later* (a lost context after a
 * background/foreground cycle, a driver that gives up mid-run). It cannot catch
 * the commonest case on the web: three's renderer throws while the canvas is
 * being set up, *outside* React's render phase, so the error-boundary never
 * trips and the child is left looking at an empty canvas with the truck (or the
 * badge, or the road) simply missing.
 *
 * So we ask the question once, up front, before any canvas is mounted, and the
 * boundary starts in its fallback state when the answer is no. Deliberately
 * free of `three`: it must be able to answer when three is the thing that would
 * break.
 */
import { Platform } from 'react-native';

function probeWebGL(): boolean {
  // Jest must never load `three` (docs/THREE.md) — take the 2D path.
  if (process.env.NODE_ENV === 'test') return false;
  // On native, expo-gl provides the context; there is nothing to probe here.
  if (Platform.OS !== 'web') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Probed once at module load — the answer does not change within a session. */
export const WEBGL_AVAILABLE = probeWebGL();
