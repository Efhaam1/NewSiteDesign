import { el } from './console.js';

const HUE = { 1: '#3fa57a', 2: '#4a8bd0', 3: '#9070ce', 4: '#d2604b', 5: '#c9a227' };

// numeric ranges are en dashes on this page; the bundle writes hyphens
const dash = (s) => s.replace('-', '–');

/**
 * One escalating sentence across five screens. Each line is what the child can
 * actually do once that stage's checkpoint is behind them, so the type carries
 * the progression rather than describing it.
 */
const CLAIM = [
  ['They learn the board, and finish a game.',
   'The queen mate, the two-rook mate, the fork, the pin, the skewer.'],
  ['They start seeing two moves ahead.',
   'The whole fork family, the discovered check, mate in two.'],
  ['They stop guessing and start judging.',
   'Who is better, and why. Isolated pawns, outposts, the Lucena position.'],
  ['They convert an advantage instead of hoping.',
   'Attacking a castled king, forced lines, the clock, the nerves.'],
  ['They find ideas of their own.',
   'Annotating a game, using an engine well, finding a style.'],
];

/**
 * Five panels, one per stage, each dealt from stage_index data. The checkpoint
 * line is not marketing: it is the real checkpoint session that stands between
 * a child and the next piece.
 */
export function buildStages(panelsEl, gatesEl, stages, catalog, headEl, subEl) {
  // A stage's checkpoints: its mid-stage assessment and its graduation. The last
  // graduation in the curriculum is typed `milestone`, so both types count.
  const checks = {};
  for (const s of catalog.sessions) {
    if (s.type !== 'assessment' && s.type !== 'milestone') continue;
    (checks[s.stage] = checks[s.stage] || []).push(s);
  }
  const panels = [];

  stages.stages.forEach((st, i) => {
    const p = el(panelsEl, 'article', 'stage-panel');
    p.style.setProperty('--sc', HUE[st.number]);
    p.dataset.stage = String(st.number);

    const top = el(p, 'div', 'sp-top');
    el(top, 'span', 'sp-n', `stage 0${st.number} · ${st.slug}`);
    // Every stage is 'ready' in bundle 1.1.0, so the first branch is the rendering
    // of a partial bundle rather than of this one — build-stages.ts still emits
    // 'coming' and 'partial', so it stays.
    el(top, 'span', 'sp-status',
      st.status === 'coming' ? 'next to be written' : `all ${st.sessionsAuthored} ready`);

    el(p, 'h3', 'sp-name', st.piece);
    el(p, 'p', 'sp-theme', st.theme);

    const g = el(p, 'div', 'sp-grid');
    const puzzles = catalog.sessions.reduce(
      (t, s) => (s.stage === st.number ? t + (s.puzzles || 0) : t), 0);
    for (const [k, v] of [
      // 'ages' promised the stage's range and delivered its ENTRY band: stage 1 prints
      // 5-7 while 18 of its 41 sessions are authored 7-9. 'plays at' likewise describes
      // the level of play inside the stage, which is what ratingBand is - never an
      // outcome the documents promise.
      ['entry age', dash(st.ageBand)],
      ['plays at', dash(st.ratingBand)],
      ['puzzles', String(puzzles)],
    ]) {
      const d = el(g, 'div');
      el(d, 'span', 'k', k);
      el(d, 'span', 'v', v);
    }

    const lv = el(p, 'ul', 'sp-levels');
    for (const l of st.levels) {
      const li = el(lv, 'li');
      el(li, 'code', '', l.code);
      el(li, 'span', '', l.name);
    }

    const un = el(p, 'ul', 'sp-units');
    for (const u of st.units) el(un, 'li', '', u.name);

    const cs = checks[st.number] || [];
    const gate = el(p, 'p', 'sp-gate');
    if (cs.length > 1) {
      // There is no piece after the queen, so the last panel cannot promise one. The
      // others name the piece rather than saying 'the next piece' five times.
      const closer = i === stages.stages.length - 1
        ? 'That graduation is the last session in the curriculum.'
        : `Pass it and the ${stages.stages[i + 1].piece.toLowerCase()} is theirs.`;
      // Scoped to the eight test puzzles, which is the part that is true: every
      // checkpoint's 8 puzzles are new, but S021, S041 and S063 revisit earlier
      // positions in their review blocks, so the SESSION is not all-unseen.
      gate.innerHTML = `Two checkpoints — one mid-stage, one to graduate. <b>Eight positions</b> each, none the child has seen before. ${closer}`;
    } else if (cs.length) {
      gate.innerHTML = 'One checkpoint — <b>eight positions</b>, none the child has seen before.';
    } else {
      gate.remove();
    }
    panels.push(p);

    const li = el(gatesEl, 'li');
    el(li, 'span', 'g-n', `0${st.number}`);
    el(li, 'span', 'g-name', st.piece);
  });

  let shown = -1;
  return function show(idx) {
    if (headEl && idx !== shown) {
      shown = idx;
      headEl.textContent = CLAIM[idx][0];
      subEl.textContent = CLAIM[idx][1];
      headEl.classList.remove('swap-in');
      subEl.classList.remove('swap-in');
      void headEl.offsetWidth;
      headEl.classList.add('swap-in');
      subEl.classList.add('swap-in');
    }
    panels.forEach((p, i) => p.classList.toggle('on', i === idx));
    [...gatesEl.children].forEach((li, i) => {
      li.classList.toggle('on', i === idx);
      li.classList.toggle('done', i < idx);
    });
  };
}
