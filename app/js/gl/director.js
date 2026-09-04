import * as THREE from 'three';
import { CameraRig, V } from './camera.js';
import { LAYER_BACK, LAYER_FRONT } from './world.js';
import { clamp, lerp, band, window_, smooth } from '../util.js';
import { TILE, fileX, rankZ, SPINE_FILE } from './board.js';
import { ORDER } from './pieces.js';

/**
 * The dark-room and paper ends of every colour that crosses the tonal cut. Mixing
 * these in JS once per lift step replaces a color-mix() that every element on the
 * page had to recompute — 12ms of style recalc a frame in a trace.
 */
const RAMPS = [
  ['--fg', [244, 239, 228, 1], [20, 20, 28, 1]],
  ['--fg-dim', [184, 174, 157, 1], [78, 76, 88, 1]],
  ['--fg-faint', [123, 115, 135, 1], [134, 130, 143, 1]],
  ['--fg-inv', [18, 18, 26, 1], [242, 236, 224, 1]],
  ['--line', [244, 239, 228, 0.11], [20, 20, 28, 0.16]],
  ['--line-2', [244, 239, 228, 0.24], [20, 20, 28, 0.32]],
  ['--glass', [7, 7, 10, 0.88], [253, 251, 246, 0.965]],
];

function mixCss(a, b, t) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  const al = a[3] + (b[3] - a[3]) * t;
  return al >= 0.999 ? `rgb(${r} ${g} ${bl})` : `rgb(${r} ${g} ${bl} / ${al.toFixed(3)})`;
}

export const ACTS = ['threshold', 'chaos', 'spine', 'stages', 'session', 'system', 'terms', 'promotion'];

const HUES = [0x3fa57a, 0x4a8bd0, 0x9070ce, 0xd2604b, 0xc9a227];
const HUE_CSS = ['#3fa57a', '#4a8bd0', '#9070ce', '#d2604b', '#c9a227'];
const HUE_SOFT = [
  'rgb(63 165 122 / 0.15)', 'rgb(74 139 208 / 0.15)', 'rgb(144 112 206 / 0.15)',
  'rgb(210 96 75 / 0.15)', 'rgb(201 162 39 / 0.15)',
];

/** Where the story opens a square and turns it into the product. */
export const FOCUS = { f: SPINE_FILE, r: 8 };

const SHOTS = [
  // The pawn has to cross the headline, not land on it: at -2 the look was the
  // pawn's own file, so the piece sat dead centre and ate the last word of the
  // only headline on the page. Looking left of the file puts it just past the
  // final glyph at every width from 1280 up.
  { at: 0.00, pos: V(2.6, 11.4, 24), look: V(-4.3, 3.4, -4), fov: 33 },
  { at: 0.42, pos: V(-6, 13, 24), look: V(-2, 2.2, -1), fov: 35 },
  { at: 0.72, pos: V(-9.5, 6.2, 17), look: V(-2, 2.1, 1), fov: 36 },
  { at: 1.00, pos: V(-2, 21, 34), look: V(-2, 7, -10), fov: 44 },
  // Act 1 is a rise and then a fall. The climb to a plan-ish key is what makes
  // three heaps on three files read as three separate places; the descent from
  // 1.45 through 1.66 into the existing raking key at 1.80 is the room closing
  // in on the merge, so the finished column is lit edge-on rather than mapped.
  { at: 1.30, pos: V(-2, 33, 19), look: V(-2, 1.0, -13), fov: 46 },
  { at: 1.45, pos: V(-2, 31, 19), look: V(-2, 1.0, -13), fov: 45 },
  { at: 1.66, pos: V(-2, 22, 22), look: V(-2, 0.8, -13), fov: 42 },
  { at: 1.80, pos: V(-2, 16, 24), look: V(-2, 0.6, -12), fov: 40 },
  { at: 2.00, pos: V(-2, 17, 33), look: V(-2, 0.4, -7), fov: 34 },
  { at: 2.55, pos: V(-2.4, 13.5, 25), look: V(-2, 0.2, -15), fov: 32 },
  { at: 3.00, pos: V(4.6, 7.8, 13.0), look: V(-0.6, 1.6, -10), fov: 31 },
  { at: 3.25, pos: V(-5.6, 7.4, 7.5), look: V(-0.4, 1.6, -15), fov: 32 },
  { at: 3.50, pos: V(6.0, 8.4, 1.0), look: V(-0.6, 1.8, -20), fov: 31 },
  { at: 3.75, pos: V(-5.2, 7.8, -4.5), look: V(-0.4, 1.8, -25), fov: 32 },
  { at: 4.00, pos: V(4.0, 9.0, -10.0), look: V(-0.8, 2.0, -30), fov: 32 },
  { at: 4.30, pos: V(-2, 11.5, -15), look: V(-2, 0.8, -27.6), fov: 38 },
  { at: 4.70, pos: V(-2, 8.6, -18.4), look: V(-2, 1.8, -28.2), fov: 42 },
  { at: 5.00, pos: V(-2, 26, -10), look: V(-2, 0, -15), fov: 34 },
  { at: 5.55, pos: V(-2, 42, -6), look: V(-2, 0, -14), fov: 29 },
  { at: 6.00, pos: V(-2, 40, -1), look: V(-2, 0, -12), fov: 30 },
  { at: 6.55, pos: V(-2, 36, 4), look: V(-2, 0, -10), fov: 32 },
  { at: 7.00, pos: V(-5.8, 11.0, -13), look: V(-5.6, 3.0, -29), fov: 34 },
  { at: 7.45, pos: V(-4.9, 7.6, -17.5), look: V(-4.9, 4.4, -29), fov: 36 },
  { at: 7.88, pos: V(-6, 28, 8), look: V(-4, 0, -15), fov: 40 },
  { at: 8.00, pos: V(-3.4, 26, 19), look: V(-2.6, 1.2, -18), fov: 33 },
];

export class Director {
  constructor({ world, board, spine, pieces, debris }) {
    this.world = world;
    this.board = board;
    this.spine = spine;
    this.pieces = pieces;
    this.debris = debris;
    this.rig = new CameraRig(world.camBack, SHOTS);
    this.n = 0;
    this.time = 0;
    this.hue = new THREE.Color(HUES[0]);
    this.stageIndex = 0;
    this.root = document.documentElement;
    this._prevStage = -1;
    this.onStage = [];
    this.bgDark = new THREE.Color(0x06060a);
    this.bgLight = new THREE.Color(0xe9e2d4);
    this._bg = new THREE.Color();
    this._target = new THREE.Color();
    /** 0 to 1 over the opening seconds. The board assembles and the first piece
     *  condenses on load, not on the readers first scroll gesture. */
    this.boot = 0;
    this._css = { hue: -1, lift: -1 };
  }

  /** narrative position: act index + local progress, continuous across acts. */
  narrative(engine) {
    const y = engine.p * engine.height;
    let n = 0;
    for (let i = 0; i < engine.acts.length; i++) {
      const a = engine.acts[i];
      if (y >= a.top) n = i + clamp((y - a.top) / a.len);
    }
    return n;
  }

  setHueLamp(x, y, z, intensity) {
    this.world.hue.position.set(x, y, z);
    this.world.hue.intensity = intensity;
    this.world.fHue.position.set(x, y, z);
    this.world.fHue.intensity = intensity;
  }

  update(engine, dt) {
    this.time += dt;
    const n = this.narrative(engine);
    this.n = n;
    this.rig.update(n, dt, engine.reduced ? 1 : 0.12);

    this.boot = Math.min(1, this.boot + dt / 2.0);
    const b = smooth(this.boot);

    // act 0 - the board builds itself out of the dark before a word is legible
    this.board.assembly = Math.max(smooth(clamp((n - 0.04) / 0.5)), b);

    // act 1 - four beats, all authored in n (= 1 + t here), so the act's height
    // can change without moving a single frame of the shot:
    //   1.06-1.40  the mess sorts into three heaps of three KINDS of material
    //   1.44-1.62  the curriculum drags all three onto the one file the rest of
    //              the film travels up, where they land as the same slip
    //   1.62-1.76  held: one ruled column of five blocks, in a lit file
    //   1.76-1.98  the handover. The blocks close into one continuous rail, the
    //              rail thins, the file's light gathers to rank 1 and the groove
    //              starts up the same line at 1.94. presence holds to 2.06 so the
    //              paper is still there, one unit wide, when the light arrives:
    //              the paper hands the line over instead of dissolving into it.
    this.debris.presence = window_(n, 0.58, 0.92, 1.92, 2.06);
    this.debris.settle = band(n, 1.06, 1.40);
    this.debris.converge = band(n, 1.44, 1.62);
    const hand = band(n, 1.76, 1.98);
    this.debris.thread = hand;
    const one = window_(n, 1.50, 1.62, 1.90, 2.06);

    // act 2 and 3 - the file fills with light, rank 1 toward rank 9
    this.spine.visible = band(n, 1.94, 2.2) * (1 - band(n, 4.55, 4.95));
    let fill;
    if (n < 3) fill = lerp(0.03, 0.13, band(n, 2.02, 2.96));
    else fill = lerp(0.13, 0.97, band(n, 3.0, 3.9));
    if (n > 6.86) fill = lerp(0.97, 1, band(n, 6.86, 7.4));
    this.spine.fill = fill;

    // five stages hold the file at five fills. crossing a gate relights the
    // room and the piece standing on the file becomes the next piece up.
    const gate = clamp((n - 3.0) / 1.0) * 5;
    const idx = clamp(Math.floor(gate), 0, 4);
    const local = gate - idx;
    this.stageIndex = idx;
    if (idx !== this._prevStage) {
      this._prevStage = idx;
      for (const fn of this.onStage) fn(idx, n);
    }
    // Act 4 shows session S115, which lives in the Bishop stage — so the room
    // wears Bishop purple while that console is open. The light always agrees
    // with the data on screen: the console's own crumb reads "Stage 3 Bishop",
    // the plate wears the same hex, and HUES[2] is where stage_index.json puts it.
    // Was HUES[1], Knight blue, for as long as the act showed S042.
    const sessionAct = band(n, 4.1, 4.4) * (1 - band(n, 4.95, 5.2));
    this._target.setHex(sessionAct > 0.5 ? HUES[2] : HUES[idx]);
    this.hue.lerp(this._target, 1 - Math.pow(1 - 0.09, dt * 60));
    this.spine.hue = this.hue;
    this.board.hueColor.copy(this.hue);
    this.world.hue.color.copy(this.hue);
    this.world.fHue.color.copy(this.hue);

    const px = fileX(SPINE_FILE);
    const pz = this.spine.at(fill).z;
    for (const nm of ORDER) this.pieces.setReveal(nm, 0);

    if (n < 3.0) {
      // the pawn condenses out of the light and waits on the file
      const born = Math.max(band(n, 0.34, 0.68), smooth(clamp((this.boot - 0.34) / 0.66)));
      this.pieces.place('pawn', px, 0, pz, this.time * 0.05, lerp(1.34, 1, band(n, 0.12, 1.0)));
      this.pieces.setReveal('pawn', born, 1);
      this.pieces.setPlate('pawn', n < 0.92);
      this.setHueLamp(px, 3, pz, born * 7);
    } else if (n < 4.62) {
      // Graduation: entering a stage IS the promotion, so the piece changes on
      // the same beat as the panel. The piece stops at the rook: the queen is the
      // page's finale and rises in act 7, not here, so the fifth panel is read with
      // the rook still standing. That is a narrative choice, not a data one — every
      // Queen-stage session is written now (stages.json: 40 of 40, status ready).
      const held = Math.min(idx, 3);
      const cur = ORDER[held];
      const prev = ORDER[Math.max(0, held - 1)];
      const enter = held > 0 && held === idx ? smooth(clamp(local / 0.2)) : 1;
      this.pieces.place(cur, px, 0, pz, 0.35, 1);
      this.pieces.setReveal(cur, enter, 1);
      this.pieces.setPlate(cur, false);
      if (enter < 0.998 && prev !== cur) {
        this.pieces.place(prev, px, 0, pz, 0.35, 1);
        this.pieces.setReveal(prev, 1 - enter, -1);
        this.pieces.setPlate(prev, false);
      }
      const morph = 1 - Math.abs(enter * 2 - 1);
      this.setHueLamp(px, 3.4 + morph * 5, pz, lerp(9, 52, morph) * this.spine.visible);
    } else if (n >= 6.86) {
      // act 6 - rank eight. the pawn burns off and the queen condenses.
      // the rook was already standing here, so it does not re-arrive: it burns
      const burn = band(n, 7.18, 7.36);
      const rise = band(n, 7.28, 7.52);
      const z8 = rankZ(8);
      this.pieces.place('rook', px, 0, z8, 0.2, 1);
      this.pieces.setReveal('rook', 1 - burn, -1);
      this.pieces.setPlate('rook', false);
      this.pieces.place('queen', px, 0, z8, -0.25, lerp(1, 1.55, rise));
      this.pieces.setReveal('queen', rise, 1);
      this.pieces.setPlate('queen', n <= 7.7);
      this.setHueLamp(px, 3 + rise * 7, z8, lerp(8, 74, Math.max(burn, 1 - Math.abs(rise * 2 - 1))));
    } else {
      // Rank eight, and the rook is still the piece: the promotion to queen is
      // held for act 7. It stays standing through the console and the plan view,
      // so the product is shown from the top of the file it just climbed.
      const z8 = rankZ(8);
      this.pieces.place('rook', px, 0, z8, 0.2, 1);
      this.pieces.setReveal('rook', 1, 1);
      this.pieces.setPlate('rook', false);
      this.setHueLamp(px, 3, z8, 6);
    }

    // act 4 - one square lifts out of the board and becomes the product
    const open = window_(n, 4.14, 4.62, 5.06, 5.34);
    this.board.focus = open > 0.002 ? { f: FOCUS.f, r: FOCUS.r, amount: open } : null;

    // act 5 - the room lifts to paper. dark is what the coach teaches from,
    // light is what the parent and the photocopier get.
    const lift = band(n, 4.62, 5.06) * (1 - band(n, 6.86, 6.99));
    this.board.lightness = lift;
    this.world.scene.environment = lift > 0.5 ? this.world.envLight : this.world.envDark;
    this.world.front.environment = lift > 0.5 ? this.world.frontEnvLight : this.world.frontEnvDark;
    this.world.scene.environmentIntensity = lerp(0.95, 1.5, lift);
    this._bg.copy(this.bgDark).lerp(this.bgLight, lift);
    this.world.scene.background.copy(this._bg);
    this.world.fog.color.copy(this._bg);
    this.world.fog.density = lerp(0.019, 0.0072, lift);
    this.world.key.intensity = lerp(4.6, 5.6, lift);
    this.world.fill.intensity = lerp(1.15, 2.4, lift);

    // rank gates glow where the head of the fill is, and everything ignites at the end
    for (let r = -2; r <= 24; r++) this.board.setRankGlow(r, 0);
    if (this.spine.visible > 0.01) {
      const head = 1 + (fill * 32) / TILE;
      for (let r = 1; r <= 9; r++) {
        const d = Math.abs(r - head);
        this.board.setRankGlow(r, Math.exp(-d * d * 0.9) * 0.26 * this.spine.visible);
      }
    }
    // act 1's payoff and its handover: three unlit paths become one lit file, and
    // then that file gives the line back. This is the only lighting model in the
    // film that could fight the spine's head-of-fill gaussian, so it is written
    // to be incapable of it — the wash is scaled by (1 - spine.visible) and
    // gathered to rank 1 by `hand`, which means it is a wedge under the head by
    // the time the head exists and gone before the head moves. There is no
    // per-frame reset for fileGlow, so zero is written.
    const lit = one * (1 - this.spine.visible);
    this.board.setFileGlow(SPINE_FILE, lit > 0.004 ? lit * 0.3 : 0, hand);
    if (n > 7.3) {
      const all = band(n, 7.3, 7.78);
      for (let r = 1; r <= 8; r++) this.board.setRankGlow(r, all * 0.3);
    }

    // handoff to CSS: the page and the world share one light. These properties
    // feed the paper colour mixes, so writing one invalidates style for the whole
    // document — they are quantised and only written when they actually move.
    const hueIdx = sessionAct > 0.5 ? 2 : idx;
    const scrim = 1
      - 0.18 * window_(n, 1.06, 1.44, 1.84, 2.0)
      - 0.22 * window_(n, 2.9, 3.2, 3.9, 4.2)
      - 0.12 * window_(n, 7.55, 7.8, 7.95, 8.0);
    const c = this._css;
    if (hueIdx !== c.hue) {
      c.hue = hueIdx;
      this.root.style.setProperty('--hue', HUE_CSS[hueIdx]);
      this.root.style.setProperty('--hue-soft', HUE_SOFT[hueIdx]);
    }
    const qLift = Math.round(lift * 12) / 12;
    if (qLift !== c.lift) {
      c.lift = qLift;
      document.body.classList.toggle('is-paper', qLift > 0.5);
      // Resolve the ramp here rather than leaving color-mix() in the cascade.
      for (const [name, a, b] of RAMPS) {
        this.root.style.setProperty(name, mixCss(a, b, qLift));
      }
    }
    // dust in the light: strong where the room is dark and a beam is doing work,
    // gone entirely on the paper side where there is no beam to catch
    const atmos = (0.42 * window_(n, -0.2, 0.5, 1.9, 2.4)
      + 0.3 * window_(n, 2.1, 2.6, 4.2, 4.6)
      + 0.62 * window_(n, 6.9, 7.2, 7.8, 8.0)) * (1 - lift);
    this.world.setDust(atmos);
    this.world.setScrim(scrim, lift);

    // --narr and --lift used to be written here too. Nothing consumed them, and
    // mutating an inline style on <html> invalidates style for the whole document:
    // a trace showed 535 elements recalculated per frame because of it.
    this.board.update(dt, this.time);
    this.spine.update(dt, this.time);
    this.debris.update(dt, this.time);
    this.world.keyTarget.position.set(px, 0, pz);
  }
}
