import { el } from './console.js';
import { buildSegments } from '../teach/segments.js';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/**
 * The payoff surface for act 1: one real session, opened.
 *
 * It is deliberately NOT act 5's console. The console is the whole instrument and
 * it is vertical; this is the hour as a TIMELINE, laid out on the page's own
 * eight-file lattice above the eight squares of rank 4 that light underneath it.
 * The correspondence is the COUNT, eight and eight — the room is in perspective,
 * so the cells are not registered to the squares and nothing here pretends they
 * are. Same session as the console — S115 — so the reader who has already met it
 * here meets it again at full size four acts later.
 *
 * Every figure comes out of the bundle. `buildSegments` is the same function
 * /teach and the console use, so the eight rows are the eight segments a coach
 * actually steps through, in order, with the minutes the bundle wrote — and the
 * four that carry no in-class minutes print an em dash rather than a number,
 * exactly as the console does. Nothing here is composed for the shot.
 *
 * Returns the segment count, because load.js files its material into one pile per
 * segment and the two must agree about how many there are.
 */
export function buildSunday(root, lesson, catalog) {
  if (!root) return 8;
  const segs = buildSegments(lesson);

  const head = el(root, 'div', 'sr-head');
  el(head, 'p', 'sr-lede mono', 'the hour, already planned');
  const line = el(head, 'p', 'sr-line');
  el(line, 'b', 'sr-id num', lesson.id);
  el(line, 'span', 'sr-title', lesson.title);
  const st = lesson.stage || {};
  const lv = lesson.level || {};
  const un = lesson.unit || {};
  el(head, 'p', 'sr-meta mono',
    [`stage ${st.number} ${String(st.name || '').toLowerCase()}`,
      `level ${lv.code}`,
      `unit ${un.number} ${String(un.name || '').toLowerCase()}`,
      `ages ${lesson.age_band}`].filter(Boolean).join(' · '));

  // ------------------------------------------------------------- the eight cells
  const ol = el(root, 'ol', 'sr-strip');
  ol.setAttribute('aria-label', `The ${segs.length} segments of session ${lesson.id}, in order`);
  ol.style.setProperty('--n', String(segs.length));
  let timed = 0;
  segs.forEach((sg, i) => {
    const li = el(ol, 'li', 'sr-cell');
    li.style.setProperty('--i', String(i));
    el(li, 'i', 'sr-sq mono', FILES[i] || '');
    el(li, 'i', 'sr-no mono', String(i + 1).padStart(2, '0'));
    el(li, 'span', 'sr-name', sg.label);
    // A segment with no in-class minutes is not a zero: puzzles and guided
    // practice take as long as the room takes. The console prints an em dash and
    // so does this.
    el(li, 'b', 'sr-min num', sg.minutes ? `${sg.minutes}m` : '—');
    if (sg.minutes) timed += sg.minutes;
  });

  // ---------------------------------------------------------------------- the foot
  const foot = el(root, 'p', 'sr-foot mono');
  const routine = (lesson.thinking_routine || {}).current;
  el(foot, 'span', 'sr-budget',
    [`${lesson.estimated_duration_min} min planned`, `${timed} timed`,
      `${(lesson.puzzles || []).length} puzzles chosen`,
      routine ? `routine ${routine}` : ''].filter(Boolean).join(' · '));
  // The answer to the beat three lines above this one. Not a claim — the next row
  // of the catalog.
  const next = ((catalog && catalog.sessions) || [])
    .find((x) => x.n === (lesson.session_number || 0) + 1);
  if (next) {
    const nx = el(foot, 'span', 'sr-next');
    el(nx, 'i', 'sr-then', 'then');
    el(nx, 'b', 'num', next.id);
    el(nx, 'span', '', next.title);
  }
  return segs.length;
}
