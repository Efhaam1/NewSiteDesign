import { el } from './console.js';
import { buildSegments } from '../teach/segments.js';
import { Board2D } from './board2d.js';
import { fmt } from '../util.js';

/**
 * ACT 6 — the system around the session.
 *
 * Act 5 is one session, annotated. This act is what surrounds it, and then how many
 * of them there are. It replaced an eight-card bento on 2026-09-05: the cards were
 * true and the section was a specification sheet, which is the wrong shape for the
 * one screen whose job is to make an academy want the thing.
 *
 * ONE OBJECT, SIX FIGURES, AND A TURN. The middle of the stage holds the session as
 * an ink plate — the artefact a coach teaches from, on the paper room the parent and
 * the photocopier get, which is the tonal cut the film already runs on. Six figures
 * stand around it, three a side, each joined to the plate by a hairline leader, and
 * each is a real count off S115: the parts of the hour, the positions and their
 * grades, the questions the coach asks, the activity, the homework, the coach notes.
 *
 * Then the turn. At t 0.53 the plate gains a ream of itself receding behind it and
 * every one of the six figures CUTS from S115's number to the curriculum's:
 * 8 parts becomes 1,701, 8 positions becomes 1,640, 6 questions becomes 1,247. The
 * labels do not move and the sentences change under them, so the reader does not
 * learn a new diagram — they learn that the one they just read is every session.
 * That is the whole argument of the act and it is the only thing it does.
 *
 * NOTHING HERE IS AN ILLUSTRATION. Every A-figure is counted off showcase.json's
 * S115 at build; every B-figure is a field of inventory.json, which tools/inventory.cjs
 * counts off the curriculum repo's 213 authored session files and `--check` re-counts.
 * The three delivery pathways are pathways.json, copied from the curriculum bundle.
 *
 * NOTHING IS WRITTEN PER FRAME. Every beat is a clamp() on the act's own --t / --e /
 * --h in system.css, including the ream, which is nine box-shadows that fan out from
 * under the plate rather than nine elements — a negative-z child paints ABOVE its
 * parent's own background, so a DOM ream would have covered the plate it copies.
 * This module runs once, at build, and after that the act is CSS and two click handlers.
 */

/** The five coach-note fields authored in all 213 sessions. pacing_notes is in 177. */
const NOTES = ['common_misconceptions', 'typical_mistakes', 'coaching_tips',
  'ways_to_simplify', 'extensions_for_strong_students'];

/** The tier ladder, in the order the bundle grades them. */
const TIERS = ['Foundation', 'Core', 'Challenge'];

/**
 * Short forms of buildSegments' own labels, keyed by its own stable keys, because the
 * rail gives each part an eighth of the plate's width and "Calculate-Out-Loud
 * Combination Game" is not an eighth of anything. The long forms are printed in full on
 * the figure beside the plate and on the sheet, so no name is lost by shortening. Same
 * convention the bento's five-row flow used.
 */
const SHORT = {
  warmup: 'warm-up', intro: 'intro', core: 'core', discussion: 'discuss',
  guided: 'guided', puzzles: 'puzzles', activity: 'activity', homework: 'home',
};

/**
 * One line per track. Every clause is a field of tracks.json, which carries the decision
 * record each one is transcribed from; nothing is composed here beyond the joins. The
 * Challenger line ends on the one piece of its compression that is executed rather than
 * planned — pathways.json's Stage-1 map, 41 sessions delivered as 24 classes.
 */
function trackLine(tr, pw) {
  const line = [tr.blocks, tr.positions, tr.play];
  if (tr.name === 'Challenger' && pw && pw.tracks && pw.tracks.C) {
    const c = pw.tracks.C;
    line.push(`Stage 1 runs in ${c.stage1_classes} classes, not ${pw.tracks.B.stage1_classes}`);
  }
  return line.join(' · ');
}

/**
 * Both readouts are written into the plate and CSS picks which one is on, so a short
 * window prints a whole sentence rather than a clamped one. Same device as pricing.json's
 * `addsShort`, and for the same reason: no window may lose a claim mid-clause.
 */
function noteRow(root, tr, pw) {
  const wrap = el(root, 'p', 'sy-note');
  el(wrap, 'span', 'sy-note-l', trackLine(tr, pw));
  el(wrap, 'span', 'sy-note-s', tr.short || '');
  return wrap;
}

export function buildSystem(root, opts) {
  const { lesson: L, inventory: IN, pathways: PW, tracks: TR, stages } = opts;
  root.innerHTML = '';

  const segs = buildSegments(L);
  // in-class minutes, homework excluded because it is not in class — the same sum
  // /teach prints and act 5's console head carries, so the two cannot drift
  const timed = segs.reduce((a, s) => a + (s.key === 'homework' ? 0 : (s.minutes || 0)), 0);
  const pz = L.puzzles || [];
  const tier = {};
  for (const t of TIERS) tier[t] = pz.filter((p) => p.difficulty === t).length;
  const hw = L.homework || {};
  const notes = NOTES.filter((k) => ((L.coach_notes || {})[k] || []).length).length;
  const asks = ((L.teaching_flow || {}).questions_to_ask || []).length;
  const act = L.practical_activity || {};
  const units = stages.stages.reduce((a, s) => a + s.units.length, 0);
  const levels = stages.stages.reduce((a, s) => a + s.levels.length, 0);

  // --------------------------------------------------------------- the six figures
  // label · what S115 has · what the curriculum has. The second sentence answers
  // "so what" rather than restating the first, because the figure already restates it.
  const SATS = [
    {
      key: 'hour', label: 'The hour',
      a: [String(segs.length), 'parts'],
      an: `${segs.slice(0, 4).map((s) => s.label.toLowerCase()).join(', ')} — and four more,`
        + ' in that order, every time.',
      b: [fmt(IN.segments), 'parts in total'],
      bn: 'The same shape every time. A coach is never handed a blank hour.',
    },
    {
      key: 'pos', label: 'The positions',
      a: [String(pz.length), 'positions'],
      an: `Chosen for this hour and graded — ${tier.Foundation} Foundation,`
        + ` ${tier.Core} Core, ${tier.Challenge} Challenge.`,
      b: [fmt(IN.puzzles), 'positions'],
      bn: `${fmt(IN.tiers.Foundation)} Foundation · ${fmt(IN.tiers.Core)} Core`
        + ` · ${fmt(IN.tiers.Challenge)} Challenge — graded before a coach ever sees them.`,
    },
    {
      key: 'ask', label: 'The questions',
      a: [String(asks), 'to ask'],
      an: 'The questions the coach puts to the room, written into the session.',
      b: [fmt(IN.questions), 'to ask'],
      bn: 'Nobody has to invent the discussion on the drive to class.',
    },
    {
      key: 'act', label: 'The activity',
      a: [String(act.duration_min || 0), 'min'],
      an: `${act.name} — setup, instructions, and what counts as success.`,
      b: [fmt(IN.activities), 'activities'],
      bn: 'One written for every session. Not a game to burn the last twenty minutes.',
    },
    {
      key: 'hw', label: 'The homework',
      a: [String(hw.estimated_time_min || 0), 'min at home'],
      an: `${(hw.online_practice || []).length} online, ${(hw.over_the_board || []).length} over`
        + ` the board, ${(hw.reflection_questions || []).length} to think about.`,
      b: [fmt(IN.homework.minutes), 'min at home'],
      bn: `Set for ${IN.homework.sessions} of ${IN.sessions} sessions. Homework never starts`
        + ' from a blank page.',
    },
    {
      key: 'notes', label: 'The coach notes',
      a: [String(notes), 'notes'],
      an: 'What they get wrong, the usual mistakes, the tips, how to simplify it, how to'
        + ' stretch the strong ones.',
      b: [fmt(IN.coachNotes.waysToSimplify), 'sessions'],
      bn: 'All five in every one of them — which is what lets one session fit two ages.',
    },
  ];

  const field = el(root, 'div', 'sy-field');
  const left = el(field, 'div', 'sy-side sy-side-l');
  const wrap = el(field, 'div', 'sy-corewrap');
  const core = el(field, 'div', 'sy-core sy-plate');
  const right = el(field, 'div', 'sy-side sy-side-r');

  // Where each figure sits, and where it comes in. Column is semantic — left is what is
  // IN the hour, right is what is around it — and the DEAL alternates sides so the diagram
  // fills evenly: dealt in document order the whole left column arrived first.
  const DEAL = [0, 2, 4, 1, 3, 5];
  const sats = [];
  SATS.forEach((s, i) => {
    const box = el(i < 3 ? left : right, 'div', 'sy-sat');
    box.dataset.lit = s.key;
    el(box, 'p', 'sy-l mono', s.label);
    const fig = el(box, 'p', 'sy-n num');
    const av = el(fig, 'span', 'sy-one');
    el(av, 'b', '', s.a[0]);
    el(av, 'small', '', s.a[1]);
    const bv = el(fig, 'span', 'sy-all');
    el(bv, 'b', '', s.b[0]);
    el(bv, 'small', '', s.b[1]);
    const gl = el(box, 'p', 'sy-g');
    el(gl, 'span', 'sy-one', s.an);
    el(gl, 'span', 'sy-all', s.bn);
    el(box, 'i', 'sy-r').setAttribute('aria-hidden', 'true');
    box.style.setProperty('--o', String(DEAL[i]));
    sats.push(box);
  });

  buildCore(core, L, segs, timed, pz, PW, TR, { units, levels, sessions: IN.sessions });
  // the sheet is built into the wrapper, BEFORE the plate, so the plate's edge covers it
  wrap.append(buildSheet(L), core);

  // Hovering a figure lights the part of the plate it names. An enhancement only —
  // nothing on the plate depends on it and a coarse pointer never sees it, so the
  // diagram is complete for a reader who never moves the mouse.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    for (const box of sats) {
      box.addEventListener('pointerenter', () => { field.dataset.lit = box.dataset.lit; });
      box.addEventListener('pointerleave', () => { delete field.dataset.lit; });
    }
  }

  return field;
}

/**
 * The artefact. An opaque ink plate that does NOT take the paper lift — the same
 * decision act 5's console made and for the same reason: the director ramps --fg,
 * --line and --glass as the room turns to paper, so a translucent plate here becomes
 * a cream panel with mid-grey type on it. It re-declares those tokens locally at
 * tokens.css's dark-room values, so every rule inside can keep saying var(--line).
 */
function buildCore(core, L, segs, timed, pz, PW, TR, count) {
  const head = el(core, 'div', 'sy-head2');
  const slot = el(head, 'div', 'sy-board');
  const bd = new Board2D(el(slot, 'div'));
  // position 4 of 8, the x-ray battery — the same position act 5's console opens on, so
  // the artefact the reader met one scroll ago is the artefact standing here.
  const shown = (pz[3] || pz[0] || {});
  if (shown.fen) bd.render(shown.fen);
  const cap = el(head, 'p', 'sy-bcap mono');
  el(cap, 'b', '', `P${pz.indexOf(shown) + 1} of ${pz.length} · ${shown.difficulty || ''}`);
  // side to move off the FEN, not off side_to_move: the bundle writes 'b'/'w' there and
  // the field the reader can check is the position itself. Same derivation console.js uses.
  const turn = (shown.fen || '').split(' ')[1] === 'b' ? 'black' : 'white';
  el(cap, 'span', '', `${turn} to move`);
  const crumb = el(head, 'p', 'sy-crumb mono');
  el(crumb, 'b', '', L.id);
  el(crumb, 'span', '', ` · stage ${L.stage.number} ${L.stage.name}`
    + ` · level ${L.level.code} · unit ${L.unit.number}`);
  el(head, 'h3', 'sy-t', L.title);
  el(head, 'p', 'sy-sub', L.subtitle);
  // The session names the ones it comes after. This is the field the curriculum uses to
  // decide what a class does next, and it is why nobody has to choose.
  const pre = ((L.prerequisites || {}).sessions || []);
  const row = el(head, 'p', 'sy-pre mono');
  if (pre.length) {
    el(row, 'span', '', 'taught after');
    el(row, 'b', '', pre.join(' · '));
  }
  // The ream's own count, on the one line of the plate that is about where this session
  // SITS — which is the question the count answers. It arrives with the fan. It used to
  // sit in the crumb and was ellipsising it at every window, even at opacity 0.
  const many = el(row, 'span', 'sy-many');
  el(many, 'b', 'num', `× ${count.sessions}`);
  el(many, 'span', '', `sessions · ${count.levels} levels · ${count.units} units`);

  // ------------------------------------------------------------------- the hour
  // Eight parts, each as wide as its own minutes. The puzzles part is lit because that
  // is the part act 5's console was open on, one scroll ago.
  const hour = el(core, 'div', 'sy-hour');
  hour.dataset.part = 'hour';
  const hk = el(hour, 'p', 'sy-k mono');
  el(hk, 'span', '', 'the hour');
  el(hk, 'em', '', `${L.estimated_duration_min} min planned · ${timed} timed`);
  const rail = el(hour, 'ul', 'sy-rail');
  for (const s of segs) {
    const li = el(rail, 'li');
    if (s.key === 'puzzles') li.className = 'is-on';
    el(li, 'span', 'sy-seg', SHORT[s.key] || s.label);
    el(li, 'span', 'sy-min num', s.minutes ? `${s.minutes}m` : '');
  }

  // --------------------------------------------------------------- the positions
  const pos = el(core, 'div', 'sy-pos');
  pos.dataset.part = 'pos';
  const pk = el(pos, 'p', 'sy-k mono');
  el(pk, 'span', '', 'the positions');
  el(pk, 'em', '', `${pz.length} graded`);
  const chips = el(pos, 'ul', 'sy-chips');
  const chipEls = [];
  pz.forEach((p, i) => {
    const li = el(chips, 'li');
    li.dataset.tier = p.difficulty;
    el(li, 'b', '', `P${i + 1}`);
    el(li, 'span', 'sy-stars', '●'.repeat(p.difficulty_stars || 1));
    el(li, 'span', 'sy-tier', p.difficulty);
    el(li, 'span', 'sy-rule');
    chipEls.push(li);
  });

  // ---------------------------------------------------------------- the two ways
  // ADR-0004's two delivery tracks over one syllabus, via tracks.json — every clause of
  // which carries the decision record it was transcribed from. Pressing one re-grades the
  // eight positions above by that track's own rule and prints that track's own parameters.
  // The re-grade is not a dimming for effect: the tier on every puzzle is authored in the
  // bundle, and the plan's own words for Explorer are "a subset (4-5 of the 8, the
  // Foundation/Core tier)" — which for S115 is exactly the five this lights.
  const ways = el(core, 'div', 'sy-ways');
  const wk = el(ways, 'p', 'sy-k mono');
  el(wk, 'span', '', TR.label);
  el(wk, 'em', '', TR.aside);
  const bar = el(ways, 'div', 'sy-bar');
  const note = { el: null };
  const keys = Object.keys(TR.tracks);
  const btns = [];

  const pick = (key) => {
    for (const b of btns) b.setAttribute('aria-pressed', String(b.dataset.track === key));
    const tr = TR.tracks[key];
    if (note.el) note.el.remove();
    note.el = noteRow(ways, tr, PW);
    for (const li of chipEls) li.dataset.state = tr.tier[li.dataset.tier] || 'the set';
    ways.dataset.track = key;
  };

  for (const key of keys) {
    const tr = TR.tracks[key];
    const b = el(bar, 'button', 'sy-way');
    b.type = 'button';
    b.dataset.track = key;
    el(b, 'b', '', tr.name);
    el(b, 'span', 'mono', `ages ${tr.ages}`);
    b.addEventListener('click', () => pick(key));
    btns.push(b);
  }
  // Challenger is the default, because S115 is a stage-3 mate-in-three written for 10-12
  // and every other figure on this stage was counted with all eight of its positions in.
  pick('challenger');

}

/**
 * The homework, as paper. Dark is what the coach teaches from and light is what goes
 * home — the film's own tonal cut — so the one thing that leaves the artefact leaves it
 * as a sheet. Real homework off the bundle: one line each from the three lists S115
 * actually carries, and the minutes it is written to take.
 */
function buildSheet(L) {
  const hw = L.homework || {};
  const sheet = document.createElement('div');
  sheet.className = 'sy-sheet';
  sheet.dataset.part = 'hw';
  sheet.setAttribute('aria-hidden', 'true');
  el(sheet, 'p', 'sy-sk mono', `${L.id} · homework · ${hw.estimated_time_min || 0} min at home`);
  const ul = el(sheet, 'ul', 'sy-hwl');
  const first = (a) => (a && a.length ? a[0] : '');
  for (const [k, v] of [['online', first(hw.online_practice)],
    ['over the board', first(hw.over_the_board)],
    ['to think about', first(hw.reflection_questions)]]) {
    if (!v) continue;
    const li = el(ul, 'li');
    el(li, 'span', 'mono', k);
    el(li, 'span', '', v);
  }
  return sheet;
}
