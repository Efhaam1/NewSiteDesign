/**
 * /for-chess-coaches and /for-chess-academies — the two role pages.
 *
 * They make different arguments and must not become the same page twice. The coach page is
 * about ONE HOUR and one person's week: what is already decided before they open the file,
 * and what the console does while eleven children are waiting. The academy page is about
 * VARIANCE: two good coaches teaching the same session differently is not a discipline
 * problem, it is the absence of a written standard, and everything an academy buys here is
 * a consequence of the standard being written down.
 *
 * Both pages end on a section saying what is NOT built. That is not a disclaimer bolted on
 * for safety — it is the most persuasive thing either page does, and it is the same list
 * pricing.json already prints on the homepage's licence schedule, so the site cannot
 * contradict itself one click apart.
 */
const { fmt } = require('./data.cjs');
const { esc, t, url } = require('./shell.cjs');
const { trackControl } = require('./curriculum.cjs');

/* ==================================================== /for-chess-coaches */
function coaches(ctx) {
  const { D, tracks: TR, pathways: PW } = ctx;

  const page = {
    path: '/for-chess-coaches',
    skip: 'coach guide',
    metaTitle: 'Chess Lesson Plans for Coaches: Open It and Teach | Efhaam',
    metaDesc: `A complete chess curriculum for coaches: ${D.sessions} sessions in order, `
      + `${fmt(D.puzzles)} graded positions, ${fmt(D.questions)} questions included, `
      + `homework for every session. No planning needed. Teach three free.`,
    ogTitle: 'For chess coaches: the planning is already done',
    ogAlt: 'What a chess coach no longer has to decide before class',
    crumbs: [{ path: '/', title: 'Home' }, { path: '/for-chess-coaches', title: 'For coaches' }],
    css: ['/css/roles.css'],
  };

  // Nine decisions, each one a count off the bundle. The pattern is deliberate and it is
  // the brief's: the feature, then what it saves, then what it changes.
  const DECIDED = [
    ['What to teach next', `Every session names the sessions it is taught after — four on the median, `
      + `${D.maxPrereq} at the deepest. The next session is the next session.`,
      'No argument about whether the group is ready.'],
    ['Which positions', `${fmt(D.puzzles)} positions, already chosen for their session and already `
      + `graded: ${fmt(D.tiers.Foundation)} Foundation, ${fmt(D.tiers.Core)} Core, `
      + `${fmt(D.tiers.Challenge)} Challenge.`,
      'No hunting a puzzle database for something that nearly fits.'],
    ['How the hour runs', `Eight parts in a fixed order, ${fmt(D.segments)} of them across `
      + `the curriculum. Warm-up, introduction, core explanation, discussion, guided practice, `
      + `puzzles, activity, homework.`,
      'The shape is never in question, so the thinking goes into the teaching.'],
    ['What to ask', `${fmt(D.questions)} questions included in the sessions — the ones with more `
      + `than one defensible answer, which are the ones a room argues about.`,
      'The discussion is not invented on the drive to class.'],
    ['What they will get wrong', `Every session carries what students wrongly believe and the `
      + `mistakes they actually play. All ${fmt(D.coachNotes.misconceptions)} of them.`,
      'A misconception gets caught the first time instead of the fourth.'],
    ['How to simplify it', `Written for every session: what to strip out when the group is not `
      + `getting it. ${fmt(D.coachNotes.waysToSimplify)} of ${D.sessions}.`,      'A hard session becomes a teachable one without abandoning the plan.'],
    ['How to stretch the strong ones', `Also written for every session — `
      + `${fmt(D.coachNotes.extensions)} extension notes.`,
      'The fast child gets more chess, not more waiting.'],
    ['What they do next week', `Homework set for all ${fmt(D.homework.sessions)} sessions in three `
      + `forms: online, over a real board, and something to think about. `
      + `${fmt(D.homework.optional)} carry a fourth for whoever finishes early.`,
      'The lesson does not stop when the room empties.'],
    ['What the hour was for', `${fmt(D.outcomes)} stated outcomes across the curriculum — what a `
      + `student can do at the end that they could not do at the start.`,
      'You can tell whether it worked, in the words the session used.'],
  ];

  const body = `<section class="pg-sec pg-hero">
  <div class="pg-wrap">
    <p class="pg-kick mono"><span class="dot" aria-hidden="true"></span>For coaches</p>
    <h1>The planning is done. The hour is&nbsp;yours.</h1>
    <p class="lead">You trained to teach chess. The evening before a class is not that. This is a
      curriculum of ${fmt(D.sessions)} ready-to-teach sessions that hands you the whole hour &mdash; the
      order, the positions, the questions, the activity and the homework &mdash; and leaves you the
      part you are actually good at.</p>
    <div class="pg-cta-row">
      <a class="cta" href="/teach">Teach a free session</a>
      <a class="cta ghost" href="/inside-a-session">See what an hour contains</a>
      <span class="mono">no email, no card</span>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-week">
  <div class="pg-wrap">
    <h2 id="h-week">What Sunday night becomes</h2>
    <div class="pg-swap ro-swap">
      <div>
        <p class="mono">Sunday night, now</p>
        <ol class="pg-swap-l">
          <li>plan</li><li>search</li><li>organise</li><li>improvise</li><li>teach</li>
        </ol>
        <p>Four of those five happen before anyone arrives, and the fifth is the only one a parent
          is paying for. The worst part is not the hours &mdash; it is that the fourth step is
          silent. Nobody sees a coach improvise, so nobody can tell a good hour from a lucky one.</p>
      </div>
      <div class="is-after">
        <p class="mono">Sunday night, with a curriculum</p>
        <ol class="pg-swap-l">
          <li>open</li><li>follow</li><li>teach</li><li>observe</li><li>progress</li>
        </ol>
        <p>Reading the session replaces writing it. The two new steps are the ones that were never
          there: watching what this particular group did with it, and knowing without deciding what
          they do next.</p>
      </div>
    </div>
    <p class="pg-note"><b class="pg-note-t">One claim this page will not make.</b>No number of hours
      saved. Nobody has measured that yet, so putting a figure on it would be an invention, and this
      site does not print figures it cannot count. What is countable is what is already written, and
      that is the rest of this page.</p>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-decided">
  <div class="pg-wrap">
    <h2 id="h-decided">Nine decisions you no longer&nbsp;make</h2>
    <p class="lead">Every line here is a count off the curriculum, not a promise about it.</p>
    <ol class="ro-dec">
${DECIDED.map(([h, what, why], i) => `      <li>
        <p class="ro-dn mono"><span class="num">${String(i + 1).padStart(2, '0')}</span>${t(h)}</p>
        <p class="ro-dw">${t(what)}</p>
        <p class="ro-dy">${t(why)}</p>
      </li>`).join('\n')}
    </ol>
  </div>
  <p class="pg-coord">the week</p>
</section>

<section class="pg-sec" aria-labelledby="h-during">
  <div class="pg-wrap">
    <div class="pg-cols-2">
      <div>
        <h2 id="h-during">And during the&nbsp;class</h2>
        <div class="prose">
          <p>A lesson plan on paper is a document you read before the room fills. The console is
            built for the other forty minutes &mdash; three rails that all stay on screen, because
            a coach cannot scroll while eleven children wait.</p>
          <p>It is the same session either way. Prep is the document; Teach is the screen you stand
            in front of.</p>
        </div>
        <div class="pg-cta-row">
          <a class="cta ghost" href="/teach">Open it and press the keys</a>
        </div>
      </div>
      <ul class="pg-ticks ro-live">
        <li><b>The answer stays hidden.</b> One key reveals it, so the room gets asked first.</li>
        <li><b>The clock is per segment, not per lesson.</b> Eight minutes of warm-up looks like
          eight minutes.</li>
        <li><b>Arrow keys step the forced line.</b> The board plays the combination out one move at
          a time while you talk.</li>
        <li><b>Every position is one paste away.</b> FEN for a board, PGN for the whole line, onto
          whatever screen the room actually has.</li>
        <li><b>The positions are numbered and jumpable.</b> Skip position six, come back to it, or
          stop at four &mdash; the session does not lose its place.</li>
        <li><b>Pressing a part of the hour goes to it.</b> A coach running late can see exactly
          what they are about to cut.</li>
      </ul>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-two">
  <div class="pg-wrap">
    <h2 id="h-two">Two groups, one&nbsp;preparation</h2>
    <div class="ro-two">
      <div>
        <p class="lead">A Tuesday group of six-year-olds and a Thursday group of eleven-year-olds
          can be taught the same session. What changes is the shape of the hour, not the
          hour.</p>
        <div class="prose">
          <p>Because every position in the curriculum is already graded, the difference is
            something a coach executes rather than prepares: hand out five positions or hand out
            eight, run five-minute blocks or fifteen, start full games in week one or hold them
            back. The session plan is the same either way.</p>
        </div>
      </div>
${trackControl(TR, PW)}
    </div>
    <p class="pg-note"><b class="pg-note-t">A track is a setting on a group.</b>An academy chooses
      it, and a coach can override it for one child &mdash; age is not level, and a strong
      seven-year-old runs Challenger. Both tracks reach the same outcomes; the difference is how,
      not what.</p>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-not">
  <div class="pg-wrap">
    <h2 id="h-not">What you still do, and what is not here&nbsp;yet</h2>
    <p class="lead">A coach can tell when a product is being sold past what it does. So here is the
      line.</p>
    <div class="pg-cols-2">
      <div>
        <h3>What the curriculum will never do</h3>
        <ul class="pg-ticks ro-never">
          <li><b>Teach the lesson.</b> The curriculum&rsquo;s own rule is that a lesson which
            only works in an expert&rsquo;s hands is a badly designed lesson &mdash; but a person
            still has to run the room.</li>
          <li><b>Decide how long position four takes.</b> Three of the eight parts carry no minutes
            on purpose. That elasticity is yours.</li>
          <li><b>Know your students.</b> The notes say what children usually believe. They cannot
            say what yours believe.</li>
        </ul>
      </div>
      <div>
        <h3>What is not built yet</h3>
        <ul class="pg-ticks">
          <li class="is-soon">A printed homework pack. The homework is written for every session; a
            pack you can hand out is on the licence schedule, not in the product.</li>
          <li class="is-soon">Marking a session taught, or tracking a child's progress. The
            checkpoints are written content, not a grade book.</li> <li class="is-soon">A parent report. There are no child accounts and no child emails, ever
            &mdash; and no report generator yet either.</li>
        </ul>
        <p class="pg-from mono">The same list the licence schedule prints.
          <a class="pg-body-link" href="/#terms">See what an academy pays</a>.</p>
      </div>
    </div>
    <div class="pg-cta-row">
      <a class="cta" href="/teach">Teach a free session</a>
      <a class="cta ghost" href="/curriculum">See all ${D.sessions} sessions</a>
      <span class="mono">${D.free.length} are free &middot; no email, no card</span>
    </div>
  </div>
</section>`;

  return { page, body };
}

/* ================================================== /for-chess-academies */
function academies(ctx) {
  const { D, tracks: TR, pathways: PW } = ctx;

  const page = {
    path: '/for-chess-academies',
    skip: 'academy guide',
    metaTitle: 'Chess Academy Curriculum: One Teaching Standard | Efhaam',
    metaDesc: `One teaching standard for a chess academy: ${D.sessions} ready-to-teach sessions in one `
      + `order, ${D.levels} levels each closing in a graded session, the same hour in every `
      + `coach's hands.`,
    ogTitle: 'For chess academies: one standard, every coach',
    ogAlt: 'A shared chess teaching standard across every coach in an academy',
    crumbs: [{ path: '/', title: 'Home' }, { path: '/for-chess-academies', title: 'For academies' }],
    css: ['/css/roles.css'],
  };

  /** The five things a written curriculum takes off the table, and what each one costs. */
  const VARY = [
    ['What gets taught', 'Two coaches with the same group and the same fifty minutes will not '
      + 'choose the same subject, because nothing tells them to.',
      `${D.sessions} sessions in one order. Session ${D.sessions} stands on all ${D.sessions - 1} in front of it.`],
    ['What order it comes in', 'A child can meet the pin before the fork, or the endgame before '
      + 'the tactic, depending on who covered which week.',
      `Every session names its prerequisites — four on the median, ${D.maxPrereq} at the deepest, and not one forward reference in the ${D.sessions}.`],
    ['How much practice', 'One coach lectures and one coach drills. Both are defensible; they are '
      + 'not the same course.',
      `Eight parts in a fixed order, ${fmt(D.segments)} of them across the curriculum — a warm-up, an explanation, a discussion, guided practice, positions, an activity.`],
    ['What goes home', 'Homework is the first thing to disappear on a busy week, and the parent '
      + 'notices before the owner does.',
      `Set for all ${fmt(D.homework.sessions)} sessions, in three forms, before anyone opens the file.`],
    ['What "done" means', 'Without a definition, finishing a topic means the coach felt finished '
      + 'with it.',
      `${fmt(D.outcomes)} stated outcomes, and ${D.checkpoints.length} graded sessions — one closing every level.`],
  ];

  const gateRows = D.checkpoints.map((c) => {
    const st = D.byStage.find((s) => s.number === c.stage);
    return `        <tr>
          <th scope="row" class="n">${c.n}</th>
          <td class="n">${c.level}</td>
          <td><a href="/curriculum/${st.slug}#s${c.n}">${t(c.title)}</a></td>
          <td>${t(st.piece)}</td>
          <td class="n">${c.puzzles} positions</td>
        </tr>`;
  }).join('\n');

  const body = `<section class="pg-sec pg-hero">
  <div class="pg-wrap">
    <p class="pg-kick mono"><span class="dot" aria-hidden="true"></span>For academies</p>
    <h1>Two good coaches. Two different&nbsp;courses.</h1>
    <p class="lead">This is not a discipline problem and it is not solved by hiring better. Two
      capable coaches given the same group and the same hour will teach two different courses,
      because nothing written down says which course it is. A curriculum is that document.</p>
    <div class="pg-cta-row">
      <a class="cta" href="/teach">Teach a free session</a>
      <a class="cta ghost" href="/curriculum">See all ${D.sessions} sessions</a>
      <span class="mono">no email, no card</span>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-vary">
  <div class="pg-wrap">
    <h2 id="h-vary">Five things that vary when nothing is written&nbsp;down</h2>
    <ol class="ro-vary">
${VARY.map(([h, problem, fix], i) => `      <li>
        <p class="ro-vn mono"><span class="num">${String(i + 1).padStart(2, '0')}</span>${t(h)}</p>
        <p class="ro-vp">${t(problem)}</p>
        <p class="ro-vf"><span class="mono">Written</span>${t(fix)}</p>
      </li>`).join('\n')}
    </ol>
    <div class="pg-quote">
      <!-- Verbatim from the curriculum's own list of design failures to avoid. -->
      <blockquote>If a lesson only works when delivered by an expert trainer, the lesson is badly
        designed.</blockquote>
      <cite>The curriculum&rsquo;s own design constraints</cite>
    </div>
  </div>
  <p class="pg-coord">variance</p>
</section>

<section class="pg-sec" aria-labelledby="h-same">
  <div class="pg-wrap">
    <h2 id="h-same">What &ldquo;the same lesson&rdquo; actually&nbsp;means</h2>
    <p class="lead">Precisely, and countably. Two coaches teaching session 115 in the same week are
      teaching the same eight parts, the same eight graded positions, the same six questions and the
      same stated outcomes &mdash; in the same place in the same order.</p>
    <table class="pg-table ro-std">
      <caption>What is identical in every coach&rsquo;s hands, across ${fmt(D.sessions)} sessions</caption>
      <thead><tr><th scope="col">Fixed</th><th scope="col">What that is</th>
        <th scope="col">Across the curriculum</th></tr></thead>
      <tbody>
        <tr><th scope="row">The shape of the hour</th>
          <td>Warm-up, introduction, core explanation, discussion, guided practice, positions,
            activity, homework &mdash; in that order.</td>
          <td class="n">${fmt(D.segments)} parts</td></tr>
        <tr><th scope="row">The positions</th>
          <td>Chosen for the session and graded Foundation, Core or Challenge before a coach
            sees them.</td>
          <td class="n">${fmt(D.puzzles)} positions</td></tr>
        <tr><th scope="row">The questions</th>
          <td>Written into the discussion, not thought of in the room.</td>
          <td class="n">${fmt(D.questions)} questions</td></tr>
        <tr><th scope="row">The activity</th>
          <td>One built for that session, with its own setup, instructions and success
            criteria.</td>
          <td class="n">${fmt(D.activities)} activities</td></tr>
        <tr><th scope="row">What it is for</th>
          <td>What the session sets out to achieve, and what a student can do at the
            end of it.</td>
          <td class="n">${fmt(D.outcomes)} outcomes</td></tr>
        <tr><th scope="row">Where it sits</th>
          <td>Named prerequisites on every session but the first, and no forward references.</td>
          <td class="n">${D.units} units &middot; ${D.levels} levels</td></tr>
      </tbody>
    </table>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-gates">
  <div class="pg-wrap">
    <h2 id="h-gates">${D.checkpoints.length} places where you find&nbsp;out</h2>
    <p class="lead">Every one of the ${D.levels} levels ends in a graded session, and it is always
      the last session of that level. Five are checkpoints; five are stage graduations. Each is
      ${D.checkpoints[0].puzzles} fresh positions a student has not seen in the sessions before it.</p>
    <table class="pg-table ro-gates">
      <caption>The ${D.checkpoints.length} graded sessions, one per level</caption>
      <thead><tr><th scope="col">Session</th><th scope="col">Level</th>
        <th scope="col">What closes the level</th><th scope="col">Stage</th>
        <th scope="col">Sits</th></tr></thead>
      <tbody>
${gateRows}
      </tbody>
    </table>
    <p class="pg-note"><b class="pg-note-t">The assessment is content, not software.</b>The
      curriculum contains the assessment: the positions, the pass mark and what to do with a
      student who does not clear it. What it does not contain is a grade book &mdash; nothing marks
      a session taught or stores a child's score, and there are no child accounts and no child
      emails, ever. An academy that wants a record keeps it the way it keeps one now.</p>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-new">
  <div class="pg-wrap">
    <div class="pg-cols-2">
      <div>
        <h2 id="h-new">A coach in their second&nbsp;month</h2>
        <div class="prose">
          <p>The hardest thing about a new trainer is not chess. It is that they have to invent an
            hour while they are still learning how a room behaves, and nobody finds out how it went.</p>
          <p>A complete session changes what onboarding is. A new coach reads the prep sheet the
            night before: the objective, what a student should be able to do at the end, the
            thinking routine, what this session builds on, and then each of the eight parts in
            full. Then five sections that are not about chess at all.</p>
          <p>All five are written in every one of the ${fmt(D.coachNotes.waysToSimplify)} sessions,
            which is what lets an academy put a second-month coach in front of a group without
            hoping.</p>
        </div>
        <a class="pg-go" href="/inside-a-session">See the prep sheet<i aria-hidden="true">&rarr;</i></a>
      </div>
      <ul class="pg-ticks ro-notes">
        <li><b>What they wrongly believe.</b> The misconceptions this particular subject produces.</li>
        <li><b>What they will play.</b> The mistakes students actually make on these positions.</li>
        <li><b>How to teach it.</b> The coaching tips for this hour, not general advice.</li>
        <li><b>If they are stuck.</b> What to strip out and still teach the session.</li>
        <li><b>If they are ahead.</b> Where to take the child who is already there.</li>
      </ul>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-cover">
  <div class="pg-wrap">
    <div class="ro-cover">
      <div>
        <h2 id="h-cover">A coach resigns on Friday. Tuesday still&nbsp;runs.</h2>
        <p class="lead">Whoever covers the group opens the same session the group was going to get,
          reads it, and teaches it. The course does not restart, and it does not fork.</p>
      </div>
      <div class="prose">
        <p>This is the operational case for writing a curriculum down, and it is the one an owner
          feels first. When the hour lives in one coach's head, that coach is a single point of
          failure &mdash; not because they are unreliable, but because nothing else knows what
          Tuesday was supposed to be.</p>
        <p>When the hour is written, cover is a reading task. The prerequisites say where the group
          is; the session says what happens; the notes say what will go wrong. A stand-in does not
          have to be as good as the coach they are covering. They have to be able to read.</p>
      </div>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-set">
  <div class="pg-wrap">
    <h2 id="h-set">What an academy sets, and what a coach can&nbsp;override</h2>
    <div class="ro-two">
      <div>
        <p class="lead">One syllabus runs two ways. An academy picks the track for a group; a coach
          can override it for one child, because age is not level and a strong seven-year-old runs
          the harder one.</p>
        <div class="prose">
          <p>This is not two curriculums to maintain, and it is not a lesson that rewrites itself.
            Every position in the curriculum is already graded, so the difference between the two
            tracks is which of the eight are the set for everyone, how long a block runs, and how
            soon a full game replaces a mini-game. Both reach the same outcomes.</p>
        </div>
      </div>
${trackControl(TR, PW)}
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-get">
  <div class="pg-wrap">
    <h2 id="h-get">What you get, and what you do not get&nbsp;yet</h2>
    <p class="lead">An owner is going to find the gap eventually. Better here.</p>
    <div class="pg-cols-2">
      <div>
        <h3>In every licence</h3>
        <ul class="pg-ticks">
          <li>All ${fmt(D.sessions)} sessions, ${D.stages} stages, ${D.levels} levels,
            ${D.units} units</li>
          <li>${fmt(D.puzzles)} positions, graded, every one machine-checked for chess legality</li>
          <li>The teaching console, in both views &mdash; the document and the screen</li>
          <li>${fmt(D.questions)} questions included, ${fmt(D.activities)} activities, homework for
            every session</li>
          <li>Coach notes on all five headings, in every session</li>
          <li>Two delivery tracks over one syllabus</li>
        </ul>
      </div>
      <div>
        <h3>Not built yet</h3>
        <ul class="pg-ticks">
          <li class="is-soon">Printed packs for coaches, students and homework</li>
          <li class="is-soon">The owner dashboard, and what coaches flag after a class</li>
          <li class="is-soon">Parent reports</li>
          <li class="is-soon">Your academy&rsquo;s name on the player and the packs</li>
          <li class="is-soon">Exports, single sign-on, other languages</li>
        </ul>
        <p class="pg-from mono">This is the licence schedule&rsquo;s own list, unchanged.
          <a class="pg-body-link" href="/#terms">See what an academy pays</a> &mdash; priced per
          academy, not per child.</p>
      </div>
    </div>
    <div class="pg-cta-row">
      <a class="cta" href="/teach">Teach a free session</a>
      <a class="cta ghost" href="/about">Who is behind this</a>
      <span class="mono">${D.free.length} sessions free &middot; no email, no card</span>
    </div>
  </div>
</section>`;

  return { page, body };
}

module.exports = { coaches, academies };

