/**
 * The Station Spark fire engine, built out of Three primitives — no external
 * assets, no loaders, nothing to download.
 *
 * It is the SVG truck's sibling: the same three-tone paint (`truckTones`), the
 * same yellow reflective stripe, the same roundel decal on the door and the
 * same chunky proportions, translated from the 220×112 SVG design box into a
 * 4.4 × 2.2 × 1.7 unit box standing on y = 0.
 *
 * Every solid is flat-shaded standard material, so each facet gets one flat
 * tone plus the bevel highlight — the "sticker, not line-art" rule from
 * docs/ART_DIRECTION.md, in three dimensions.
 *
 * Draw calls: 38 (see docs/THREE.md). Wheels and ladder rungs are instanced.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useFrame } from '@react-three/fiber';
import type { TruckStyle } from '@/state/store';
import { decalTones, hslToHex, lampColors, trim, truckTones } from './palette3d';
import { decalShapes } from './shapes';

/* ------------------------------------------------------------------ */
/* The design box — all numbers in world units, wheels on y = 0         */
/* ------------------------------------------------------------------ */

/** Bounding box of the model, for camera framing. */
export const TRUCK_BOX = { length: 4.44, height: 2.2, width: 1.84 } as const;

const HW = 0.86; // half width of the paint
const SKIN = HW + 0.004; // where side details sit, a hair proud of the paint

const BODY = { x0: -2.18, x1: 0.62, y0: 0.46, y1: 1.52 };
const CAB = { x0: 0.5, x1: 1.9, y0: 0.46, y1: 1.98 };
const HOOD = { x0: 1.84, x1: 2.2, y0: 0.46, y1: 1.42 };
/** The sloped cab front, from the roof's front corner to the hood's. */
const SCREEN = { x: 2.03, y: 1.7, tilt: 0.57 };
const WHEEL = { r: 0.44, w: 0.32, y: 0.44, z: 0.8, front: 1.3, rear: -1.26 };
const STRIPE_Y = 0.8;
const DECAL = { x: -1.01, y: 1.2, r: 0.3 };
const RUNG_X = [-1.85, -1.45, -1.05, -0.65, -0.25] as const;

const mid = (a: number, b: number) => (a + b) / 2;
const len = (a: number, b: number) => b - a;

/* ------------------------------------------------------------------ */
/* Geometry                                                             */
/* ------------------------------------------------------------------ */

/** Rounded box whose radius can never exceed the smallest half-extent. */
function rb(w: number, h: number, d: number, radius = 0.09, segments = 2): RoundedBoxGeometry {
  return new RoundedBoxGeometry(w, h, d, segments, Math.min(radius, w / 2.02, h / 2.02, d / 2.02));
}

/** Cylinder lying on its side, so its axis runs along z (the truck's width). */
function wheelGeo(radius: number, width: number, segments: number): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(radius, radius, width, segments);
  g.rotateX(Math.PI / 2);
  return g;
}

function extrudeFlat(shapes: THREE.Shape[], depth: number): THREE.ExtrudeGeometry {
  const g = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.45,
    bevelSize: depth * 0.35,
    bevelSegments: 1,
    curveSegments: 10,
  });
  g.center();
  return g;
}

interface TruckGeometry {
  skirt: THREE.BufferGeometry;
  body: THREE.BufferGeometry;
  cab: THREE.BufferGeometry;
  hood: THREE.BufferGeometry;
  screen: THREE.BufferGeometry;
  windshield: THREE.BufferGeometry;
  glint: THREE.BufferGeometry;
  sideWindow: THREE.BufferGeometry;
  sideGlint: THREE.BufferGeometry;
  compartment: THREE.BufferGeometry;
  panelLine: THREE.BufferGeometry;
  stripeSide: THREE.BufferGeometry;
  stripeFront: THREE.BufferGeometry;
  ladderRail: THREE.BufferGeometry;
  ladderRung: THREE.BufferGeometry;
  lightBarBase: THREE.BufferGeometry;
  lamp: THREE.BufferGeometry;
  bumper: THREE.BufferGeometry;
  grille: THREE.BufferGeometry;
  grilleSlat: THREE.BufferGeometry;
  headlight: THREE.BufferGeometry;
  tyre: THREE.BufferGeometry;
  hub: THREE.BufferGeometry;
  hubCap: THREE.BufferGeometry;
  roundel: THREE.BufferGeometry;
  shadow: THREE.BufferGeometry;
  sparkles: THREE.BufferGeometry;
  decalMain?: THREE.BufferGeometry;
  decalAccent?: THREE.BufferGeometry;
}

const SPARKLE_COUNT = 46;

function buildSparkles(count: number): THREE.BufferGeometry {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    pos[i * 3] = (Math.random() - 0.5) * 5;
    pos[i * 3 + 1] = Math.random() * 2.6;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return g;
}

function buildGeometry(decal: TruckStyle['decal']): TruckGeometry {
  const shadow = new THREE.CircleGeometry(1, 44);
  shadow.rotateX(-Math.PI / 2);

  const geo: TruckGeometry = {
    skirt: rb(4.4, 0.4, 1.62, 0.15),
    body: rb(len(BODY.x0, BODY.x1), len(BODY.y0, BODY.y1), HW * 2, 0.16),
    cab: rb(len(CAB.x0, CAB.x1), len(CAB.y0, CAB.y1), HW * 2, 0.18),
    hood: rb(len(HOOD.x0, HOOD.x1), len(HOOD.y0, HOOD.y1), HW * 2, 0.14),
    screen: rb(0.1, 0.64, HW * 2, 0.045),
    windshield: rb(0.06, 0.5, 1.44, 0.028),
    glint: rb(0.02, 0.42, 0.11, 0.009),
    sideWindow: rb(1.06, 0.46, 0.05, 0.022),
    sideGlint: rb(0.1, 0.36, 0.02, 0.009),
    compartment: rb(0.66, 0.4, 0.05, 0.05),
    panelLine: rb(2.52, 0.045, 0.03, 0.014),
    stripeSide: rb(4.36, 0.2, 0.035, 0.014),
    stripeFront: rb(0.035, 0.2, HW * 2 - 0.06, 0.014),
    ladderRail: rb(2.34, 0.1, 0.11, 0.045),
    ladderRung: rb(0.08, 0.07, 0.78, 0.03),
    lightBarBase: rb(0.3, 0.1, 1.42, 0.042),
    lamp: rb(0.26, 0.15, 0.5, 0.06),
    bumper: rb(0.24, 0.3, 1.84, 0.11),
    grille: rb(0.06, 0.34, 1.0, 0.028),
    grilleSlat: rb(0.03, 0.035, 0.86, 0.014),
    headlight: rb(0.07, 0.18, 0.2, 0.055),
    tyre: wheelGeo(WHEEL.r, WHEEL.w, 22),
    hub: wheelGeo(0.23, WHEEL.w + 0.03, 6),
    hubCap: wheelGeo(0.085, WHEEL.w + 0.06, 6),
    roundel: new THREE.CircleGeometry(DECAL.r, 28),
    shadow,
    sparkles: buildSparkles(SPARKLE_COUNT),
  };

  if (decal !== 'none') {
    const parts = decalShapes(decal);
    geo.decalMain = extrudeFlat(parts.main, 0.02);
    if (parts.accent.length) geo.decalAccent = extrudeFlat(parts.accent, 0.02);
  }
  return geo;
}

/* ------------------------------------------------------------------ */
/* Materials                                                            */
/* ------------------------------------------------------------------ */

interface TruckMaterials {
  body: THREE.MeshStandardMaterial;
  shade: THREE.MeshStandardMaterial;
  inset: THREE.MeshStandardMaterial;
  line: THREE.MeshStandardMaterial;
  stripe: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  glint: THREE.MeshBasicMaterial;
  chrome: THREE.MeshStandardMaterial;
  ladder: THREE.MeshStandardMaterial;
  ladderLight: THREE.MeshStandardMaterial;
  grille: THREE.MeshStandardMaterial;
  tyre: THREE.MeshStandardMaterial;
  hub: THREE.MeshStandardMaterial;
  hubCap: THREE.MeshStandardMaterial;
  headlight: THREE.MeshStandardMaterial;
  lampA: THREE.MeshStandardMaterial;
  lampB: THREE.MeshStandardMaterial;
  roundel: THREE.MeshStandardMaterial;
  sparkle: THREE.PointsMaterial;
  shadow: THREE.ShaderMaterial;
  decalMain?: THREE.MeshStandardMaterial;
  decalAccent?: THREE.MeshStandardMaterial;
}

const paint = (hex: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color: hex, roughness: 0.58, metalness: 0.06, flatShading: true, ...extra });

/**
 * The blurred contact shadow: a radial falloff on a squashed disc. Cheaper than
 * a shadow map, works on every device, and it matches the soft navy ellipse the
 * 2D art already puts under every object.
 */
function buildShadowMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(trim.shadow) }, uOpacity: { value: 0.34 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float d = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0);
        float a = 1.0 - d;
        gl_FragColor = vec4(uColor, a * a * uOpacity);
      }
    `,
  });
}

function buildMaterials(color: TruckStyle['color'], decal: TruckStyle['decal']): TruckMaterials {
  const tone = truckTones[color];
  const mats: TruckMaterials = {
    body: paint(tone.face, { emissive: new THREE.Color(tone.face), emissiveIntensity: 0.06 }),
    shade: paint(tone.shade),
    inset: paint(tone.shade, { roughness: 0.72 }),
    line: paint(tone.shade, { roughness: 0.85 }),
    stripe: paint(trim.stripe, { roughness: 0.36, emissive: new THREE.Color(trim.stripe), emissiveIntensity: 0.1 }),
    glass: paint(trim.glass, { roughness: 0.1, metalness: 0.45, flatShading: false }),
    glint: new THREE.MeshBasicMaterial({ color: trim.glassHighlight, transparent: true, opacity: 0.45, depthWrite: false }),
    chrome: paint(trim.chrome, { roughness: 0.4, metalness: 0.3 }),
    ladder: paint(trim.ladder, { roughness: 0.5, metalness: 0.22 }),
    ladderLight: paint(trim.ladderLight, { roughness: 0.5, metalness: 0.22 }),
    grille: paint(trim.grille, { roughness: 0.55, metalness: 0.3 }),
    tyre: paint(trim.tyre, { roughness: 0.92, metalness: 0 }),
    hub: paint(trim.hub, { roughness: 0.4, metalness: 0.3 }),
    hubCap: paint(trim.hubCap, { roughness: 0.5, metalness: 0.25 }),
    headlight: new THREE.MeshStandardMaterial({
      color: trim.headlight,
      emissive: new THREE.Color(trim.headlightGlow),
      emissiveIntensity: 0.9,
      roughness: 0.3,
    }),
    lampA: new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color('#FFFFFF'), roughness: 0.28 }),
    lampB: new THREE.MeshStandardMaterial({ color: '#FFFFFF', emissive: new THREE.Color('#FFFFFF'), roughness: 0.28 }),
    roundel: paint('#FFFFFF', { roughness: 0.45, flatShading: false }),
    sparkle: new THREE.PointsMaterial({
      color: trim.sparkle,
      size: 0.14,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    shadow: buildShadowMaterial(),
  };

  if (decal !== 'none') {
    const d = decalTones[decal];
    mats.decalMain = paint(d.main, { roughness: 0.45 });
    mats.decalAccent = paint(d.accent, { roughness: 0.45 });
  }
  return mats;
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export interface TruckModelProps {
  /** the child's truck from the store — colour, decal, lights, horn */
  style: TruckStyle;
  /** wheels turn */
  spinning?: boolean;
  /** increment to trigger a squash-and-bounce (the Honk! button) */
  honk?: number;
  /** 0..1 wash shine: emissive lift, glossier paint, sparkle burst */
  shine?: number;
  /** honour reduce-motion: no spin, no drifting sparkles, lights hold steady */
  reduced?: boolean;
}

const SPIN_AXIS = new THREE.Vector3(0, 0, 1);
const tmpMatrix = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3(1, 1, 1);
const tmpColor = new THREE.Color();

/**
 * The truck. Drop it inside any `<Canvas>`: it drives its own wheel spin, light
 * bar, wash shine and honk bounce from `useFrame`, and disposes every geometry
 * and material it created when it unmounts or the paint changes.
 */
export function TruckModel({ style, spinning = false, honk = 0, shine = 0, reduced = false }: TruckModelProps) {
  const geo = useMemo(() => buildGeometry(style.decal), [style.decal]);
  const mat = useMemo(() => buildMaterials(style.color, style.decal), [style.color, style.decal]);

  useEffect(
    () => () => {
      for (const g of Object.values(geo)) g?.dispose();
    },
    [geo],
  );
  useEffect(
    () => () => {
      for (const m of Object.values(mat)) m?.dispose();
    },
    [mat],
  );

  const bounce = useRef<THREE.Group>(null);
  const tyres = useRef<THREE.InstancedMesh>(null);
  const hubs = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const sparkles = useRef<THREE.Points>(null);

  const spin = useRef(0);
  const squash = useRef({ x: 0, v: 0 });
  const shineNow = useRef(0);
  const lastHonk = useRef(honk);

  useEffect(() => {
    if (honk !== lastHonk.current) {
      lastHonk.current = honk;
      squash.current.v = -7.2;
    }
  }, [honk]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;

    /* wheels — one instanced draw per part, spun about the axle */
    if (spinning && !reduced) spin.current += dt * 7.4;
    const wheelParts = [tyres.current, hubs.current, caps.current];
    if (wheelParts[0]) {
      tmpQuat.setFromAxisAngle(SPIN_AXIS, -spin.current);
      for (let i = 0; i < 4; i += 1) {
        tmpPos.set(i < 2 ? WHEEL.front : WHEEL.rear, WHEEL.y, i % 2 === 0 ? WHEEL.z : -WHEEL.z);
        tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
        for (const part of wheelParts) part?.setMatrixAt(i, tmpMatrix);
      }
      for (const part of wheelParts) {
        if (part) part.instanceMatrix.needsUpdate = true;
      }
    }

    /* light bar */
    const beat = (t * 1.9) % 1;
    if (style.lights === 'rainbow') {
      tmpColor.set(hslToHex((t * 0.26) % 1, 0.86, 0.58));
      mat.lampA.color.copy(tmpColor);
      mat.lampA.emissive.copy(tmpColor);
      tmpColor.set(hslToHex((t * 0.26 + 0.5) % 1, 0.86, 0.58));
      mat.lampB.color.copy(tmpColor);
      mat.lampB.emissive.copy(tmpColor);
    } else {
      const [a, b] = lampColors[style.lights];
      mat.lampA.color.set(a);
      mat.lampA.emissive.set(a);
      mat.lampB.color.set(b);
      mat.lampB.emissive.set(b);
    }
    mat.lampA.emissiveIntensity = reduced ? 0.8 : beat < 0.5 ? 1.25 : 0.25;
    mat.lampB.emissiveIntensity = reduced ? 0.8 : beat < 0.5 ? 0.25 : 1.25;

    /* wash shine — eased toward the prop so press-and-hold ramps up */
    shineNow.current += (shine - shineNow.current) * Math.min(1, dt * 4.5);
    const s = shineNow.current;
    mat.body.emissiveIntensity = 0.06 + s * 0.2;
    mat.body.roughness = 0.58 - s * 0.3;
    mat.body.metalness = 0.06 + s * 0.24;
    mat.stripe.emissiveIntensity = 0.1 + s * 0.4;
    mat.sparkle.opacity = s;
    if (sparkles.current && s > 0.01) {
      const attr = sparkles.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 1; i < arr.length; i += 3) {
        const y = (arr[i] ?? 0) + dt * (reduced ? 0 : 0.6);
        arr[i] = y > 2.7 ? 0.05 : y;
      }
      attr.needsUpdate = true;
      sparkles.current.rotation.y = reduced ? 0 : t * 0.24;
    }

    /* honk: squash, then bounce back through the top */
    const sq = squash.current;
    sq.v += (-150 * sq.x - 15 * sq.v) * dt;
    sq.x += sq.v * dt;
    if (Math.abs(sq.x) < 0.0008 && Math.abs(sq.v) < 0.0008) {
      sq.x = 0;
      sq.v = 0;
    }
    if (bounce.current) {
      bounce.current.scale.set(1 - sq.x * 0.055, 1 + sq.x * 0.1, 1 - sq.x * 0.055);
      bounce.current.position.y = Math.max(0, sq.x) * 0.22;
    }
  });

  return (
    <group>
      {/* the contact shadow stays on the floor, so it sits outside the bounce */}
      <mesh geometry={geo.shadow} material={mat.shadow} position={[0.04, 0.01, 0]} scale={[2.55, 1, 1.16]} />

      <group ref={bounce}>
        {/* ── chassis + paint ─────────────────────────────────── */}
        <mesh geometry={geo.skirt} material={mat.shade} position={[0.01, 0.36, 0]} />
        <mesh geometry={geo.body} material={mat.body} position={[mid(BODY.x0, BODY.x1), mid(BODY.y0, BODY.y1), 0]} />
        <mesh geometry={geo.cab} material={mat.body} position={[mid(CAB.x0, CAB.x1), mid(CAB.y0, CAB.y1), 0]} />
        <mesh geometry={geo.hood} material={mat.body} position={[mid(HOOD.x0, HOOD.x1), mid(HOOD.y0, HOOD.y1), 0]} />
        <mesh geometry={geo.screen} material={mat.body} position={[SCREEN.x, SCREEN.y, 0]} rotation={[0, 0, SCREEN.tilt]} />

        {/* ── glass: sloped windscreen + a door window each side ─ */}
        <mesh geometry={geo.windshield} material={mat.glass} position={[SCREEN.x + 0.058, SCREEN.y + 0.038, 0]} rotation={[0, 0, SCREEN.tilt]} />
        <mesh
          geometry={geo.glint}
          material={mat.glint}
          position={[SCREEN.x + 0.094, SCREEN.y + 0.06, 0.34]}
          rotation={[0.5, 0, SCREEN.tilt]}
        />

        {/* ── everything that repeats on both flanks ───────────── */}
        {[1, -1].map((side) => (
          <group key={`flank${side}`}>
            <mesh geometry={geo.compartment} material={mat.inset} position={[-1.74, 1.2, SKIN * side]} />
            <mesh geometry={geo.compartment} material={mat.inset} position={[-0.3, 1.2, SKIN * side]} />
            <mesh geometry={geo.panelLine} material={mat.line} position={[-0.88, 1.46, SKIN * side]} />
            <mesh geometry={geo.stripeSide} material={mat.stripe} position={[0.02, STRIPE_Y, (SKIN + 0.008) * side]} />
            <mesh geometry={geo.sideWindow} material={mat.glass} position={[1.2, 1.55, SKIN * side]} />
            <mesh geometry={geo.sideGlint} material={mat.glint} position={[0.92, 1.55, (SKIN + 0.022) * side]} rotation={[0, 0, 0.34]} />
          </group>
        ))}

        {/* ── the door decal, one roundel per side ─────────────── */}
        {style.decal !== 'none'
          ? [1, -1].map((side) => (
              <group key={`decal${side}`} position={[DECAL.x, DECAL.y, SKIN * side]} rotation={[0, side > 0 ? 0 : Math.PI, 0]}>
                <mesh geometry={geo.roundel} material={mat.roundel} position={[0, 0, 0.006]} />
                {geo.decalMain && mat.decalMain ? (
                  <mesh geometry={geo.decalMain} material={mat.decalMain} position={[0, 0, 0.028]} scale={0.84} />
                ) : null}
                {geo.decalAccent && mat.decalAccent ? (
                  <mesh geometry={geo.decalAccent} material={mat.decalAccent} position={[0, 0, 0.046]} scale={0.84} />
                ) : null}
              </group>
            ))
          : null}

        {/* ── roof ladder ──────────────────────────────────────── */}
        <mesh geometry={geo.ladderRail} material={mat.ladder} position={[-0.88, 1.6, 0.46]} />
        <mesh geometry={geo.ladderRail} material={mat.ladder} position={[-0.88, 1.6, -0.46]} />
        <LadderRungs geometry={geo.ladderRung} material={mat.ladderLight} />

        {/* ── light bar ────────────────────────────────────────── */}
        <mesh geometry={geo.lightBarBase} material={mat.grille} position={[1.24, 2.03, 0]} />
        <mesh geometry={geo.lamp} material={mat.lampA} position={[1.24, 2.13, 0.34]} />
        <mesh geometry={geo.lamp} material={mat.lampB} position={[1.24, 2.13, -0.34]} />

        {/* ── the face: bumper, stripe, grille, headlights ─────── */}
        <mesh geometry={geo.bumper} material={mat.chrome} position={[2.22, 0.46, 0]} />
        <mesh geometry={geo.stripeFront} material={mat.stripe} position={[2.215, STRIPE_Y, 0]} />
        <mesh geometry={geo.grille} material={mat.grille} position={[2.21, 1.14, 0]} />
        <mesh geometry={geo.grilleSlat} material={mat.chrome} position={[2.245, 1.06, 0]} />
        <mesh geometry={geo.grilleSlat} material={mat.chrome} position={[2.245, 1.22, 0]} />
        <mesh geometry={geo.headlight} material={mat.headlight} position={[2.23, 1.14, 0.62]} />
        <mesh geometry={geo.headlight} material={mat.headlight} position={[2.23, 1.14, -0.62]} />

        {/* ── wheels: 12 objects in 3 instanced draw calls ─────── */}
        <instancedMesh ref={tyres} args={[geo.tyre, mat.tyre, 4]} frustumCulled={false} />
        <instancedMesh ref={hubs} args={[geo.hub, mat.hub, 4]} frustumCulled={false} />
        <instancedMesh ref={caps} args={[geo.hubCap, mat.hubCap, 4]} frustumCulled={false} />

        {/* ── wash sparkles ────────────────────────────────────── */}
        <points ref={sparkles} geometry={geo.sparkles} material={mat.sparkle} frustumCulled={false} />
      </group>
    </group>
  );
}

/** The five rungs, in one instanced draw call. */
function LadderRungs({ geometry, material }: { geometry: THREE.BufferGeometry; material: THREE.Material }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const mat4 = new THREE.Matrix4();
    RUNG_X.forEach((x, i) => {
      mat4.makeTranslation(x, 1.6, 0);
      m.setMatrixAt(i, mat4);
    });
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return <instancedMesh ref={mesh} args={[geometry, material, RUNG_X.length]} frustumCulled={false} />;
}
