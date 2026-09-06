import { TextStyle } from 'react-native';

/**
 * Fredoka for display/headings/buttons (the rounded chunky voice of the logo),
 * Nunito for body copy. Both are loaded via @expo-google-fonts in app/_layout.
 */
export const fontFamily = {
  display: 'Fredoka_700Bold',
  displaySemi: 'Fredoka_600SemiBold',
  displayMedium: 'Fredoka_500Medium',
  body: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
  bodyRegular: 'Nunito_600SemiBold',
} as const;

/** Kid-scale type: everything is bigger than an adult app. */
export const typeScale = {
  hero: { fontFamily: fontFamily.display, fontSize: 44, lineHeight: 50, letterSpacing: 0.5 },
  display: { fontFamily: fontFamily.display, fontSize: 36, lineHeight: 42 },
  h1: { fontFamily: fontFamily.display, fontSize: 30, lineHeight: 36 },
  h2: { fontFamily: fontFamily.display, fontSize: 25, lineHeight: 31 },
  h3: { fontFamily: fontFamily.displaySemi, fontSize: 21, lineHeight: 27 },
  button: { fontFamily: fontFamily.display, fontSize: 24, lineHeight: 30 },
  buttonSmall: { fontFamily: fontFamily.display, fontSize: 19, lineHeight: 24 },
  body: { fontFamily: fontFamily.body, fontSize: 18, lineHeight: 26 },
  bodyStrong: { fontFamily: fontFamily.bodyHeavy, fontSize: 18, lineHeight: 26 },
  small: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 21 },
  tiny: { fontFamily: fontFamily.bodyHeavy, fontSize: 13, lineHeight: 17, letterSpacing: 0.4 },
  numeral: { fontFamily: fontFamily.display, fontSize: 40, lineHeight: 46 },
  numeralBig: { fontFamily: fontFamily.display, fontSize: 64, lineHeight: 70 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof typeScale;

/**
 * How far the OS text-size setting may grow each variant.
 *
 * Refusing to scale at all is the easy answer and the wrong one: a child (or
 * the grown-up reading the report over their shoulder) who has turned their
 * device's text up has asked for something, and this type is already large
 * enough to absorb some of it. But an uncapped 2× would break every fitted
 * thing in the app, so the cap goes where the room is.
 *
 * Small copy, which is what a low-vision reader actually struggles with, gets
 * the most headroom. The big display faces are already huge and get least —
 * growing a 64 px numeral by half would burst the tile it sits in. Anything
 * measured against artwork can still pass its own multiplier, or opt out with
 * `allowFontScaling={false}`.
 */
export const fontScaleCap = {
  hero: 1.1,
  display: 1.1,
  h1: 1.15,
  h2: 1.2,
  h3: 1.25,
  button: 1.15,
  buttonSmall: 1.25,
  body: 1.35,
  bodyStrong: 1.35,
  small: 1.45,
  tiny: 1.5,
  numeral: 1.1,
  numeralBig: 1.05,
} as const satisfies Record<TypeVariant, number>;
