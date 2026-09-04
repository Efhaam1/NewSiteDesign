import { el } from './console.js';
import { clamp, fmt } from '../util.js';

/**
 * The bento is the board seen from above: eight columns, cells cut into the
 * lattice. Cards are not features in a grid — each one is a surface the product
 * actually has, and the first cell drills itself in as you scroll: stages, then
 * a stage's units, then the session those units contain.
 */
export function buildBento(root, stages, catalog) {
  root.innerHTML = '';
  const cells = [];

  const add = (cls, build) => {
    const c = el(root, 'article', `cell ${cls}`);
    build(c);
    cells.push(c);
    return c;
  };

  // ------------------------------------------- 1. the curriculum, drilling in
  let drill = null;
  add('b-curriculum', (c) => {
    key(c, 'the curriculum', 'a1–e2');
    el(c, 'h3', 'c-t', 'One curriculum, all the way down.');
    el(c, 'p', 'c-b',
      'Every session is written out in full — its own minutes, its own puzzles, its own homework, and the sessions a coach has to have taught first.');
    drill = el(c, 'ul', 'drill');
    const f = el(c, 'ul', 'drill drill-foot');
    // One figure, not three. "213 of 213" was the seventh printing of the count and the
    // literal sum of the five stage rows above it; "unique positions 1,996" was the fourth
    // printing of a de-duplicated FEN count, which act 7's proof strip is the right place
    // for because "0 errors in 4,702 checks" stands beside it there.
    for (const [k, v] of [
      ['sessions', '213'],
      ['hours of class', '210'],
      ['ages', '5–14'],
    ]) {
      const li = el(f, 'li');
      el(li, 'span', '', '·');
      el(li, 'b', '', k);
      el(li, 'span', 'num', v);
    }
  });
  const drillRows = [];
  for (const st of stages.stages) {
    const li = el(drill, 'li');
    el(li, 'span', '', `0${st.number}`);
    el(li, 'b', '', `${st.piece} — ${st.levels.map((l) => l.code).join(' · ')} — ${st.units.length} units`);
    el(li, 'span', 'num', `${st.sessionsAuthored}`);
    drillRows.push(li);
  }

  // ---------------------------------------------------- 2. the console itself
  add('b-console', (c) => {
    key(c, 'teaching console', 'f1');
    // S115, the session act 4 renders, and the same five timed rows its left rail prints:
    // 8 + 5 + 7 + 6 + 16 = 42 of the 60 minutes the bundle plans for it. Was S042's
    // 47 in five parts until 2026-09-04, when act 4 changed session; the two acts are one
    // scroll apart and a reader who adds the column has to get the same answer twice.
    // 'min, five timed parts' wrapped the <small> to two lines in the 151px phone column,
    // which left the body 11px against a 15.23px line box and sliced its one clamped line.
    el(c, 'p', 'c-n').innerHTML = '42<small>min in five parts</small>';
    // Trimmed from 22 words to 9 on 2026-08-29: the card is three lattice rows and the
    // fifth flow row was being cut, which hid one of the five segments the figure above it
    // counts. What came out - "What to say, which position is on the board, which answer is
    // right." - is what act 4 shows in full, so no claim left the page.
    el(c, 'p', 'c-b', 'Read it before class. Teach from it in the room.');
    const f = el(c, 'ul', 'flow mini');
    for (const seg of [['warm-up', 8], ['introduce', 5], ['explain', 7], ['discuss', 6], ['activity', 16]]) {
      const li = el(f, 'li');
      el(li, 'span', '', seg[0]);
      el(li, 'span', 'num', seg[1] + 'm');
      const tr = el(li, 'span', 'track');
      el(tr, 'i').style.width = ((seg[1] / 42) * 100).toFixed(0) + '%';
    }
  });

  // -------------------------------------------------------- 3. verified chess
  add('b-verified', (c) => {
    key(c, 'the positions', 'g1');
    el(c, 'p', 'c-n').innerHTML = `${fmt(1640)}<small>puzzles</small>`;
    el(c, 'p', 'c-b', 'No coach ever demonstrates a line that does not work — every puzzle position and every answer machine-checked.');
  });

  // ------------------------------------------------------------ 4. checkpoints
  add('b-checkpoint', (c) => {
    key(c, 'checkpoints', 'h1');
    const st = el(c, 'div', 'stack');
    // ten levels, ten checkpoints, all of them written
    for (let i = 0; i < 10; i++) el(st, 'span', 'on');
    el(c, 'p', 'c-t', 'Ten checkpoints, one per level.');
    el(c, 'p', 'c-b', 'Earned on positions the child has never seen — not on attendance.');
    const g = el(c, 'ul', 'gate-names');
    const GATES = [
      ['1A', 'Board Explorer'], ['1B', 'Pawn stage graduation'],
      ['2A', 'Tactical Eyes'], ['2B', 'Knight stage graduation'],
      ['3A', 'The Thinking Player'], ['3B', 'Bishop stage graduation'],
      ['4A', 'The Complete Player'], ['4B', 'Rook stage graduation'],
      ['5A', 'The Analyst'], ['5B', 'Queen stage graduation'],
    ];
    for (const row of GATES) {
      const li = el(g, 'li');
      el(li, 'code', '', row[0]);
      el(li, 'span', '', row[1]);
    }
  });

  // ------------------------------------------------------------- 5. two tracks
  add('b-tracks', (c) => {
    key(c, 'two tracks', 'f2');
    el(c, 'p', 'c-t', 'Explorer, then Challenger.');
    el(c, 'p', 'c-b', 'One curriculum, two age tracks. The track switch is still being built.');
    const t = el(c, 'ul', 'tracks');
    const TR = [
      ['Explorer', '5–7', 'shorter blocks, story framing, more play'],
      ['Challenger', '8–12', 'longer calculation, notation, tournament habits'],
    ];
    for (const row of TR) {
      const li = el(t, 'li');
      el(li, 'b', '', row[0]);
      el(li, 'code', '', row[1]);
      el(li, 'span', '', row[2]);
    }
  });

  // ------------------------------------------------------------------ 6. print
  // The ink-bloom video used to close this card. It was 45.9px of a 139.7px cell and
  // it was the element at the cut edge at every window: the card needed 183px and had
  // 123px at 1440x900. product.css meant to drop it on short windows and could not --
  // the tier's `.c-ink { display: none }` (product.css:419) is overridden by the
  // unconditional `.c-ink { display: block }` at product.css:469 - later in the same
  // file at equal specificity, since a media query adds none - so it was
  // laid out even at 620px of height. The card's sentence carries the claim without it.
  add('b-paper', (c) => {
    key(c, 'print pack', 'g2');
    el(c, 'p', 'c-t', 'It also has to work on paper.');
    el(c, 'p', 'c-b', 'Worksheets, homework and a parent summary, for the classroom with no screen. The print pack itself is still being built.');
  });

  // ---------------------------------------------------------------- 7. privacy
  add('b-privacy', (c) => {
    key(c, 'child privacy', 'h2');
    el(c, 'p', 'c-t', 'No child accounts. No child emails. Ever.');
    el(c, 'p', 'c-b', 'Only the academy holds accounts. Built in, not promised in a policy — COPPA and the UK Children’s Code.');
  });

  // ------------------------------------------------------------- 8. one coach
  add('b-point', (c) => {
    key(c, 'every coach', 'a3–d3');
    el(c, 'h3', 'c-t', 'A coach in their second month teaches the session a coach in their twentieth year would have built.');
    el(c, 'p', 'c-b', 'Everything above exists to make that true on a Tuesday evening.');
  });

  const last = new Array(cells.length).fill(-1);
  let lastDrill = -1;
  return function update(t) {
    // cells deal in on the lattice, in reading order, over the first third
    for (let i = 0; i < cells.length; i++) {
      const start = 0.02 + i * 0.022;
      const v = Math.round(clamp((t - start) / 0.16) * 60) / 60;
      if (v === last[i]) continue;
      last[i] = v;
      cells[i].style.setProperty('--cin', v.toFixed(3));
    }
    // and the curriculum cell walks its own stages
    const k = Math.round(clamp((t - 0.32) / 0.5) * drillRows.length * 10) / 10;
    if (k === lastDrill) return;
    lastDrill = k;
    drillRows.forEach((li, i) => li.classList.toggle('on', i <= k - 0.5));
  };
}

function key(c, left, right) {
  const k = el(c, 'p', 'c-k');
  el(k, 'span', '', left);
  el(k, 'em', '', right);
  return k;
}
