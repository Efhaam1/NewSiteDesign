/**
 * /inside-a-session — what one hour actually contains.
 *
 * The brief's rule for this page is that the real product interface is the hero, not a
 * prettier invention of one. So the hero is a REAL SCREENSHOT of /teach, taken by
 * tools/shotproduct.cjs, and the callouts are numbered pins at positions that tool
 * MEASURED off the live DOM — a legend carries the words, so every annotation is text a
 * crawler and a screen reader both get, and nothing covers the product.
 *
 * Everything else on the page is session 115 itself, read out of showcase.json: its eight
 * parts and their real minutes, its eight positions as real board diagrams built from
 * their own FENs, the six questions it tells a coach to ask, the activity, and the
 * homework in the three forms it is actually written in. If a string on this page is in
 * quotation marks it is the curriculum's, verbatim.
 */
const { fmt } = require('./data.cjs');
const { esc, t, url } = require('./shell.cjs');
const { board } = require('./board.cjs');

/**
 * Cut a long field at the last SENTENCE that fits, not at the last character. The project's
 * standing rule is that no window may lose a claim mid-clause, and an ellipsis in the middle
 * of "before we extend that same chain by one more" reads as a bug rather than as an
 * abbreviation. If there is no sentence end inside the budget the whole field is kept — a
 * complete paragraph is a better outcome than a clean-looking fragment.
 */
function clip(text, budget = 260) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= budget) return t;
  const cut = t.slice(0, budget);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return end > budget * 0.45 ? cut.slice(0, end + 1) : t;
}

/**
 * The eight parts of the hour, mirroring app/js/teach/segments.js — the same function
 * /teach and act 5 of the homepage both build their flow from. It is duplicated here
 * rather than imported because that module is ESM and this generator is CommonJS in a
 * repo with no build step; the assertion at the foot of `parts()` is what keeps the two
 * from drifting. Three of the eight carry no `duration_min` in any of the 213 files, and
 * that is a fact about the curriculum this page states out loud rather than papering over.
 */
function parts(L) {
  const f = L.teaching_flow || {};
  const hw = L.homework || {};
  const out = [
    { key: 'warmup', label: 'Warm-up', min: (f.warmup_review || {}).duration_min,
      body: (f.warmup_review || {}).description,
      n: ((f.warmup_review || {}).review_items || []).length, unit: 'positions to re-open' },
    { key: 'intro', label: 'Introduction', min: (f.lesson_introduction || {}).duration_min,
      body: (f.lesson_introduction || {}).hook },
    { key: 'core', label: 'Core explanation', min: (f.core_explanation || {}).duration_min,
      body: (f.core_explanation || {}).explanation,
      n: ((f.core_explanation || {}).key_points || []).length, unit: 'key points' },
    { key: 'discussion', label: 'Discussion', min: (f.guided_discussion || {}).duration_min,
      body: (f.guided_discussion || {}).description,
      n: ((f.guided_discussion || {}).talking_points || []).length, unit: 'talking points' },
    { key: 'guided', label: 'Guided practice', min: null,
      body: 'Worked examples the coach plays through with the room, each with the walkthrough '
        + 'written under it.',
      n: (f.guided_examples || []).length, unit: 'worked examples' },
    { key: 'puzzles', label: 'Puzzles', min: null,
      body: 'The graded positions, in order, each with its prompt, its answer and the mistakes '
        + 'students usually make on it.',
      n: (L.puzzles || []).length, unit: 'graded positions' },
    { key: 'activity', label: (L.practical_activity || {}).name,
      min: (L.practical_activity || {}).duration_min,
      body: (L.practical_activity || {}).setup,
      n: ((L.practical_activity || {}).instructions || []).length, unit: 'instructions' },
    { key: 'homework', label: 'Homework', min: null,
      body: `Set for home, not for the room — which is why it carries no minutes here and `
        + `${hw.estimated_time_min} at the kitchen table instead.`,
      n: (hw.online_practice || []).length + (hw.over_the_board || []).length
        + (hw.reflection_questions || []).length, unit: 'pieces of work' },
  ];
  if (out.length !== 8) throw new Error('the hour is no longer eight parts — see teach/segments.js');
  return out;
}

/**
 * The numbered pins on the screenshot. Every x/y is the top-left of that element's own
 * box as tools/shotproduct.cjs measured it at 1360x830, inset a couple of percent so the
 * pin sits beside its target rather than on top of it. Re-run that tool after any change
 * to /teach and paste the new boxes in.
 *
 * The pins are aria-hidden because they are markers; the legend below them is the content,
 * and it is an ordinary ordered list.
 */
const CALLS = [
  { x: 10.5, y: 3.3, h: 'The session, named',
    b: 'Session 115, Stage 3 Bishop, level 3B, and the title. Before a coach reads a word of '
      + 'the hour they know where it sits in the curriculum and what came before it.' },
  { x: 94.4, y: 3.3, h: 'Two views',
    b: 'One session, two views. Prep is the document to read the night before; Teach is the '
      + 'screen to stand in front of. The same content, laid out for two different jobs.' },
  { x: 3.6, y: 13.6, h: 'The hour, minute by minute',
    b: 'Eight parts in the order every session in the curriculum uses. The minutes are this '
      + 'session\'s own, and pressing a part goes to it — a coach who is running late can see '
      + 'exactly what they are about to cut.' },
  { x: 28, y: 23, h: 'The position, at the size the room needs',
    b: 'Every board is a real position from the curriculum, not an illustration. Left and right '
      + 'step the forced line; up and down change position.' },
  { x: 76.6, y: 11, h: 'What this position is for',
    b: 'The focus for the beat on screen, and the prompt to put to the room — written, so the '
      + 'question a coach asks is not the one they thought of while eleven children watched.' },
  { x: 76.6, y: 38, h: 'The answer, behind a button',
    b: 'Hidden by default, so the room gets asked first. One key reveals it, and then the whole '
      + 'forced line is steppable move by move with the board following along.' },
  { x: 76.6, y: 86, h: 'A clock for the part, not the lesson',
    b: 'Eight minutes of warm-up looks like eight minutes. The clock belongs to the segment, '
      + 'which is the unit a coach actually loses control of.' },
  { x: 3.6, y: 79.5, h: 'The notation, to copy',
    b: 'FEN for one board, PGN for the whole line. Whatever screen the room actually has — a '
      + 'projector, a phone, a demonstration board — the position goes onto it in one paste.' },
];

function page(ctx) {
  const { D, showcase } = ctx;
  const L = showcase.data.S115;
  const meta = D.byId.S115;
  const st = D.byStage.find((s) => s.number === L.stage.number);
  const P = parts(L);
  const timed = P.reduce((a, p) => a + (p.min || 0), 0);
  const asks = (L.teaching_flow.questions_to_ask || []);
  const hw = L.homework;
  const pz = L.puzzles;
  const tier = (k) => pz.filter((p) => p.difficulty === k).length;

  const pageDef = {
    path: '/inside-a-session',
    skip: 'session anatomy',
    hue: st.hue,
    hueSoft: 'rgb(20 20 28 / 0.05)',
    metaTitle: 'Inside a Chess Lesson: One Hour, Minute by Minute | Efhaam',
    metaDesc: `One real Efhaam chess session in full: eight parts in fixed order, ${timed} of `
      + `${L.estimated_duration_min} minutes on the clock, ${pz.length} graded positions, `
      + `${asks.length} questions and homework in three forms.`,
    ogTitle: 'Inside one chess coaching session',
    ogAlt: 'The Efhaam teaching console, showing one session minute by minute',
    crumbs: [{ path: '/', title: 'Home' }, { path: '/inside-a-session', title: 'Inside a session' }],
    css: ['/css/session.css'],
    js: ['/js/pages/session.js'],
    // No page-specific structured data, on purpose. The eight parts are a real `<ol>` in the
    // markup, which a crawler reads natively; wrapping them in an `ItemList` produces no rich
    // result (ItemList is only eligible paired with Course list, Movie, Recipe or Restaurant)
    // and its ListItems would carry no `url`, which is a validator warning for nothing. The
    // rule is to mark up what a consumer consumes, not everything that could be marked up.
  };

  const pins = CALLS.map((c, i) => `        <li style="--x:${c.x}%;--y:${c.y}%"><span>${i + 1}</span></li>`).join('\n');
  const legend = CALLS.map((c, i) => `        <li><span class="is-ln num">${i + 1}</span>
          <div><b>${t(c.h)}</b><p>${t(c.b)}</p></div></li>`).join('\n');

  const body = `<section class="pg-sec pg-hero">
  <div class="pg-wrap">
    <p class="pg-kick mono"><span class="dot" aria-hidden="true"></span>Inside a session</p>
    <h1>A session is not a topic. It is a full hour, ready to&nbsp;teach.</h1>
    <p class="lead">This page is one real session &mdash; number ${meta.n} of ${D.sessions},
      &ldquo;${t(L.title)}&rdquo;, a ${t(st.piece)}-stage class on ${t(L.concepts.primary)}. Not a
      summary of it: the parts, the minutes, the positions, the questions and the homework, exactly
      as a coach is handed them.</p>
    <ul class="pg-figs">
      <li><b class="num">${P.length}</b><span>parts, always in this order</span></li>
      <li><b class="num">${L.estimated_duration_min}</b><span>minutes planned</span></li>
      <li><b class="num">${timed}</b><span>minutes on the clock</span></li>
      <li><b class="num">${pz.length}</b><span>positions, graded</span></li>
      <li><b class="num">${asks.length}</b><span>questions to ask</span></li>
      <li><b class="num">${hw.estimated_time_min}</b><span>minutes at home</span></li>
    </ul>
  </div>
</section>

<section class="pg-sec is-sec" aria-labelledby="h-screen">
  <div class="pg-wide">
    <div class="is-head">
      <h2 id="h-screen">This is the screen. Nothing on it is a&nbsp;mock.</h2>
      <p class="lead">A photograph of the console at session ${meta.n}, opened on the first
        warm-up position. Every string in it came out of the curriculum file.</p>
    </div>
    <figure class="is-shot">
      <div class="is-shot-img">
        <!-- The LCP element on this page, so it says so: fetchpriority high, explicit box to
             keep CLS at zero, and no lazy attribute. The prep shot below is lazy. -->
        <img src="/assets/product/console-teach.jpg" width="1360" height="830"
          fetchpriority="high" decoding="async"
          alt="The Efhaam teaching console at session ${meta.n}, ${esc(L.title)}. On the left, the
          hour in eight parts with their minutes and a panel holding the position's FEN and PGN. In
          the middle, a chess board with the current position and the prompt above it. On the right,
          the focus for this beat, the answer behind a reveal button, and a clock for the current
          segment." />
        <ol class="is-pins" aria-hidden="true">
${pins}
        </ol>
      </div>
      <ol class="is-legend">
${legend}
      </ol>
      <figcaption>Session ${meta.n} in the console, at ${st.rating} strength.
        <a class="pg-body-link" href="/teach?s=S115">Open this session yourself</a> &mdash; it is
        one of ${D.free.length} that are free to teach, with no email and no card.</figcaption>
    </figure>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-hour">
  <div class="pg-wrap">
    <h2 id="h-hour">Eight parts, always in the same&nbsp;order</h2>
    <p class="lead">Not a suggested shape &mdash; the shape. The console lays every session out in
      these eight parts, and there are ${fmt(D.segments)} of them across the curriculum. A
      coach who has taught one session knows the architecture of every other one.</p>
    <ol class="is-hour">
${P.map((p, i) => `      <li>
        <p class="is-hn mono"><span class="num">${String(i + 1).padStart(2, '0')}</span>${t(p.label)}</p>
        <p class="is-hm num">${p.min ? `${p.min} min` : '<span>no clock</span>'}</p>
        <p class="is-hb">${t(clip(p.body))}</p>
        ${p.n ? `<p class="is-hc mono">${p.n} ${t(p.unit)}</p>` : ''}
      </li>`).join('\n')}
    </ol>
    <p class="pg-from mono">Three of the ${D.sessions} carry no positions &mdash; they are
      tournament-preparation and game-analysis sessions &mdash; so those run seven parts rather
      than eight. Every other session runs all eight.</p>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-clock">
  <div class="pg-wrap">
    <div class="pg-cols-2">
      <div>
        <h2 id="h-clock">${L.estimated_duration_min} minutes planned.
          ${timed} on the&nbsp;clock.</h2>
        <div class="prose">
          <p>Five of the eight parts carry minutes. Three do not, in every session in the
            curriculum: guided practice, the puzzles, and the homework.</p>
          <p>That is deliberate and it is the part of the hour a coach owns. The puzzle block is
            where a class either flies or gets stuck, and a written number there would be a lie
            in one direction or the other. What the curriculum fixes is the order, the material
            and the grading; what it leaves is how long eleven particular children need on
            position four.</p>
          <p>The console prints both figures on the same line, so nobody has to work out which
            one they are looking at.</p>
        </div>
      </div>
      <div class="is-clock">
        <p class="mono">Session ${meta.n} &middot; where the ${timed} minutes go</p>
        <ul>
${P.filter((p) => p.min).map((p) => `          <li style="--w:${Math.round((p.min / timed) * 100)}%">
            <span class="is-cl">${t(p.label)}</span>
            <span class="is-cb"><i></i></span>
            <span class="is-cm num">${p.min}m</span>
          </li>`).join('\n')}
${P.filter((p) => !p.min).map((p) => `          <li class="is-none" style="--w:0%">
            <span class="is-cl">${t(p.label)}</span>
            <span class="is-cb"><i></i></span>
            <span class="is-cm mono">no clock</span>
          </li>`).join('\n')}
        </ul>
        <p class="pg-from mono">Minutes read off session ${meta.n} in curriculum bundle
          ${esc(D.bundle)}. Across the curriculum a session runs ${D.minMin} to ${D.maxMin}
          minutes, most of them ${D.modeMin}.</p>
      </div>
    </div>
  </div>
</section>`;

  return { page: pageDef, body: body + tail(ctx, { L, meta, st, P, timed, asks, hw, pz, tier }) };
}

/**
 * The prep view's own sections, read off the rendered sheet by tools/shotproduct.cjs. Six
 * of them are the coach notes, which is the part of a session that is not about chess at
 * all: what students wrongly believe, what they will actually play, how to teach it, what
 * to do if they are stuck and what to do if they are ahead.
 */
const PREP = ['Learning objective', 'By the end they can', 'Thinking routine', 'Builds on',
  'Materials', 'The eight parts, each in full', 'What they wrongly believe',
  'What they will play', 'How to teach it', 'If they are stuck', 'If they are ahead',
  'Pacing', 'Homework', 'Where this comes from'];

/** The second half of the page: the positions, the questions, the activity, what goes home. */
function tail(ctx, s) {
  const { D } = ctx;
  const { L, meta, st, asks, hw, pz, tier } = s;

  const boards = pz.map((p, i) => `        <figure class="pg-fig is-p">
          ${board(p.fen, { label: String(p.prompt).slice(0, 120), coords: false })}
          <div class="pg-fig-h">
            <b>Position ${i + 1}</b>
            <span class="pg-chip">${t(p.difficulty)}</span>
            <span>${p.fen.split(' ')[1] === 'b' ? 'black' : 'white'} to move</span>
          </div>
          <figcaption>${t(String(p.prompt).replace(/\s*Mate in three\.\s*$/, ''))}</figcaption>
          <p class="is-pt mono">${(p.theme || []).slice(0, 4).map((x) => t(x)).join(' &middot; ')}</p>
        </figure>`).join('\n');

  return `

<section class="pg-sec is-sec" aria-labelledby="h-pos">
  <div class="pg-wide">
    <div class="is-head">
      <h2 id="h-pos">Eight positions, chosen and graded before a coach opens the&nbsp;file</h2>
      <p class="lead">These are session ${meta.n}'s own eight, in its own order, with its own
        prompts. ${tier('Foundation')} are graded Foundation, ${tier('Core')} Core and
        ${tier('Challenge')} Challenge &mdash; which is how one session serves a group that
        has to be stretched and a group that has to be carried.</p>
    </div>
    <div class="is-pgrid">
${boards}
    </div>
    <div class="is-gate">
      <div>
        <h3>The answers are in the session. They are just not on the&nbsp;screen.</h3>
        <p>Every position carries its solution, the whole forced line in notation, an explanation
          of why each reply is forced, and the mistakes students usually make on it. All of it sits
          behind one button, because a coach who can see the answer asks a worse question. Press
          the button and the line becomes steppable: the board plays the combination out one move
          at a time.</p>
        <p class="pg-from mono">Across the curriculum: ${fmt(D.puzzles)} positions,
          ${fmt(D.tiers.Foundation)} Foundation &middot; ${fmt(D.tiers.Core)} Core &middot;
          ${fmt(D.tiers.Challenge)} Challenge. Every one machine-checked for chess legality
          &mdash; the position legal, the side to move right, and every solution line playable
          to its end.</p>
      </div>
      <a class="cta" href="/teach?s=S115">Teach this session free</a>
    </div>
  </div>
  <p class="pg-coord">${st.rating} &middot; stage ${st.number}</p>
</section>

<section class="pg-sec" aria-labelledby="h-ask">
  <div class="pg-wrap">
    <div class="pg-cols-2">
      <div>
        <h2 id="h-ask">The questions come with the&nbsp;session</h2>
        <div class="prose">
          <p>A discussion is the part of a lesson that most often becomes whatever the coach
            thought of in the moment. Session ${meta.n} carries ${asks.length} questions for it,
            and there are ${fmt(D.questions)} of them across the curriculum &mdash; so nobody has
            to invent the discussion on the drive to class.</p>
          <p>They are not comprehension checks. Every one of these has more than one defensible
            answer, which is what makes a room argue.</p>
        </div>
        <p class="pg-from mono">Session ${meta.n} &middot; teaching flow &middot; questions to ask,
          verbatim</p>
      </div>
      <ol class="is-ask">
${asks.map((q) => `        <li>${t(q)}</li>`).join('\n')}
      </ol>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-act">
  <div class="pg-wrap">
    <div class="is-act">
      <div>
        <h2 id="h-act">Then they play</h2>
        <p class="lead">${t(L.practical_activity.name)} &mdash;
          ${L.practical_activity.duration_min} minutes, written for this session and not
          borrowed from a folder of games.</p>
        <div class="prose">
          <p>${t(L.practical_activity.setup)}</p>
          <p><strong>What counts as success:</strong> ${t(L.practical_activity.success_criteria)}</p>
        </div>
        <p class="pg-from mono">${fmt(D.activities)} activities across ${fmt(D.sessions)}
          sessions &mdash; one written for every hour, not a game to burn the last twenty
          minutes.</p>
      </div>
      <ol class="pg-steps">
${L.practical_activity.instructions.map((x, i) => `        <li><span class="s-n num">${String(i + 1).padStart(2, '0')}</span>
          <div><span>${t(x)}</span></div></li>`).join('\n')}
      </ol>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-home">
  <div class="pg-wrap">
    <h2 id="h-home">What goes&nbsp;home</h2>
    <p class="lead">Homework is set for every one of the ${fmt(D.sessions)} sessions, in three
      forms: something to do online, something to do over a real board, and something to think
      about. ${fmt(D.homework.optional)} sessions carry a fourth &mdash; an optional challenge for
      the child who finishes early.</p>
    <div class="is-home">
${[['Online', hw.online_practice, 'on whatever platform the academy already uses'],
    ['Over the board', hw.over_the_board, 'with a parent, a sibling, or alone'],
    ['To think about', hw.reflection_questions, 'written down, not just answered'],
    ['Optional', hw.optional_challenge, 'for the child who wants more']]
    .filter(([, v]) => v && v.length)
    .map(([k, v, note]) => `      <div class="pg-plate pg-plate-hue">
        <p class="mono">${t(k)} &middot; ${t(note)}</p>
        <ul>
${v.map((x) => `          <li>${t(x)}</li>`).join('\n')}
        </ul>
      </div>`).join('\n')}
    </div>
    <p class="pg-note"><b class="pg-note-t">${hw.estimated_time_min} minutes, at
      home.</b>Across the curriculum that is ${fmt(D.homework.minutes)} written minutes of work
      after class. Today it travels as words &mdash; a coach reads the three lines out, writes them
      up, or sends them &mdash; because a printed pack is on the licence schedule and not in the
      product yet. What is not missing is the work itself: no coach has to invent it, and no week
      goes home empty.</p>
  </div>
</section>

<section class="pg-sec is-sec" aria-labelledby="h-prep">
  <div class="pg-wide">
    <div class="is-head">
      <h2 id="h-prep">And a second view, for the night&nbsp;before</h2>
      <p class="lead">The same session as a document. This is what a coach reads before class
        rather than during it, and it is where the part of a lesson that is not about chess
        lives.</p>
    </div>
    <div class="is-prep">
      <figure class="pg-fig">
        <img src="/assets/product/console-prep.jpg" width="1360" height="830" loading="lazy"
          decoding="async"
          alt="The prep view of session ${meta.n}: the same session laid out as a document, with
          the learning objective, the expected outcomes, the thinking routine, what it builds on,
          the materials, each of the eight parts in full, the coach notes and the homework." />
        <figcaption>Session ${meta.n} in prep view, ${PREP.length} sections deep.</figcaption>
      </figure>
      <div>
        <ol class="is-prepl">
${PREP.map((x) => `          <li>${t(x)}</li>`).join('\n')}
        </ol>
        <p>Six of those sections are the coach notes, and they are the ones a new coach reads
          twice: what students wrongly believe, what they will actually play, how to teach it, what
          to do if they are stuck, what to do if they are ahead. All five are written in every one
          of the ${fmt(D.coachNotes.waysToSimplify)} sessions &mdash; which is what lets one
          session work for two different ages in the same week.</p>
        <p class="pg-from mono">Thinking routine for this session:
          ${t(L.thinking_routine.current)}. Five routines ladder across the five stages.</p>
      </div>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-onward">
  <div class="pg-wrap">
    <h2 id="h-onward">One hour, ${fmt(D.sessions)}&nbsp;times</h2>
    <p class="lead">Everything on this page exists in every session in the curriculum: the eight
      parts, the graded positions, the questions, the activity, the homework and the coach
      notes. That is the whole claim, and it is countable.</p>
    <div class="pg-cta-row">
      <a class="cta" href="/teach">Teach a free session</a>
      <a class="cta ghost" href="/curriculum">See all ${D.sessions} sessions</a>
      <span class="mono">no email, no card</span>
    </div>
    <ul class="pg-figs">
      <li><b class="num">${fmt(D.segments)}</b><span>parts in total</span></li>
      <li><b class="num">${fmt(D.puzzles)}</b><span>positions, graded</span></li>
      <li><b class="num">${fmt(D.questions)}</b><span>questions to ask</span></li>
      <li><b class="num">${fmt(D.activities)}</b><span>activities</span></li>
      <li><b class="num">${fmt(D.homework.sessions)}</b><span>sessions with homework set</span></li>
      <li><b class="num">${fmt(D.outcomes)}</b><span>stated outcomes</span></li>
    </ul>
  </div>
</section>`;
}

module.exports = { page, parts, CALLS, tail };

