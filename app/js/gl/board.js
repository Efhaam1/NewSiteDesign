import * as THREE from 'three';
import { LAYER_BACK } from './world.js';
import { clamp, lerp, smooth, band, rng } from '../util.js';

export const TILE = 4;
export const RANK_MIN = -2;   // two ranks in front of a1 so the board has a lip
export const RANK_MAX = 24;   // ranks past 8 that fade into fog
export const FILE_N = 8;
export const SPINE_FILE = 3;  // the d-file: the curriculum spine

export const fileX = (f) => (f - (FILE_N - 1) / 2) * TILE;
export const rankZ = (r) => -(r - 1) * TILE;

/**
 * The board is not a backdrop — it is the page's structural system. Tiles
 * assemble, ranks gate the story, one file becomes the spine the curriculum
 * runs along, and at the end a single square lifts out and becomes the product.
 */
export class Board {
  constructor(world) {
    this.world = world;
    this.ranks = [];
    for (let r = RANK_MIN; r <= RANK_MAX; r++) this.ranks.push(r);
    this.count = this.ranks.length * FILE_N;

    const geo = new THREE.BoxGeometry(TILE * 0.985, 0.62, TILE * 0.985);
    geo.translate(0, -0.31, 0);

    // Phong, not Standard. These 216 instances cover most of the screen, and what
    // the board needs from its material is one raking specular highlight — not a
    // GGX lobe per light plus two cubeUV environment samples per pixel. Measured
    // on an Iris Xe: Standard 34.5 fps median / 15.2 min, Phong 42 / 33, and the
    // Lambert version that scored highest lost the sheen the board is lit by.
    const matDark = new THREE.MeshPhongMaterial({
      color: 0xffffff, specular: 0x2c2a26, shininess: 26, reflectivity: 0,
    });
    this.mesh = new THREE.InstancedMesh(geo, matDark, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.layers.set(LAYER_BACK);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 0;
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.count * 3), 3);
    world.scene.add(this.mesh);

    // additive plate above each tile — this is how a square "lights"
    const gg = new THREE.PlaneGeometry(TILE * 0.985, TILE * 0.985);
    gg.rotateX(-Math.PI / 2);
    this.glow = new THREE.InstancedMesh(
      gg,
      new THREE.MeshBasicMaterial({
        transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false,
      }),
      this.count);
    this.glow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.glow.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.count * 3), 3);
    this.glow.layers.set(LAYER_BACK);
    this.glow.frustumCulled = false;
    world.scene.add(this.glow);

    // The table the board sits on. Without it the board has a void at its edge
    // and reads as a floating plank instead of an object in a room.
    const table = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      // A near-black rough plane does not need four GGX lobes and two env lookups
      // across a quarter of the screen.
      new THREE.MeshLambertMaterial({ color: 0x0a090d, reflectivity: 0 }));
    table.rotation.x = -Math.PI / 2;
    table.position.y = -0.64;
    // three sorts opaques by renderOrder before material id. Without this the
    // table draws first and the board overdraws 72% of it.
    table.renderOrder = 1;
    table.layers.set(LAYER_BACK);
    world.scene.add(table);
    this.table = table;

    // per-instance authored state
    const rand = rng(20260828);
    this.tiles = [];
    for (const r of this.ranks) {
      for (let f = 0; f < FILE_N; f++) {
        const light = (f + r) % 2 === 1;
        this.tiles.push({
          f, r, light,
          x: fileX(f), z: rankZ(r),
          // assembly: farther-from-a1 tiles land later, jittered
          order: clamp((Math.abs(f - SPINE_FILE) * 0.06 + (r - RANK_MIN) * 0.045 + rand() * 0.22) / 1.5),
          drop: 26 + rand() * 34,
          spin: (rand() - 0.5) * 0.9,
          y: 0, lift: 0, g: 0,
          hue: new THREE.Color(0x000000),
        });
      }
    }

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3(1, 1, 1);
    this._c = new THREE.Color();
    this._t = new THREE.Color();

    this.assembly = 0;     // 0 = scattered above, 1 = locked
    this.lightness = 0;    // 0 = ebony room, 1 = ivory room
    this.focus = null;     // {f, r, amount} — the square that lifts out
    this.rankGlow = new Float32Array(RANK_MAX + 3);
    /** File glow is the mirror of rank glow, for the one shot that needs a whole
        file lit rather than a whole rank: act 1's three coaches converging onto
        the d-file. Ranks light as a gate is crossed; a file lights when the
        curriculum takes over. */
    this.fileGlow = new Float32Array(FILE_N);
    this.fileGlowTop = 8;
    /** 0 lights the whole file flat; 1 gathers that light down to rank 1, which
        is where the spine's fill starts. See setFileGlow. */
    this.fileGather = 0;
    this.hueColor = new THREE.Color(0x3fa57a);
    this._wasFocus = false;
    this._lastLight = -1;
    this._wasGlowing = false;
  }

  /** Rank glow lets the director light a whole rank as a gate is crossed. */
  setRankGlow(rank, v) {
    const i = rank - RANK_MIN;
    if (i >= 0 && i < this.rankGlow.length) this.rankGlow[i] = v;
  }

  /**
   * Light one whole file, over all eight ranks.
   *
   * `gather` is the handover. At 0 the file is lit flat, which is what "the
   * curriculum takes over from three scattered paths" looks like. At 1 the same
   * light is a wedge that falls off linearly to nothing at fileGlowTop, so it is
   * concentrated on rank 1 — where act 2's fill starts. The file therefore hands
   * the line to the spine rather than switching off, and no flat wash is ever on
   * the board competing with the head-of-fill gaussian.
   */
  setFileGlow(file, v, gather = 0) {
    if (file < 0 || file >= FILE_N) return;
    this.fileGlow[file] = v;
    this.fileGather = gather;
  }

  update(dt, t) {
    const a = this.assembly;
    // Once the board has locked and nothing is lifting, the tile transforms and
    // albedo are constant. Writing 216 matrices and 216 colours per frame for a
    // static board is pure CPU tax, so the geometry pass runs only when it moves.
    const moving = a < 0.999 || !!this.focus || this._wasFocus
      || Math.abs(this.lightness - this._lastLight) > 0.002;
    this._wasFocus = !!this.focus;
    this._lastLight = this.lightness;
    let glowing = false;
    let hiRank = RANK_MIN - 1;
    for (let i = 0; i < this.rankGlow.length; i++) {
      if (this.rankGlow[i] > 0.002) { glowing = true; hiRank = RANK_MIN + i; }
    }
    // A lit file needs its own ranks in the draw range. It is bounded by
    // fileGlowTop rather than by RANK_MAX so the tail past rank 8 stays culled.
    for (let i = 0; i < FILE_N; i++) {
      if (this.fileGlow[i] > 0.002) { glowing = true; hiRank = Math.max(hiRank, this.fileGlowTop); }
    }
    if (this.focus) hiRank = Math.max(hiRank, this.focus.r);
    if (!moving && !glowing && !this._wasGlowing) return;
    this._wasGlowing = glowing;
    // Only the ranks up to the highest lit one can contribute, and the instance
    // buffer is rank-major, so the tail is culled by lowering the draw count.
    this.glow.count = glowing
      ? Math.min(this.count, (hiRank - RANK_MIN + 1) * FILE_N)
      : 0;
    // The lit file's falloff per rank, hoisted out of the tile loop: 0 is flat,
    // 1 is a wedge that reaches nothing at fileGlowTop.
    const fgk = this.fileGather / Math.max(1, this.fileGlowTop - 1);

    for (let i = 0; i < this.tiles.length; i++) {
      const p = this.tiles[i];
      // assembly: each tile has its own start, so the board locks in as a wave
      const local = smooth(clamp((a - p.order * 0.55) / 0.45));
      const y = lerp(p.drop, 0, local);
      const rot = lerp(p.spin, 0, local);
      let lift = 0;
      if (this.focus) {
        // One square rises; its neighbours settle a little, so the lift reads as
        // a square being taken out of a solid board rather than the board breaking.
        const near = p.f === this.focus.f && p.r === this.focus.r;
        const d = Math.hypot(p.f - this.focus.f, (p.r - this.focus.r) * 0.9);
        if (near) lift = this.focus.amount * 3.4;
        else lift = -this.focus.amount * clamp(1 - d / 3.4) * 0.5;
      }
      p.y = y + lift;

      this._e.set(rot * 0.6, rot, rot * 0.4);
      this._q.setFromEuler(this._e);
      this._v.set(p.x, p.y, p.z);
      const sc = lerp(0.86, 1, local);
      this._s.set(sc, 1, sc);
      this._m.compose(this._v, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);

      // colour: the two square tones, lifted toward ivory as the room lifts
      // the two square tones. instanceColor multiplies a white material, so
      // these are albedo values and the light does the rest.
      const base = p.light ? 0x6d6353 : 0x201d28;
      this._c.setHex(base);
      if (this.lightness > 0) {
        this._t.setHex(p.light ? 0xefe8da : 0xa2977f);
        this._c.lerp(this._t, this.lightness);
      }
      if (this.table) this.table.material.color.setHex(this.lightness > 0.5 ? 0xd9d2c4 : 0x0a090d);
      this.mesh.instanceColor.setXYZ(i, this._c.r, this._c.g, this._c.b);

      // glow plate
      const rg = this.rankGlow[p.r - RANK_MIN] || 0;
      const fg = p.r >= 1 && p.r <= this.fileGlowTop
        ? (this.fileGlow[p.f] || 0) * (1 - fgk * (p.r - 1))
        : 0;
      const spineBoost = p.f === SPINE_FILE ? 0.55 : 0;
      let g = p.g + rg * (0.5 + spineBoost) + fg + (local < 1 ? (1 - local) * 0.12 : 0);
      if (this.focus && p.f === this.focus.f && p.r === this.focus.r) g += this.focus.amount * 0.42;
      g *= 1 - this.lightness * 0.75;
      this._c.copy(this.hueColor).multiplyScalar(g);
      this.glow.instanceColor.setXYZ(i, this._c.r, this._c.g, this._c.b);
      this._v.set(p.x, p.y + 0.035, p.z);
      this._q.identity();
      this._s.set(1, 1, 1);
      this._m.compose(this._v, this._q, this._s);
      this.glow.setMatrixAt(i, this._m);
    }
    if (moving) {
      this.mesh.instanceMatrix.needsUpdate = true;
      this.mesh.instanceColor.needsUpdate = true;
      this.glow.instanceMatrix.needsUpdate = true;
    }
    this.glow.instanceColor.needsUpdate = true;
    this.glow.visible = glowing && this.glow.count > 0;
  }
}
