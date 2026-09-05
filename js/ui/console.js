import { Board2D } from './board2d.js';
import { buildSegments } from '../teach/segments.js';
import { buildLine } from '../teach/line.js';
import { clamp } from '../util.js';

/**
 * ACT 4 — the teaching console, annotated.
 *
 * This is the screen /teach opens, rendered inside act 4 at the size the act has
 * room for, and named from the outside: three labels above the plate and three
 * below, each with a hairline leader that lands on the edge nearest the thing it
 * names. The act stopped being a picture of a lesson when the labels arrived; it
 * is a diagram of the instrument a coach is handed.
 *
 * Nothing here is a mock. The crumb, the eight segments and their minutes, the
 * position, the FEN, the forced line, the unit and the thinking routine are all
 * fields off `showcase.json` (bundle 1.1.0), and the flow comes from the same
 * `buildSegments` /teach uses, so the two routes cannot drift apart.
 *
 * Reveals are CSS: every band in annot.css is a clamp() on the act's own --t /
 * --e / --h. Nothing is written per frame from here except the board.
 */

/** The three sessions /teach opens without a signup. The chips link to them. */
const FREE = ['S001', 'S042', 'S115'];
/** Where the answer opens itself if nobody has asked it to. A real control still wins. */
const AUTO_REVEAL = 0.56;
/** The clock is right to the second, so it is not on the frame loop. */
const TICK_MS = 250;
/** The segment the board belongs to. The flow highlights it and the clock counts it. */
const SEG_KEY = 'puzzles';

const pad2 = (n) => String(n).padStart(2, '0');
const mmss = (s) => `${Math.floor(s / 60)}:${pad2(Math.floor(s % 60))}`;
const turnOf = (fen) => (fen.split(' ')[1] === 'b' ? 'Black' : 'White');

export function buildConsole(root, lesson, opts = {}) {
  const L = lesson;
  const segments = buildSegments(L);
  const si = Math.max(0, segments.findIndex((s) => s.key === SEG_KEY));
  const seg = segments[si];
  const beats = seg.beats;
  // in-class minutes: the same sum /teach prints, homework excluded because it is not in class
  const timed = segments.reduce((a, s) => a + (s.key === 'homework' ? 0 : (s.minutes || 0)), 0);

  root.innerHTML = '';
  // Position 4 of 8: the x-ray battery. Not the first, because the first two are
  // Foundation rook ladders and this is the one the section is a diagram of.
  const S = { beat: Math.min(3, beats.length - 1), revealed: null };

  // One sentence, one region: what a screen reader is told changed.
  const live = el(root, 'p', 'sr');
  live.setAttribute('role', 'status');
  const say = (m) => { live.textContent = m; };

  const top = topBar(root, L, segments, si, seg);
  const plan = planPane(root, L, segments, si, timed);
  const stage = boardPane(root, seg, si, segments.length, beats);
  const ctl = ctlPane(root, L, seg);
  prepSheet(root, L, segments, timed, top, say);

  // ------------------------------------------------------------------ the position
  let t = 0, shownPly = -1, wasOpen = null, lastBeat = -1;
  const isOpen = () => (S.revealed === null ? t >= AUTO_REVEAL : S.revealed);

  /** The plies of the current beat's forced line, one FEN each. */
  let line = [];

  function loadBeat() {
    const bt = beats[S.beat] || {};
    line = bt.fen ? buildLine(bt.fen, bt.moves || []) : [];
    stage.setBeat(bt, S.beat, beats.length);
    plan.setPosition(bt);
    ctl.setBeat(bt);
    shownPly = -1;
    wasOpen = null;
  }

  function goto(i) {
    const n = beats.length;
    S.beat = ((i % n) + n) % n;
    // false, not null: a reader who stepped the position has taken the control, so the new
    // answer is hidden until they ask for it rather than re-opening on the scroll band
    S.revealed = false;
    loadBeat();
    apply();
    const bt = beats[S.beat];
    say(`Position ${S.beat + 1} of ${n}.${bt.prompt ? ` ${bt.prompt}` : ''}`);
  }

  let parked = false;
  function apply() {
    // The rail is not laid out at the size it will be read at until the act is live, so a
    // list parked at boot parks against the wrong height and lands on 0. Once.
    if (!parked) { parked = true; plan.park(); stage.markCut(); }
    const open = isOpen();
    if (open !== wasOpen) { wasOpen = open; ctl.showAnswer(open); }
    // The line plays out across the back half of the act and rewinds on the way up —
    // but only while the answer is open, because that is what the control means.
    // Closed, the board holds the position the room is calculating.
    const k = clamp((t - 0.58) / 0.19);
    const step = open && line.length > 1
      ? Math.min(line.length - 1, Math.floor(k * line.length)) : 0;
    if (step === shownPly && S.beat === lastBeat) return;
    shownPly = step; lastBeat = S.beat;
    const p = line[step] || { fen: (beats[S.beat] || {}).fen, highlight: [] };
    if (p.fen) stage.render(p.fen, p.highlight, step ? p.san : '');
  }

  stage.onPick = goto;
  ctl.onStep = (d) => goto(S.beat + d);
  ctl.onReveal = () => {
    S.revealed = !isOpen();
    wasOpen = null; shownPly = -1;
    apply();
    say(S.revealed ? `Answer shown. ${(beats[S.beat] || {}).sanLine || ''}` : 'Answer hidden.');
  };

  // Keyboard, and only the keys the page can spare. /teach binds up and down as well;
  // here they are the reader's own scroll, and the scroll position IS the timeline, so
  // nothing in this act is allowed to take them. Left, right and R are free, and the
  // hint line under the board claims exactly those three.
  const live4 = opts.active || (() => true);
  addEventListener('keydown', (e) => {
    if (!live4() || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goto(S.beat + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goto(S.beat - 1); }
    else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); ctl.onReveal(); }
  });

  loadBeat();
  apply();
  return function play(now) { t = now; apply(); };
}

// =============================================================== the header bar
/**
 * What /teach opens with: the lockup, where in the curriculum this session sits,
 * which part of the hour is on screen, the three free sessions, and the two views.
 * The session chips are LINKS — /teach reads ?s= and opens that session — so the
 * row is the same promise the act's headline makes rather than a picture of one.
 */
function topBar(root, L, segments, si, seg) {
  const bar = el(root, 'div', 'con-top');
  const brand = el(bar, 'p', 'con-brand');
  el(brand, 'span', 'mark').setAttribute('aria-hidden', 'true');
  el(brand, 'span', '', 'Efhaam');

  const id = el(bar, 'div', 'con-id');
  const crumb = el(id, 'p', 'mono con-crumb');
  el(crumb, 'b', '', `Session ${L.session_number}`);
  // the leading space is part of the string: a flex gap would fall on the wrap
  el(crumb, 'span', '', ` \u00b7 Stage ${L.stage.number} ${L.stage.name}`
    + ` \u00b7 Level ${L.level.code}`);
  el(id, 'p', 'con-title', L.title);

  // A visual readout, and a genuinely ambiguous one: "PUZZLES 6 OF 8" is segment 6 of the
  // eight, not puzzle 6 of 8, and the board's own head says "position 4 of 8" two inches
  // below it. The flow list carries the same fact unambiguously (row 06 is aria-current),
  // so this is hidden from the accessibility tree rather than read out twice, which is
  // what /teach does with the same element (teach/index.html:28).
  const count = el(bar, 'p', 'mono con-seg');
  count.setAttribute('aria-hidden', 'true');
  el(count, 'b', '', seg.label);
  el(count, 'span', '', `${si + 1} of ${segments.length}`);

  const pick = el(bar, 'div', 'con-pick');
  pick.setAttribute('role', 'group');
  pick.setAttribute('aria-label', 'Free sessions');
  for (const sid of FREE) {
    const a = el(pick, 'a', 'con-b', sid);
    a.href = `/teach?s=${sid}`;
    if (sid === L.id) a.setAttribute('aria-current', 'true');
    a.setAttribute('aria-label', sid === L.id
      ? `${sid}, the session on screen, opens in the teaching console`
      : `${sid}, open in the teaching console`);
  }

  const views = el(bar, 'div', 'con-views');
  views.setAttribute('role', 'group');
  views.setAttribute('aria-label', 'View');
  const teachB = button(views, 'con-b', 'Teach');
  teachB.setAttribute('aria-pressed', 'true');
  const prepB = button(views, 'con-b', 'Prep');
  prepB.setAttribute('aria-pressed', 'false');
  prepB.setAttribute('aria-controls', 'cs-prep');
  return { prepBtn: prepB, teachBtn: teachB };
}

// ================================================================ pane 1, the plan
/**
 * The hour, in the order it is taught, off the same `buildSegments` /teach uses —
 * so the eight rows and their minutes are one function, not two.
 */
function planPane(root, L, segments, si, timed) {
  const p = pane(root, 'pane-plan');
  const h = el(p, 'p', 'mono rail-h');
  el(h, 'span', '', `${L.estimated_duration_min} min planned \u00b7 ${timed} timed`);
  el(h, 'b', '', `${L.age_band.replace('-', '\u2013')} yrs`);

  const flow = el(p, 'ol', 'con-flow');
  segments.forEach((s, i) => {
    const li = el(flow, 'li', i === si ? 'on' : i < si ? 'done' : '');
    if (i === si) li.setAttribute('aria-current', 'step');
    el(li, 'span', 'n', pad2(i + 1));
    el(li, 'span', 'l', s.label);
    el(li, 'span', 'm', s.minutes ? `${s.minutes}m` : '\u2014');
  });

  // The rail scrolls below about 700px of window, and the row the clock is holding is row 6
  // of 8 — off the bottom of a cut list, which leaves a flow list that does not say where the
  // class is. Parked, not `scrollIntoView`: that walks up the ancestor chain and the page's
  // own scroll position is the timeline.
  const park = () => {
    const on = flow.querySelector('li.on');
    if (!on || flow.scrollHeight <= flow.clientHeight + 2) return;
    flow.scrollTop = Math.max(0, on.offsetTop - (flow.clientHeight - on.offsetHeight) / 2);
  };
  requestAnimationFrame(park);
  addEventListener('resize', () => requestAnimationFrame(park), { passive: true });

  const box = el(p, 'div', 'panel panel-pos');
  const ph = el(box, 'h3', 'mono rail-h');
  el(ph, 'span', '', 'This position');
  const pid = el(ph, 'b', '', '');

  const grp = el(box, 'div', 'fen-grp');
  grp.setAttribute('role', 'group');
  grp.setAttribute('aria-labelledby', 'cs-fen-l');
  el(grp, 'p', 'mono field-l', 'FEN').id = 'cs-fen-l';
  const code = el(grp, 'code', 'fen-v');
  const b = button(grp, 'con-b fen-b', 'Copy FEN');
  b.setAttribute('aria-label', 'Copy the FEN for this position');
  const st = el(box, 'p', 'mono copy-st');
  st.setAttribute('role', 'status');
  const note = el(box, 'p', 'mono note', '');

  let timer = 0;
  b.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(code.textContent); ok = true; } catch { ok = false; }
    // said in words, not by the button turning a colour
    st.textContent = ok ? 'FEN copied' : 'select it instead';
    b.classList.toggle('ok', ok);
    clearTimeout(timer);
    timer = setTimeout(() => { st.textContent = ''; b.classList.remove('ok'); }, 2000);
  });

  return {
    park,
    setPosition(bt) {
      pid.textContent = bt.tag || '';
      code.textContent = bt.fen || '\u2014';
      b.disabled = !bt.fen;
      // /teach's own sentence for a gated line: the PGN is behind the reveal, so the
      // note says so rather than offering a button that would give the answer away.
      note.textContent = bt.moves && bt.moves.length
        ? 'FEN for a board. The PGN comes with the answer.'
        : 'FEN for a board. No line on this position.';
    },
  };
}

// =============================================================== pane 2, the board
function boardPane(root, seg, si, nSeg, beats) {
  const p = pane(root, 'pane-board');
  const head = el(p, 'p', 'mono b-head');
  const prompt = el(p, 'p', 'b-prompt');
  const row = el(p, 'div', 'con-beats');
  row.setAttribute('role', 'group');
  row.setAttribute('aria-label', 'Positions in this segment');
  const chips = beats.map((_, i) => {
    const c = button(row, 'con-b', String(i + 1));
    c.setAttribute('aria-label', `Position ${i + 1} of ${beats.length}`);
    c.addEventListener('click', () => api.onPick(i));
    return c;
  });
  const markCut = () => {
    prompt.classList.toggle('clipped',
      prompt.scrollTop + prompt.clientHeight < prompt.scrollHeight - 2);
  };
  prompt.addEventListener('scroll', markCut);
  addEventListener('resize', markCut, { passive: true });

  const board = new Board2D(el(el(p, 'div', 'b-slot'), 'div'));
  const cap = el(p, 'p', 'b-cap');
  el(p, 'p', 'mono b-hint',
    'Left and right change position. R reveals the answer.');

  const api = {
    onPick: () => {},
    markCut,
    setBeat(bt, i, n) {
      head.textContent = `${pad2(si + 1)} / ${pad2(nSeg)} \u00b7 ${seg.label}`
        + ` \u00b7 position ${i + 1} of ${n}` + (bt.difficulty ? ` \u00b7 ${bt.difficulty}` : '');
      prompt.textContent = bt.prompt || seg.label;
      requestAnimationFrame(markCut);
      chips.forEach((c, k) => c.setAttribute('aria-current', k === i ? 'true' : 'false'));
    },
    render(fen, hl, san) {
      board.render(fen, hl);
      cap.textContent = `${turnOf(fen)} to move` + (san ? ` \u00b7 after ${san}` : '');
    },
  };
  return api;
}

// ============================================================ pane 3, the controls
/**
 * The four things /teach carries that a screenshot of a lesson cannot show: where
 * the session sits in its unit, the answer behind a gate, a stepper for the
 * position, and a clock on the segment. Each one is a panel, and the three labels
 * below the plate name them from the outside.
 */
function ctlPane(root, L, seg) {
  const p = pane(root, 'pane-ctl');

  // ---- the focus
  const f = el(p, 'div', 'panel panel-focus');
  const fh = el(f, 'h3', 'mono rail-h');
  el(fh, 'span', '', 'The focus');
  el(fh, 'b', '', L.id);
  const dl = el(f, 'dl', 'meta');
  const r = L.thinking_routine;
  for (const [k, v] of [
    ['unit', `${L.unit.number} ${L.unit.name}`],
    ['routine', (r && r.current !== 'none' && r.current) || '\u2014'],
  ]) {
    const d = el(dl, 'div');
    el(d, 'dt', '', k);
    el(d, 'dd', '', v);
  }

  // ---- the answer
  const a = el(p, 'div', 'panel panel-answer');
  const ah = el(a, 'h3', 'mono rail-h');
  el(ah, 'span', '', 'The answer');
  const astate = el(ah, 'b', '', 'hidden');
  const lead = el(a, 'p', 'sol-lead', 'Hidden so you can ask the room first.');
  const body = el(a, 'div', 'sol-body');
  body.id = 'cs-answer';
  body.hidden = true;
  const san = el(body, 'p', 'san', '');
  const res = el(body, 'p', 'sol-res', '');
  const why = el(body, 'p', 'sol-x', '');
  const rev = button(a, 'con-b con-go reveal', '');
  const revL = el(rev, 'span', 'reveal-l', 'Reveal answer');
  const kbd = el(rev, 'kbd', '', 'R');
  kbd.setAttribute('aria-hidden', 'true');
  rev.setAttribute('aria-expanded', 'false');
  rev.setAttribute('aria-controls', 'cs-answer');
  rev.setAttribute('aria-keyshortcuts', 'R');
  rev.addEventListener('click', () => api.onReveal());

  // ---- the stepper
  const s = el(p, 'div', 'panel panel-step');
  const sh = el(s, 'h3', 'mono rail-h');
  el(sh, 'span', '', 'Step the session');
  const srow = el(s, 'div', 'con-brow');
  button(srow, 'con-b', 'Previous position')
    .addEventListener('click', () => api.onStep(-1));
  button(srow, 'con-b con-go', 'Next position')
    .addEventListener('click', () => api.onStep(1));

  // ---- the clock
  const c = el(p, 'div', 'panel panel-clock');
  const ch = el(c, 'h3', 'mono rail-h');
  ch.id = 'cs-clock-h';
  el(ch, 'span', '', 'Segment clock');
  el(ch, 'b', '', seg.label);
  const time = el(c, 'p', 'num clk');
  const now = el(time, 'b', '', '0:00');
  const budget = (seg.minutes || 0) * 60;
  const bud = el(time, 'span', '', budget ? `/ ${mmss(budget)} planned` : 'no planned minutes');
  const bar = el(c, 'div', 'clk-bar');
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-labelledby', 'cs-clock-h');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-valuenow', '0');
  const fill = el(bar, 'i');
  const crow = el(c, 'div', 'con-brow');
  const go = button(crow, 'con-b con-go', 'Start segment');
  const rst = button(crow, 'con-b', 'Reset');

  const C = { on: false, ms: 0, last: 0, timer: 0 };
  function tick() {
    const sec = C.ms / 1000;
    now.textContent = mmss(sec);
    go.textContent = C.on ? 'Pause' : C.ms ? 'Resume' : 'Start segment';
    if (budget) {
      const over = sec > budget;
      const pct = Math.min(1, sec / budget);
      // scaleX, not width: this redraws four times a second and must not lay out
      fill.style.transform = `scaleX(${pct.toFixed(4)})`;
      bar.classList.toggle('over', over);
      bar.setAttribute('aria-valuenow', String(Math.round(pct * 100)));
      bar.setAttribute('aria-valuetext', `${mmss(sec)} of ${mmss(budget)}`);
      // over budget is said in words as well as in colour
      bud.textContent = over ? `over by ${mmss(sec - budget)}` : `/ ${mmss(budget)} planned`;
    } else {
      bar.setAttribute('aria-valuetext', `${mmss(sec)}, no planned minutes`);
    }
  }
  go.addEventListener('click', () => {
    C.on = !C.on;
    C.last = performance.now();
    clearInterval(C.timer);
    if (C.on) {
      C.timer = setInterval(() => {
        const n = performance.now();
        C.ms += n - C.last; C.last = n; tick();
      }, TICK_MS);
    }
    tick();
  });
  rst.addEventListener('click', () => {
    C.on = false; C.ms = 0; clearInterval(C.timer); tick();
  });
  tick();

  // A body that is genuinely cut fades at the foot, so the half line reads as more
  // answer below rather than as a panel that failed to draw. Same idiom as /teach.
  const markCut = () => {
    body.classList.toggle('clipped', body.scrollTop + body.clientHeight < body.scrollHeight - 2);
  };
  body.addEventListener('scroll', markCut);
  addEventListener('resize', markCut, { passive: true });

  // Below 901px wide the rail is bounded at 42% of the plate and scrolls inside it, so a
  // rail that is genuinely cut fades at the foot — the half line then reads as more rail
  // below rather than as a panel that failed to draw. Re-decided on the page's own scroll
  // as well, because the answer opens itself at t=0.56 and closes on the way back up.
  const markRail = () => {
    p.classList.toggle('clipped', p.scrollTop + p.clientHeight < p.scrollHeight - 2);
  };
  p.addEventListener('scroll', markRail);
  addEventListener('resize', markRail, { passive: true });

  const api = {
    onReveal: () => {}, onStep: () => {},
    setBeat(bt) {
      san.textContent = bt.sanLine || (bt.moves || []).join(' ');
      res.textContent = bt.result || '';
      why.textContent = bt.answer || '';
      rev.hidden = !(bt.sanLine || bt.answer);
    },
    showAnswer(open) {
      body.hidden = !open;
      requestAnimationFrame(markCut);
      requestAnimationFrame(markRail);
      lead.hidden = open;
      rev.setAttribute('aria-expanded', String(open));
      revL.textContent = open ? 'Hide answer' : 'Reveal answer';
      astate.textContent = open ? 'revealed' : 'hidden';
      a.classList.toggle('locked', !open);
      // the rail packs its four panels to their content while the answer is shut and
      // gives the answer the slack once it opens — one class, no per-frame write
      p.classList.toggle('open', open);
    },
  };
  return api;
}

// ================================================================= the prep sheet
/**
 * The session as something a coach reads before class. It is on paper, because that
 * is what prep is — dark is what the coach teaches from, light is what the
 * photocopier gets. A disclosure, not a modal: it never leaves the DOM, Escape
 * closes it, and focus goes back to the control that opened it.
 */
function prepSheet(root, L, segments, timed, views, say) {
  const btn = views.prepBtn;
  const d = el(root, 'div', 'prep');
  d.id = 'cs-prep';
  d.hidden = true;
  d.tabIndex = -1;
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-label', `Prep sheet, ${L.id} ${L.title}`);
  const top = el(d, 'div', 'prep-top');
  el(top, 'p', 'prep-k mono', `${L.id} \u00b7 stage ${L.stage.number} ${L.stage.name}`
    + ` \u00b7 level ${L.level.code} \u00b7 unit ${L.unit.number} ${L.unit.name}`);
  const x = button(top, 'prep-x', 'Close');
  el(d, 'h3', 'prep-t', L.title);
  const facts = el(d, 'ul', 'prep-f');
  for (const [k, v] of [
    ['ages', L.age_band.replace('-', '\u2013')],
    ['planned', `${L.estimated_duration_min} min`],
    ['timed', `${timed} min`],
    ['puzzles', String(L.puzzles.length)],
    ['homework', `${L.homework.estimated_time_min} min`],
    ['type', String(L.session_type).replace(/_/g, ' ')],
  ]) {
    const li = el(facts, 'li');
    el(li, 'span', 'k mono', k);
    el(li, 'span', 'v', v);
  }
  sect(d, 'learning objective', (s) => el(s, 'p', '', L.learning_objective));
  if (L.thinking_routine) {
    sect(d, 'thinking routine', (s) => {
      el(s, 'p', 'prep-r', L.thinking_routine.current);
      el(s, 'p', '', L.thinking_routine.focus);
    });
  }
  sect(d, 'the hour', (s) => {
    const ol = el(s, 'ol', 'prep-h');
    for (const sg of segments) {
      const li = el(ol, 'li', sg.minutes ? '' : 'off');
      el(li, 'span', '', sg.label);
      el(li, 'b', 'num', sg.minutes ? `${sg.minutes}m` : '\u2014');
    }
  });
  const cn = L.coach_notes || {};
  if ((cn.common_misconceptions || []).length) {
    sect(d, 'what they wrongly believe', (s) => list(s, cn.common_misconceptions.slice(0, 2)));
  }
  if ((cn.coaching_tips || []).length) {
    sect(d, 'how to teach it', (s) => list(s, cn.coaching_tips.slice(0, 1)));
  }
  el(d, 'p', 'prep-n mono', 'The full version of this sheet is at /teach.');

  // A sheet that is genuinely cut fades at the foot, so the half line reads as more
  // document below rather than as a panel that failed to draw. Same idiom as /teach.
  const mark = () => {
    d.classList.toggle('clipped', d.scrollTop + d.clientHeight < d.scrollHeight - 2);
  };
  d.addEventListener('scroll', mark);

  function open(v) {
    d.hidden = !v;
    // one control, two buttons: the sheet is the Prep view, so Teach un-presses with it
    btn.setAttribute('aria-pressed', String(v));
    views.teachBtn.setAttribute('aria-pressed', String(!v));
    // preventScroll: the page's scroll position is the timeline, so nothing here
    // is allowed to move it
    if (v) { d.focus({ preventScroll: true }); mark(); say(`Prep sheet. ${L.title}.`); }
    else { btn.focus({ preventScroll: true }); }
  }
  btn.addEventListener('click', () => open(d.hidden));
  x.addEventListener('click', () => open(false));
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); open(false); }
  });
}

// ------------------------------------------------------------------- the pieces
/** One rail of the console. The three class names the gate resolves stay put. */
function pane(root, cls) {
  const p = el(root, 'div', `pane ${cls}`);
  return p;
}

function button(parent, cls, text) {
  const b = el(parent, 'button', cls, text);
  b.type = 'button';
  return b;
}

function sect(parent, title, build) {
  const s = el(parent, 'section', 'prep-s');
  el(s, 'h4', 'mono', title);
  build(s);
  return s;
}

function list(parent, items) {
  const ul = el(parent, 'ul');
  for (const i of items) el(ul, 'li', '', i);
  return ul;
}

function el(parent, tag, cls = '', text = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  parent.appendChild(e);
  return e;
}
export { el };
