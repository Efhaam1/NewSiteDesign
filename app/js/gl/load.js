import * as THREE from 'three';
import { LAYER_BACK, LAYER_FRONT } from './world.js';
import { clamp, lerp, smooth, easeOut, rng } from '../util.js';
import { TILE, fileX, rankZ, SPINE_FILE } from './board.js';

/**
 * The work that happens BEFORE the lesson — and where it ends up.
 *
 * Act 1 (`chaos`) already owns three coaches converging onto one FILE. This act
 * owns the other axis, and that is the whole reason it can stand next to it: a
 * file is the curriculum, a RANK is one hour. Eight squares, left to right, in
 * order — which is exactly the eight segments S115 is written in. So the argument
 * is spatial and it is not a repeat:
 *
 *   pile     material rises out of the dark and stacks on ONE square: next
 *            Tuesday, fifty minutes, nothing in them yet.
 *   spread   the same stacking spills across the board. One square becomes
 *            twenty-four, and the workload is legible as area, not as a number.
 *   arrows   the thirty legal moves from d4, drawn as analysis arrows at room
 *            scale and all the same weight. Chess has a name for a position with
 *            too many candidate moves and no way to rank them; so does Sunday.
 *   airborne the stacks lose their squares. Material leaves the board entirely
 *            and drifts at every depth, some of it in FRONT of the headline on
 *            the front plate, because clutter you can read past is not clutter.
 *   unrest   the composition stops holding still. Desync, not noise: every slip
 *            drifts on its own phase, so nothing in the frame agrees.
 *   resolve  all of it falls back and lands as EIGHT ordered piles on rank 4 —
 *            one per segment of the session, a to h. The room does not tidy up;
 *            it files.
 *
 * Two instanced meshes for the slips (room and front plate) and two for the
 * arrows (shaft and head). Everything the eye reads as "a system arrived" is a
 * per-item random being lerped to a constant, the same trick debris.js uses, so
 * no attribute, material or draw call is added to say it.
 */

/** The rank one hour resolves onto, and the square the coach starts staring at.
 *  d4 is on the file the whole film travels and is clear of the pawn on rank 1. */
export const HOUR_RANK = 4;
export const SEED = { f: SPINE_FILE, r: HOUR_RANK };

/** Slips live on the room layer; a few ride the front plate so they cross the
 *  type. 26 is the most that can pass in front of a headline before the words
 *  stop being readable at all — measured at 1440x900 against the d2 line. */
const N_BACK = 200;
const N_FRONT = 22;

/** Where the work piles up, in the order it appears. The seed square is first,
 *  then it spills outward — near squares before far ones, so `spread` reads as
 *  a week filling up rather than as a random sprinkle. Twenty-four squares over
 *  ranks 2-7: enough to cover the frame, short of the rank the hour lands on
 *  being buried before it is lit. */
const SQUARES = [
  [3, 4], [4, 4], [2, 5], [4, 6], [1, 3], [5, 5], [3, 6], [6, 4],
  [0, 5], [2, 2], [5, 7], [1, 6], [7, 5], [4, 2], [6, 7], [0, 3],
  [3, 7], [7, 2], [2, 7], [5, 2], [1, 7], [6, 2], [0, 7], [7, 7],
];

/**
 * The thirty legal moves from d4, by piece. Not a fan of decorative rays: this
 * is the rook's file and rank, the bishop's four diagonals and the knight's
 * eight jumps, which is what a player sees when they have no plan and every
 * move looks equally reasonable.
 */
const RAYS = [
  // rook — up and down the d-file, then along rank 4. RAYS[0] is the one that
  // survives, so it is the LONGEST move up the file the frame can hold: two
  // squares reads as "onward", one square reads as a nudge.
  [3, 6], [3, 5], [3, 7], [3, 3], [3, 2],
  [2, 4], [1, 4], [0, 4], [4, 4], [5, 4], [6, 4], [7, 4],
  // bishop — the four diagonals
  [4, 5], [5, 6], [6, 7], [2, 5], [1, 6], [0, 7], [4, 3], [5, 2], [2, 3], [1, 2],
  // knight — all eight jumps
  [4, 6], [5, 5], [5, 3], [4, 2], [2, 2], [1, 3], [1, 5], [2, 6],
];

/**
 * Four KINDS of material, mixed on every square — which is the difference between
 * an overload and a screensaver. Same technique debris.js uses for its three kinds:
 * every field biases a random the slip has already drawn, so there is no second
 * geometry, no new attribute and no branch in the hot loop.
 *
 * Act 2's three kinds are three COACHES, one kind each, sorted into three heaps.
 * These four are one coach's week and they are deliberately NOT sorted: a single
 * square carries a diagram, a page of notes, a phone screenshot and a dark export,
 * because "it is all in one place" is exactly what is not true.
 *
 *   s   scale bias      a   footprint aspect (>1 landscape)
 *   t   albedo          g,b warmth against red      y  how square it is kept
 *
 * DIAGRAM  a printed puzzle position: square, cream, the most numerous.
 * NOTES    A4 of opening or endgame notes: portrait 1:1.41, warm, the largest.
 * GRAB     a position screenshotted off a phone and printed: landscape 2:1, cool.
 * EXPORT   a dark PDF export. 0.44, not 0.30: below about 0.4 it stops reading as a
 *          dark print and reads as a missing tile, which debris.js's own DARK note
 *          records running into. Its cast is neutral for the same reason - warm-red
 *          against a low albedo went cyan.
 */
const DIAGRAM = { s: 0.86, a: 1.00, t: 0.94, g: 0.985, b: 0.94, y: 0.60 };
const NOTES   = { s: 1.16, a: 0.72, t: 0.80, g: 0.995, b: 0.96, y: 1.00 };
const GRAB    = { s: 0.78, a: 1.62, t: 0.62, g: 0.945, b: 1.10, y: 1.25 };
const EXPORT  = { s: 0.92, a: 1.34, t: 0.44, g: 0.985, b: 1.0, y: 1.15 };
/** Round-robin, so every square holds a mix and no square is "the puzzle square".
 *  Diagrams twice because puzzle sheets are what a coach actually accumulates most. */
const KINDS = [DIAGRAM, NOTES, GRAB, DIAGRAM, EXPORT, NOTES, DIAGRAM, GRAB];

const Y_BASE = 0.11;       // above the spine groove (0.05) and its ticks (0.055)
/* Stack pitch, and the number that keeps this act out of act 2's territory. At
   0.05, seven slips on a square were 0.35 units tall — under two pixels at the plan
   key — and the result was a scattered CARPET, which is exactly what act 2's paper
   already is. At 0.19 the same eight are a 1.5-unit slab, well over a third of a
   tile, and the workload is a HEIGHT rather than an area you have to count. Scale
   and yaw were tightened with it: sheets the size of a whole tile at ±1.2rad read
   as a fan, not a pile. */
const Y_STEP = 0.19;
const BORN_Y = -7.5;       // the slips rise from under the table
const ARROW_Y = 0.075;
/** Unranked. Ivory, slightly cool, so thirty of them are annotation and not light. */
const CANDIDATE = new THREE.Color(0.78, 0.76, 0.72);
/** The resolved piles are all the SAME height, and squarely stacked. The eight
 *  segments do not carry equal minutes — the DOM strip prints the real ones
 *  (8/5/7/6/-/-/16/-) — so making the piles proportional here would be a second,
 *  wronger copy of a number the product already states. One standard is the point. */
const PILE_STEP = 0.055;
/** The one scale, yaw and warmth every slip ends at. Filed material is one paper. */
const UNIFORM = 0.80;
const CAST_G = 0.972;
const CAST_B = 0.902;

function flatArrowHead() {
  const g = new THREE.BufferGeometry();
  // unit head pointing +x, lying in the xz plane, origin at its base
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    0, 0, -0.5, 0, 0, 0.5, 1, 0, 0,
  ]), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([
    0, 1, 0, 0, 1, 0, 0, 1, 0,
  ]), 3));
  g.setIndex([0, 1, 2]);
  return g;
}

function additive() {
  return new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
  });
}

export class Load {
  constructor(world, scale = 1) {
    this.world = world;
    const nBack = Math.max(24, Math.round(N_BACK * scale));
    const nFront = Math.max(6, Math.round(N_FRONT * scale));
    this.total = nBack + nFront;

    // ---------------------------------------------------------------- the slips
    // 1 x 1.32 rather than debris.js's 1 x 1.4142: this is not A4, it is
    // everything that is not A4 — a card, a printout, a page torn out of a book.
    const geo = new THREE.BoxGeometry(1, 0.028, 1.32);
    const mat = () => new THREE.MeshStandardMaterial({
      color: 0xd6cfc1, roughness: 0.9, metalness: 0, envMapIntensity: 0.62,
    });
    this.back = new THREE.InstancedMesh(geo, mat(), nBack);
    this.front = new THREE.InstancedMesh(geo, mat(), nFront);
    for (const [m, layer, scene] of [
      [this.back, LAYER_BACK, world.scene], [this.front, LAYER_FRONT, world.front]]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(m.count * 3), 3);
      m.layers.set(layer);
      m.frustumCulled = false;
      m.castShadow = false;
      m.visible = false;
      m.renderOrder = 3;
      scene.add(m);
    }

    // --------------------------------------------------------------- the arrows
    const shaftGeo = new THREE.PlaneGeometry(1, 1);
    shaftGeo.rotateX(-Math.PI / 2);
    shaftGeo.translate(0.5, 0, 0);          // origin at the tail, spans x 0..1
    this.shaft = new THREE.InstancedMesh(shaftGeo, additive(), RAYS.length);
    this.head = new THREE.InstancedMesh(flatArrowHead(), additive(), RAYS.length);
    for (const m of [this.shaft, this.head]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(RAYS.length * 3), 3);
      m.layers.set(LAYER_BACK);
      m.frustumCulled = false;
      m.visible = false;
      m.renderOrder = 2;
      world.scene.add(m);
    }

    // ------------------------------------------------------- authored per-slip
    const rand = rng(20260905);
    this.slips = [];
    for (let i = 0; i < this.total; i++) {
      const sq = i % SQUARES.length;
      const k = Math.floor(i / SQUARES.length);
      const K = KINDS[i % KINDS.length];
      this.slips.push({
        sq, k, kind: K,
        seg: i % 8,                             // which of the eight it files into
        pk: Math.floor(i / 8),                  // its depth in that pile
        jx: (rand() - 0.5) * 0.9, jz: (rand() - 0.5) * 0.9,
        yaw0: (rand() - 0.5) * 1.05 * K.y, tilt: (rand() - 0.5) * 0.2,
        sc: (0.62 + rand() * 0.34) * K.s, ax2: K.a * (0.92 + rand() * 0.16),
        tone: K.t * (0.86 + rand() * 0.28),
        dark: K === EXPORT,
        cg: K.g * (0.98 + rand() * 0.04), cb: K.b * (0.97 + rand() * 0.06),
        phase: rand() * Math.PI * 2, rate: 0.5 + rand() * 1.4,
        // where it goes when it stops being on the board at all: a shell around
        // the camera path, wide in x, tall in y, deep in z.
        air: new THREE.Vector3(
          -20 + rand() * 34, 1.2 + rand() * 15, -30 + rand() * 46),
        aYaw: (rand() - 0.5) * 6.2, aTilt: (rand() - 0.5) * 2.2,
        stagger: rand(),
      });
    }
    // Front-plate slips are the ones that cross the words, so they are pulled in
    // toward the lens and up: at the shell's own depth they were specks. Their z
    // band is 0 to 7, which is 4 to 14 units in front of the camera everywhere it
    // stands during this act (keys at z 20, 13 and 11.2) - straddling the lens put
    // one sheet three units away and it read as a wall, not as paper. The scale is
    // capped for the same reason.
    for (let i = nBack; i < this.total; i++) {
      const p = this.slips[i];
      const k = i - nBack;
      p.air.set(-14 + (k / Math.max(1, nFront - 1)) * 23, 1.8 + ((k * 7) % 11) * 1.05,
        ((k * 5) % 8) * 0.9);
      p.sc = 0.82 + ((k * 3) % 6) * 0.08;
    }
    this.nBack = nBack;

    this.segs = 8;
    this.presence = 0;
    this.pile = 0;
    this.spread = 0;
    this.airborne = 0;
    this.unrest = 0;
    this.resolve = 0;
    this.arrows = 0;
    this.arrowsResolve = 0;
    this.hue = new THREE.Color(0x3fa57a);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3(1, 1, 1);
    this._c = new THREE.Color();
    this._stack = new THREE.Vector3();
    this._row = new THREE.Vector3();
    this._wasOn = false;
  }

  /**
   * How many piles the material files into. ui/sunday.js counts the session's
   * real segments and hands the number over, so the room and the strip can never
   * disagree about how many there are — with S115 it is eight, which is why this
   * act can put one on each file of one rank.
   */
  setSegments(n) {
    const k = Math.max(1, Math.min(8, n | 0));
    if (k === this.segs) return;
    this.segs = k;
    for (let i = 0; i < this.total; i++) {
      this.slips[i].seg = i % k;
      this.slips[i].pk = Math.floor(i / k);
    }
  }

  /** The resolved piles: one per segment, a to h on rank 4, in segment order,
   *  centred on the file the rest of the film travels when there are fewer than
   *  eight of them. */
  segX(seg) { return fileX(seg + (8 - this.segs) / 2); }

  update(dt, t) {
    const on = this.presence > 0.002;
    if (!on) {
      if (this._wasOn) {
        this.back.visible = false; this.front.visible = false;
        this.shaft.visible = false; this.head.visible = false;
        this._wasOn = false;
      }
      return;
    }
    this._wasOn = true;
    this.back.visible = true;
    this.front.visible = true;

    // One square, then twenty-four. The dial is area, not a count: the reader
    // never sees a number for how much work this is, they see how much board
    // it covers.
    const openSq = 1 + this.spread * (SQUARES.length - 1);
    const rz4 = rankZ(HOUR_RANK);

    for (let i = 0; i < this.total; i++) {
      const p = this.slips[i];
      const mesh = i < this.nBack ? this.back : this.front;
      const slot = i < this.nBack ? i : i - this.nBack;

      const sqOn = clamp(openSq - p.sq);
      const grow = smooth(clamp(this.pile * 1.4 - p.stagger * 0.4));
      // Airborne and filed both run staggered, and deliberately in opposite
      // orders: material scatters near-first (it comes off the top of the pile)
      // and files far-first, so the resolution reads as a sweep toward the reader
      // instead of everything arriving on one frame.
      const aw = smooth(clamp(this.airborne * 1.45 - p.stagger * 0.45));
      const rw = smooth(clamp(this.resolve * 1.55 - (1 - p.stagger) * 0.5));
      const alive = sqOn * grow;
      // Once filed, a slip belongs to the hour and not to the square it came
      // from, so it survives its own square being switched off.
      const vis = Math.max(alive, rw) * this.presence;
      if (vis < 0.004) {
        this._s.set(0, 0, 0);
        this._m.compose(this._v.set(0, BORN_Y, 0), this._q.identity(), this._s);
        mesh.setMatrixAt(slot, this._m);
        continue;
      }

      const sq = SQUARES[p.sq];
      const stackY = lerp(BORN_Y, Y_BASE + p.k * Y_STEP, smooth(alive));
      this._stack.set(fileX(sq[0]) + p.jx * 0.42, stackY, rankZ(sq[1]) + p.jz * 0.42);
      this._row.set(
        this.segX(p.seg) + p.jx * 0.22, Y_BASE + p.pk * PILE_STEP, rz4 + p.jz * 0.22);

      this._v.copy(this._stack).lerp(p.air, aw).lerp(this._row, rw);

      // Desync, not noise. Every slip drifts on its own phase and its own rate,
      // so at full unrest nothing in the frame is agreeing with anything — which
      // is what "too much to hold" looks like without a single new object.
      const u = this.unrest * (1 - rw);
      if (u > 0.002) {
        const w = t * p.rate;
        this._v.x += Math.sin(w + p.phase) * u * 0.85;
        this._v.y += Math.sin(w * 1.31 + p.phase * 1.7) * u * 0.5;
        this._v.z += Math.cos(w * 0.87 + p.phase) * u * 0.85;
      }

      const yaw = lerp(lerp(p.yaw0, p.aYaw, aw), 0, rw);
      const tilt = lerp(lerp(p.tilt, p.aTilt, aw), 0, rw) + u * Math.sin(t * p.rate + p.phase) * 0.16;
      this._e.set(tilt * 0.7, yaw, tilt);
      this._q.setFromEuler(this._e);

      const scl = lerp(lerp(p.sc, p.sc * 1.22, aw), UNIFORM, rw) * TILE * 0.42 * smooth(vis);
      const ax = lerp(p.ax2, 1, rw);
      this._s.set(scl * ax, 1, scl / Math.max(0.35, ax));
      this._m.compose(this._v, this._q, this._s);
      mesh.setMatrixAt(slot, this._m);

      // Every kind of material becomes one paper. Warmth, tone and the dark
      // exports all collapse to the same three numbers as `resolve` completes.
      const tone = lerp(p.tone, 0.9, rw);
      this._c.setRGB(tone, tone * lerp(p.cg, CAST_G, rw), tone * lerp(p.cb, CAST_B, rw));
      mesh.instanceColor.setXYZ(slot, this._c.r, this._c.g, this._c.b);
    }
    this.back.instanceMatrix.needsUpdate = true;
    this.back.instanceColor.needsUpdate = true;
    this.front.instanceMatrix.needsUpdate = true;
    this.front.instanceColor.needsUpdate = true;

    this._arrows(t);
  }

  /**
   * Thirty candidate moves, then one.
   *
   * RAYS[0] is d5 — one step up the file the curriculum runs on — and it is the
   * arrow that survives. So the beat is not "the mess tidied up", it is "the
   * position had an answer all along and nothing on the board was ranking it".
   * The survivor thickens and brightens as the other twenty-nine go out, and it
   * is left pointing at the next session for act 2's light to start on.
   */
  _arrows(t) {
    const shown = this.arrows * RAYS.length;
    if (shown < 0.02 && this.arrowsResolve < 0.02) {
      this.shaft.visible = false; this.head.visible = false;
      return;
    }
    this.shaft.visible = true;
    this.head.visible = true;
    const ox = fileX(SEED.f), oz = rankZ(SEED.r);
    const res = this.arrowsResolve;

    for (let i = 0; i < RAYS.length; i++) {
      const [f, r] = RAYS[i];
      const survivor = i === 0;
      // Candidates come up in order and go out together; the survivor is the one
      // arrow whose life is the inverse of the crowd's.
      let a = clamp(shown - i);
      if (survivor) a = Math.max(a, res);
      else a *= 1 - smooth(clamp(res * 1.25 - 0.05));
      if (a < 0.004) {
        this._s.set(0, 0, 0);
        this._m.compose(this._v.set(0, -40, 0), this._q.identity(), this._s);
        this.shaft.setMatrixAt(i, this._m);
        this.head.setMatrixAt(i, this._m);
        continue;
      }

      const dx = fileX(f) - ox, dz = rankZ(r) - oz;
      const len = Math.hypot(dx, dz);
      const ang = Math.atan2(dz, dx);
      // A candidate is a hairline; the answer is a rule. 0.19 to 0.52 units is
      // the difference between "one of thirty" and "the one".
      const w = survivor ? lerp(0.19, 0.52, smooth(res)) : 0.19;
      const headL = Math.min(1.5, len * 0.26) * (survivor ? lerp(1, 1.5, res) : 1);
      // Candidates never reach their square: they stop a little short and at
      // different distances, so thirty of them read as a thicket rather than as
      // a diagram anyone could follow.
      const reach = survivor ? 1 : 0.72 + ((i * 37) % 19) / 68;
      const L = len * reach;
      const grow = easeOut(clamp(a));

      this._e.set(0, -ang, 0);
      this._q.setFromEuler(this._e);
      this._v.set(ox, ARROW_Y, oz);
      this._s.set(Math.max(0.01, (L - headL) * grow), 1, w);
      this._m.compose(this._v, this._q, this._s);
      this.shaft.setMatrixAt(i, this._m);

      const hx = ox + Math.cos(ang) * (L - headL) * grow;
      const hz = oz + Math.sin(ang) * (L - headL) * grow;
      this._v.set(hx, ARROW_Y, hz);
      this._s.set(headL * grow, 1, w * 3.4);
      this._m.compose(this._v, this._q, this._s);
      this.head.setMatrixAt(i, this._m);

      // Unresolved candidates flicker very slightly out of step with each other.
      // Not a strobe: 0.86-1.0 of their own brightness, on thirty phases.
      const jitter = 1 - this.unrest * 0.14 * (0.5 + 0.5 * Math.sin(t * (1.4 + i * 0.11) + i));
      const lit = survivor ? lerp(0.62, 1.8, smooth(res)) : 0.4 * jitter;
      // A candidate is a pencil mark: ivory, unranked, worth nothing on its own.
      // The hue on this page means "the system said so", so the one arrow that
      // survives is the only one that gets to be it — thirty grey options
      // becoming one green answer, in the page's own colour language.
      if (survivor) this._c.copy(CANDIDATE).lerp(this.hue, smooth(res));
      else this._c.copy(CANDIDATE);
      this._c.multiplyScalar(a * lit * this.presence);
      this.shaft.instanceColor.setXYZ(i, this._c.r, this._c.g, this._c.b);
      this._c.multiplyScalar(1.5);
      this.head.instanceColor.setXYZ(i, this._c.r, this._c.g, this._c.b);
    }
    this.shaft.instanceMatrix.needsUpdate = true;
    this.shaft.instanceColor.needsUpdate = true;
    this.head.instanceMatrix.needsUpdate = true;
    this.head.instanceColor.needsUpdate = true;
  }
}
