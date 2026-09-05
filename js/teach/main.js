import { Board2D } from '/NewSiteDesign/js/ui/board2d.js';
import { buildSegments } from './segments.js';
import { buildLine, buildPgn } from './line.js';

/**
 * The teaching console: what a coach is handed for one session.
 *
 * Three rails that all stay on screen, because a coach cannot scroll while eleven
 * children wait. Left: the session minute by minute, plus the notation to read out.
 * Middle: the position, at the largest size the window allows. Right: the focus for
 * this beat, the answer behind a reveal, and the clock.
 *
 * Everything is bundle 1.1.0 data. Nothing on this screen is a mock.
 */
const FREE = ['S001', 'S042', 'S115'];
const STAGE_HUE = { 1: '#3fa57a', 2: '#4a8bd0', 3: '#9070ce', 4: '#d2604b', 5: '#c9a227' };

const q = (sel, root = document) => root.querySelector(sel);
function el(parent, tag, cls = '', text = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
const pad = (n) => String(n).padStart(2, '0');
const mmss = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;

const S = {
  data: null,
  id: null,
  lesson: null,
  segments: [],
  view: 'teach',
  seg: 0,
  beat: 0,
  ply: 0,
  revealed: false,
  clock: { running: false, elapsed: 0, last: 0 },
  board: null,
};

boot();

async function boot() {
  const res = await fetch('/NewSiteDesign/data/showcase.json');
  S.data = (await res.json()).data;
  const wanted = new URLSearchParams(location.search).get('s');
  S.id = FREE.includes(wanted) ? wanted : 'S042';
  S.board = new Board2D(q('.t-board'));
  buildPicker();
  wireStatic();
  load(S.id);
  // The single-character shortcuts are scoped to the console (WCAG 2.1.4), so the
  // console holds focus from the first frame: a coach at a projector presses R
  // without clicking anything first.
  q('#t-main').focus({ preventScroll: true });
  requestAnimationFrame(tick);
}

function load(id) {
  S.id = id;
  S.lesson = S.data[id];
  S.segments = buildSegments(S.lesson);
  S.seg = 0; S.beat = 0; S.ply = 0; S.revealed = false;
  S.clock = { running: false, elapsed: 0, last: 0 };
  const hue = STAGE_HUE[S.lesson.stage.number] || STAGE_HUE[4];
  document.body.style.setProperty('--rook', hue);
  history.replaceState(null, '', `?s=${id}`);
  // Three sessions are three documents: the tab, the history entry and the window
  // list all have to say which one this is.
  document.title = `${S.lesson.title} · free session — Efhaam`;
  buildFlow();
  renderAll();
}

/** The current segment and beat, always defined so the stepper cannot stall. */
const seg = () => S.segments[S.seg] || S.segments[0];
const beat = () => seg().beats[S.beat] || seg().beats[0];
const line = () => (beat().fen ? buildLine(beat().fen, beat().moves) : []);
/** Stepping the line shows the answer, so it waits for the reveal. */
const canStep = () => line().length > 1 && !(beat().gated && !S.revealed);
/** Homework is not taught in the room, so it is not part of the class total. */
const inClassMinutes = () =>
  S.segments.reduce((a, sg) => a + (sg.key === 'homework' ? 0 : (sg.minutes || 0)), 0);
const turnOf = (fen) => (fen.split(' ')[1] === 'b' ? 'Black' : 'White');
/** One status region, one sentence: what a screen reader is told changed. */
function say(m) { q('.t-status').textContent = m; }

// ------------------------------------------------------------------------- chrome
function buildPicker() {
  const root = q('.t-pick');
  for (const id of FREE) {
    const b = el(root, 'button', '', id);
    b.type = 'button';
    b.setAttribute('aria-label', `${id} ${S.data[id].title}`);
    b.addEventListener('click', () => { load(id); });
    b.dataset.id = id;
  }
}

function wireStatic() {
  for (const b of document.querySelectorAll('.t-views button')) {
    b.addEventListener('click', () => setView(b.dataset.view));
  }
  q('.t-prev').addEventListener('click', () => stepBeat(-1));
  q('.t-next').addEventListener('click', () => stepBeat(1));
  q('.t-reveal').addEventListener('click', toggleReveal);
  q('.t-play').addEventListener('click', () => {
    S.clock.running = !S.clock.running;
    S.clock.last = performance.now();
    renderClock();
  });
  q('.t-reset').addEventListener('click', () => {
    S.clock = { running: false, elapsed: 0, last: 0 };
    renderClock();
  });
  for (const b of document.querySelectorAll('.t-line-btns button')) {
    b.addEventListener('click', () => {
      const l = line();
      const last = Math.max(0, l.length - 1);
      const to = { start: 0, back: S.ply - 1, next: S.ply + 1, end: last }[b.dataset.ply];
      setPly(Math.max(0, Math.min(last, to)));
    });
  }
  for (const b of document.querySelectorAll('.t-copy-btn')) {
    b.addEventListener('click', () => copy(b));
  }
  addEventListener('keydown', onKey);
  watchScrollers();
}

function setView(v) {
  const prep = q('#t-prep');
  const wasInPrep = prep.contains(document.activeElement);
  S.view = v;
  q('#t-teach').hidden = v !== 'teach';
  prep.hidden = v !== 'prep';
  for (const b of document.querySelectorAll('.t-views button')) {
    b.setAttribute('aria-pressed', String(b.dataset.view === v));
  }
  // Prep is a scroll container with nothing focusable inside it, so opening it has
  // to hand it focus or a keyboard cannot reach the document at all.
  if (v === 'prep') { renderPrep(); prep.focus(); say('Session plan.'); }
  else if (wasInPrep) q('#t-main').focus({ preventScroll: true });
}

function toggleReveal() {
  const bt = beat();
  if (!bt.gated) return;
  S.revealed = !S.revealed;
  if (!S.revealed) S.ply = 0;
  renderBoard();
  renderSolution();
  renderLine();
  renderTransport();
  markScrollers();
  say(S.revealed ? `Answer shown. ${bt.sanLine || ''}` : 'Answer hidden.');
}

function onKey(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement
    || (t && t.isContentEditable)) return;
  // The character keys are scoped to the console's own controls rather than to the
  // window (WCAG 2.1.4), and they never fire while text is being entered. The header
  // counts as the console: scoping to #t-main alone leaves R and P dead for the rest
  // of the class after the coach clicks a session pill.
  const inConsole = q('#t-main').contains(t) || q('#t-top').contains(t);
  if (e.key === 't' || e.key === 'T') { if (inConsole) setView('teach'); return; }
  if (e.key === 'p' || e.key === 'P') {
    if (inConsole) setView(S.view === 'prep' ? 'teach' : 'prep');
    return;
  }
  // Prep is a document. Every key that scrolls one has to keep scrolling it.
  if (S.view === 'prep') return;
  if (e.key === 'r' || e.key === 'R') { if (inConsole) toggleReveal(); return; }
  const l = line();
  const last = Math.max(0, l.length - 1);
  // Below 1100px the page itself scrolls, and taking Up/Down would strand the
  // panels that sit under the board.
  const scrolls = document.documentElement.scrollHeight > innerHeight + 1;
  if (e.key === 'ArrowRight' && canStep()) { setPly(Math.min(last, S.ply + 1)); e.preventDefault(); }
  else if (e.key === 'ArrowLeft' && canStep()) { setPly(Math.max(0, S.ply - 1)); e.preventDefault(); }
  else if (e.key === 'ArrowDown' && !scrolls) { stepBeat(1); e.preventDefault(); }
  else if (e.key === 'ArrowUp' && !scrolls) { stepBeat(-1); e.preventDefault(); }
}

/** Walking past the last beat of a segment moves to the next segment, not nowhere. */
function stepBeat(d) {
  let s = S.seg, b = S.beat + d;
  while (b < 0) { s -= 1; if (s < 0) { s = 0; b = 0; break; } b = S.segments[s].beats.length - 1; }
  while (b > (S.segments[s].beats.length - 1)) {
    if (s >= S.segments.length - 1) { b = S.segments[s].beats.length - 1; break; }
    b -= S.segments[s].beats.length; s += 1;
  }
  goto(s, b);
}

function goto(s, b) {
  const changedSeg = s !== S.seg;
  S.seg = s; S.beat = b; S.ply = 0; S.revealed = false;
  if (changedSeg) S.clock = { running: false, elapsed: 0, last: 0 };
  renderAll();
  const sg = seg();
  const bt = beat();
  say(`${sg.label}, position ${S.beat + 1} of ${sg.beats.length}.`
    + (bt.prompt ? ` ${bt.prompt}` : '')
    + (bt.fen ? ` ${turnOf(bt.fen)} to move.` : ''));
}

function setPly(p) {
  S.ply = p;
  renderBoard();
  renderLine();
  renderTransport();
  const cur = line()[S.ply];
  // The board is a role="img": stepping it is not an announcement, so the move,
  // the two squares and the new side to move are said here instead.
  say(cur && cur.san
    ? `${cur.san}, ${cur.highlight.join(' to ')}. ${turnOf(cur.fen)} to move.`
    : 'Back to the starting position.');
}

// ------------------------------------------------------------------------ render
function renderAll() {
  clampPly();
  renderHeader();
  renderFlow();
  renderBoard();
  renderFocus();
  renderSolution();
  renderLine();
  renderTransport();
  renderClock();
  if (S.view === 'prep') renderPrep();
  markScrollers();
}

/** Three panels are capped. The one that is actually cut says so, so that a half-visible
 *  line reads as more text rather than as a broken panel. `.t-caption` is on this list
 *  because it is the one box on the route that was cut at EVERY window size and never
 *  said so: teach.css:172 caps it at 11lh with `overflow-y: auto`, the scrollbar takes
 *  0px of layout width in this build, and S115's 185-word core explanation measures 286px
 *  of content in 224px of box - 62px, 33 words, gone with no cue at all. */
const CAPPED = ['.t-focus', '.t-sol-body', '.t-caption'];

function markScrollers() {
  for (const sel of CAPPED) {
    const e = q(sel);
    if (!e) continue;
    e.classList.toggle('clipped', e.scrollHeight > e.clientHeight + 1);
  }
}

/**
 * ...and it has to re-run when the boxes change, not only when the content does. Nothing
 * called markScrollers on resize, so a panel measured at 1440x900 kept its verdict at
 * 1244x620: a 62px cut painted as a complete panel, and the reverse left a fade on a panel
 * with nothing to hide. A ResizeObserver on the three boxes catches every cause - the
 * window, the 820px and 1100px breakpoints, and the rail re-laying out around a reveal -
 * and `.clipped` only paints a mask, so toggling it cannot feed back into layout.
 */
function watchScrollers() {
  if (typeof ResizeObserver !== 'function') { addEventListener('resize', markScrollers); return; }
  const ro = new ResizeObserver(() => markScrollers());
  for (const sel of CAPPED) { const e = q(sel); if (e) ro.observe(e); }
}

/** A ply index only survives a beat change if the new beat's line is that long. */
function clampPly() {
  if (!canStep()) { S.ply = 0; return; }
  S.ply = Math.max(0, Math.min(S.ply, line().length - 1));
}

function renderHeader() {
  const L = S.lesson;
  const c = q('.t-crumb');
  c.querySelector('b').textContent = `Session ${L.session_number}`;
  // The leading space is part of the string, not a flex gap: this line is read aloud
  // and copied as often as it is looked at.
  c.querySelector('span').textContent =
    ` · Stage ${L.stage.number} ${L.stage.name} · Level ${L.level.code}`;
  q('.t-title').textContent = L.title;
  const sg = seg();
  q('.t-seg').innerHTML = '';
  el(q('.t-seg'), 'b', '', sg.label);
  // "pos 1/3" was jargon, and the board's own header two inches below already prints the
  // whole thing in words ("01 / 08 - WARM-UP - POSITION 1 OF 3"), so the chip only has to
  // say where in the session the coach is.
  el(q('.t-seg'), 'span', '', `${S.seg + 1} of ${S.segments.length}`);
  for (const b of document.querySelectorAll('.t-pick button')) {
    b.setAttribute('aria-current', String(b.dataset.id === S.id));
  }
}

const segLabel = (sg, i) =>
  `Segment ${i + 1} of ${S.segments.length}: ${sg.label}`
  + (sg.minutes ? `, ${sg.minutes} minutes` : ', no planned minutes');

/** Built once per session: clicking a row must not delete the row that was clicked. */
function buildFlow() {
  const ol = q('.t-flow');
  ol.innerHTML = '';
  S.segments.forEach((sg, i) => {
    const li = el(ol, 'li');
    const b = el(li, 'button');
    b.type = 'button';
    el(b, 'span', 'n', pad(i + 1));
    el(b, 'span', 'l', sg.label);
    el(b, 'span', 'm', sg.minutes ? `${sg.minutes}m` : '—');
    b.setAttribute('aria-label', segLabel(sg, i));
    b.addEventListener('click', () => goto(i, 0));
  });
}

function renderFlow() {
  const L = S.lesson;
  const h = q('.t-left .t-rail-h');
  h.querySelector('span').textContent =
    `${L.estimated_duration_min} min planned · ${inClassMinutes()} timed`;
  h.querySelector('b').textContent = `${L.age_band.replace('-', '–')} yrs`;
  const rows = q('.t-flow').children;
  for (let i = 0; i < rows.length; i++) {
    rows[i].classList.toggle('on', i === S.seg);
    rows[i].classList.toggle('done', i < S.seg);
    rows[i].firstElementChild.setAttribute('aria-current', i === S.seg ? 'step' : 'false');
  }
  keepCurrentVisible();
}

/** Below 1100px the flow is a horizontal scroller, where the current segment can be
 *  sitting off the right edge. */
function keepCurrentVisible() {
  const ol = q('.t-flow');
  const li = ol.children[S.seg];
  if (!li || ol.scrollWidth <= ol.clientWidth + 1) return;
  const r = li.getBoundingClientRect();
  const o = ol.getBoundingClientRect();
  ol.scrollLeft += (r.left - o.left) - (o.width - r.width) / 2;
}

function renderBoard() {
  const sg = seg();
  const bt = beat();
  const l = line();
  const cur = l[Math.min(S.ply, Math.max(l.length - 1, 0))];
  const fen = (cur && cur.fen) || bt.fen;

  q('.t-beat-h').textContent =
    `${pad(S.seg + 1)} / ${pad(S.segments.length)} · ${sg.label}`
    + (sg.beats.length > 1 ? ` · position ${S.beat + 1} of ${sg.beats.length}` : '')
    + (bt.difficulty ? ` · ${bt.difficulty}` : '');
  const title = q('.t-beat-title');
  title.textContent = bt.prompt || sg.label;
  // A prompt is anything from three words to a 380-character calculation brief, so
  // it gets two type tiers rather than one display size that only suits the short ones.
  title.classList.toggle('long', title.textContent.length > 130);

  const chips = q('.t-beats');
  const n = sg.beats.length > 1 ? sg.beats.length : 0;
  if (chips.children.length !== n || chips.dataset.seg !== String(S.seg)) {
    chips.dataset.seg = String(S.seg);
    chips.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const b = el(chips, 'button', '', String(i + 1));
      b.type = 'button';
      b.setAttribute('aria-label', `Position ${i + 1} of ${n}`);
      b.addEventListener('click', () => goto(S.seg, i));
    }
  }
  for (let i = 0; i < chips.children.length; i++) {
    chips.children[i].setAttribute('aria-current', String(i === S.beat));
  }

  const wrap = q('.t-board-wrap');
  const board = q('.t-board');
  const empty = q('.t-empty');
  q('.t-stage').classList.toggle('no-board', !fen);
  if (fen) {
    if (empty) empty.remove();
    board.hidden = false;
    S.board.render(fen, (cur && cur.highlight) || []);
  } else {
    board.hidden = true;
    if (!empty) {
      el(wrap, 'p', 't-empty', 'No position for this part of the session.');
    }
  }

  const parts = [];
  if (fen) parts.push(`${turnOf(fen)} to move`);
  if (cur && cur.san) parts.push(`after ${cur.san}`);
  q('.t-caption').textContent = sg.body && !bt.prompt ? sg.body : parts.join(' · ');

  renderNotation(fen, l);
}

function renderNotation(fen, l) {
  const bt = beat();
  const sg = seg();
  const gated = Boolean(bt.gated) && !S.revealed;
  q('.t-pos .t-rail-h b').textContent = fen ? (bt.tag || '') : 'none';
  q('.t-fen').textContent = fen || '—';
  q('.t-copy-btn[data-copy="fen"]').disabled = !fen;
  // The movetext is the answer, so the PGN waits for the reveal, and it is dropped
  // entirely when there is no line: a fragment with no moves reads as broken.
  const pgn = !gated && l.length > 1
    ? buildPgn(l[0].fen, l, { event: `${S.id} ${sg.label}${bt.tag ? ` · ${bt.tag}` : ''}` })
    : '';
  q('.t-copy-pgn').hidden = !pgn;
  q('.t-pgn').textContent = pgn;
  q('.t-note').textContent = pgn
    ? 'FEN for a board. PGN for the whole line.'
    : l.length > 1
      ? 'FEN for a board. The PGN comes with the answer.'
      : fen ? 'FEN for a board. No line on this position.'
        : 'Nothing to copy for this part.';
}

let copyTimer = 0;
async function copy(btn) {
  const kind = btn.dataset.copy === 'fen' ? 'FEN' : 'PGN';
  const text = btn.dataset.copy === 'fen' ? q('.t-fen').textContent : q('.t-pgn').textContent;
  const status = q('.t-copy-status');
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = `${kind} copied`;
  } catch {
    status.textContent = 'Copy unavailable';
  }
  btn.classList.add('ok');
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    status.textContent = '';
    for (const b of document.querySelectorAll('.t-copy-btn')) b.classList.remove('ok');
  }, 1600);
}

function renderFocus() {
  const L = S.lesson;
  const bt = beat();
  q('.t-focus .t-rail-h b').textContent = L.id;
  const dl = q('.t-meta');
  dl.innerHTML = '';
  const rows = [
    ['unit', `${L.unit.number} ${L.unit.name}`],
    ['routine', (L.thinking_routine && L.thinking_routine.current !== 'none'
      && L.thinking_routine.current) || '—'],
  ];
  for (const [k, v] of rows) {
    const d = el(dl, 'div');
    el(d, 'dt', '', k);
    el(d, 'dd', '', v);
  }
  // The prompt is already the headline over the board and the caption already carries
  // the segment body. What nothing else shows is the routine this session runs on.
  q('.t-prompt').textContent =
    (L.thinking_routine && L.thinking_routine.focus) || L.learning_objective;
  const hint = q('.t-hintline');
  hint.hidden = !bt.hint;
  hint.textContent = bt.hint ? `Hint: ${bt.hint}` : '';
}

function renderSolution() {
  const bt = beat();
  const sg = seg();
  const has = Boolean(bt.answer || (bt.moves && bt.moves.length) || (sg.bullets || []).length);
  const gated = Boolean(bt.gated) && !S.revealed;
  const body = q('.t-sol-body');
  const reveal = q('.t-reveal');
  const lead = q('.t-sol-lead');
  q('.t-solution .t-rail-h b').textContent = bt.gated ? (S.revealed ? 'revealed' : 'hidden') : 'open';

  // The reveal is a toggle and never leaves the DOM: activating it must not delete
  // the control the coach just used, or focus lands on <body>.
  reveal.hidden = !has || !bt.gated;
  reveal.setAttribute('aria-expanded', String(S.revealed));
  q('.t-reveal-l').textContent = S.revealed ? 'Hide answer' : 'Reveal answer';
  lead.hidden = !gated || !has;
  lead.textContent = 'Hidden so you can ask the room first.';
  body.hidden = gated || !has;
  q('.t-solution').classList.toggle('locked', body.hidden);
  body.innerHTML = '';
  if (!has) {
    lead.hidden = false;
    lead.textContent = 'Nothing to reveal here.';
    return;
  }
  if (gated) return;

  if (bt.sanLine || (bt.moves && bt.moves.length)) {
    el(body, 'p', 'san', bt.sanLine || bt.moves.join(' '));
  }
  if (bt.result) el(body, 'p', '', bt.result);
  if (bt.answer) el(body, 'p', '', bt.answer);
  if ((sg.bullets || []).length && !bt.answer) {
    const ul = el(body, 'ul');
    for (const t of sg.bullets.slice(0, 6)) el(ul, 'li', '', t);
  }
  if ((bt.mistakes || []).length) {
    el(body, 'p', 'san', 'What they will play');
    const ul = el(body, 'ul');
    for (const t of bt.mistakes) el(ul, 'li', '', t);
  }
  if ((sg.questions || []).length) {
    el(body, 'p', 'san', 'Ask the room');
    const ul = el(body, 'ul');
    for (const t of sg.questions.slice(0, 5)) el(ul, 'li', '', t);
  }
}

/** The whole line. Its own renderer because renderSolution returns early on a gated
 *  beat, which used to leave the previous beat's plies on screen. */
function renderLine() {
  const l = line();
  const nav = q('.t-line');
  nav.hidden = !canStep();
  if (nav.hidden) return;
  q('.t-line .t-rail-h b').textContent = `${S.ply}/${l.length - 1}`;
  const ol = q('.t-plies');
  const key = `${S.id}:${S.seg}:${S.beat}`;
  if (ol.dataset.key !== key) {
    ol.dataset.key = key;
    ol.innerHTML = '';
    l.slice(1).forEach((p, i) => {
      const n = i + 1;
      const li = el(ol, 'li');
      const b = el(li, 'button');
      b.type = 'button';
      el(b, 'span', 'no', `${Math.ceil(n / 2)}${n % 2 === 1 ? '.' : '…'}`);
      el(b, 'span', '', p.san);
      b.addEventListener('click', () => setPly(n));
    });
  }
  for (let i = 0; i < ol.children.length; i++) {
    const b = ol.children[i].firstElementChild;
    if (i + 1 === S.ply) b.setAttribute('aria-current', 'step');
    else b.removeAttribute('aria-current');
  }
}

/** Both transports, outside every early return, so a disabled state is never stale. */
function renderTransport() {
  const l = line();
  const sg = seg();
  const last = Math.max(0, l.length - 1);
  const stepping = canStep();
  q('[data-ply="start"]').disabled = !stepping || S.ply === 0;
  q('[data-ply="back"]').disabled = !stepping || S.ply === 0;
  q('[data-ply="next"]').disabled = !stepping || S.ply === last;
  q('[data-ply="end"]').disabled = !stepping || S.ply === last;
  q('.t-prev').disabled = S.seg === 0 && S.beat === 0;
  q('.t-next').disabled = S.seg === S.segments.length - 1 && S.beat === sg.beats.length - 1;
}

function renderClock() {
  const sg = seg();
  const budget = (sg.minutes || 0) * 60;
  const over = budget > 0 && S.clock.elapsed > budget;
  q('.t-clock .t-rail-h b').textContent = sg.label;
  q('.t-time b').textContent = mmss(S.clock.elapsed);
  q('.t-time span').textContent = budget
    ? `/ ${mmss(budget)} planned${over ? ` · over by ${mmss(S.clock.elapsed - budget)}` : ''}`
    : 'no planned minutes';
  const bar = q('.t-bar');
  const pct = budget ? Math.min(1, S.clock.elapsed / budget) : 0;
  bar.querySelector('i').style.width = `${(pct * 100).toFixed(1)}%`;
  bar.classList.toggle('over', over);
  bar.setAttribute('aria-valuenow', String(Math.round(pct * 100)));
  bar.setAttribute('aria-valuetext', budget
    ? `${mmss(S.clock.elapsed)} of ${mmss(budget)}`
    : `${mmss(S.clock.elapsed)}, no planned minutes`);
  q('.t-play').textContent = S.clock.running ? 'Pause' : (S.clock.elapsed ? 'Resume' : 'Start segment');
}

function tick(now) {
  if (S.clock.running) {
    if (S.clock.last) S.clock.elapsed += (now - S.clock.last) / 1000;
    S.clock.last = now;
    renderClock();
  }
  requestAnimationFrame(tick);
}

// -------------------------------------------------------------------- prep view
function renderPrep() {
  const L = S.lesson;
  const root = q('#t-prep');
  root.innerHTML = '';
  const doc = el(root, 'div', 'doc');

  el(doc, 'p', 'kick',
    `${L.id} · Stage ${L.stage.number} ${L.stage.name} · Level ${L.level.code} ${L.level.name} · Unit ${L.unit.number} ${L.unit.name}`);
  el(doc, 'h2', '', L.title);
  if (L.subtitle) el(doc, 'p', '', L.subtitle);

  const facts = el(doc, 'ul', 'facts');
  const f = [
    ['ages', L.age_band.replace('-', '–')],
    ['minutes', `${L.estimated_duration_min} planned`],
    ['timed', `${inClassMinutes()} min`],
    ['puzzles', String((L.puzzles || []).length)],
    ['homework', `${(L.homework && L.homework.estimated_time_min) || 0} min`],
  ];
  for (const [k, v] of f) {
    const li = el(facts, 'li');
    el(li, 'span', 'k', k);
    el(li, 'span', 'v', v);
  }

  sect(doc, 'Learning objective', (s) => el(s, 'p', '', L.learning_objective));
  if ((L.expected_outcomes || []).length) {
    sect(doc, 'By the end they can', (s) => list(s, L.expected_outcomes));
  }
  if (L.thinking_routine) {
    sect(doc, 'Thinking routine', (s) => {
      const r = el(s, 'div', 'routine');
      el(r, 'b', '', L.thinking_routine.current);
      el(r, 'p', '', L.thinking_routine.focus);
    });
  }
  if (L.prerequisites && (L.prerequisites.sessions || []).length) {
    sect(doc, 'Builds on', (s) =>
      el(s, 'p', '', `Sessions ${L.prerequisites.sessions.join(', ')} · concepts: ${(L.prerequisites.concepts || []).join(', ')}`));
  }
  if ((L.materials_required || []).length) {
    sect(doc, 'Materials', (s) => list(s, L.materials_required));
  }

  // Homework has its own section at the foot, with the platform lists in full.
  for (const sg of S.segments) {
    if (sg.key === 'homework') continue;
    sect(doc, `${sg.label}${sg.minutes ? ` · ${sg.minutes} min` : ' · no planned minutes'}`, (s) => {
      if (sg.body) el(s, 'p', '', sg.body);
      if ((sg.bullets || []).length) list(s, sg.bullets);
      if ((sg.questions || []).length) {
        el(s, 'h4', '', 'Questions to ask');
        list(s, sg.questions);
      }
      const withFen = sg.beats.filter((b) => b.fen);
      if (withFen.length) {
        el(s, 'h4', '', `${withFen.length} position${withFen.length > 1 ? 's' : ''}`);
        const ol = el(s, 'ol');
        for (const b of withFen) {
          const li = el(ol, 'li');
          if (b.prompt) el(li, 'span', '', `${b.prompt} `);
          if (b.sanLine || (b.moves || []).length) {
            el(li, 'span', 'san', b.sanLine || b.moves.join(' '));
          }
          el(li, 'br');
          el(li, 'code', '', b.fen);
        }
      }
    });
  }

  const cn = L.coach_notes || {};
  const notes = [
    ['What they wrongly believe', cn.common_misconceptions],
    ['What they will play', cn.typical_mistakes],
    ['How to teach it', cn.coaching_tips],
    ['If they are stuck', cn.ways_to_simplify],
    ['If they are ahead', cn.extensions_for_strong_students],
  ];
  for (const [title, items] of notes) {
    if ((items || []).length) sect(doc, title, (s) => list(s, items));
  }
  if (cn.pacing_notes) sect(doc, 'Pacing', (s) => el(s, 'p', '', cn.pacing_notes));

  const hw = L.homework || {};
  if ((hw.online_practice || []).length || (hw.over_the_board || []).length) {
    sect(doc, `Homework · ${hw.estimated_time_min || 0} min at home`, (s) => {
      if ((hw.online_practice || []).length) { el(s, 'h4', '', 'Online'); list(s, hw.online_practice); }
      if ((hw.over_the_board || []).length) { el(s, 'h4', '', 'Over the board'); list(s, hw.over_the_board); }
      if ((hw.reflection_questions || []).length) { el(s, 'h4', '', 'Reflection'); list(s, hw.reflection_questions); }
    });
  }
  sect(doc, 'Where this comes from', (s) =>
    el(s, 'p', '', 'Curriculum bundle 1.1.0 · every puzzle position and its solution line is'
      + ' machine-checked for legality.'));
}

function sect(parent, title, build) {
  const s = el(parent, 'section');
  el(s, 'h3', '', title);
  build(s);
  return s;
}
function list(parent, items) {
  const ul = el(parent, 'ul');
  for (const t of items) el(ul, 'li', '', t);
  return ul;
}
