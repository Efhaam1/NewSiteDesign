import { el } from './console.js';
import { parseFen, GLYPH } from './board2d.js';
import { FILES } from '../util.js';

/**
 * Three coaches, one class, one instrument.
 *
 * The act argues once, in four beats, at reading scale, on the same frames the room
 * argues it at board scale:
 *
 *   BEFORE   three columns, and in each one the SAME board — the position a class
 *            starts from — with a different coach's hour drawn over it. Eighteen
 *            arrows at once, eight of them, and two moves on an otherwise untouched
 *            board. Three good coaches in
 *            DESCENDING rating, one class, three visibly different KINDS of marking,
 *            a verdict under each, and one line at the foot that turns the whole
 *            thing on the reader. Readable with the words blurred out, and the FM is
 *            the one whose hour has no practice in it.
 *   MERGE    the middle column leaves in place, the outer two walk into its track,
 *            and in the room 88 sheets land on the d-file on the same t.
 *   AFTER    what they land as is the FOURTH CARD, three cards wide: the monogram and
 *            the brand on the left, the five things a coach opens on the right, and
 *            along its foot the whole curriculum as five stage rails — 41 / 44 / 44 /
 *            44 / 40 ticks, one a session, 213 in all, drawing in stage by stage.
 *            Same plate as the three, same eyebrow and foot, one landscape instead of
 *            three portraits, so the comparison is card to card.
 *   HANDOVER everything the card says leaves ahead of the rule it says it on, so the
 *            last thing standing is one lit vertical line on the file act 2 lights.
 *
 * THIS COMPOSITION IS THE FOUNDER'S OWN REFERENCE, twice over, and the second pass is
 * why it looks like this rather than like a card. On 2026-09-03 they asked for the hour
 * to become a picture — "more visually appealing and delivers the message" — plus an
 * exaggerated characteristic named on every card, "puzzles every class", "a game every
 * class". The first build of that shipped as three plated cards with a slot meter and a
 * small lettered medallion; they rejected it against their own image — "i dont like the
 * current design make the same one as shown in the reference img" — so this is that
 * image: no plate, one hairline over each column, a large ringed avatar, the name at
 * display size with the title chip and the rating inline beside it, a coordinate-bearing
 * board with the marks in `--rook`, a Fraunces verdict, two lines of consequence, and
 * the closing statement under a rule the full width of the three columns.
 *
 * READ ADR-0014 BEFORE CHANGING THE MARKS. Its predecessor ADR-0011 built one real
 * position annotated four ways — 2 arrows, 7, every legal move — and the founder
 * overturned it on the record: "the three cards must show three coaching METHODOLOGIES,
 * not three analyses of a chess position." What keeps this one on the right side of that
 * line is that the three overlays are three different KINDS of mark, not three counts of
 * one kind: an opening explained to death, a worksheet stamped over a lesson, two moves
 * and then nothing. And every card says what its coach DOES, in words, directly above
 * the picture of it.
 */

/**
 * ILLUSTRATION, not data. Read this before printing anything new from it.
 *
 * WHAT TRACES, and to where. `who`, `title`, `rating` and the years are ADR-0014's
 * authored record, upstream at `site/src/components/landing/CoachVariance.tsx`
 * L84-118 — invented names, invented methods, no real coach named, rated or ranked.
 * The rating line is the inversion the whole argument rests on: the cards run in
 * DESCENDING rating and the titled 2200+ is the one whose hour has no practice in it.
 * Drop the ratings and the act argues only "coaches differ", which no academy owner is
 * afraid of.
 *
 * WHAT DOES NOT TRACE. The marks and the verdicts. Upstream types a coach's hour as
 * `Kind[]` — bare 'explain' / 'puzzle' / 'game' / 'discuss', no durations (L59, L70) —
 * so the eighteen arrows, the eight and the two are a drawing of that kind
 * at that density and nothing more. They print no figure and they are never offered as
 * a count of anything in the bundle.
 *
 * WHAT THIS ACT NO LONGER PRINTS, and it is worth knowing why. Two earlier passes put
 * numbers on the problem side: sixteen per-beat bar lengths, then one meter a coach at
 * 25 / 48 / 32 of the fifty-minute slot. Both were ADR-0014's authored apportionment
 * rather than anything countable in bundle 1.1.0, and the founder's reference has
 * neither — so the problem side now carries no invented figure at all, and every number
 * still on screen in this act is the bundle's: the age band and the slot in the kicker,
 * and S012's id, title, five segment minutes, puzzle count and homework minutes on the
 * surface the three columns resolve into.
 */
const COACHES = [
  {
    who: 'Coach A', title: 'FM', rating: '2200+', years: '8+ yrs experience',
    // The exaggerated characteristic, in the register the founder asked for. It is the
    // card's claim; the board under it is the picture of that claim.
    method: 'A lecture every class.',
    // A LECTURE DRAWN ON THE OPENING. Eighteen arrows and every one of them is a legal
    // first move from this position — four centre pawns, both knights, both bishops on
    // two squares each, the queen, and black's four replies. That is what "he explained
    // everything he knows" looks like drawn on a board, and it is why they are legal:
    // the founder's word for arrows between arbitrary squares was "weird", and a chess
    // arrow that goes nowhere a piece could go reads as a scratch rather than as a coach
    // explaining something.
    // Coordinates are grid, not algebraic: x = file a..h as 0..7, y = 0 at rank 8.
    marks: [
      ['a', 4, 6, 4, 4], //  e2-e4
      ['a', 3, 6, 3, 4], //  d2-d4
      ['a', 2, 6, 2, 4], //  c2-c4
      ['a', 5, 6, 5, 4], //  f2-f4
      ['a', 6, 7, 5, 5], //  Ng1-f3
      ['a', 1, 7, 2, 5], //  Nb1-c3
      ['a', 5, 7, 2, 4], //  Bf1-c4
      ['a', 5, 7, 1, 3], //  Bf1-b5
      ['a', 2, 7, 6, 3], //  Bc1-g5
      ['a', 3, 7, 7, 3], //  Qd1-h5
      ['a', 6, 6, 6, 5], //  g2-g3
      ['a', 1, 6, 1, 5], //  b2-b3
      ['a', 4, 1, 4, 3], //  e7-e5
      ['a', 3, 1, 3, 3], //  d7-d5
      ['a', 6, 0, 5, 2], //  Ng8-f6
      ['a', 1, 0, 2, 2], //  Nb8-c6
      ['a', 2, 0, 6, 4], //  Bc8-g4
      ['a', 5, 0, 2, 3], //  Bf8-c5
    ],
    stroke: 0.17, draw: 0.045,
    verdict: 'Overloaded.', cost: ['Too many ideas. No focus.', 'Kids get lost, not better.'],
    // What a screen reader is told the picture is. Not the position — what the coach did
    // to it.
    alt: 'The opening position under eighteen arrows at once.',
  },
  {
    who: 'Coach B', rating: '1600', years: '5+ yrs experience',
    method: 'Puzzles every class.',
    // THE MIDDLE OF THE THREE, and it has to READ as the middle: many, moderate, few is
    // what the row argues at a glance. Eight arrows against A's eighteen and C's two.
    // The numbered chips that were here came off on the founder's note — "remove 1234
    // thing in coach b chess board" — so all three boards now speak one vocabulary and
    // what separates them is the hand, not the mark: eighteen ideas at once, eight, two.
    // The METHOD is still stated in words directly above the board, which is where the
    // founder asked for it in the first place.
    marks: [
      ['a', 4, 6, 4, 4], //  e2-e4
      ['a', 3, 6, 3, 4], //  d2-d4
      ['a', 6, 7, 5, 5], //  Ng1-f3
      ['a', 1, 7, 2, 5], //  Nb1-c3
      ['a', 5, 7, 2, 4], //  Bf1-c4
      ['a', 4, 1, 4, 3], //  e7-e5
      ['a', 6, 0, 5, 2], //  Ng8-f6
      ['a', 5, 0, 2, 3], //  Bf8-c5
    ],
    stroke: 0.15, draw: 0.05,
    verdict: 'Unbalanced.', cost: ['Some good moments,', 'but no clear structure.'],
    alt: 'The opening position under eight arrows.',
  },
  {
    who: 'Coach C', rating: '900', years: '3+ yrs experience',
    method: 'A game every class.',
    // TWO MOVES AND THEN NOTHING: 1. e4 c5, one from each side, fat and slow, on a board
    // that is otherwise untouched. They are on DIFFERENT files on purpose — drawn on the
    // e-file both ways, 1. e4 e5 reads as one arrow pointing at itself rather than as two
    // moves. The empty board IS the verdict: this is the column where what is missing has
    // to be the visible part.
    marks: [
      ['a', 4, 6, 4, 4], //  e2-e4
      ['a', 2, 1, 2, 3], //  c7-c5
    ],
    stroke: 0.26, draw: 0.09,
    verdict: 'Too little.', cost: ['Not enough challenge.', 'Kids get bored, not better.'],
    alt: 'The opening position with two moves drawn on it and nothing else.',
  },
];

/**
 * The board every card marks up, and the ONE piece of chess on this side of the act that
 * is not an illustration: the starting position, which is a fact about the game rather
 * than a figure that has to trace to the bundle.
 *
 * It is the same on all three cards, which is what lets the act say "the same session"
 * and mean it — three coaches, one class, three hours. It is also the densest board
 * there is, and density is what the founder's reference is built on: thirty-two men
 * under eighteen arrows is legibly a lecture, where four men under eighteen arrows is a
 * mess. And for the age band this session is written for — 5 to 7, printed in the act's
 * own kicker — the board a class starts from IS the starting position.
 *
 * WHAT THIS COST, recorded because it is a real trade. Until 2026-09-03 the three boards
 * carried S012's own FEN from variance.json, which put a real bundle position on the
 * problem side. The act still satisfies 07 §B's density rule from the other side of the
 * convergence — the kicker prints the real slot and age band, and `.cv-one` prints S012's
 * id, title, five segment minutes, puzzle count and homework minutes — so the rule is
 * met by the act, not by every panel in it.
 */
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** The closing statement, under a rule the full width of the three columns. It is the
 *  reference's own last beat and the only place in the act that addresses the reader
 *  directly: everything above it describes three coaches, and this line says what that
 *  means for their academy. The second half is the one line in the act set in the live
 *  act colour, because it is the turn from problem to product — and the product surface
 *  resolves out of the same hue four beats later. */
const CLOSE = ['Different coaches. Different paths. Different outcomes.',
  'Your students deserve better.'];

/** THE ACT'S TIMING, and this file is now the only place it is written. A card is fully
 *  dealt in at its own --bs, and the LAST mark in the whole act has to finish drawing at
 *  t = LAST = 0.40, which is n 2.40 — the exact frame the room finishes sorting its pile
 *  into three heaps (`debris.settle` in director.js; it was n 1.40 until act 1 `sunday`
 *  was inserted and moved this act to index 2. LAST is act-local t, so the retiming was
 *  a comment, not a value). The per-mark stagger is DERIVED from that rather
 *  than typed, so adding or removing a mark re-times its column instead of breaking the
 *  invariant. These three arrays used to be duplicated as `.cv-col:nth-of-type()` rules
 *  in acts.css; they are written onto each card as custom properties instead — one write
 *  per card at build, zero per frame. */
const BS = [0.17, 0.22, 0.27];
/** where each card starts dealing in, and which way it walks at the merge: the outer
 *  two travel inward by one track pitch and the middle one leaves in place, because it
 *  is the track the other two are walking into. */
const CI = [0.06, 0.11, 0.16];
const DIR = [1, 0, -1];
const LAST = 0.40;

const NS = 'http://www.w3.org/2000/svg';
const sv = (parent, tag, at) => {
  const e = document.createElementNS(NS, tag);
  for (const k in at) e.setAttribute(k, at[k]);
  parent.appendChild(e);
  return e;
};

/** four decimal places is plenty in a 0-8 user space and it keeps the markup readable */
const r = (n) => Math.round(n * 10000) / 10000;

/**
 * One arrow, drawn the way a chess site draws one — because the first pass did not,
 * and that was the whole of what was wrong with it.
 *
 * What a chess.com or lichess arrow is, and what this now matches: a THICK shaft
 * (0.15-0.26 of a square, not 0.115), a head about 2.3x the shaft long and 2.9x wide
 * so the point is the loudest part, a small inset off the origin square's centre, and
 * ONE translucent fill rather than a coloured line inside a dark outline. The old
 * two-pass line-with-casing is what made a boardful of them read as pen scratches: at
 * 0.115 wide with a 1.85x casing there was more edge than arrow.
 *
 * Translucency is doing real work here and is not a style choice. Fifteen opaque
 * arrows crossing each other is a hatch pattern; at 0.82 they LAYER, so the reader
 * sees depth where a lecture doubled back on itself — which is the argument of coach
 * A's card. The thin `--ink` halo underneath (paint-order: stroke) is what keeps them
 * findable on both square colours: the two squares are 4.4:1 apart, so no single
 * opaque ink clears WCAG 1.4.11's 3:1 against both, and product.css:101-103 rings act
 * 4's own from/to squares in ink for exactly that reason.
 *
 * The arrow is emitted in its OWN space — translated to the tail, rotated onto the
 * axis — so the draw-on is two CSS declarations and no trigonometry per frame: the
 * shaft scales in x from the tail and the head rides its tip.
 */
function arrow(g, x1, y1, x2, y2, w) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const tail = w * 0.8;
  const hd = w * 2.3, hw = w * 1.45;
  const shaft = Math.max(len - tail - hd, w * 0.35);
  const a = sv(g, 'g', { class: 'cv-ar',
    transform: `translate(${r(x1)} ${r(y1)}) rotate(${r(deg)})` });
  a.style.setProperty('--sh', String(r(shaft)));
  sv(a, 'rect', { class: 'cv-sh', x: r(tail), y: r(-w / 2), width: r(shaft), height: r(w) });
  sv(a, 'path', { class: 'cv-hd',
    d: `M${r(tail + shaft + hd)} 0L${r(tail + shaft)} ${r(hw)}L${r(tail + shaft)} ${r(-hw)}Z` });
}

/**
 * The board a coach marks up: ONE svg element, not 64 divs plus an overlay.
 *
 * Everything is in the same `0 0 8 8` user space — the thirty-two dark squares, the
 * thirty-two men, the rim coordinates and every mark — so a mark's coordinates ARE
 * squares and the alignment is exact by construction at every size from 69px to 267px.
 * It also means the board is one box to lay out instead of sixty-five, and one element
 * to fade.
 *
 * Deliberately NOT `.board2d` and not act 4's component. `.board2d` is asserted by
 * tools/gate.cjs assertion 12 through `document.querySelector`, which takes the FIRST
 * one in the document — an act-1 board carrying that class would silently become the
 * board that gate measures in act 4. product.css:90 also sizes `.board2d` off a
 * container query and fades it on `--k2`, which is act 4's driver and undefined here.
 * The FEN parser is shared (board2d.js), because that is the part where agreeing with
 * act 4 matters; the rendering is not.
 */
function board(parent, fen, coach) {
  const s = sv(parent, 'svg', { class: 'cv-bd', viewBox: '0 0 8 8', role: 'img' });
  s.setAttribute('aria-label', coach.alt);
  sv(s, 'rect', { class: 'cv-lt', x: 0, y: 0, width: 8, height: 8 });
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if ((x + y) % 2) sv(s, 'rect', { class: 'cv-dk', x, y, width: 1, height: 1 });
    }
  }
  // rank 8 first, which is the order parseFen returns and the order y runs here
  const grid = parseFen(fen);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const p = grid[y][x];
      if (!p) continue;
      sv(s, 'image', { class: 'cv-pc', href: `/NewSiteDesign/assets/cburnett/${p.c}${GLYPH[p.t]}.svg`,
        x: x + 0.06, y: y + 0.06, width: 0.88, height: 0.88 });
    }
  }
  // The rim, like a tournament board and like the founder's reference: files along the
  // bottom, ranks down the left, inside the edge squares. Ink at half alpha, which is
  // product.css:104-106's own treatment for act 4's board — dark enough to read on the
  // light squares, quiet enough not to compete with the marks on the dark ones. The
  // whole group is one element so acts.css can drop it below 901px, where a square is
  // 8.6-11px and a coordinate is sub-pixel noise.
  const co = sv(s, 'g', { class: 'cv-co' });
  for (let f = 0; f < 8; f++) {
    const t = sv(co, 'text', { x: f + 0.5, y: 7.78, 'text-anchor': 'middle', 'font-size': 0.3 });
    t.textContent = FILES[f];
  }
  for (let k = 0; k < 8; k++) {
    const t = sv(co, 'text', { x: 0.12, y: k + 0.3, 'font-size': 0.3 });
    t.textContent = String(8 - k);
  }
  return s;
}

/** The avatar: a ring with a person in it, drawn rather than fetched — two shapes, no
 *  asset, no new colour, and it scales with the type because the ring is sized in em.
 *  It is the reference's own mark and it is the one element on the card that carries no
 *  information: it is there because an identity row that starts with a face reads as a
 *  person, and a staffing problem is about people. aria-hidden for the same reason. */
function avatar(parent) {
  const s = sv(parent, 'svg', { class: 'cv-av', viewBox: '0 0 24 24', 'aria-hidden': 'true' });
  sv(s, 'circle', { class: 'cv-ar-o', cx: 12, cy: 12, r: 11.4 });
  sv(s, 'circle', { class: 'cv-ai', cx: 12, cy: 9.4, r: 3.5 });
  sv(s, 'path', { class: 'cv-ai', d: 'M4.9 20.6a7.6 7.6 0 0 1 14.2 0' });
  return s;
}

/** The marks, each in its own group so one custom property times the whole mark. The
 *  stagger is derived, not typed: whatever the count, mark 0 starts at the column's
 *  own --bs and the last one closes at t = 0.40. A one-mark coach would divide by
 *  zero, and would also not be a methodology.
 *  Mark coordinates are GRID indices — x = file a..h as 0..7, y = 0 at rank 8 — the
 *  same space parseFen and the piece loop above use, so a mark and the man it comes
 *  from cannot drift apart. Centres are +0.5 and that conversion happens here, once. */
function marks(s, coach, bs) {
  const g0 = sv(s, 'g', { class: 'cv-mg' });
  const n = coach.marks.length;
  if (n < 2) throw new Error(`compare.js: ${coach.who} needs at least two marks`);
  const step = (LAST - coach.draw - bs) / (n - 1);
  for (let i = 0; i < n; i++) {
    const m = coach.marks[i];
    if (m[0] !== 'a') throw new Error(`compare.js: unknown mark kind ${m[0]}`);
    const g = sv(g0, 'g', { class: 'cv-mk' });
    g.style.setProperty('--d', String(r(step * i)));
    arrow(g, m[1] + 0.5, m[2] + 0.5, m[3] + 0.5, m[4] + 0.5, coach.stroke);
  }
}


/**
 * The claim, and it is written to answer the three verdicts at once. The problem side ends
 * on "Overloaded. / Unbalanced. / Too little." — three failures of one kind, which is that
 * nobody had decided what the hour was. Two sentences, same register.
 */
const CLAIM = 'Written once. Taught the same.';

/**
 * THE ANSWER, in three parts, and each one answers the coach card it stands over.
 *
 * This is the whole reason the payoff exists: the founder's note on it was "its a followup
 * to the 3 coach comparison and then this comes in showing that we fix those problems". So
 * the three columns of the problem get three columns of answer, in the same order and in
 * the same tracks — the fix lands where its failure was.
 *
 *   Coach A  "Overloaded. Too many ideas. No focus."      -> one idea an hour
 *   Coach B  "Unbalanced. No clear structure."            -> the same parts, in order
 *   Coach C  "Too little. Not enough challenge."          -> the practice is already chosen
 *
 * WHAT EACH ONE IS ALLOWED TO SAY. `concept` and `objective` are fields on every session in
 * catalog.json, one each. The five part names come from the bundle too and are read off
 * variance.json rather than typed — and they are the CURRICULUM's parts, not one session's:
 * every lesson in showcase.json carries the identical six `teaching_flow` keys
 * (`warmup_review`, `lesson_introduction`, `core_explanation`, `guided_discussion`,
 * `questions_to_ask`, `guided_examples`), which is what console.js's own SEGMENTS list
 * reads. The MINUTES are not here on purpose: those do vary by session (4 / 6 / 8 minutes
 * of warm-up across S001 / S042 / S115, against 50- and 60-minute slots), and printing one
 * session's budget is exactly what made the earlier version of this panel read as being
 * about S012.
 */
const FIX = (n, parts) => [
  ['One idea an hour.',
    [`Every session names its one concept.`, `${n.sessions} of them, written.`]],
  ['The same parts, in order.',
    [parts.slice(0, 3).join(', ') + ',', parts.slice(3).join(', ') + '.']],
  ['The practice is chosen.',
    [`${n.puzzles} puzzles, and homework`, 'in every session.']],
];

/**
 * Every figure on the panel, counted out of the bundle at build rather than typed. This
 * is the density rule's own test (07 §B) and STATE.md's: a figure that cannot survive a
 * count against app/data/*.json has to come off rather than be adjusted. `catalog.json`
 * carries one record per session with its own puzzle count; `stages.json` carries the
 * five stages and their levels. The age band is the span of every band in the catalogue,
 * which is where act 0's "ages 5-14" comes from too.
 */
function counts(catalog, stages) {
  const ss = catalog.sessions;
  const bands = ss.flatMap((x) => x.ageBand.split('-').map(Number));
  return {
    sessions: ss.length,
    planned: catalog.planned,
    puzzles: ss.reduce((a, x) => a + (x.puzzles || 0), 0).toLocaleString('en-US'),
    stages: stages.stages.length,
    levels: stages.stages.reduce((a, x) => a + (x.levels ? x.levels.length : 0), 0),
    ages: `${Math.min(...bands)}–${Math.max(...bands)}`,
  };
}

export function buildCompare(root, variance, catalog, stages) {
  const s = variance.session;
  const count = counts(catalog, stages);
  root.innerHTML = '';
  // The CSS contract is .converge; the id is what main.js resolves. Setting the
  // class here keeps the built composition and its rules together whatever the
  // container is called in the markup — and drops .compare, whose stale mobile
  // rule in product.css (four auto rows, 6px gap) otherwise wins over
  // .converge's tracks at equal specificity because it is in the later file.
  root.classList.add('converge');

  // Flat, no wrappers: the three columns and the one surface share the same grid
  // tracks, so "three become one" is a track change rather than a second
  // component fading up somewhere else in the frame.
  for (let i = 0; i < COACHES.length; i++) {
    const c = COACHES[i];
    // One CARD a coach, spanning all three of the grid's rows and reproducing them
    // inside itself, so the three heads sit on one baseline, the three boards on one
    // line, and the three verdicts on one baseline at the foot. It is also where the
    // act's per-column reveal band lives: one element a column, with --ci / --dir /
    // --bs / --cc inherited by everything inside it.
    const card = el(root, 'div', 'cv-col');
    card.style.gridColumn = String(i + 1);
    // The card's whole timing, written once, read by acts.css: when it deals in, when
    // its marks start, which way it walks at the merge, and how fast a mark draws —
    // A's eighteen go on fast, B's eight stamp evenly, C's two are slow enough to
    // watch. These used to be three `.cv-col:nth-of-type()` rules, which made the
    // bands depend on sibling position: `.cv-one` is div #4 of `.converge`, so any div
    // inserted ahead of the cards would have shifted every card's --ci onto the wrong
    // column and left the third one at opacity 0 — invisible, with nothing to see in
    // the markup. It also duplicated 0.17 / 0.22 / 0.27 between this file (which needs
    // them to derive the mark stagger) and the sheet. One write, one source.
    card.style.setProperty('--c0', String(CI[i]));
    card.style.setProperty('--bs', String(BS[i]));
    card.style.setProperty('--dir', String(DIR[i]));
    card.style.setProperty('--kw', String(c.draw));
    // The middle card fades on the early band: it has to be gone before the outer two
    // arrive in its track.
    if (DIR[i] === 0) card.style.setProperty('--fa', 'var(--fm)');

    // The identity row, in the order a chess player reads one and in the order the
    // founder's reference sets it: a ringed avatar, then the title chip, the name at
    // display size and the rating inline beside it, then the years underneath. The
    // ratings run DESCENDING A to C, which is the inversion the whole argument rests
    // on: the titled 2200+ is the one whose hour has no practice in it.
    const who = el(card, 'p', 'cv-who');
    avatar(who);
    const id1 = el(who, 'span', 'cv-w1');
    if (c.title) el(id1, 'b', 'cv-ti', c.title);
    el(id1, 'span', 'cv-nm', c.who);
    el(id1, 'span', 'cv-rt num', c.rating);
    el(who, 'span', 'cv-me', c.years);

    // The hour: what this coach does with it, in words, and the same board with that
    // hour drawn over it.
    const seq = el(card, 'div', 'cv-seq');
    el(seq, 'p', 'cv-mo', c.method);
    marks(board(seq, START, c), c, BS[i]);

    // The verdict: one word, then the consequence in two lines — the reference's own
    // shape and its own words. This is what makes the act a problem statement instead
    // of a comparison.
    const cost = el(card, 'span', 'cv-cost');
    el(cost, 'b', 'cv-vd', c.verdict);
    for (const line of c.cost) el(cost, 'span', 'cv-cw', line);
  }

  // The closing statement, spanning all three columns under a rule as wide as they are.
  // It arrives after the last verdict and leaves with the columns, on the same --cc /
  // --fa bands, because it is the last thing the PROBLEM says: the answer is the surface
  // that resolves in its place.
  const end = el(root, 'div', 'cv-end');
  el(end, 'p', 'cv-e1', CLOSE[0]);
  el(end, 'p', 'cv-e2', CLOSE[1]);

  // --------------------------------------------- the standard they land as
  // WHAT THIS FRAME HAS TO DO, because two passes got it wrong. It is the payoff: three
  // hours of somebody's guesswork resolve into the thing you buy. It was S012's flow rail
  // (too much about one session — "dont make it focused on any session"), then a 245px
  // list of labels beside an empty half-frame ("our card is just a little speck on the
  // screen theres so much more u can do with it ... dont just utilise the space,
  // IMPROVE").
  //
  // So it is now the FOURTH CARD, and it is three cards wide. It replaces the row rather
  // than appearing beside it: same plate, same eyebrow-to-foot anatomy, one landscape
  // instead of three portraits. The comparison is card to card, which is the only reason
  // the problem side was three cards in the first place.
  //
  // AND IT SHOWS SOMETHING. Each coach card carries a picture of one hour; a list of five
  // labels cannot answer a picture. So the left half is the whole curriculum drawn at
  // once — 213 cells, one a session, in bundle order, each in its own stage's colour. It
  // is the only figure on the page that is more persuasive as a picture than as a number:
  // "213 of 213 written" is a claim, and a field with no gap in it is the evidence. The
  // five stage colours are curriculum data, not decoration (tokens.css:20-26 — stage
  // colour is declared per stage in the bundle's own index), which is why the five bands
  // sweep through the field in order and need no legend to be read as five stages.
  // Every cell is counted out of catalog.json. If a session were ever unwritten, the
  // field would have a hole in it, and that is the point.
  const one = el(root, 'div', 'cv-one');
  // NO `mono` CLASS on the eyebrow or the foot, and that is a cascade fix rather than a
  // style choice. product.css:224 colours `.mono` `--fg-faint` from a LATER sheet at equal
  // specificity, so a `color` on `.cv-eb` in acts.css silently loses the tie: measured
  // 3.12:1 median and 2.41:1 p10 on 8px type — an SC 1.4.3 failure on the one surface the
  // act is selling. acts.css declares the mono face on them explicitly instead, which is
  // the same fix `.cv-ti` and `.cv-rt` carry. No new act-1 element may carry `mono`.
  el(el(one, 'p', 'cv-eb', 'the standard'), 'b', 'num',
    `${count.sessions} of ${count.planned} written`);

  // ---- the brand and the claim
  // The monogram, and it is the page's own `.mark` — the same masked PNG the nav and act 7's
  // footer set. Reusing the class is deliberate here (it is the one place in this act that
  // WANTS the monogram) and it closes the rhyme the coach cards opened: three of them lead
  // with a person, and this one leads with a mark. Three people, one standard.
  const brand = el(one, 'div', 'cv-brand');
  el(brand, 'span', 'mark').setAttribute('aria-hidden', 'true');
  el(brand, 'h3', 'cv-title', 'Efhaam');
  el(brand, 'p', 'cv-claim', CLAIM);

  // ---- the facts: the brand, the claim, and the five things a coach opens
  // EVERY ROW IS A THING THAT EXISTS, and that is the whole of why it may say them.
  // `Teaching view` and `Prep view` are literally the two views /teach ships and toggles
  // between (teach/main.js:134-144, `setView('prep')` / `'teach'`); act 4 opens the same
  // pair as its console and its "Open prep sheet" control (console.js:342-364).
  // `Positions, copyable` is the copy control on both — FEN in act 4 (console.js:318) and
  // FEN or PGN on /teach (teach/main.js:424).
  // What it does NOT say: worksheets, or anything printed. The print pack is still being
  // built and act 5 says so in as many words (bento.js:136); claiming it here would put
  // the page in disagreement with itself two screens apart.
  // ---- the three fixes, one over each coach
  const fix = el(one, 'div', 'cv-fix');
  const parts = variance.session.segments.map((g) => g.label);
  const rows = FIX(count, parts);
  for (let k = 0; k < rows.length; k++) {
    const [head, body] = rows[k];
    const cell = el(fix, 'div', 'cv-fx');
    // left to right, after the brand lands: 0.628 + 0.036 + 0.035 puts the third at 0.699,
    // inside the 0.70 by which this act has finished moving. 0.018, not 0.022 — at 0.022 the
    // third cell ran to 0.707 and one frame of motion landed inside the 0.70-0.75 hold the
    // room is authored against (director.js:141-143 holds it motionless from n 1.62 to 1.76).
    cell.style.setProperty('--d', String(Math.round(k * 0.018 * 1000) / 1000));
    el(cell, 'h4', 'cv-fh', head);
    const bd = el(cell, 'p', 'cv-fb');
    for (let q = 0; q < body.length; q++) {
      if (q) el(bd, 'br');
      bd.append(body[q]);
    }
  }

  // ---- what a coach opens, on one line. These are the two views /teach ships and toggles
  // between (teach/main.js:134-144) and the copy control on both — FEN in act 4
  // (console.js:318), FEN or PGN on /teach (teach/main.js:424). It does NOT say worksheets
  // or anything printed: the print pack is still being built and act 5 says so in as many
  // words (bento.js:136).
  el(one, 'p', 'cv-open', 'Teaching view · prep view · positions copyable, FEN + PGN');

  // The one verification claim on this panel, and it is act 0's own wording, scoped to
  // chess legality because that is the only thing the checks cover: `bundle:validate`
  // still fails two of its own checks, so nothing on this page may imply the bundle
  // passes every check (STATE.md).
  const foot = el(one, 'p', 'cv-ft',
    `${count.stages} stages · ${count.levels} levels · ages ${count.ages}`);
  el(foot, 'b', 'num', '0 chess errors in 4,702 checks');

  // The shared brief, written from the bundle rather than retyped into the markup
  // (ADR-0011 §5), which is why the kicker ships empty. It no longer opens with "The
  // problem" because the act's own headline says that in display type now.
  const kick = document.getElementById('k-chaos');
  if (kick) {
    kick.textContent = '';
    el(kick, 'span', 'dot');
    kick.append('The same session'
      + ` · ages ${s.ageBand.replace('-', '–')} · one ${s.slotMinutes}-minute slot`);
  }

  // Every reveal is a clamp() on --t in acts.css — the per-column deal-in, every
  // mark's own draw, the crossover, the surface resolving row by row — so this act
  // costs zero per-frame style writes and scrolling back runs it backwards exactly.
  // main.js calls this once and ignores the return.
}
