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
| `ThreeBoundary.tsx` | Error boundary: any GL failure (no WebGL, old device, Jest/SSR) renders the 2D fallback (`TruckFallback` → SVG `<FireTruck/>`, or `<BadgeArt/>`). |

Public API:

```tsx
import { TruckScene3D, Badge3D } from '@/three';

<TruckScene3D style={truck} height={300} honk={honks} shine={0.4} spinning />
<Badge3D color={def.color} icon={def.icon} size={104} flipKey={n} />
```

Props are documented in `src/three/index.ts` and `truckSceneProps.ts`. Both components accept
`forceFallback` for QA (the `/dev/three` route has a "Force 2D fallback" button).

## Rules

- **Import `@/three` only from screens that show GL** (today: `src/screens/Garage`, `app/dev/three.tsx`).
  Importing it elsewhere pulls `three` (~600 KB min) into that route's first paint.
- **Jest never loads `three`**: no test imports a screen that imports `@/three`. Keep it that way.
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
