/**
 * The sticker language, in three tokens.
 *
 * Consistency rules #2 and #3 of `docs/ART_CRITIQUE.md`: every object is a flat
 * base fill, then exactly one shade tone, then one highlight — and anything
 * that stands on ground gets a navy contact ellipse. Importing these instead of
 * re-typing the rgba() keeps every world layer drawn by the same hand.
 */

/** the single shade tone laid over the light-away side of an object */
export const SHADE = 'rgba(31,42,90,0.14)';
/** a slightly deeper shade for recesses (door reveals, soffits, wells) */
export const SHADE_DEEP = 'rgba(31,42,90,0.22)';
/** the single highlight tone laid on the lit side */
export const HIGHLIGHT = 'rgba(255,255,255,0.32)';
/** the softer sheen used on big surfaces (walls, plaques, door faces) */
export const SHEEN = 'rgba(255,255,255,0.22)';

/** contact-shadow fill + opacity (rule #3 — never black, never a blur) */
export const SHADOW_FILL = '#1F2A5A';
export const SHADOW_OPACITY = 0.12;
/** a contact shadow is always this flat: ry ≈ rx × 0.22 */
export const shadowRy = (rx: number) => rx * 0.22;
