/* eslint-disable react/no-unknown-property -- three.js JSX elements are declared by @react-three/fiber, not the DOM. */
/**
 * Everything that lives *inside* the truck canvas — shared by the web and the
 * native scene wrappers, which differ only in how they capture a drag.
 *
 * The rig is three nested groups so each motion has its own pivot:
 *   tilt  — the drag's vertical component, about the camera's right axis
 *   turn  — yaw: the ±12°/6 s idle sway plus the user's turntable angle
 *   hover — the gentle bob, and the drop that puts the truck's floor below
 *           the camera's target so the framing reads as a hero shot
 */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { palette } from '@/theme';
import type { TruckStyle } from '@/state/store';
import { TruckModel } from './TruckModel';
import type { DragController } from './dragControl';

/** Hero framing: the camera sits front-right and slightly above the light bar. */
export const TRUCK_CAMERA = { position: [5.9, 2.9, 5.3] as [number, number, number], fov: 30 };

/** The camera's right axis — drag up/down tilts about this, never about world X. */
const PITCH_AXIS = new THREE.Vector3(0.67, 0, -0.74).normalize();
const IDLE_YAW = (12 * Math.PI) / 180;
const IDLE_PERIOD = 6;
const BOB_PERIOD = 3.4;
/** Puts the truck's floor below the camera target so it sits in the lower half. */
const GROUND_DROP = -0.94;

export interface TruckSceneContentProps {
  style: TruckStyle;
  spinning?: boolean;
  honk?: number;
  shine?: number;
  /** decorative loops off; the child can still turn the truck by hand */
  reduced?: boolean;
  drag: DragController;
}

export function TruckSceneContent({ style, spinning, honk, shine, reduced = false, drag }: TruckSceneContentProps) {
  const tilt = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const hover = useRef<THREE.Group>(null);
  /** Idle sway fades out the moment a finger lands, and eases back in later. */
  const idleAmp = useRef(1);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    drag.step(dt);

    const target = drag.moving ? 0 : 1;
    idleAmp.current += (target - idleAmp.current) * Math.min(1, dt * (target > idleAmp.current ? 0.7 : 7));

    if (turn.current) {
      const sway = reduced ? 0 : Math.sin((t * Math.PI * 2) / IDLE_PERIOD) * IDLE_YAW * idleAmp.current;
      turn.current.rotation.y = sway + drag.yaw;
    }
    if (tilt.current) tilt.current.quaternion.setFromAxisAngle(PITCH_AXIS, drag.pitch);
    if (hover.current) {
      hover.current.position.y = GROUND_DROP + (reduced ? 0 : Math.sin((t * Math.PI * 2) / BOB_PERIOD) * 0.028);
    }
  });

  return (
    <>
      {/* Sky above, warm cream bounce off the bay floor — the palette, as light. */}
      <hemisphereLight args={[palette.skyBottom, palette.cream, 1.85]} />
      {/* Key: front-right and high, like the bay's work lamps. */}
      <directionalLight position={[4.5, 7, 5.5]} intensity={1.85} />
      {/* Cool fill so the shaded side keeps its colour instead of going muddy. */}
      <directionalLight position={[-5, 2.5, -4.5]} intensity={0.55} color={palette.waterCyanLight} />

      <group ref={tilt}>
        <group ref={turn}>
          <group ref={hover} position={[0, GROUND_DROP, 0]}>
            <TruckModel style={style} spinning={spinning} honk={honk} shine={shine} reduced={reduced} />
          </group>
        </group>
      </group>
    </>
  );
}
