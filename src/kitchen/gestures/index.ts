/**
 * KITCHEN GESTURES — the physical verbs of cooking.
 *
 * Every step in the kitchen has a hand behind it: rolling, stirring, pouring,
 * chopping, scooping. These are the shared, forgiving implementations, and they
 * all obey the same three rules:
 *
 *  1. **No dexterity gates.** Nothing measures how neat, how fast or how
 *     straight. A gesture accumulates whatever the child gives it.
 *  2. **A tap always works.** Every one of them treats a press that never moved
 *     as one unit of the work — the accessibility path, and the path a child
 *     with reduced motion is offered outright.
 *  3. **Quiet gets help.** Pair any of them with `useIdleAssist` and Captain Bea
 *     finishes the step herself if the child cannot. Nobody is ever stuck.
 */
export * from './useSweepGesture';
export * from './useSwirlGesture';
export * from './useStrokeGesture';
export * from './useScrubGesture';
export * from './useIdleAssist';
export * from './GestureHint';
export * from './cut';
