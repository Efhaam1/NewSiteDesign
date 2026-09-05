import { el } from './console.js';
import { clamp } from '../util.js';

const HUE = { 1: '#3fa57a', 2: '#4a8bd0', 3: '#9070ce', 4: '#d2604b', 5: '#c9a227' };

/**
 * What each rung actually goes to, in the nav's own words.
 *
 * There are nine acts and a chessboard has eight ranks, so the map is authored
 * rather than proportional — `((r-1)/7) * ACTS.length` made rung 5 land on act 5
 * and left act 4, the five stages, with no rung at all. `promotion` is the one
 * act with no rung of its own, which is correct: promotion is what happens PAST
 * rank eight, and the ladder's own last rung is the price you promote from.
 */
const RUNG_ACT = [0, 0, 1, 2, 3, 4, 5, 6, 7];
const RANK = ['', 'the top', 'the week before the lesson', 'three coaches, one session',
  'the curriculum', 'five stages', 'inside a session', 'what’s included', 'what it costs'];


/**
 * The rank ladder: scroll position rendered as a piece walking the d-file, and
 * the site's navigation. A coordinate is a real address on a board, so it can be
 * a real address on the page too — clicking d5 goes to rank five of the story.
 */
export function buildLadder(root, engine) {
  const ol = root.querySelector('.rungs');
  const now = root.querySelector('.ladder-now');
  const rungs = [];
  root.removeAttribute('aria-hidden');
  root.setAttribute('aria-label', 'Jump to a section of the page');
  for (let r = 8; r >= 1; r--) {
    const li = el(ol, 'li');
    li.dataset.rank = String(r);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rung-hit';
    b.title = RANK[r];
    b.setAttribute('aria-label', 'Go to ' + RANK[r]);
    b.addEventListener('click', () => {
      // one rung, one act: see RUNG_ACT
      const i = Math.min(engine.acts.length - 1, RUNG_ACT[r]);
      const a = engine.acts[i];
      if (a) scrollTo({ top: Math.round(a.top + 0.06 * a.len), behavior: 'smooth' });
    });
    li.appendChild(b);
    rungs.push(li);
  }
  let shown = -1;
  return function update(n) {
    // act index -> rung, the inverse of RUNG_ACT. The last two acts share rank 8.
    const i = Math.max(1, Math.min(8, Math.floor(n) + 1));
    if (i === shown) return;
    shown = i;
    for (const li of rungs) {
      const r = +li.dataset.rank;
      li.classList.toggle('on', r === i);
      li.classList.toggle('past', r < i);
    }
    now.textContent = `d${i}`;
  };
}

/** The session scrubber: real ids streaming past as the file fills. */
export function buildScrub(root, catalog) {
  const idEl = root.querySelector('.scrub-id');
  const titleEl = root.querySelector('.scrub-title');
  const metaEl = root.querySelector('.scrub-meta');
  const bar = root.querySelector('.scrub-bar i');
  const list = catalog.sessions;
  let last = -1;
  return function update(fill) {
    const i = Math.min(list.length - 1, Math.floor(clamp(fill) * list.length));
    bar.style.width = `${(clamp(fill) * 100).toFixed(1)}%`;
    if (i === last) return;
    last = i;
    const s = list[i];
    idEl.textContent = `session ${s.n} of ${list.length}`;
    titleEl.textContent = s.title;
    metaEl.textContent =
      `${s.stageName} stage · level ${s.level} · ${s.unitName}`
      + (s.puzzles ? ` · ${s.puzzles} puzzles` : '')
      + ` · ${s.minutes} min · ages ${s.ageBand.replace('-', '–')}`;
  };
}

/**
 * The ten levels, in order, lighting as the file fills. This is what the glowing
 * rank gates in the world actually are: a named level with a session count and a
 * checkpoint at the end of it. All ten are written, and each carries its own count.
 */
export function buildLevels(root, stages, catalog) {
  const counts = {};
  for (const s of catalog.sessions) counts[s.level] = (counts[s.level] || 0) + 1;
  const rows = [];
  for (const st of stages.stages) {
    for (const lv of st.levels) {
      const n = counts[lv.code] || 0;
      const li = el(root, 'li');
      li.style.setProperty('--lc', HUE[st.number]);
      el(li, 'code', '', lv.code);
      el(li, 'span', 'lv-name', lv.name);
      el(li, 'span', 'lv-n num', n ? String(n) : 'planned');
      rows.push({ li, written: n > 0 });
    }
  }
  let lastK = -1;
  return function update(fill) {
    // ten levels walk the file, so a level lights at fill i/10
    const k = Math.round(clamp(fill) * rows.length * 20) / 20;
    if (k === lastK) return;
    lastK = k;
    rows.forEach((r, i) => {
      r.li.classList.toggle('on', r.written && i < k && i >= k - 1.35);
      r.li.classList.toggle('past', r.written && i < k - 1.35);
      r.li.classList.toggle('unwritten', !r.written);
    });
  };
}

export function buildProof(root) {
  const rows = [
    ['213', 'sessions, all written'],
    ['1,640', 'puzzles'],
    ['0', 'chess errors in 4,702 checks'],
    ['1,996', 'unique positions'],
  ];
  for (const [n, k] of rows) {
    const li = el(root, 'li');
    el(li, 'b', 'num', n);
    el(li, 'span', '', k);
  }
}

/** A vertical mono readout of the current square — small, constant, chess. */
export function buildReadout(root) {
  const span = root.querySelector('span');
  let last = '';
  return function update(n, stageName) {
    const rank = Math.max(1, Math.min(8, Math.floor(n) + 1));
    // The bundle version used to close this line. It was internal metadata used as
    // furniture - on the pricing screen the rail's entire content was a coordinate and a
    // semver - and at 8.96px it measured 1.97:1, so it was not even legible provenance.
    // The footer carries the version, which is where a buyer expects it. Dropping it also
    // takes the longest composition from 39 characters to 17, which retires the 314.50px
    // second-column problem `white-space: nowrap` (acts.css:108) was added to solve.
    const t = [`d${rank}`, stageName].filter(Boolean).join('  ·  ');
    if (t === last) return;
    last = t;
    span.textContent = t;
  };
}


/**
 * The pointer, written onto the button under it. product.css's .cta face is a
 * radial gradient whose light source is `var(--mx) var(--my)`, so moving those two
 * properties moves the highlight: the plate is brightest exactly where the cursor
 * is and rolls into its own chamfer away from it. That is the whole of the liquid.
 *
 * Three deliberate choices about cost:
 *  - The properties are set on the ELEMENT, never on :root. A custom property on
 *    the root element recalculates style for the entire document on every write,
 *    which is the 12ms-a-frame trap acts.css:118 records; on the element it
 *    invalidates one ~168x49 box.
 *  - `pointermove` does not exist until the pointer is inside a button, and is
 *    removed on the way out. Off-hover this costs exactly nothing, which is what
 *    lets it run beside eight pinned acts and two WebGL contexts.
 *  - The write is coalesced into a rAF, so a 1000Hz mouse still writes once a frame.
 *
 * Every .cta is in the DOM by the time boot() calls this (act 6's pair is built by
 * buildRate, act 7's is authored markup), and none is created afterwards.
 */
export function bindPlates(root = document) {
  // A coarse pointer has no hover state to track, and no cursor to follow.
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // At most one plate is ever lit. `pointerleave` does not always fire when the
  // element leaves the POINTER — an act scrolling out from under the cursor takes
  // its stage to `visibility: hidden` instead — so a button could keep a stale light
  // position. Measured: one of seven held a stale --mx after a sweep of all eight
  // acts. Handing the previous holder over on the next enter fixes the case that can
  // actually be seen, which is two buttons on screen at once during a handover.
  let lit = null;
  const douse = (btn) => {
    btn.style.removeProperty('--mx');
    btn.style.removeProperty('--my');
    if (lit === btn) lit = null;
  };

  for (const btn of root.querySelectorAll('.cta')) {
    let raf = 0;
    let px = 0;
    let py = 0;

    const write = () => {
      raf = 0;
      const r = btn.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = ((px - r.left) / r.width) * 100;
      // The light stays ABOVE the plate — a highlight from below reads as a
      // different, wrong material. The cursor's vertical position leans it, from
      // -34% at the top edge to -6% at the bottom, rather than placing it.
      const y = -34 + ((py - r.top) / r.height) * 28;
      btn.style.setProperty('--mx', x.toFixed(1) + '%');
      btn.style.setProperty('--my', y.toFixed(1) + '%');
    };

    const move = (e) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(write);
    };

    const off = () => {
      btn.removeEventListener('pointermove', move);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      // Back to the declared rest state, so the plate is lit the same way on every
      // button until a pointer says otherwise.
      douse(btn);
    };

    btn.addEventListener('pointerenter', (e) => {
      if (lit && lit !== btn) douse(lit);
      lit = btn;
      btn.addEventListener('pointermove', move);
      move(e);
    });

    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);

    /**
     * The press, at the point it was actually pressed.
     *
     * product.css:.cta-rip is a 22px disc of the label's own ink that scales out
     * and fades; all this does is put it where the finger went down. Same three
     * cost rules as the light above: one absolutely positioned child, so no
     * layout; `currentColor`, so no second declaration for the ink plate; and it
     * removes itself.
     *
     * The removal is a timer rather than `animationend`, deliberately. base.css:91
     * pauses every animation inside an act that stops being live, so a plate
     * pressed on the way out of an act would keep a paused disc forever and
     * `animationend` would never arrive.
     */
    btn.addEventListener('pointerdown', (e) => {
      if (still || e.button !== 0) return;
      const r = btn.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const rip = document.createElement('span');
      rip.className = 'cta-rip';
      rip.setAttribute('aria-hidden', 'true');
      rip.style.setProperty('--rx', (e.clientX - r.left).toFixed(1) + 'px');
      rip.style.setProperty('--ry', (e.clientY - r.top).toFixed(1) + 'px');
      btn.appendChild(rip);
      setTimeout(() => rip.remove(), 700);
    });
  }
}
