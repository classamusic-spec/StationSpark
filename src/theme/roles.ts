import { palette, shadows } from './colors';

/**
 * SEMANTIC ROLES — what a colour or elevation *means*, not what it looks like.
 *
 * The palette says "engineRed"; this file says "this is the one primary action
 * on the screen". Screens should reach for a role, so that a child can tell
 * what to touch without learning our colour scheme:
 *
 *   - Exactly one `action.primary` per screen. Everything else is secondary.
 *   - Interactive things sit up (`lift.interactive`). Scenery lies flat.
 *   - Two surfaces by default: one `surface.card` for content, one
 *     `surface.control` for the tools underneath it. Nest a third only when
 *     the learning task genuinely needs the structure.
 *   - Red is brand energy, never "wrong". A miss is `state.retry` — warm
 *     orange — and always paired with motion and words, never colour alone.
 */
export const roles = {
  surface: {
    /** the screen's own ground, behind everything */
    page: palette.cream,
    /** the one main content surface */
    card: palette.white,
    /** the control surface: trays, answer rows, tool rails */
    control: palette.panel,
    /** a well things are dropped into or read out of */
    sunken: '#EFF2F9',
    /** a quiet band for supporting information */
    muted: palette.creamDeep,
  },

  ink: {
    primary: palette.navy,
    secondary: palette.navySoft,
    muted: palette.navyMuted,
    onColour: palette.white,
    /** the second language, wherever both are shown together */
    translation: palette.purple,
  },

  action: {
    /** the single clearest thing to do on the screen */
    primary: 'red' as const,
    /** everything else that is still a real action */
    secondary: 'white' as const,
    /** listen / replay / speak */
    audio: 'blue' as const,
    /** finish, confirm, continue */
    confirm: 'green' as const,
  },

  state: {
    selectedFill: palette.waterCyanLight,
    selectedEdge: palette.waterCyanDark,
    /** a correct answer settling in */
    successFill: palette.mint,
    successEdge: palette.leafGreenDark,
    /** "not quite" — warm, never red, never a buzzer */
    retryFill: '#FFE6D6',
    retryEdge: palette.orangeDark,
    /** the gold ring the hint ladder puts round the next thing to touch */
    focusRing: palette.safetyYellow,
    disabledFill: '#DCE1EE',
    disabledEdge: '#BAC2D8',
    disabledInk: palette.navyMuted,
  },

  border: {
    /** the only hairline in the system */
    hairline: 'rgba(31,42,90,0.10)',
    /** a draggable object's edge, so it reads as liftable without colour alone */
    draggable: 'rgba(31,42,90,0.16)',
  },

  lift: {
    /** anything a child can touch */
    interactive: shadows.card,
    /** a surface that only groups things */
    surface: shadows.soft,
    /** scenery: no shadow at all */
    scenery: undefined,
  },
} as const;

/**
 * How much room the activity chrome takes, so a play area can size itself
 * without measuring. Kept here because both activity shells and the screens
 * that host them need the same numbers.
 */
export const activity = {
  /** the task bar at the top */
  taskBarHeight: 92,
  taskBarCompact: 76,
  /** clear air between the play area and whatever is under it */
  playGutter: 12,
  /** on tablets the tools sit beside the play area instead of under it */
  sidePanelWidth: 320,
  /** a tablet gets the side layout only when it is this wide */
  sideLayoutMinWidth: 900,
} as const;
