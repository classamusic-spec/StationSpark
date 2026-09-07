import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { MiniGameProps } from '@/minigames/types';
import { useMiniGameSession } from '@/minigames/useMiniGameSession';
import { hit, palette, radii, shadows, spacing, springs } from '@/theme';
import { Button, Text, Tray, TrayRow } from '@/ui';
import { ResetIcon } from '@/ui/icons';
import { sfx } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { speech } from '@/services/speech';

import { Stage } from '@/world';

import { BarrierPiece, Campfire, Cone, RingPanel, ringSlots } from '@/world/props';
import {
  DragToken,
  GameShell,
  GROUND_OVERLAP,
  HILITE,
  HILITE_SOFT,
  PlayGround,
  SHADE,
  SHADE_SOFT,
  bark,
  leaf,
  bestNextPiece,
  equationText,
  sumOf,
  useHintLadder,
  useMeasuredBox,
  useSpokenPrompt,
  useStage,
} from '../shared';

/* ------------------------------------------------------------------ */
/* State machine: building → reject → done                              */
/* ------------------------------------------------------------------ */

type Phase = 'building' | 'reject' | 'done';

interface State {
  phase: Phase;
  /** indices into `pieces`, in placement order */
  placed: number[];
}

type Action = { type: 'place'; index: number } | { type: 'undo' } | { type: 'reject' } | { type: 'settle' } | { type: 'finish' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'place':
      if (state.phase !== 'building') return state;
      return { ...state, placed: [...state.placed, action.index] };
    case 'undo':
      if (state.phase !== 'building' || state.placed.length === 0) return state;
      return { ...state, placed: state.placed.slice(0, -1) };
    case 'reject':
      return { ...state, phase: 'reject' };
    case 'settle':
      return state.phase === 'reject' ? { ...state, phase: 'building' } : state;
    case 'finish':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

export function BuildBarrier({ challenge, ageBand, onComplete, onEvent, compact }: MiniGameProps<'build-barrier'>) {
  const session = useMiniGameSession('build-barrier', onComplete, onEvent);
  const stage = useStage(compact);
  const hints = useHintLadder(session.hint);
  const { box, ready, onLayout } = useMeasuredBox();

  const pieces = challenge.pieces;
  const target = Math.max(1, challenge.target);

  const [state, dispatch] = useReducer(reducer, { phase: 'building', placed: [] });

  const placedValues = useMemo(() => state.placed.map((i) => pieces[i] ?? 0), [pieces, state.placed]);
  const filled = sumOf(placedValues);
  const available = useMemo(
    () => pieces.map((v, i) => ({ value: v, index: i, used: state.placed.includes(i) })),
    [pieces, state.placed],
  );
  const suggestion = useMemo(
    () => bestNextPiece(available.filter((p) => !p.used).map((p) => p.value), placedValues, target),
    [available, placedValues, target],
  );

  const shake = useSharedValue(0);
  const pop = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      list.length = 0;
    };
  }, []);

  /* ---- prompt ---- */
  const prompt = ageBand === 'A' ? `Fence the fire with ${target}!` : `Build a ${target}-unit safety ring`;
  const subtitle = compact || ageBand === 'A' ? undefined : 'Drag barriers into the dashed outline.';
  useSpokenPrompt(`Build a safety ring of ${target}`, { speaker: 'bea' });

  /* ---- geometry ----
   * The clearing used to be an ellipse of grass floating in the sky with the
   * logs, cones and bucket hanging in the blue around it — the single worst
   * thing in the seven games. There is a *field* now: the near ground plane
   * runs from a horizon high in the frame all the way to the foot of the play
   * area, the fire ring is a patch of bare earth burnt into that field, and
   * every loose prop stands on it with a contact shadow. Nothing floats. */
  const geo = useMemo(() => {
    const w = Math.max(1, box.w);
    const h = Math.max(1, box.h);
    const cx = w / 2;
    /* the grass starts high enough that the mid-distance can still be seen
       over it, and low enough that the ring never crowds the horizon */
    const horizonY = Math.max(56, Math.min(h * 0.3, 170));
    const field = h - horizonY;
    const cy = horizonY + field * 0.5;
    /* the safety ring is the subject: as big as the field can hold, with a
       hand's width of grass in front of it for the near dressing */
    const radius = Math.max(
      54,
      Math.min(w * 0.4, cy - horizonY - 8, h - cy - Math.max(14, field * 0.1)),
    );
    const slotSize = Math.max(10, Math.min(((2 * Math.PI * radius) / target) * 0.92, radius * 0.55));
    return {
      w,
      h,
      cx,
      cy,
      horizonY,
      field,
      radius,
      slotSize,
      fire: Math.min(radius * 1.5, Math.min(w, h) * 0.52),
    };
  }, [box.h, box.w, target]);

  const slots = useMemo(() => ringSlots(geo.cx, geo.cy, geo.radius, target), [geo.cx, geo.cy, geo.radius, target]);

  /* Where the loose props stand. Everything here is placed against the ring
     and the frame at once, so a log can neither cross a barrier slot nor hang
     off the edge of the play area — the two ways this scene used to break. */
  const dress = useMemo(() => {
    const { w, h, cx, cy, radius, horizonY } = geo;
    const logW = Math.max(48, Math.min(radius * 0.72, w * 0.24));
    const logH = Math.max(12, Math.min(radius * 0.15, 26));
    const coneNear = Math.max(30, Math.min(stage.s(46), radius * 0.4));
    const coneFar = coneNear * 0.7;
    const bucketR = Math.max(14, Math.min(radius * 0.17, stage.s(26)));
    /* the two strips of open grass the ring leaves: one at the hedge, one in
       front. Everything loose is placed in those, in its own lane, so no two
       props ever land on top of each other however tall the play area is. */
    const nearY = Math.min(h - logH - 6, cy + radius + Math.max(4, (h - cy - radius) * 0.18));
    const farY = Math.max(horizonY + 4, Math.min(cy - radius - logH - 4, horizonY + 10));
    return {
      logs: [
        { x: cx - radius * 0.62 - logW / 2, y: nearY, w: logW, h: logH, f: 1 },
        { x: Math.min(w - logW - 8, cx + radius * 0.28), y: farY, w: logW, h: logH, f: -1 },
      ],
      bucket: {
        cx: Math.min(w - bucketR * 1.7, cx + radius * 0.86 + bucketR * 1.4),
        y: Math.min(h - bucketR * 2.2, cy + radius * 0.9),
        r: bucketR,
        h: bucketR * 1.9,
      },
      cones: [
        { x: 6, y: h - coneNear - 4, size: coneNear },
        { x: 6, y: horizonY + coneFar * 0.1, size: coneFar },
        { x: w - coneFar - 6, y: horizonY - coneFar * 0.05, size: coneFar },
      ],
      /* a wide frame gets two park trees rather than a wider ring: the ring is
         bound by the height of the field, so the room goes into the world */
      trees:
        w > radius * 2 + 260
          ? [
              { x: Math.max(24, cx - radius - 130), y: horizonY + 6, s: Math.min(120, h * 0.3) },
              { x: Math.min(w - 120, cx + radius + 34), y: horizonY - 4, s: Math.min(104, h * 0.26) },
            ]
          : [],
    };
  }, [geo, stage]);
  const { logs, bucket, cones } = dress;

  /** which placed piece owns each slot (for the alternating stripe) */
  const owners = useMemo(() => {
    const out: number[] = new Array(target).fill(-1);
    let cursor = 0;
    placedValues.forEach((value, piece) => {
      for (let k = 0; k < value && cursor < target; k += 1, cursor += 1) out[cursor] = piece;
    });
    return out;
  }, [placedValues, target]);

  const runStart = useMemo(() => {
    const out: number[] = new Array(target).fill(0);
    let cursor = 0;
    placedValues.forEach((value) => {
      const start = cursor;
      for (let k = 0; k < value && cursor < target; k += 1, cursor += 1) out[cursor] = start;
    });
    return out;
  }, [placedValues, target]);

  /* ---- placing ---- */
  const finish = useCallback(() => {
    dispatch({ type: 'finish' });
    sfx.play('correct');
    haptics.celebrate();
    pop.value = withSequence(withSpring(1, springs.bounce), withSpring(0.6, springs.gentle));
    session.correct(equationText(placedValues));
    session.progress(target, target);
    const line = `${placedValues.join(' plus ')} equals ${target}. The ring is closed!`;
    session.say('bea', line);
    speech.say(line, { speaker: 'bea' });
    timers.current.push(
      setTimeout(() => {
        sfx.play('success');
        session.complete();
      }, 1200),
    );
  }, [placedValues, pop, session, target]);

  const place = useCallback(
    (index: number) => {
      if (state.phase !== 'building') return;
      const value = pieces[index];
      if (value === undefined || state.placed.includes(index)) return;
      if (filled + value > target) {
        dispatch({ type: 'reject' });
        session.incorrect(`overflow ${filled}+${value}`);
        sfx.play('wrong-soft');
        haptics.nudge();
        shake.value = withSequence(
          withTiming(-7, { duration: 60 }),
          withTiming(7, { duration: 60 }),
          withTiming(-5, { duration: 60 }),
          withTiming(0, { duration: 70 }),
        );
        hints.miss({
          text: suggestion
            ? `That one is too long — only ${target - filled} spaces left. The ${suggestion} fits!`
            : `Only ${target - filled} spaces left. Take one off with Undo.`,
          es: `Solo quedan ${target - filled} espacios.`,
        });
        timers.current.push(setTimeout(() => dispatch({ type: 'settle' }), 520));
        return;
      }
      dispatch({ type: 'place', index });
      sfx.play('drop');
      haptics.drop();
      const next = [...placedValues, value];
      if (ageBand !== 'C') speech.say(String(sumOf(next)), { speaker: 'bea' });
      if (sumOf(next) === target) timers.current.push(setTimeout(finish, 420));
    },
    [ageBand, filled, finish, hints, pieces, placedValues, session, shake, state.phase, state.placed, suggestion, target],
  );

  const undo = useCallback(() => {
    if (state.placed.length === 0) return;
    dispatch({ type: 'undo' });
    sfx.play('tap-soft');
    haptics.select();
  }, [state.placed.length]);

  /* ---- idle nudge ---- */
  useEffect(() => {
    if (state.phase !== 'building' || filled >= target) return;
    const t = setTimeout(() => {
      if (suggestion !== null) {
        hints.nudge({
          text: `${target - filled} spaces still open — the ${suggestion} barrier fits there.`,
          es: `Faltan ${target - filled} espacios.`,
        });
      }
    }, 14000);
    return () => clearTimeout(t);
  }, [filled, hints, state.phase, state.placed.length, suggestion, target]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const fireStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pop.value * 0.1 }] }));

  /* The longest piece must fit the tray it lives in — the bottom tray on a
     phone, the side RAIL on a tablet, where a 14-unit barrier used to hang
     over both edges of the panel. One measurement, both cases. */
  const longest = Math.max(...pieces, 1);
  const units = pieces.reduce((a, b) => a + b, 0) || 1;
  /* two constraints at once: the LONGEST barrier must fit one line of the tray,
     and the whole set must fit in about two lines — five 58 px rows of tokens
     ate half the phone screen and shrank the ring they are meant to fill */
  /* ...and each token now stands on a shelf with 12 px of padding, so the
     budget the barrier itself may spend is that much smaller on every piece */
  const shelf = 12;
  const segPx = Math.max(
    9,
    Math.min(
      stage.s(22),
      (stage.trayWidth - 26 - shelf) / longest,
      Math.max(9, stage.trayWidth * 1.8 - pieces.length * shelf) / units,
    ),
  );
  const pieceH = Math.max(hit.min, Math.min(stage.rail ? 62 : 56, stage.s(58)));

  return (
    <GameShell
      prompt={prompt}
      subtitle={subtitle}
      es={`Haz un círculo de ${target}`}
      compact={compact}
      onStageLayout={onLayout}
      hint={hints.bubble}
      onDismissHint={hints.dismiss}
      /* the Stage's ground plane is pushed up to meet the field the game
         paints inside the play area, so the park is one lawn top to bottom
         instead of grass, a seam, and a band of somebody else's middle
         distance under the counter */
      backdrop={(below) => <Stage variant="park" groundHeight={Math.max(150, below + GROUND_OVERLAP)} />}
      footer={
        <View style={styles.mathRow}>
          <Text variant="h3" color={filled === target ? palette.leafGreenDark : palette.navy}>
            {placedValues.length > 0 ? equationText(placedValues) : `0 of ${target}`}
          </Text>
        </View>
      }
      tray={
        <Tray>
          <TrayRow style={stage.rail ? styles.trayColumn : undefined}>
            {available.map((p) => (
              /* THE DEPOT RACK. A barrier is red AND WHITE, and half of it
                 disappeared against a white tray — a 4-unit barrier read as
                 two red stubs and a 2 as one. Every token stands on its own
                 slate shelf, so the white stripes have something to be white
                 against and the row reads as barriers racked in the yard. */
              <View key={p.index} style={styles.rackCell}>
                <DragToken
                  disabled={p.used || state.phase !== 'building'}
                  highlight={hints.assist && !p.used && p.value === suggestion}
                  onPlace={() => place(p.index)}
                  accessibilityLabel={`Barrier of ${p.value}`}
                >
                  <BarrierPiece segments={p.value} segmentPx={segPx} height={pieceH} tone={p.used ? 'ghost' : 'red'} />
                </DragToken>
                <View style={styles.rackRail} />
              </View>
            ))}
            <Button
              label="Undo"
              tone="white"
              size="md"
              icon={<ResetIcon size={20} />}
              onPress={undo}
              disabled={state.placed.length === 0 || state.phase === 'done'}
              sound="tap-soft"
              accessibilityLabel="Take the last barrier off"
            />
          </TrayRow>
        </Tray>
      }
    >
      {ready ? (
        <View style={StyleSheet.absoluteFill}>
          {/* THE FIELD. The near ground plane runs from the horizon to the
              foot of the play area — the same plane `Stage` is drawing behind
              us, so the park is one lawn and nothing in this scene is standing
              on sky. */}
          <PlayGround width={geo.w} height={geo.h} top={geo.horizonY} variant="grass" dressed seed={target} />

          <Svg style={StyleSheet.absoluteFill} width={geo.w} height={geo.h} pointerEvents="none">
            <Defs>
              <RadialGradient id="ss-pit-dish" cx="0.34" cy="0.28" r="0.86">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.3} />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.02} />
                <Stop offset="1" stopColor="#1F2A5A" stopOpacity={0.2} />
              </RadialGradient>
              <RadialGradient id="ss-pit-glow" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor={palette.flameMid} stopOpacity={0.4} />
                <Stop offset="0.55" stopColor={palette.flameOuter} stopOpacity={0.14} />
                <Stop offset="1" stopColor={palette.flameOuter} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {/* sky furniture: the band over the hedge is the top plane of the
                composition and it was raw blue. A flat cloud bank and two
                gulls, both pale and static — nothing here may pull an eye off
                the ring. */}
            <G opacity={0.72}>
              <Ellipse cx={geo.w * 0.22} cy={geo.horizonY * 0.34} rx={geo.w * 0.17} ry={geo.horizonY * 0.1} fill={palette.white} />
              <Ellipse cx={geo.w * 0.13} cy={geo.horizonY * 0.4} rx={geo.w * 0.1} ry={geo.horizonY * 0.075} fill={palette.white} />
              <Ellipse cx={geo.w * 0.3} cy={geo.horizonY * 0.42} rx={geo.w * 0.09} ry={geo.horizonY * 0.065} fill={palette.white} />
              <Ellipse cx={geo.w * 0.26} cy={geo.horizonY * 0.22} rx={geo.w * 0.08} ry={geo.horizonY * 0.085} fill={palette.white} />
            </G>
            <G opacity={0.4}>
              <Ellipse cx={geo.w * 0.83} cy={geo.horizonY * 0.62} rx={geo.w * 0.12} ry={geo.horizonY * 0.06} fill={palette.white} />
              <Ellipse cx={geo.w * 0.75} cy={geo.horizonY * 0.66} rx={geo.w * 0.07} ry={geo.horizonY * 0.045} fill={palette.white} />
            </G>
            <Path
              d={`M ${geo.w * 0.56} ${geo.horizonY * 0.3} q ${geo.w * 0.02} ${-geo.horizonY * 0.05} ${geo.w * 0.04} 0 q ${geo.w * 0.02} ${-geo.horizonY * 0.05} ${geo.w * 0.04} 0 M ${geo.w * 0.64} ${geo.horizonY * 0.44} q ${geo.w * 0.015} ${-geo.horizonY * 0.04} ${geo.w * 0.03} 0 q ${geo.w * 0.015} ${-geo.horizonY * 0.04} ${geo.w * 0.03} 0`}
              stroke={palette.navySoft}
              strokeWidth={Math.max(1.6, geo.w * 0.005)}
              fill="none"
              strokeLinecap="round"
              opacity={0.34}
            />

            {/* a hedge along the far edge, so the middle band carries mass
                rather than a hard line between grass and distance */}
            <G>
              {Array.from({ length: Math.ceil(geo.w / Math.max(34, geo.w / 9)) + 2 }, (_, i) => {
                const step = Math.max(34, geo.w / 9);
                /* a hedge of identical bumps reads as a caterpillar: the size,
                   the lift and the tone all vary on a hash, never on i % n */
                const j = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
                const k = Math.abs(Math.sin(i * 4.1414 + 7) * 21783.13) % 1;
                const x = -step * 0.6 + i * step + (j - 0.5) * step * 0.4;
                const r = step * (0.46 + j * 0.4);
                const lift = geo.horizonY - r * (0.24 + k * 0.34);
                return (
                  <G key={`hedge${i}`}>
                    <Ellipse cx={x} cy={lift} rx={r} ry={r * (0.6 + k * 0.3)} fill={leaf.deep} />
                    <Ellipse cx={x - r * 0.24} cy={lift - r * 0.2} rx={r * 0.66} ry={r * 0.5} fill={k > 0.45 ? palette.leafGreen : leaf.mid} />
                    <Ellipse cx={x - r * 0.34} cy={lift - r * 0.32} rx={r * 0.3} ry={r * 0.2} fill={leaf.lit} />
                  </G>
                );
              })}
              {/* the hedge meets the grass on a soft shadow, never a seam */}
              <Path
                d={`M -20 ${geo.horizonY + 4} Q ${geo.w / 2} ${geo.horizonY - 6} ${geo.w + 20} ${geo.horizonY + 4} L ${geo.w + 20} ${geo.horizonY + 14} Q ${geo.w / 2} ${geo.horizonY + 4} -20 ${geo.horizonY + 14} Z`}
                fill={SHADE_SOFT}
              />
            </G>

            {/* park trees on a wide frame: the ring is bound by the height of
                the field, so a tablet's extra width becomes more world */}
            {dress.trees.map((t, i) => (
              <G key={`tree${i}`}>
                <Ellipse cx={t.x} cy={t.y + t.s * 0.98} rx={t.s * 0.3} ry={t.s * 0.075} fill={palette.navy} opacity={0.12} />
                <Rect x={t.x - t.s * 0.055} y={t.y + t.s * 0.42} width={t.s * 0.11} height={t.s * 0.56} rx={t.s * 0.05} fill={bark.mid} />
                <Rect x={t.x - t.s * 0.055} y={t.y + t.s * 0.42} width={t.s * 0.04} height={t.s * 0.56} fill={bark.rim} />
                <Ellipse cx={t.x} cy={t.y + t.s * 0.34} rx={t.s * 0.34} ry={t.s * 0.32} fill={leaf.deep} />
                <Ellipse cx={t.x - t.s * 0.16} cy={t.y + t.s * 0.24} rx={t.s * 0.26} ry={t.s * 0.24} fill={palette.leafGreen} />
                <Ellipse cx={t.x + t.s * 0.15} cy={t.y + t.s * 0.3} rx={t.s * 0.2} ry={t.s * 0.19} fill={palette.leafGreen} />
                <Ellipse cx={t.x - t.s * 0.19} cy={t.y + t.s * 0.17} rx={t.s * 0.12} ry={t.s * 0.1} fill={leaf.lit} />
              </G>
            ))}

            {/* the worn path somebody walked in on, from the near edge to the
                ring — it gives the flat field a direction to read */}
            <Path
              d={`M ${geo.cx - geo.radius * 0.5} ${geo.h + 6} Q ${geo.cx - geo.radius * 0.16} ${geo.cy + geo.radius * 1.3} ${geo.cx - geo.radius * 0.42} ${geo.cy + geo.radius * 0.84} L ${geo.cx + geo.radius * 0.34} ${geo.cy + geo.radius * 0.84} Q ${geo.cx + geo.radius * 0.2} ${geo.cy + geo.radius * 1.36} ${geo.cx + geo.radius * 0.58} ${geo.h + 6} Z`}
              fill="#DFCFA8"
              opacity={0.4}
            />

            {/* the bare earth INSIDE the ring: the barrier line stands on
                grass, the fire stands on scorched ground. Painting the earth
                wider than the ring put the white dashed slots on pale sand
                where a child could barely see them. */}
            <Ellipse cx={geo.cx} cy={geo.cy + geo.radius * 0.06} rx={geo.radius * 0.9} ry={geo.radius * 0.86} fill={leaf.deep} opacity={0.3} />
            <Ellipse cx={geo.cx} cy={geo.cy} rx={geo.radius * 0.88} ry={geo.radius * 0.84} fill="#D8C39A" />
            <Ellipse cx={geo.cx} cy={geo.cy - geo.radius * 0.03} rx={geo.radius * 0.84} ry={geo.radius * 0.79} fill="#E4D3AE" />
            {/* the pit is dished, not painted on: one wash lights the up-left
                rim of the earth and drops the far-right side into shade */}
            <Ellipse cx={geo.cx} cy={geo.cy - geo.radius * 0.03} rx={geo.radius * 0.84} ry={geo.radius * 0.79} fill="url(#ss-pit-dish)" />
            <Ellipse cx={geo.cx} cy={geo.cy + 2} rx={geo.radius * 0.5} ry={geo.radius * 0.46} fill="#C6AC7C" opacity={0.62} />
            {/* the fire's own warmth, thrown on the ground it is standing on */}
            <Ellipse cx={geo.cx} cy={geo.cy + geo.radius * 0.1} rx={geo.radius * 0.66} ry={geo.radius * 0.5} fill="url(#ss-pit-glow)" />
            <Path
              d={`M ${geo.cx - geo.radius * 0.4} ${geo.cy - geo.radius * 0.54} q ${geo.radius * 0.36} ${-geo.radius * 0.12} ${geo.radius * 0.72} ${geo.radius * 0.05}`}
              stroke={HILITE}
              strokeWidth={Math.max(2, geo.radius * 0.035)}
              fill="none"
              strokeLinecap="round"
            />
            {/* a few pebbles kicked out of the fire ring */}
            {[
              [geo.cx - geo.radius * 0.86, geo.cy + geo.radius * 0.56],
              [geo.cx + geo.radius * 0.78, geo.cy - geo.radius * 0.62],
              [geo.cx - geo.radius * 0.2, geo.cy - geo.radius * 0.86],
            ].map(([x, y], i) => (
              <G key={`peb${i}`}>
                <Ellipse cx={(x ?? 0) + geo.radius * 0.02} cy={(y ?? 0) + geo.radius * 0.04} rx={Math.max(3.4, geo.radius * 0.05)} ry={Math.max(1.2, geo.radius * 0.016)} fill={palette.navy} opacity={0.1} />
                <Circle cx={x} cy={y} r={Math.max(3, geo.radius * 0.045)} fill="#9AA4C0" />
                <Circle cx={(x ?? 0) - geo.radius * 0.014} cy={(y ?? 0) - geo.radius * 0.014} r={Math.max(1.2, geo.radius * 0.02)} fill={HILITE} />
              </G>
            ))}

            {/* two seating logs, lying ON the grass outside the ring */}
            {logs.map((log, i) => (
              <G key={`log${i}`}>
                <Ellipse cx={log.x + log.w / 2} cy={log.y + log.h * 1.02} rx={log.w * 0.54} ry={Math.max(2.6, log.h * 0.3)} fill={palette.navy} opacity={0.12} />
                <Rect x={log.x} y={log.y} width={log.w} height={log.h} rx={log.h / 2} fill={bark.mid} />
                <Rect x={log.x + log.h * 0.3} y={log.y} width={Math.max(2, log.w - log.h * 0.6)} height={log.h * 0.32} rx={log.h * 0.16} fill={bark.rim} opacity={0.85} />
                <Rect x={log.x + log.h * 0.3} y={log.y + log.h * 0.72} width={Math.max(2, log.w - log.h * 0.6)} height={log.h * 0.28} rx={log.h * 0.14} fill={SHADE} />
                <Ellipse cx={log.f > 0 ? log.x + log.w : log.x} cy={log.y + log.h / 2} rx={log.h * 0.3} ry={log.h / 2} fill={bark.lit} />
                <Ellipse cx={log.f > 0 ? log.x + log.w : log.x} cy={log.y + log.h / 2} rx={log.h * 0.16} ry={log.h * 0.26} fill={bark.deep} />
              </G>
            ))}

            {/* the water bucket that belongs beside any camp fire */}
            <G>
              <Ellipse cx={bucket.cx} cy={bucket.y + bucket.h + bucket.r * 0.1} rx={bucket.r * 1.15} ry={bucket.r * 0.34} fill={palette.navy} opacity={0.12} />
              <Path
                d={`M ${bucket.cx - bucket.r} ${bucket.y} h ${bucket.r * 2} l ${-bucket.r * 0.22} ${bucket.h} h ${-bucket.r * 1.56} z`}
                fill={palette.slate}
              />
              <Path
                d={`M ${bucket.cx - bucket.r} ${bucket.y} h ${bucket.r * 0.5} l ${-bucket.r * 0.06} ${bucket.h} h ${-bucket.r * 0.22} z`}
                fill={HILITE_SOFT}
              />
              <Ellipse cx={bucket.cx} cy={bucket.y} rx={bucket.r} ry={bucket.r * 0.3} fill={palette.slateLight} />
              <Ellipse cx={bucket.cx} cy={bucket.y + bucket.r * 0.04} rx={bucket.r * 0.82} ry={bucket.r * 0.24} fill={palette.waterCyan} />
              <Ellipse cx={bucket.cx - bucket.r * 0.24} cy={bucket.y} rx={bucket.r * 0.3} ry={bucket.r * 0.08} fill={palette.white} opacity={0.6} />
              <Path
                d={`M ${bucket.cx - bucket.r} ${bucket.y - bucket.r * 0.06} a ${bucket.r} ${bucket.r * 0.92} 0 0 1 ${bucket.r * 2} 0`}
                stroke={palette.charcoal}
                strokeWidth={Math.max(1.8, bucket.r * 0.13)}
                fill="none"
                strokeLinecap="round"
              />
            </G>
          </Svg>

          {/* cones marking the clearing — standing on the grass, sized by how
              near they are, and always whole inside the frame */}
          {cones.map((c, i) => (
            <View key={i} style={[styles.cone, { left: c.x, top: c.y }]} pointerEvents="none">
              <Cone size={c.size} />
            </View>
          ))}


          {/* the campfire in the middle */}
          <Animated.View
            style={[styles.fire, { left: geo.cx - geo.fire / 2, top: geo.cy - geo.fire / 2, width: geo.fire, height: geo.fire }, fireStyle]}
            pointerEvents="none"
          >
            <Campfire size={geo.fire} calm={state.phase === 'done'} />
          </Animated.View>

          {/* the perimeter */}
          <Animated.View style={[StyleSheet.absoluteFill, ringStyle]} pointerEvents="none">
            <Svg width={geo.w} height={geo.h}>
              {slots.map((slot) => {
                const owner = owners[slot.index] ?? -1;
                const start = runStart[slot.index] ?? 0;
                return (
                  <RingPanel
                    key={slot.index}
                    slot={slot}
                    size={geo.slotSize}
                    filled={owner >= 0}
                    alt={owner >= 0 && (slot.index - start) % 2 === 1}
                  />
                );
              })}
            </Svg>
          </Animated.View>
        </View>
      ) : null}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  cone: { position: 'absolute' },
  /* the shelf one barrier is racked on: a pale slate plate with a darker rail
     under its feet, so a red-and-white barrier has a ground to stand on */
  rackCell: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 6,
    paddingTop: 4,
    borderRadius: radii.tile,
    backgroundColor: 'rgba(140,148,179,0.13)',
  },
  rackRail: { height: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: 'rgba(140,148,179,0.4)' },
  /* in a side rail the tray is a tall column: a wrapping ROW hung the longest
     barrier over both edges of the panel */
  trayColumn: { flexDirection: 'column' },
  fire: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  mathRow: {
    alignItems: 'center',
    backgroundColor: palette.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    ...shadows.soft,
  },
});
