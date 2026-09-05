/**
 * Turntable drag with inertia — pure maths, no `three`, no React.
 *
 * The platform wrappers (`TruckScene3D.tsx` on web, `TruckScene3D.native.tsx`
 * on native) feed it pointer/pan coordinates; the scene reads `yaw`/`pitch`
 * once per frame. Keeping it plain means the input layer can differ per
 * platform while the motion feels identical.
 */

const MAX_PITCH = 0.16; // ~9°
/** Velocity decay per second while coasting (e^-DECAY). */
const DECAY = 3.4;
/** Screen px → radians. */
const YAW_PER_PX = 0.011;
const PITCH_PER_PX = 0.006;
/** Below this the coast is over — stops the frame loop doing pointless work. */
const REST = 0.004;

export interface DragSnapshot {
  yaw: number;
  pitch: number;
  active: boolean;
  moving: boolean;
}

export class DragController {
  yaw = 0;
  pitch = 0;
  active = false;

  private yawVel = 0;
  private pitchVel = 0;
  private lastX = 0;
  private lastY = 0;
  private lastT = 0;

  begin(x: number, y: number, now = Date.now()): void {
    this.active = true;
    this.lastX = x;
    this.lastY = y;
    this.lastT = now;
    this.yawVel = 0;
    this.pitchVel = 0;
  }

  move(x: number, y: number, now = Date.now()): void {
    if (!this.active) return;
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const dt = Math.max(0.008, (now - this.lastT) / 1000);
    this.lastX = x;
    this.lastY = y;
    this.lastT = now;

    const dYaw = dx * YAW_PER_PX;
    const dPitch = -dy * PITCH_PER_PX;
    this.yaw += dYaw;
    this.pitch = clamp(this.pitch + dPitch, -MAX_PITCH, MAX_PITCH);
    // Blend the sampled velocity so a flick releases smoothly.
    this.yawVel = this.yawVel * 0.35 + (dYaw / dt) * 0.65;
    this.pitchVel = this.pitchVel * 0.35 + (dPitch / dt) * 0.65;
  }

  end(): void {
    if (!this.active) return;
    this.active = false;
    // Cap the fling so a fast swipe never becomes a blur.
    this.yawVel = clamp(this.yawVel, -9, 9);
    this.pitchVel = clamp(this.pitchVel, -3, 3);
  }

  /** Advance the coast. `dt` in seconds. */
  step(dt: number): void {
    if (this.active) return;
    if (Math.abs(this.yawVel) < REST && Math.abs(this.pitchVel) < REST) {
      this.yawVel = 0;
      this.pitchVel = 0;
      // Pitch drifts gently back to level so the truck never rests askew.
      this.pitch += (0 - this.pitch) * Math.min(1, dt * 2.2);
      return;
    }
    const damp = Math.exp(-DECAY * dt);
    this.yaw += this.yawVel * dt;
    this.pitch = clamp(this.pitch + this.pitchVel * dt, -MAX_PITCH, MAX_PITCH);
    this.yawVel *= damp;
    this.pitchVel *= damp;
  }

  /** True while the user is holding it or it is still coasting. */
  get moving(): boolean {
    return this.active || Math.abs(this.yawVel) > REST || Math.abs(this.pitchVel) > REST;
  }

  reset(): void {
    this.yaw = 0;
    this.pitch = 0;
    this.yawVel = 0;
    this.pitchVel = 0;
    this.active = false;
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
