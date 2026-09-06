# The 3D layer (Three.js via react-three-fiber)

Station Spark is a 2D vector world. Three.js is used **only where the object itself is the reward,
never where the object is information** (art critique): the Garage truck turntable and the badge flip.
It stays out of the home screen, the map, every play field, the characters, and the first-paint path.

## Modules (`src/three/`)

| File | Role |
| --- | --- |
| `TruckModel.tsx` | Procedural low-poly fire truck from primitives: rounded cab, body, compartment panel line, roof ladder, flashing light bar (classic / rainbow / blue), bumper, grille, headlights, glossy navy windows, yellow stripe, spinning wheels, and the decal (flame / star / paw / lightning) built from geometry. Toon-ish materials in the brand palette (`palette3d.ts`). |
| `TruckSceneContent.tsx` | Camera, hemisphere + directional light, contact shadow disc, idle rotation + hover bob, wheel spin, light flash, honk squash-and-bounce, wash shine. |
| `TruckScene3D.tsx` / `TruckScene3D.native.tsx` | Platform entry points sharing `truckSceneProps.ts`. Web uses `@react-three/fiber`'s DOM canvas; native uses `@react-three/fiber/native` over `expo-gl`. |
| `dragControl.ts` | Drag-to-rotate with inertia (pointer events on web, gesture-handler pan on native). |
| `Badge3D.tsx` | Extruded shield badge with rim colour + emblem; `flipKey` bump → 720° flip with a sparkle burst. Same colour/icon contract as `<BadgeArt/>`. |
| `Stage.tsx` / `Stage.native.tsx` | The shared R3F canvas wrapper (transparent background, DPR clamp, reduced-motion aware). |
| `TruckRunScene3D.tsx` / `TruckRunRoad.tsx` | The Truck Run road: chase camera over a scrolling three-lane road with hazards, ramps, boost pads and answer gates, reusing `TruckModel` with the child's own truck style. Loaded lazily so no route pays for `three` at first paint. |
| `webgl.ts` | The one up-front "is there a GL context?" probe (`WEBGL_AVAILABLE`), consumed by `ThreeBoundary`. |
| `ThreeBoundary.tsx` | Error boundary **and** GL gate: any GL failure (no WebGL, old device, Jest/SSR) renders the 2D fallback (`TruckFallback` → SVG `<FireTruck/>`, or `<BadgeArt/>`). |
| `lazy.tsx` | **The doors screens use.** `<LazyTruckScene3D/>` and `<LazyBadge3D/>`: the two entry points behind a `lazy()` chunk, a `ThreeBoundary` and the 2D fallback. Free of `three`. |
| `badgeIcons.ts` | The twelve badge emblem *names* (`badge3DIcons`, `Badge3DIcon`, `toBadge3DIcon`), free of `three` so a caller can name an emblem without loading a renderer. `shapes.ts` re-exports them. |

## The one rule: screens import `@/three/lazy`, never `@/three`

The web build is a **single page** (`app.json` → `web.output: "single"`), so every
route is in the entry bundle. One eager `import … from '@/three'` anywhere in
`app/` or `src/screens` therefore puts ~600 KB of renderer on the first paint of
the *whole app* — the Firehouse, the map, every mini-game — not just the screen
that shows a canvas.

That is exactly what had happened: `GarageScreen` imported `@/three` at the top
of the file, so the road's careful lazy loading bought nothing and the entry
bundle carried `WebGLRenderer` regardless. Moving the Garage, the badge flip and
the dev bench onto `@/three/lazy` took the entry chunk from **5,472,226 to
4,454,996 bytes** and dropped `WebGLRenderer` out of it entirely; three now sits
in an async `__common` chunk (~1 MB) that only a scene chunk pulls.

```tsx
import { LazyTruckScene3D, LazyBadge3D } from '@/three/lazy';

<LazyTruckScene3D style={truck} height={300} honk={honks} shine={0.4} spinning />
<LazyBadge3D color={def.color} icon={def.icon} size={104} flipKey={n} />
```

Same props as `<TruckScene3D/>` / `<Badge3D/>` (documented in `truckSceneProps.ts`
and `Badge3D.tsx`), plus an optional `fallback` on the badge for a caller with its
own 2D art — `CelebrationOverlay` passes its flipping SVG. Both accept
`forceFallback` for QA (the `/dev/three` route has a "Force 2D fallback" button).

**Loading a new 3D scene — copy this pattern.** Lazy-import the scene inside a
`ThreeBoundary` with the 2D view as both the `fallback` and the `<Suspense>`
fallback (`src/three/lazy.tsx` and `src/minigames/tactile/TruckRun/RoadScene.tsx`
are the references). The boundary alone is not enough on its own: three throws
while the canvas is being set up, *outside* React's render phase, so a boundary
never trips and the child gets an empty canvas. That is why the boundary starts
tripped when `WEBGL_AVAILABLE` is false — do not re-implement the probe per
scene.

Because the boundary renders its fallback *without mounting its children*, a
device with no WebGL never even fires the dynamic import — and neither does Jest,
where `WEBGL_AVAILABLE` is false by construction. That is what keeps `three` out
of the tests without a `NODE_ENV` check at each call site.

## Rules

- **Never import `@/three` from a screen** — use `@/three/lazy` (see above). The eager barrel is for
  code that is already inside a canvas. Today the only importers of the barrel are the modules under
  `src/three/` themselves. `npm run export:web && grep -c WebGLRenderer dist/_expo/static/js/web/entry-*.js`
  must print `0`; if it does not, something started importing the barrel eagerly.
- **Jest never loads `three`**: `WEBGL_AVAILABLE` is false under test, so `ThreeBoundary` renders the
  2D fallback and the lazy import is never fired. Keep it that way.
- **Fallback is mandatory**: every 3D element is wrapped in `ThreeBoundary` with a 2D sibling that
  looks like the same object. A child on a device without GL must not notice.
- **Reduced motion**: idle rotation/bob stop; flips shorten; wheel spin stays (it is the object's
  identity), light flash slows.
- **Performance targets**: 60 fps on a 2020 iPad; < 40 draw calls per scene; no shadow maps above
  1024; DPR clamped to 2. Materials are shared per colour; geometries are created once per mount.

## Verifying on the web

```bash
npm run export:web
CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/qa/shoot-gl.mjs dist screenshots 390x844 "/garage,/dev/three"
```

`shoot-gl.mjs` launches headless Chromium with SwiftShader flags so WebGL renders without a GPU.

## Native caveats

- `@react-three/fiber/native` needs `expo-gl`; it is installed and config-plugin free.
- Drag-to-rotate on native is fed by a `react-native-gesture-handler` Pan gesture; the web build
  uses pointer events on the canvas.
- The 3D scene has not been run on a physical device from this environment; the fallback path and
  the web path are verified in Chromium.
