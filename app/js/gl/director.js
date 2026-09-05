import * as THREE from 'three';
import { CameraRig, V } from './camera.js';
import { LAYER_BACK, LAYER_FRONT } from './world.js';
import { clamp, lerp, band, window_, smooth } from '../util.js';
import { TILE, fileX, rankZ, SPINE_FILE } from './board.js';
import { ORDER } from './pieces.js';
import { SEED, HOUR_RANK } from './load.js';

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

// Act 1 `sunday` was inserted here, which moved every act after it one place up
// the narrative axis. `n` is act index + local progress, so the SHOTS table and
// every band() in update() are authored in this order: change the order and both
// have to be re-timed together.
export const ACTS = ['threshold', 'sunday', 'chaos', 'spine', 'stages', 'session', 'system', 'terms', 'promotion'];

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
  // Act 1 is the only stretch of the film the camera is not in control of. It
  // starts low on the file, climbs to a plan key so twenty-four covered squares
  // and thirty candidate arrows read as AREA rather than as a number, drops back
  // into the material it just showed you, and then tightens and ROLLS - the one
  // place on the page the horizon is not level, because that is what the beat is.
  // 1.66 and 1.86 are a near-held pair on purpose: the frame the material lands in
  // and the frame the reader reads the product in are the same frame, drifting a unit
  // and a half over 0.14 of the act and doing nothing else.
  { at: 1.00, pos: V(-2, 11.6, 16), look: V(-2, 0.8, -10), fov: 36 },
  { at: 1.12, pos: V(-2, 14, 15), look: V(-2, 0.7, -12), fov: 39 },
  { at: 1.26, pos: V(-2, 26, 14), look: V(-2, 0.6, -14), fov: 44 },
  { at: 1.40, pos: V(-3.4, 15.5, 20), look: V(-2, 3.4, -10), fov: 47 },
  { at: 1.50, pos: V(-0.9, 11, 13), look: V(-2.8, 4.4, -9), fov: 52, roll: 0.028 },
  { at: 1.60, pos: V(-0.2, 9.4, 11.2), look: V(-3.4, 5.0, -8), fov: 55, roll: 0.042 },
  // The payoff key is the one shot in the film that is centred on the BOARD (x 0)
  // rather than on the d-file (x -2), because it is the one shot whose subject is a
  // whole rank rather than a file: aimed at the d-file the eight lit squares sat
  // 97px right of the eight cells naming them. It also looks PAST rank 4, at rank
  // 8 — looking at the lit rank centred it, which put the pawn standing on d1
  // straight through the product strip. Both numbers were measured, not guessed.
  // The room straightens up BEFORE the material files, and then the lens does not
  // move again until the answer has been read. A camera travelling through the snap
  // makes the resolution look like something the camera did rather than something
  // the curriculum did.
  { at: 1.66, pos: V(0, 18, 20), look: V(0, 0, -26), fov: 34 },
  { at: 1.86, pos: V(0, 18.5, 21.4), look: V(0, 0.2, -25.7), fov: 34.4 },
  { at: 2.00, pos: V(-2, 21, 34), look: V(-2, 7, -10), fov: 44 },
  // Act 1 is a rise and then a fall. The climb to a plan-ish key is what makes
  // three heaps on three files read as three separate places; the descent from
  // 1.45 through 1.66 into the existing raking key at 1.80 is the room closing
  // in on the merge, so the finished column is lit edge-on rather than mapped.
  { at: 2.30, pos: V(-2, 33, 19), look: V(-2, 1.0, -13), fov: 46 },
  { at: 2.45, pos: V(-2, 31, 19), look: V(-2, 1.0, -13), fov: 45 },
  { at: 2.66, pos: V(-2, 22, 22), look: V(-2, 0.8, -13), fov: 42 },
  { at: 2.80, pos: V(-2, 16, 24), look: V(-2, 0.6, -12), fov: 40 },
  { at: 3.00, pos: V(-2, 17, 33), look: V(-2, 0.4, -7), fov: 34 },
  { at: 3.55, pos: V(-2.4, 13.5, 25), look: V(-2, 0.2, -15), fov: 32 },
  { at: 4.00, pos: V(4.6, 7.8, 13.0), look: V(-0.6, 1.6, -10), fov: 31 },
  { at: 4.25, pos: V(-5.6, 7.4, 7.5), look: V(-0.4, 1.6, -15), fov: 32 },
  { at: 4.50, pos: V(6.0, 8.4, 1.0), look: V(-0.6, 1.8, -20), fov: 31 },
  { at: 4.75, pos: V(-5.2, 7.8, -4.5), look: V(-0.4, 1.8, -25), fov: 32 },
  { at: 5.00, pos: V(4.0, 9.0, -10.0), look: V(-0.8, 2.0, -30), fov: 32 },
  { at: 5.30, pos: V(-2, 11.5, -15), look: V(-2, 0.8, -27.6), fov: 38 },
  { at: 5.70, pos: V(-2, 8.6, -18.4), look: V(-2, 1.8, -28.2), fov: 42 },
  { at: 6.00, pos: V(-2, 26, -10), look: V(-2, 0, -15), fov: 34 },
  { at: 6.55, pos: V(-2, 42, -6), look: V(-2, 0, -14), fov: 29 },
  { at: 7.00, pos: V(-2, 40, -1), look: V(-2, 0, -12), fov: 30 },
  { at: 7.55, pos: V(-2, 36, 4), look: V(-2, 0, -10), fov: 32 },
  { at: 8.00, pos: V(-5.8, 11.0, -13), look: V(-5.6, 3.0, -29), fov: 34 },
  { at: 8.45, pos: V(-4.9, 7.6, -17.5), look: V(-4.9, 4.4, -29), fov: 36 },
  { at: 8.88, pos: V(-6, 28, 8), look: V(-4, 0, -15), fov: 40 },
  { at: 9.00, pos: V(-3.4, 26, 19), look: V(-2.6, 1.2, -18), fov: 33 },
];

export class Director {
  constructor({ world, board, spine, pieces, debris, load }) {
    this.world = world;
    this.board = board;
    this.spine = spine;
    this.pieces = pieces;
    this.debris = debris;
    this.load = load;
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

    // ------------------------------------------------------------------- act 1
    // The coach's own week. Six beats in n (= 1 + t here). Read load.js first:
    // every knob below is one sentence of the argument, and the order the beats
    // OVERLAP in is the argument too — the arrows are still up when the material
    // goes airborne, and the filing starts while the room is still at its worst.
    //   1.02-1.20  material rises and stacks on ONE square: Tuesday, empty
    //   1.08-1.28  the same stacking spills over twenty-four squares
    //   1.24-1.42  thirty candidate moves from d4, none of them ranked
    //   1.38-1.55  the stacks lose their squares; some of it crosses the type
    //   1.28-1.68  nothing in the frame agrees with anything (see `strain`)
    //   1.66-1.735 all of it lands as eight ordered piles on rank 4, under a camera
    //              that arrived at 1.66 and does not move again until 1.86
    //   1.675-1.75 and those eight squares light, a to h, in order
    // Everything is finished by 1.81 because act 1's --h opens at t 0.857 and act 2's
    // own reveal starts inside that same window: a payoff that is still printing when
    // the next act begins fading in puts two acts' copy on one screen.
    // The DOM beats change at t 0.115 / 0.255 / 0.390 / 0.520 / 0.660 (acts.css),
    // which is n 1.115 / 1.255 / 1.390 / 1.520 / 1.660 — each band above opens
    // BEFORE its line so the room says it first and the words confirm it.
    const sun = window_(n, 0.94, 1.02, 1.95, 2.03);
    // How far the room has stopped coping. It drives the wash, the fog, the key
    // and the dust together, so overload is one physical state of the room rather
    // than four effects that happen to coincide. Peaks at 1.72-1.80, which is
    // where the camera is also tightest and rolled.
    const strain = window_(n, 1.28, 1.46, 1.56, 1.68);
    if (this.load) {
      this.load.presence = sun;
      this.load.pile = band(n, 1.02, 1.20);
      this.load.spread = band(n, 1.08, 1.28);
      this.load.arrows = band(n, 1.24, 1.42);
      this.load.airborne = band(n, 1.38, 1.55);
      this.load.unrest = strain;
      this.load.resolve = band(n, 1.66, 1.735);
      this.load.arrowsResolve = band(n, 1.63, 1.72);
      this.load.hue.copy(this.hue);
    }
    this.board.unrest = strain * 0.85;
    this.board.clearTileGlow();
    if (sun > 0.01) {
      // one square, faint, for as long as the hour is empty
      const seed = window_(n, 1.00, 1.07, 1.36, 1.48) * 0.46 * sun;
      if (seed > 0.004) this.board.setTileGlow(SEED.f, SEED.r, seed);
      // then eight, left to right, as the material lands on them. x9 so the last
      // file is lit before the band closes and the row reads as ONE object.
      const row = band(n, 1.675, 1.75) * sun;
      if (row > 0.004) {
        for (let f = 0; f < 8; f++) {
          this.board.setTileGlow(f, HOUR_RANK, smooth(clamp(row * 9 - f)) * 0.42 * sun);
        }
      }
    }

    // act 2 - four beats, all authored in n (= 2 + t here), so the act's height
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
    this.debris.presence = window_(n, 1.90, 2.04, 2.92, 3.06);
    this.debris.settle = band(n, 2.06, 2.40);
    this.debris.converge = band(n, 2.44, 2.62);
    const hand = band(n, 2.76, 2.98);
    this.debris.thread = hand;
    const one = window_(n, 2.50, 2.62, 2.90, 3.06);

    // act 2 and 3 - the file fills with light, rank 1 toward rank 9
    this.spine.visible = band(n, 2.94, 3.2) * (1 - band(n, 5.55, 5.95));
    let fill;
    if (n < 4) fill = lerp(0.03, 0.13, band(n, 3.02, 3.96));
    else fill = lerp(0.13, 0.97, band(n, 4.0, 4.9));
    if (n > 7.86) fill = lerp(0.97, 1, band(n, 7.86, 8.4));
    this.spine.fill = fill;

    // five stages hold the file at five fills. crossing a gate relights the
    // room and the piece standing on the file becomes the next piece up.
    const gate = clamp((n - 4.0) / 1.0) * 5;
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
    const sessionAct = band(n, 5.1, 5.4) * (1 - band(n, 5.95, 6.2));
    this._target.setHex(sessionAct > 0.5 ? HUES[2] : HUES[idx]);
    this.hue.lerp(this._target, 1 - Math.pow(1 - 0.09, dt * 60));
    this.spine.hue = this.hue;
    this.board.hueColor.copy(this.hue);
    this.world.hue.color.copy(this.hue);
    this.world.fHue.color.copy(this.hue);

    const px = fileX(SPINE_FILE);
    const pz = this.spine.at(fill).z;
    for (const nm of ORDER) this.pieces.setReveal(nm, 0);

    if (n < 4.0) {
      // the pawn condenses out of the light and waits on the file
      const born = Math.max(band(n, 0.34, 0.68), smooth(clamp((this.boot - 0.34) / 0.66)));
      this.pieces.place('pawn', px, 0, pz, this.time * 0.05, lerp(1.34, 1, band(n, 0.12, 1.0)));
      this.pieces.setReveal('pawn', born, 1);
      this.pieces.setPlate('pawn', n < 0.92);
      this.setHueLamp(px, 3, pz, born * 7);
    } else if (n < 5.62) {
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
    } else if (n >= 7.86) {
      // act 6 - rank eight. the pawn burns off and the queen condenses.
      // the rook was already standing here, so it does not re-arrive: it burns
      const burn = band(n, 8.18, 8.36);
      const rise = band(n, 8.28, 8.52);
      const z8 = rankZ(8);
      this.pieces.place('rook', px, 0, z8, 0.2, 1);
      this.pieces.setReveal('rook', 1 - burn, -1);
      this.pieces.setPlate('rook', false);
      this.pieces.place('queen', px, 0, z8, -0.25, lerp(1, 1.55, rise));
      this.pieces.setReveal('queen', rise, 1);
      this.pieces.setPlate('queen', n <= 8.7);
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
    const open = window_(n, 5.14, 5.62, 6.06, 6.34);
    this.board.focus = open > 0.002 ? { f: FOCUS.f, r: FOCUS.r, amount: open } : null;

    // act 5 - the room lifts to paper. dark is what the coach teaches from,
    // light is what the parent and the photocopier get.
    const lift = band(n, 5.62, 6.06) * (1 - band(n, 7.86, 7.99));
    this.board.lightness = lift;
    this.world.scene.environment = lift > 0.5 ? this.world.envLight : this.world.envDark;
    this.world.front.environment = lift > 0.5 ? this.world.frontEnvLight : this.world.frontEnvDark;
    this.world.scene.environmentIntensity = lerp(0.95, 1.5, lift);
    this._bg.copy(this.bgDark).lerp(this.bgLight, lift);
    this.world.scene.background.copy(this._bg);
    this.world.fog.color.copy(this._bg);
    this.world.fog.density = lerp(0.019, 0.0072, lift) * (1 + strain * 0.62);
    this.world.key.intensity = lerp(4.6, 5.6, lift) * (1 - strain * 0.26);
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
    if (n > 8.3) {
      const all = band(n, 8.3, 8.78);
      for (let r = 1; r <= 8; r++) this.board.setRankGlow(r, all * 0.3);
    }

    // handoff to CSS: the page and the world share one light. These properties
    // feed the paper colour mixes, so writing one invalidates style for the whole
    // document — they are quantised and only written when they actually move.
    const hueIdx = sessionAct > 0.5 ? 2 : idx;
    const scrim = 1
      - 0.18 * window_(n, 2.06, 2.44, 2.84, 3.0)
      - 0.22 * window_(n, 3.9, 4.2, 4.9, 5.2)
      - 0.12 * window_(n, 8.55, 8.8, 8.95, 9.0)
      // Act 1 is the one place the wash goes UP. Two terms, because they say two
      // things: the first keeps five lines of copy legible while two hundred slips
      // are between them and the lens, and the second is the room getting heavier
      // as it stops coping. Together they peak at +0.25, inside the +/-0.22 the rest
      // of the film moves the wash by. Then it goes the other way for the payoff:
      // an answered question is a lighter room, and by 1.78 there is nothing left
      // in front of the copy to wash out.
      + 0.13 * window_(n, 1.06, 1.20, 1.62, 1.74)
      + 0.12 * strain
      - 0.10 * band(n, 1.70, 1.82) * (1 - band(n, 1.97, 2.02));
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
    const atmos = (0.42 * window_(n, -0.2, 0.5, 2.9, 3.4)
      + 0.3 * window_(n, 3.1, 3.6, 5.2, 5.6)
      + 0.62 * window_(n, 7.9, 8.2, 8.8, 9.0)
      // the air thickens as the work does, and clears when it is filed
      + 0.34 * strain) * (1 - lift);
    this.world.setDust(atmos);
    this.world.setScrim(scrim, lift);

    // --narr and --lift used to be written here too. Nothing consumed them, and
    // mutating an inline style on <html> invalidates style for the whole document:
    // a trace showed 535 elements recalculated per frame because of it.
    this.board.update(dt, this.time);
    this.spine.update(dt, this.time);
    this.debris.update(dt, this.time);
    if (this.load) this.load.update(dt, this.time);
    this.world.keyTarget.position.set(px, 0, pz);
  }
}
