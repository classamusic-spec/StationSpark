/**
 * SCENE FRAME — where a scene's drawing sits inside the box it was handed.
 *
 * The old SceneHero drew into a fixed `0 0 320 200` viewBox and let SVG's
 * `slice` crop it to fit. That is why the full-screen backdrop read as "a
 * wall": on a 390 × 694 phone box, `slice` scales a 1.6 : 1 drawing by 4.2 and
 * shows the middle 92 of its 320 units — three enormous shapes and nothing
 * else. There is no viewBox any more. The scene measures its box and draws in
 * *pixels*, so the composition is built for the aspect it is actually given.
 *
 * Two coordinate systems:
 *
 *  - **px space** — the depth planes (sky, far hills, skyline, mid terrace,
 *    near ground). These are parameterised by width, so they fill a portrait
 *    phone and a landscape tablet with no band of raw sky and no seam.
 *  - **design space** — each scene's own building, authored once in a
 *    `SCENE_W`-wide box whose ground line is its height. `sceneFrame` picks the
 *    scale and the origin; `tx`/`ty` map a design point into px when a piece of
 *    ambient motion has to be pinned to it.
 *
 * The ground line and the building's share of the frame both move with the
 * aspect ratio: tall boxes get a higher horizon and a wider building, short
 * wide boxes get a low horizon and a smaller building with more street either
 * side. The building is always scaled to fit the room above the ground line,
 * so a roof or a bell gable can never be cropped. A tall scene may declare a
 * `spill` so its design box runs wider than the frame — the clock tower's low
 * side walls are happy to be cropped, and without it the tower would be capped
 * by the width of a box that is mostly wall.
 */

/** Design width of every scene's own drawing box. */
export const SCENE_W = 300;

export interface SceneFrame {
  /** the measured box, in px */
  w: number;
  h: number;
  /** w / h */
  a: number;
  /** top of the near ground plane, px */
  gy: number;
  /** design → px scale for this scene's building */
  k: number;
  /** px of the scene design box's (0, 0) */
  ox: number;
  oy: number;
  /** the building's drawn size in px */
  bw: number;
  bh: number;
  /** unit scale for px-space furniture (1 ≈ a 390-wide phone) */
  s: number;
  /** fine dressing on — false for dispatch-slip thumbnails */
  detail: boolean;
  /** design x → px */
  tx: (x: number) => number;
  /** design y → px */
  ty: (y: number) => number;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * Compute the frame for a box of `w × h` px holding a scene whose design box
 * is `SCENE_W × sceneH`.
 */
export function sceneFrame(w: number, h: number, sceneH: number, detail: boolean, bleed = false, spill = 1): SceneFrame {
  const a = w / Math.max(1, h);
  /* The horizon. Two thirds down on a portrait phone and lower still on a
     short wide panel — a ground line drawn halfway up leaves a third of the
     frame as featureless pavement, which is the same failure as an empty sky
     and reads worse, because the eye expects the ground to be near. */
  const gy = Math.round(h * clamp(0.665 + (a - 0.5) * 0.085 + (bleed ? 0.015 : 0), 0.64, 0.84));
  /* How much of the width the hero building may take.
     On a tall portrait box the building is allowed to run *wider than the
     frame*: a 300 × 240 design box capped at the frame width can only ever
     fill a third of a 390 × 844 phone, which is what left a lake of empty
     pavement under it. Cropping a few units off a symmetrical façade costs
     nothing and buys the height that makes the frame feel close-up. */
  const bwFrac = clamp(0.94 - (a - 0.72) * 0.62, 0.46, 1.12);
  const topPad = Math.min(h * 0.05, 34) + 4;
  const k = Math.min((w * bwFrac * spill) / SCENE_W, Math.max(24, gy - topPad) / Math.max(1, sceneH));
  const bw = SCENE_W * k;
  const bh = sceneH * k;
  const ox = w / 2 - bw / 2;
  const oy = gy - bh;
  const s = clamp(Math.min(w / 390, h / 560), 0.16, 2.4);
  return {
    w,
    h,
    a,
    gy,
    k,
    ox,
    oy,
    bw,
    bh,
    s,
    detail,
    tx: (x: number) => ox + x * k,
    ty: (y: number) => oy + y * k,
  };
}

/* ------------------------------------------------------------------ */
/* Colour helpers — the value ladder between the depth planes           */
/* ------------------------------------------------------------------ */

function channels(hex: string): [number, number, number] {
  const s = hex.replace('#', '');
  const full = s.length === 3 ? `${s[0] ?? '0'}${s[0] ?? '0'}${s[1] ?? '0'}${s[1] ?? '0'}${s[2] ?? '0'}${s[2] ?? '0'}` : s;
  const n = parseInt(full.slice(0, 6) || '000000', 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const hex2 = (n: number): string => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');

/** Blend two hex colours. `t = 0` is `a`, `t = 1` is `b`. */
export function mix(a: string, b: string, t: number): string {
  const ca = channels(a);
  const cb = channels(b);
  const f = clamp(t, 0, 1);
  return `#${hex2((ca[0] ?? 0) + ((cb[0] ?? 0) - (ca[0] ?? 0)) * f)}${hex2((ca[1] ?? 0) + ((cb[1] ?? 0) - (ca[1] ?? 0)) * f)}${hex2((ca[2] ?? 0) + ((cb[2] ?? 0) - (ca[2] ?? 0)) * f)}`;
}

/** One value step darker — the step between two depth planes. */
export const darker = (c: string, t = 0.14): string => mix(c, '#1F2A5A', t);
/** One value step lighter. */
export const lighter = (c: string, t = 0.14): string => mix(c, '#FFFFFF', t);

/* ------------------------------------------------------------------ */
/* Path batching — repeated small shapes cost one node, not a hundred   */
/* ------------------------------------------------------------------ */

/** One rectangle as path data, for concatenating into a single `<Path/>`. */
export function rp(x: number, y: number, w: number, h: number): string {
  return `M ${x.toFixed(1)} ${y.toFixed(1)} h ${w.toFixed(1)} v ${h.toFixed(1)} h ${(-w).toFixed(1)} z`;
}

/** A row of `n` rectangles, batched. */
export function rowOf(n: number, x: number, y: number, w: number, h: number, step: number): string {
  let d = '';
  for (let i = 0; i < n; i += 1) d += rp(x + i * step, y, w, h);
  return d;
}

/** A grid of `rows × cols` rectangles, batched. */
export function gridOf(rows: number, cols: number, x: number, y: number, w: number, h: number, dx: number, dy: number): string {
  let d = '';
  for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) d += rp(x + c * dx, y + r * dy, w, h);
  return d;
}

/**
 * PAVING JOINTS THAT RECEDE. A ground plane ruled with parallel vertical lines
 * reads as a wall lying down; the same plane ruled with lines that fan out
 * towards the viewer and converge on the horizon reads as ground. All of them
 * in one path: each joint is a tapered quad, thin at the horizon and full
 * width at the front.
 */
export function fanJoints(w: number, gy: number, yTop: number, yBot: number, n: number, tw: number): string {
  const depth = Math.max(1, yBot - gy);
  const t0 = clamp((yTop - gy) / depth, 0, 1);
  const vx = w / 2;
  let d = '';
  for (let i = 0; i <= n; i += 1) {
    /* spread the front edge wider than the frame so the outermost joints leave
       the picture at the sides rather than crowding into the middle */
    const bx = -w * 0.42 + (i / n) * w * 1.84;
    const x0 = vx + (bx - vx) * t0;
    const hw0 = Math.max(0.35, (tw * t0) / 2);
    const hw1 = tw / 2;
    d +=
      `M ${(x0 - hw0).toFixed(1)} ${yTop.toFixed(1)} L ${(x0 + hw0).toFixed(1)} ${yTop.toFixed(1)} ` +
      `L ${(bx + hw1).toFixed(1)} ${yBot.toFixed(1)} L ${(bx - hw1).toFixed(1)} ${yBot.toFixed(1)} Z`;
  }
  return d;
}

/**
 * One tapered strip on the receding plane — a painted guide line, thin at the
 * back and wide at the front, aimed at the same horizon the joints converge on.
 */
export function fanStripe(w: number, gy: number, yTop: number, yBot: number, xFrac: number, tw: number): string {
  const depth = Math.max(1, yBot - gy);
  const t0 = clamp((yTop - gy) / depth, 0, 1);
  const vx = w / 2;
  const bx = w * xFrac;
  const x0 = vx + (bx - vx) * t0;
  const hw0 = Math.max(0.4, (tw * t0) / 2);
  return (
    `M ${(x0 - hw0).toFixed(1)} ${yTop.toFixed(1)} L ${(x0 + hw0).toFixed(1)} ${yTop.toFixed(1)} ` +
    `L ${(bx + tw / 2).toFixed(1)} ${yBot.toFixed(1)} L ${(bx - tw / 2).toFixed(1)} ${yBot.toFixed(1)} Z`
  );
}

/**
 * The joints that run *across* a receding plane: closer together at the back,
 * further apart at the front, so the spacing itself carries the depth.
 */
export function courseLines(w: number, yTop: number, yBot: number, n: number, th: number): string {
  let d = '';
  for (let i = 1; i <= n; i += 1) {
    const t = (i / (n + 1)) ** 1.85;
    const y = yTop + (yBot - yTop) * t;
    d += rp(-2, y, w + 4, th * (0.5 + t));
  }
  return d;
}

/**
 * A stable 0..1 from two integers. Variety in a row of buildings has to be
 * deterministic — the art is memoized and must not shimmer between renders —
 * but it must not read as a pattern either, hence a hash rather than `i % 3`.
 */
export function vary(i: number, salt: number): number {
  const n = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
}
