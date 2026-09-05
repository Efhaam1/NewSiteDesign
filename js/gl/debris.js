import * as THREE from 'three';
import { LAYER_BACK } from './world.js';
import { clamp, lerp, smooth, easeOut, rng } from '../util.js';
import { TILE, fileX, rankZ, SPINE_FILE } from './board.js';

/**
 * The mess an academy actually runs on: printed sheets, screenshots, PDFs,
 * scribbled plans, a puzzle someone found on a phone. It drifts unaligned in
 * the dark, and then it does the act's whole argument three times over, in space:
 *
 *   settle   the pile sorts into THREE heaps on three files — three coaches,
 *            three improvised hours, four piles each, nothing shared. Each heap
 *            is a different KIND of material (a box of index cards, a sheaf of
 *            written A4, a mix of whatever was to hand) because three heaps of
 *            identical slips is decoration and three kinds is the problem.
 *   converge the curriculum drags all three onto the d-file, where every one of
 *            them lands as the SAME slip — one scale, one footprint, one yaw,
 *            one tone — in ONE ruled column whose five blocks are S012's real
 *            minute budget. Three kinds of material becoming one written session.
 *   thread   the five blocks close their gaps into one continuous rail, the rail
 *            lies down into the groove and thins, and act 2's light starts up the
 *            same line. The paper hands the file over instead of dissolving.
 *
 * Nothing is added to the room to do it. The same 88 sheets stop being a carpet
 * on 56 squares and become a spine on one file — the exact line act 2 lights.
 * Everything the eye reads as standardisation is a per-item random being lerped
 * to a constant: scale, aspect, yaw, tilt, warmth and tone all collapse to one
 * value, and no attribute, mesh, material or draw call is added to say it.
 */

/** Landscape lanes: files a / d / g. Symmetric about fileX(3) = -2, which every
 *  camera key from n=1 holds, and ±12 units apart — the widest separation the
 *  plan key's ±31-unit frame can hold with both outer heaps fully on the board. */
const LANES_W = [1, 4, 7];
/** Portrait: files b / d / f. c/d/e were tried first and rejected — 4 units of
 *  pitch is one tile, and three heaps one tile apart land on top of each other on
 *  a phone. 8 units of pitch costs a little of the outer paper at the frame edge,
 *  which NARROW below pays back by bringing every kind in one notch. */
const LANES_N = [1, SPINE_FILE, 5];
/** Four piles per heap, at four ranks. Adjacency in space is repetition in the
 *  words printed beside it: Coach A's two Explains are ranks 1 and 2, Coach B's
 *  three Puzzles are ranks 1, 2 and 3. */
const CLUSTER = [[2, 3, 4, 5], [1, 2, 3, 4], [3, 4, 5, 6]];

/**
 * Three KINDS of material, one heap each — the reason the paper is an argument
 * and not a mood. Every field here biases a random the pile already drew, so
 * there is no new attribute, no second geometry and no branch in the hot loop:
 *
 *   s0,s1  scale band. World width is scale * TILE * 0.42 * ax = scale * 1.68 * ax
 *          and world depth is scale * 1.711 * az, so these are sizes in units of
 *          a 4-unit square, not taste. The keys through this act rake the board at
 *          about 45deg, which foreshortens depth by ~0.7 on screen: what survives
 *          that is the size difference and an extreme aspect, which is why the
 *          three bands barely overlap and the third kind is a 2.1:1 landscape.
 *   ax,az  footprint aspect against the slip's own 1 : 1.02
 *   t0,t1  albedo band          cg,cb  green and blue against red
 *   jx,jz  how loose the pile is  yaw  how square it is kept  ky  stack pitch
 *
 * CARD  index cards, 1.1-1.6 units square, cream stock, in a shallow spilled
 *       cluster — tighter than that and eight cards hid under one, and the heap
 *       read as four squares instead of a coach's box of them.
 * SHEET written A4, 2.0x2.8 to 2.5x3.6 units, portrait 1:1.41, fanned and yawed.
 * SHOT  a screenshot printed off a phone, 1.9x0.9 to 2.6x1.2 units, landscape
 *       2.1:1, grey-blue, and the only kind that is ever a dark PDF export.
 */
const CARD = { s0: 0.66, s1: 0.26, ax: 1.00, az: 0.98, t0: 0.95, t1: 0.30, cg: 0.940, cb: 0.72, jx: 0.85, jz: 0.72, yaw: 0.24, ky: 0.07 };
const SHEET = { s0: 1.36, s1: 0.38, ax: 0.86, az: 1.19, t0: 0.72, t1: 0.34, cg: 0.995, cb: 0.985, jx: 1.10, jz: 1.05, yaw: 0.82, ky: 0.105 };
const SHOT = { s0: 0.82, s1: 0.32, ax: 1.34, az: 0.62, t0: 0.52, t1: 0.46, cg: 0.930, cb: 1.115, jx: 1.00, jz: 0.86, yaw: 1.10, ky: 0.135 };
/** Coach A works off written sheets, coach B off a box of cards, coach C off
 *  whatever was to hand — two thirds of it printed screen-grabs. The mixed heap
 *  is the one with no format at all, which is what "improvised" looks like from
 *  above, and it stays on the g-file where the room's light actually reaches it:
 *  a dark export in the dark is not a communication.
 *
 *  Which kind goes on which file is a composition decision and it was measured on
 *  the film, not guessed: the biggest kind cannot be the middle one. Coach B's
 *  four piles are ranks 1, 2, 3 and 5 — three of them adjacent — so at sheet size
 *  the middle heap merged into one snowdrift across the centre of the frame and
 *  buried the pawn that stands on the d-file. Cards there keep the centre low and
 *  dense, and the sheaf reads better on A's 1, 2, 4, 7. */
const LANE_KIND = [[SHEET], [CARD], [SHOT, CARD, SHOT, SHEET, SHOT]];

/** app/data/variance.json → session.segments[].minutes for S012. Passed in by
 *  main.js when it has the bundle; this is the mirror, not a second source. */
const SEG_MINUTES = [6, 7, 6, 5, 18];

const RANK_FIRST = 1.55;   // clear of the pawn that stands on the file in act 1
const RANK_LAST = 7.6;     // and stops short of rank 8, which is promotion's
const BAND_GAP = 2.45;     // centre-to-centre; a slip is 1.53 deep, so ~0.9 clear
const UNIFORM = 0.86;      // the one scale every sheet ends at (the kinds run
                           // 0.66 to 1.74, so the standard is also the smallest)
const Y_BASE = 0.12;       // above the spine groove (0.05) and its ticks (0.055)
const Y_STEP = 0.008;      // a fanned deck: the 18-minute band is visibly thicker
/** The one warmth every sheet ends at, against red. Card stock is cream and a
 *  screen-grab is blue; the standard is one paper. */
const CAST_G = 0.975;
const CAST_B = 0.9;
/** A dark export is a grey screen-grab, not a hole in the board: at 0.3 — the
 *  value it had when every dark item in the pile was scattered evenly — the
 *  mixed heap read as missing paper once they were all concentrated in it. */
const DARK = 0.5;
/** Portrait widens to camera.js's 64deg cap and then shifts the image -15% in x,
 *  which leaves about +7 units of world before the right edge — and the f-file
 *  heap is centred at +6. So on a phone every kind arrives one notch smaller
 *  rather than one notch clipped. It multiplies the heap scale only: the standard
 *  every slip converges to is the same slip at every breakpoint. */
const NARROW = 0.84;
/** The threaded rail is narrower than the blocks it closes out of — a rule, not
 *  a slab, and it lets the file's own light show either side of it. */
const RAIL_W = 0.62;
/** Where the rail lies: clear of the groove (0.05) and its ticks (0.055), and
 *  rising 0.0005 a slip so that overlapping paper never fights for the same
 *  pixel. The far slip is always the higher one, which reads as one ramp. */
const LINE_Y = 0.08;
const LINE_STEP = 0.00055;

/**
 * Largest-remainder apportionment of `total` slips across the segment minutes,
 * so the five bands are the real budget and the counts always sum. floor() alone
 * loses three slips at either tier. Measured output, not a hand-balanced set:
 * 6/7/6/5/18 minutes over 88 slips gives 13/15/12/10/38, and over 34 gives
 * 5/6/5/4/14.
 */
function apportion(total, minutes) {
  const sum = minutes.reduce((a, b) => a + b, 0);
  const exact = minutes.map((m) => (total * m) / sum);
  const out = exact.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => [v - Math.floor(v), i])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length][1]]++;
  return out;
}

export class Debris {
  constructor(world, count = 88, variance = null) {
    this.world = world;
    this.n = count;
    const geo = new THREE.BoxGeometry(1, 0.035, 1.4142);
    this.mesh = new THREE.InstancedMesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: 0xd9d2c4, roughness: 0.88, metalness: 0.0, envMapIntensity: 0.7,
      }),
      count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    this.mesh.layers.set(LAYER_BACK);
    this.mesh.frustumCulled = false;
    world.scene.add(this.mesh);

    // ------------------------------------------------- the converged column
    const minutes = variance?.session?.segments?.map((s) => s.minutes) || SEG_MINUTES;
    const per = apportion(count, minutes);
    const span = rankZ(RANK_FIRST) - rankZ(RANK_LAST);
    const paper = span - BAND_GAP * (per.length - 1);
    const sumMin = minutes.reduce((a, b) => a + b, 0);
    /** band[b] = { z0, len, cnt } — length AND slip count both proportional to
     *  minutes, so the five blocks are the hour's proportions at any tier. */
    const bands = [];
    let z = rankZ(RANK_FIRST);
    for (let b = 0; b < per.length; b++) {
      const len = (paper * minutes[b]) / sumMin;
      bands.push({ z0: z, len, cnt: per[b] });
      z -= len + BAND_GAP;
    }
    this.bands = bands;

    const rand = rng(4242);
    // A second stream for the one field the original had no draw for, so the
    // drifting pile stays bit-identical to what it was before this second stage.
    const rand2 = rng(90210);
    // A third, for which kind of material an item in the mixed heap is. Its own
    // stream so that both of the above keep their sequences exactly.
    const rand3 = rng(1337);
    this.items = [];
    let b = 0, j = 0;
    for (let i = 0; i < count; i++) {
      // Drawn in the original order and the original count, so every position,
      // rotation, drift and phase in the chaos cloud is bit-identical. What
      // changed is what two of them MEAN: `rs` and `rt` are now read inside the
      // item's own kind band, which is where three heaps stop being three
      // positions of one slip.
      const rs = rand();
      const cx = (rand() - 0.5) * 46;
      const cy = 9 + rand() * 26;
      const cz = rankZ(2) - rand() * 30;
      const crx = (rand() - 0.5) * 3.4;
      const cry = (rand() - 0.5) * 6.3;
      const crz = (rand() - 0.5) * 3.4;
      const drift = 0.25 + rand() * 0.8;
      const phase = rand() * 6.28;
      const jf = rand() - 0.5;
      const jr = rand() - 0.5;
      const jy = rand() - 0.5;
      const stagger = rand();
      const rt = rand();
      const rd = rand();
      // heap: which coach, which of that coach's four piles, how deep in it
      const h = i % 3;
      const c = Math.floor(i / 3) % CLUSTER[h].length;
      const k = Math.floor(i / (3 * CLUSTER[h].length));
      // and what that coach's material IS
      const kinds = LANE_KIND[h];
      const K = kinds[Math.min(kinds.length - 1, Math.floor(rand3() * kinds.length))];
      const scale = K.s0 + rs * K.s1;
      const tone = K.t0 + rt * K.t1;
      // Somebody's dark PDF export off a phone. It lives in the mixed heap only:
      // the pile with no format is the pile with the screenshots in it, and a
      // fifth of the whole pile scattered evenly said nothing about anybody.
      const dark = h === 2 && rd < 0.42;
      // column: which band of the hour, and where in it
      if (j >= bands[b].cnt && b < bands.length - 1) { b++; j = 0; }
      const bd = bands[b];
      // line: where this slip sits once the five blocks close their gaps. i is
      // monotonic in the column's z, so the closure is a pure evening-out of the
      // spacing — nothing crosses anything, and the rail keeps the column's exact
      // extent (rank 1.55 to 7.6). It is continuous at either tier: 88 slips
      // 0.28 apart or 34 slips 0.73 apart, against a slip 1.53 deep.
      const lu = count > 1 ? i / (count - 1) : 0;
      this.items.push({
        cx, cy, cz, crx, cry, crz, drift, phase, stagger, scale, tone, dark,
        // the kind: footprint aspect and warmth, both lerped away by converge
        ax: K.ax, az: K.az, cg: K.cg, cb: K.cb,
        // heaped state: one coach's four untidy piles, on one file of their own,
        // as loose, as yawed and as stacked as that kind of material is
        sxW: fileX(LANES_W[h]) + jf * 1.6 * K.jx,
        sxN: fileX(LANES_N[h]) + jf * 1.1 * K.jx,
        sy: 0.06 + k * K.ky,
        sz: rankZ(CLUSTER[h][c]) + jr * 1.9 * K.jz,
        sry: jy * 0.5 * K.yaw,
        srx: (rand2() - 0.5) * 0.12,
        // converged state: one file, one ruled position inside one of five bands
        ux: fileX(SPINE_FILE),
        uy: Y_BASE + j * Y_STEP,
        uz: bd.z0 - bd.len * (bd.cnt > 1 ? j / (bd.cnt - 1) : 0.5),
        // threaded state: one continuous line, lying in the groove
        lu,
        ly: LINE_Y + i * LINE_STEP,
        lz: lerp(rankZ(RANK_FIRST), rankZ(RANK_LAST), lu),
      });
      j++;
    }
    this._m = new THREE.Matrix4();
    this._v = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._s = new THREE.Vector3();
    this._c = new THREE.Color();
    this.settle = 0;   // 0 chaos, 1 sorted into three heaps of three kinds
    this.converge = 0; // 0 three heaps, 1 one ruled column on the d-file
    this.thread = 0;   // 0 five blocks, 1 one continuous rail in the groove
    this.presence = 0; // fade in/out of the whole cloud
    this.spread = 1;   // 1 landscape lanes, 0 the narrower portrait ones
    this._fit();
    addEventListener('resize', () => this._fit(), { passive: true });
  }

  /** Same 0.95 threshold camera.js uses to decide it is framing a portrait. */
  _fit() {
    this.spread = innerWidth / innerHeight >= 0.95 ? 1 : 0;
  }

  update(dt, time) {
    this.mesh.visible = this.presence > 0.002;
    if (!this.mesh.visible) return;
    const spread = this.spread;
    const km = spread ? 1 : NARROW;
    const pres = this.presence;
    const th = this.thread;
    // Hoisted: for all but the 0.22 of n that the handover runs, this loop costs
    // exactly what it cost before the third stage existed.
    const threading = th > 0.001;
    for (let i = 0; i < this.n; i++) {
      const p = this.items[i];
      // three staggered stages. A sorts the pile into the heaps, B drags the heaps
      // onto one file, C closes the five blocks into the line act 2 lights; the
      // per-scrap offset is what makes each read as a sort rather than a switch.
      const A = smooth(clamp((this.settle - p.stagger * 0.42) / 0.58));
      const B = smooth(clamp((this.converge - p.stagger * 0.26) / 0.74));
      // C is staggered by rank rather than by the per-item random: the closure
      // zips up the file from rank 1, which is the direction the fill then runs.
      const C = threading ? smooth(clamp((th - p.lu * 0.34) / 0.66)) : 0;
      const dropA = easeOut(A);
      const wob = (1 - A) * p.drift;
      let cx = p.cx, cy = p.cy, cz = p.cz;
      // Three trig calls on 88 sheets ran every frame for the rest of the film
      // even though wob is zero the moment a sheet lands.
      if (wob > 0.001) {
        cx += Math.sin(time * 0.42 + p.phase) * wob * 1.6;
        cy += Math.cos(time * 0.31 + p.phase * 1.7) * wob * 1.1;
        cz += Math.sin(time * 0.27 + p.phase * 0.6) * wob * 1.4;
      }
      const hx = p.sxN + (p.sxW - p.sxN) * spread;
      // the ruled column's own targets, closed into one continuous line by C
      const uy = C > 0 ? lerp(p.uy, p.ly, C) : p.uy;
      const uz = C > 0 ? lerp(p.uz, p.lz, C) : p.uz;
      this._v.set(
        lerp(lerp(cx, hx, dropA), p.ux, B),
        lerp(lerp(cy, p.sy, dropA), uy, B),
        lerp(lerp(cz, p.sz, dropA), uz, B),
      );
      // yaw and tilt collapse to zero: heaps are not square, a standard is
      this._e.set(
        lerp(lerp(p.crx + time * 0.12 * wob, p.srx, dropA), 0, B),
        lerp(lerp(p.cry + time * 0.17 * wob, p.sry, dropA), 0, B),
        lerp(p.crz - time * 0.09 * wob, 0, dropA),
      );
      this._q.setFromEuler(this._e);
      // and so do the size and the shape: three kinds of material, one format
      const scB = Math.min(1, B * 2.4);
      const sc = lerp(p.scale * km, UNIFORM, scB) * TILE * 0.42 * lerp(1, 1.04, dropA);
      // The handover is a thinning, not a dissolve. Width narrows to a rule and
      // then goes with presence; length does NOT, so the last frames of act 1 are
      // one hairline down the d-file rather than eighty-eight shrinking dots.
      const wx = sc * lerp(p.ax, 1, B) * (C > 0 ? lerp(1, RAIL_W, C) : 1) * pres;
      const wz = sc * 0.72 * lerp(p.az, 1, B) * (C > 0 ? lerp(pres, 1, C) : pres);
      this._s.set(wx, 1, wz);
      this._m.compose(this._v, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
      // a dark PDF export somebody found on a phone is what the mixed heap is
      // made of, and which the standard turns into paper: cream card, white A4
      // and grey-blue screen-grab all land on one warmth.
      let t = lerp(p.tone * (p.dark ? DARK : 1), 1.06, B) * lerp(0.5, 1, dropA);
      let cg = lerp(p.cg, CAST_G, B);
      let cb = lerp(p.cb, CAST_B, B);
      if (C > 0) {
        // The last state of the paper is the colour the groove opens on. Acts 1
        // to 3 always sit in stage one's green (director's idx is 0 for all
        // n < 4 — it was n < 3 before act 1 `sunday` was inserted, and the gate
        // anchor at director.js's `gate` moved with it), so the tip toward it is a
        // constant here rather than a hue plumbed through three objects for two
        // hundred frames.
        t *= 1 + 0.16 * C;
        cg = lerp(cg, 1.06, C);
        cb = lerp(cb, 1.0, C);
      }
      this._c.setRGB(t, t * cg, t * cb);
      this.mesh.instanceColor.setXYZ(i, this._c.r, this._c.g, this._c.b);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
  }
}
