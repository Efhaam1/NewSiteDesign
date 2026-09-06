/**
 * /about — the entity page, and the one page on this site that has to earn trust without a
 * single piece of social proof.
 *
 * WHAT IS DOCUMENTED, and therefore what this page is allowed to contain: the name, its
 * root, its meaning and its pronunciation (ADR-0006, 04-brand-identity.md §B); the finding
 * that started the project — that a real academy's written syllabus told trainers what to
 * teach and never how; the positioning and the explicit "we are not" list
 * (04-brand-identity.md §A); the curriculum's own design constraints; and exactly what the
 * machine checking does and does not prove.
 *
 * WHAT IS NOT DOCUMENTED ANYWHERE, and is therefore absent: a person's name, a surname, a
 * title, a biography, years of experience, a chess rating or title, a location, a country,
 * a legal entity, a contact address, a customer, a pilot, a testimonial, an award, an
 * accreditation, a partnership, or a student outcome. The docs say "the founder" and
 * nothing else, the whole paper trail is three months old, and the 213 sessions are
 * unattributed — two different author strings appear in the files and neither is a person.
 * So this page's authority is the structure and the checking, which are things a reader can
 * verify, rather than a byline they would have to take on faith.
 *
 * That absence is not hidden either. The "six things you will not find" section says it
 * outright, because on a page with no proof, the willingness to name what is missing is the
 * proof.
 */
const { fmt } = require('./data.cjs');
const { esc, t, url } = require('./shell.cjs');

function page(ctx) {
  const { D } = ctx;

  const pageDef = {
    path: '/about',
    skip: 'about page',
    metaTitle: 'About Efhaam: The Complete Chess Curriculum for Academies',
    metaDesc: 'Efhaam means "to cause someone to understand": a complete chess '
      + `curriculum of ${D.sessions} sessions in one order. What it is, how it is made, and `
      + 'what is not built.',
    ogTitle: 'About Efhaam',
    ogAlt: 'Efhaam — إفهام — to cause someone to understand',
    crumbs: [{ path: '/', title: 'Home' }, { path: '/about', title: 'About' }],
    css: ['/css/roles.css'],
  };

  const NOT = [
    ['No testimonials, and no logos', 'When academies are teaching from this, their words will '
      + 'appear with their names on them. Until then there is nothing to quote, so nothing is '
      + 'quoted. The same goes for case studies, review stars and customer counts.'],
    ['No promise about a rating', 'Each stage records the strength a student at that stage usually '
      + 'plays at. That is a correlation, published as one. No page here says a child will reach a '
      + 'number, and no page ever will.'],
    ['No claims about intelligence or school results', 'The research on chess and general cognitive '
      + 'gains is contested and its own authors say so. A chess curriculum is a chess curriculum.'],
    ['No figure that cannot be counted', `Every number on this site is read at build time out of `
      + `the curriculum bundle — ${D.sessions} sessions, ${fmt(D.puzzles)} positions, `
      + `${fmt(D.questions)} questions. If a figure could not be counted it was removed rather `
      + `than adjusted.`],
    ['No feature described as built that is not', 'Printed packs, an owner dashboard, parent '
      + 'reports, exports and single sign-on are not built. They are named as unbuilt on the '
      + 'licence schedule, on the coach page and on the academy page, in the same words.'],
    ['No child accounts and no child emails', 'Not a roadmap item and not a compliance posture to '
      + 'be revisited: children do not have logins here, and the product asks for nothing about '
      + 'them. Ever.'],
  ];

  const BUILT = [
    ['built', `All ${fmt(D.sessions)} sessions, ready to teach`, `${D.stages} stages, ${D.levels} levels, `
      + `${D.units} units, in one order`],
    ['built', `${fmt(D.puzzles)} positions`, 'chosen per session and graded Foundation, Core or Challenge'],
    ['built', 'The teaching console', 'both views — the document for the night before, the screen for the room'],
    ['built', 'Homework for every session', `three forms, ${fmt(D.homework.minutes)} minutes of work`],
    ['built', 'Coach notes in every session', 'misconceptions, mistakes, tips, how to simplify, how to stretch'],
    // The built thing here is the per-position grading, which is what a reader can actually
    // go and check in the console — the two tracks are a delivery decision that grading makes
    // runnable from one written hour. The row says that rather than implying a toggle.
    ['built', 'Two ways to run one syllabus', 'the per-position grading both tracks turn on, in every session'],
    ['soon', 'Printed packs', 'coach pack, student sheets, homework'],
    ['soon', 'The owner dashboard', 'what was taught, and what coaches flagged'],
    ['soon', 'Parent reports', 'built from the checkpoints, without child accounts'],
    ['soon', 'Your academy on the player', 'naming, and exports'],
    ['soon', 'Single sign-on, other languages', ''],
  ];

  const body = `<section class="pg-sec pg-hero">
  <div class="pg-wrap">
    <p class="pg-kick mono"><span class="dot" aria-hidden="true"></span>About</p>
    <h1>Efhaam means &ldquo;to cause someone to&nbsp;understand&rdquo;.</h1>
    <p class="lead">Which is the product in one word. What an academy licenses here is not chess
      content &mdash; there is plenty of that, free, everywhere. It is a coach&rsquo;s ability to
      make a room understand something, written down ${fmt(D.sessions)} times.</p>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-name">
  <div class="pg-wrap">
    <div class="ab-name">
      <div>
        <h2 id="h-name">A word, and the whole&nbsp;thesis</h2>
        <div class="prose">
          <p><strong>Efhaam</strong> is said <em>ef-HAAM</em>. It is the Arabic
            <span lang="ar" dir="rtl">إفهام</span>, the causative form of the root
            <span lang="ar" dir="rtl">ف-ه-م</span> &mdash; <em>fahm</em>, understanding. The
            causative is the whole point: not <em>to understand</em>, but <em>to cause someone else
            to understand</em>. That is a description of teaching, and it is the founder&rsquo;s own
            given name.</p>
          <p>English readers tend to read it as &ldquo;ef-HAM&rdquo; on first sight. That was known
            when the name was chosen and accepted rather than solved &mdash; the pronunciation is
            set once, in the footer of every page, and never inside the logo.</p>
          <p>The name also carries no category, which is deliberate: every headline and every card
            on this site says <em>chess curriculum for academies</em> beside it, because the word
            will not do that job.</p>
        </div>
      </div>
      <figure class="ab-word">
        <p lang="ar" dir="rtl">إفهام</p>
        <figcaption><span class="mono">ef-HAAM</span> &middot; the causative of
          <span lang="ar" dir="rtl">ف-ه-م</span>, to understand</figcaption>
      </figure>
    </div>
  </div>
  <p class="pg-coord">the name</p>
</section>

<section class="pg-sec" aria-labelledby="h-why">
  <div class="pg-wrap">
    <h2 id="h-why">It started with a syllabus that said what to teach and never&nbsp;how</h2>
    <div class="pg-cols-2">
      <div class="prose">
        <p>The project began as an audit of a real academy&rsquo;s written syllabus &mdash; a
          ninety-eight-session document, genuinely thought about, used by real trainers. It listed
          topics in a sensible order. It contained almost nothing a trainer could stand in front of
          a room and use.</p>
        <p>That is the ordinary state of chess teaching material, and it is why every academy quietly
          depends on its best coaches. A topic list is not an hour. Somebody still has to decide the
          warm-up, find the positions, write the questions, build an activity, set the homework and
          guess how long any of it takes &mdash; every week, per group, forever. When that work
          happens in one person&rsquo;s head, the academy has no standard. It has staff.</p>
        <p>So the unit of this curriculum is not a topic. It is an hour: ordered, timed where timing
          is honest, with the positions chosen, the questions written and the homework set, in every
          one of the ${fmt(D.sessions)}.</p>
      </div>
      <div class="ab-side">
        <div class="pg-quote">
          <!-- Verbatim from the audit the project started from, minus the report's own
               capitals on WHAT and HOW, which are set as emphasis instead. -->
          <blockquote>The syllabus gives trainers <em>what</em> to teach but never <em>how</em>
            to teach it.</blockquote>
          <cite>The audit finding, 2026</cite>
        </div>
        <p class="pg-note"><b class="pg-note-t">The academy is not named.</b>That audit was internal
          analysis of somebody else&rsquo;s material, and publishing a critical review of an
          identifiable third party is not something this site is going to do. The finding is the
          part that matters, and the finding is general.</p>
      </div>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-what">
  <div class="pg-wrap">
    <h2 id="h-what">What Efhaam is, and what it is&nbsp;not</h2>
    <div class="pg-cols-2 ab-is">
      <div>
        <h3>It is</h3>
        <ul class="pg-ticks">
          <li><b>A written curriculum, licensed to an academy.</b> One licence is the whole thing;
            nothing above the entry tier adds a lesson.</li>
          <li><b>A teaching standard.</b> The same eight-part hour, the same graded positions and
            the same stated outcomes in every coach&rsquo;s hands.</li>
          <li><b>For ages ${D.ageSpan}.</b> Five stages, from naming the squares to a graduation
            paper.</li>
          <li><b>Something a coach reads, not something that teaches.</b> Every session is written
            for a competent trainer rather than an exceptional one.</li>
        </ul>
      </div>
      <div>
        <h3>It is not</h3>
        <ul class="pg-ticks ro-never">
          <li><b>A place to play chess.</b> There is no engine, no ladder and no opponent.</li>
          <li><b>A children&rsquo;s app.</b> Children never log in. The product is for the adult
            standing at the board.</li>
          <li><b>A content library.</b> A library is a pile you search. This is ${fmt(D.sessions)}
            sessions in one order, each naming the ones before it.</li>
          <li><b>A replacement for a coach.</b> It removes the invention, not the teaching.</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-method">
  <div class="pg-wrap">
    <h2 id="h-method">The authority here is the structure, not a&nbsp;byline</h2>
    <p class="lead">This page is not going to tell you a famous player wrote the curriculum, because
      that is not what happened and you could not check it if it were. What can be checked is how
      the ${fmt(D.sessions)} sessions are built, and it is the same five things every time.</p>
    <ol class="pg-steps ab-method">
      <li><span class="s-n num">01</span><div><b>One schema</b><span>Every session is the same
        document: the same fields in the same places, filled in for a different hour. Not a folder
        of documents that happen to be about chess.</span></div></li>
      <li><span class="s-n num">02</span><div><b>One shape</b><span>The same eight parts in the
        same order, ${fmt(D.segments)} of them written across the curriculum &mdash; a warm-up, an
        introduction, an explanation, a discussion, guided practice, positions, an activity,
        homework. A coach who has taught one session knows the architecture of every other
        one.</span></div></li>
      <li><span class="s-n num">03</span><div><b>One order</b><span>Prerequisites on every session
        but the first, four on the median and ${D.maxPrereq} at the deepest, with no forward
        references anywhere in the ${fmt(D.sessions)}. ${D.units} units, each with a review inside
        it; ${D.levels} levels, each closing in a graded session.</span></div></li>
      <li><span class="s-n num">04</span><div><b>One habit per stage</b><span>Five thinking routines
        ladder across the five stages &mdash; ${t(D.routineNames.join(', '))} &mdash; so a child is
        taught a way of looking at a position, not only a list of patterns.</span></div></li>
      <li><span class="s-n num">05</span><div><b>Checked by machine, not by eye</b><span>Every
        puzzle position is validated for chess legality: the position legal, the side to move
        correct, and every solution line playable to its stated end. ${fmt(D.verified.checks)}
        checks, 0 errors.</span></div></li>
    </ol>
    <p class="pg-note"><b class="pg-note-t">And precisely what that check proves.</b>Chess legality,
      on the puzzle positions. It does not mean the curriculum passes every internal check it has,
      because it does not: the same tool reports formatting problems in the session files that this
      site&rsquo;s figures do not depend on, and they are being worked through. It also does not
      mean every position in the bundle is covered &mdash; the check covers the puzzle positions.
      &ldquo;Every puzzle position checked for legality&rdquo; is the exact claim, and it is the only
      one made.</p>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-not">
  <div class="pg-wrap">
    <h2 id="h-not">Six things you will not find on this&nbsp;site</h2>
    <p class="lead">A product with no customers yet has one thing it can offer instead of proof:
      an accurate account of itself. This is that account, and it is enforced &mdash; the rule in
      this repository is that a figure which cannot be counted gets removed rather than softened.</p>
    <ol class="ab-not">
${NOT.map(([h, b], i) => `      <li>
        <p class="ab-nn mono"><span class="num">${String(i + 1).padStart(2, '0')}</span>${t(h)}</p>
        <p>${t(b)}</p>
      </li>`).join('\n')}
    </ol>
  </div>
  <p class="pg-coord">the standard</p>
</section>

<section class="pg-sec" aria-labelledby="h-built">
  <div class="pg-wrap">
    <h2 id="h-built">What is built, and what is&nbsp;next</h2>
    <p class="lead">The left column is in the product today and you can go and check every line of
      it. The right column is not, and it is named as unbuilt everywhere else on this site too.</p>
    <table class="pg-table ab-built">
      <caption>Curriculum bundle ${esc(D.bundle)}</caption>
      <thead><tr><th scope="col">Status</th><th scope="col">What</th>
        <th scope="col">Detail</th></tr></thead>
      <tbody>
${BUILT.map(([s, h, d]) => `        <tr class="${s === 'soon' ? 'is-soon' : 'is-built'}">
          <td class="mono">${s === 'soon' ? 'not yet' : 'built'}</td>
          <th scope="row">${t(h)}</th><td>${t(d)}</td></tr>`).join('\n')}
      </tbody>
    </table>
    <p class="pg-from mono">The unbuilt list is the licence schedule&rsquo;s own, unchanged.
      <a class="pg-body-link" href="/#terms">See what an academy pays</a>.</p>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-start">
  <div class="pg-wrap">
    <h2 id="h-start">The fastest way to judge&nbsp;this</h2>
    <p class="lead">Not by reading about it. ${D.free.length} of the ${fmt(D.sessions)} sessions are
      free to teach right now, at full size, in the console a coach actually uses &mdash; no email,
      no card, no signup. Open one and see whether you would put it in front of a group.</p>
    <div class="pg-cta-row">
      <a class="cta" href="/teach">Teach a free session</a>
      <a class="cta ghost" href="/curriculum">See all ${D.sessions} sessions</a>
    </div>
    <ul class="pg-list">
${D.free.map((s) => {
    const st = D.byStage.find((x) => x.number === s.stage);
    return `      <li><a href="/teach?s=${esc(s.id)}">${t(s.title)}</a><span>session ${s.n} &middot; ${t(st.piece)} stage &middot; entry age ${s.ageBand.replace('-', '–')}</span></li>`;
  }).join('\n')}
    </ul>
  </div>
</section>`;

  return { page: pageDef, body };
}

module.exports = { page };
