import * as THREE from 'three';
import { clamp, lerp, smoother } from '../util.js';

/**
 * The camera is on rails: keyframes are authored against narrative position
 * (act index + local progress), so the shot list survives any change to how
 * long an act scrolls for. Interpolation is smootherstep with a per-segment
 * curve, which is what keeps the travel feeling weighted rather than linear.
 */
export class CameraRig {
  constructor(camera, keys) {
    this.cam = camera;
    this.keys = keys;
    this.pos = new THREE.Vector3().copy(keys[0].pos);
    this.look = new THREE.Vector3().copy(keys[0].look);
    this.fov = keys[0].fov;
    this.roll = keys[0].roll || 0;
    this.mouse = new THREE.Vector2();
    this._mt = new THREE.Vector2();
    this._a = new THREE.Vector3();
    this._b = new THREE.Vector3();
    addEventListener('pointermove', (e) => {
      this._mt.set((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2);
    }, { passive: true });
  }

  sample(n) {
    const k = this.keys;
    let i = 0;
    while (i < k.length - 2 && n >= k[i + 1].at) i++;
    const a = k[i], b = k[i + 1];
    let t = clamp((n - a.at) / Math.max(1e-6, b.at - a.at));
    t = (b.curve || smoother)(t);
    this._a.copy(a.pos).lerp(b.pos, t);
    this._b.copy(a.look).lerp(b.look, t);
    return {
      pos: this._a, look: this._b,
      fov: lerp(a.fov, b.fov, t),
      roll: lerp(a.roll || 0, b.roll || 0, t),
    };
  }

  /**
   * Portrait is not a narrower crop of the same shot. The horizontal framing is
   * what the composition was authored against, so on a tall viewport the field
   * is widened to preserve it (capped, or the perspective goes fisheye) and the
   * whole shot is tilted up so the copy owns the lower half.
   */
  fit(fov) {
    const a = innerWidth / innerHeight;
    const base = 1.6;
    if (a >= base) return fov;
    const wide = (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * (base / a)) * 180) / Math.PI;
    return Math.min(64, wide);
  }

  update(n, dt, damp = 0.13) {
    const s = this.sample(n);

    const k = 1 - Math.pow(1 - damp, dt * 60);
    this.pos.lerp(s.pos, k);
    this.look.lerp(s.look, k);
    this.fov += (s.fov - this.fov) * k;
    this.roll += (s.roll - this.roll) * k;
    this.mouse.lerp(this._mt, 1 - Math.pow(1 - 0.06, dt * 60));

    const par = 1.7;
    this.cam.position.set(
      this.pos.x + this.mouse.x * par,
      this.pos.y - this.mouse.y * par * 0.55,
      this.pos.z,
    );
    this.cam.fov = this.fit(this.fov);
    // On a tall screen the world is shifted up and to the right inside the frame
    // so the lower-left belongs to the copy. This moves the rendered image, not
    // the camera, so the composition holds without distorting the perspective.
    const portrait = innerWidth / innerHeight < 0.95;
    if (portrait) {
      this.cam.setViewOffset(innerWidth, innerHeight,
        -innerWidth * 0.15, innerHeight * 0.17, innerWidth, innerHeight);
    } else if (this.cam.view && this.cam.view.enabled) {
      this.cam.clearViewOffset();
    }
    this.cam.updateProjectionMatrix();
    this.cam.up.set(Math.sin(this.roll), Math.cos(this.roll), 0);
    this.cam.lookAt(this.look);
  }
}

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
