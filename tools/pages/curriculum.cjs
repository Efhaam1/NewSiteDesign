/**
 * /curriculum — the map, and /curriculum/<stage> — the detail.
 *
 * THE DIVISION OF LABOUR, because two pages listing the same 213 sessions would be one
 * page twice. The map is an INDEX: every session in teaching order, with its type and how
 * many positions it carries, under its unit, under its level, under its stage. The five
 * stage pages are the DETAIL: the same sessions with the objective each one is written
 * against, printed in full, plus the stage's own arc, its two checkpoints and what it
 * hands on to. Nothing is duplicated between them except the titles, which is what makes
 * the map a map.
 *
 * WHAT IS NOT ON THESE PAGES, and why. No teaching flow, no puzzle solutions, no coach
 * notes: the blueprint's own line for this page is "all 213 sessions visible as structure
 * (titles/objectives), content gated" (01-information-architecture.md §C), and the three
 * sessions whose full content IS public are public in the place you can teach them, at
 * /teach. And no per-session minute on the map — the field exists but bundle 1.1.0 is ten
 * sessions stale on it, so the map prints the stage's range and the stage page prints the
 * session's own figure with the bundle named beside it.
 *
 * EVERY ROW IS IN THE HTML. There is no fetch, no template rendered on the client and no
 * accordion hiding a session behind a click. js/pages/curriculum.js adds a filter, a
 * track control and a reading indicator to markup that is already complete — remove the
 * script and the page is still the whole syllabus.
 */
const { fmt, TYPE, isGate } = require('./data.cjs');
const { esc, t, url, ORIGIN } = require('./shell.cjs');

/**
 * One authored paragraph per stage. Five, not a template with the piece name swapped:
 * each is written from that stage's own theme sentence, its two level names and what
 * actually changes across its six units. `plays` is the rating band phrased the way
 * ui/stages.js renders it — "plays at", never "reaches" — because the manifesto calls
 * the bands "a correlation benchmark, not a gating mechanism".
 */
const STAGE_COPY = {
  pawn: {
    subject: 'the rules, the pieces, first checkmates and first tactics',
    h1: 'Everything a child needs to play a legal game',
    lead: 'The first stage takes a child who has never touched a board to one who can set it '
      + 'up, play every piece legally, spot a checkmate and tell it from a stalemate — and '
      + 'then win material on purpose.',
    arc: 'Sessions one to seven are the six pieces, one at a time, then a review that puts them '
      + 'together. Unit two adds setup, promotion, captures and piece values, and introduces the '
      + 'first thinking habit — THE LOOK, which is checking whether anything of yours is under '
      + 'attack before you move. Unit three is check, checkmate and stalemate, and it is where '
      + 'the first level ends. Level 1B is the same board used offensively: hanging pieces, '
      + 'counting attackers and defenders, forced mate in one, king and queen against a bare '
      + 'king, two rooks, and finally the fork, the pin and the skewer.',
    next: 'A child who graduates Stage 1 can play a whole legal game and win a piece on purpose. '
      + 'They cannot yet see a tactic in a crowded position, which is the whole of Stage 2.',
  },
  knight: {
    subject: 'the full tactical toolkit and the first endgames',
    h1: 'The full tactical toolkit, and the first endgames',
    lead: 'Stage 2 is the tactics stage. Every double attack, every discovered attack, the mating '
      + 'patterns by name, and the first endgames a player has to know rather than calculate.',
    arc: 'The first three units are one tactic family each — forks by every piece, discovered '
      + 'attacks and discovered checks, then the named mating patterns — and they close level 2A. '
      + 'Level 2B is harder tactics, the endgames that decide games at this strength, and the '
      + 'opening principles that stop a game being lost before it starts. THE SCAN arrives here: '
      + 'checks, captures, threats, in that order, every move.',
    next: 'A Knight-stage player finds tactics. What they do not yet do is judge a position that '
      + 'has none, which is where Stage 3 begins.',
  },
  bishop: {
    subject: 'evaluation, pawn structure, planning and rook endgames',
    h1: 'Judging a position, not just calculating it',
    lead: 'Stage 3 is where a player stops looking only for moves and starts looking at the '
      + 'position: what is good about it, what is wrong with it, and what to do when there is no '
      + 'tactic at all.',
    arc: 'Evaluation first — material, king safety, activity, structure — then pawn structure as a '
      + 'thing with its own rules, then piece placement and the worst-piece question. Level 3B '
      + 'turns judgement into a plan: prophylaxis, the sacrifice you can verify, and rook endgames, '
      + 'which are the endgames that actually happen. It also asks a player to choose an opening '
      + 'and know why.',
    next: 'A Bishop-stage player has a plan. Stage 4 makes them defend one, and calculate under '
      + 'tournament conditions.',
  },
  rook: {
    subject: 'attack, defence, calculation and tournament skills',
    h1: 'Attack, defence, calculation, and a tournament',
    lead: 'Stage 4 is the competitive stage. Attacking a king, defending your own, calculating '
      + 'lines you cannot see the end of, and the practical skills of playing a real event.',
    arc: 'Attack and defence as one subject, then calculation and visualisation trained directly '
      + 'rather than as a by-product, then advanced strategy. Level 4B is complex endgames, then a '
      + 'unit that is unlike anything earlier in the curriculum: nerves, pre-game preparation, '
      + 'analysing your own loss, and a simulated tournament round. It closes with opening depth.',
    next: 'A Rook-stage player can hold their own in a tournament. Stage 5 is about becoming a '
      + 'player with a style rather than a repertoire.',
  },
  queen: {
    subject: 'deep strategy, advanced endgames, analysis and style',
    h1: 'Deep strategy, real analysis, and a style of your own',
    lead: 'The last stage treats a student as a player: long-horizon strategy, the endgames that '
      + 'need technique rather than tricks, and the habit of analysing a game properly — including '
      + 'their own.',
    arc: 'Deep strategy and advanced endgames first, then a unit on analysis itself — how to take a '
      + 'game apart, alone and in a group. Level 5B is the most unusual material in the '
      + 'curriculum: creative chess, then style and identity, then a closing unit on competition '
      + 'and what comes after the curriculum ends.',
    next: 'The last session is a graduation paper: eight unlabelled positions, seats apportioned '
      + 'across the stage’s six units, and a pass mark of six.',
  },
};

/** A stage's session-length range, printed instead of a per-row minute on the map. */
const minRange = (st) => {
  const lo = Math.min(...st.sessions.map((s) => s.minutes));
  const hi = Math.max(...st.sessions.map((s) => s.minutes));
  return lo === hi ? `${lo} min` : `${lo}–${hi} min`;
};

/**
 * One session row on the map. The title is the drill-down: it goes to the same session on
 * its stage page, where the objective is. The ordinal is printed, not the bundle's `S###`
 * id — an internal identifier is not copy — but the anchor keeps the number so a link to
 * one session is stable.
 */
function row(s, slug, free) {
  const isFree = free.includes(s.id);
  const chips = [`<span class="pg-chip">${t(TYPE[s.type] || s.type)}</span>`];
  if (isFree) chips.push('<span class="pg-chip pg-chip-free">Free to teach</span>');
  return `        <li class="cu-s${isGate(s) ? ' is-gate' : ''}" data-type="${esc(s.type)}">
          <a class="cu-t" href="/curriculum/${slug}#s${s.n}"><span class="cu-n num">${s.n}</span>${t(s.title)}</a>
          <span class="cu-p mono">${s.puzzles ? `${s.puzzles} positions` : 'no positions'}</span>
          <span class="cu-c">${chips.join('')}</span>
        </li>`;
}

/** A unit block: its own head, then its sessions. Units nest inside levels in every stage. */
function unit(u, st, free) {
  return `      <section class="cu-u" aria-labelledby="u${st.number}-${u.number}">
        <h4 class="cu-uh" id="u${st.number}-${u.number}">
          <span class="mono">Unit ${u.number}</span>
          <span class="cu-un">${t(u.name)}</span>
          <span class="mono cu-uc">${u.count} sessions</span>
        </h4>
        <ol class="cu-list">
${u.sessions.map((s) => row(s, st.slug, free)).join('\n')}
        </ol>
      </section>`;
}

/** A level block: the gate is named in the head, because the gate is what the level is for. */
function level(lv, st, free) {
  const units = st.units.filter((u) => u.levels[0] === lv.code);
  return `    <section class="cu-l" aria-labelledby="l${lv.code}">
      <div class="cu-lh">
        <h3 id="l${lv.code}"><span class="cu-lc mono num">${lv.code}</span>${t(lv.name)}</h3>
        <p class="cu-lm mono">${lv.count} sessions &middot; ${units.length} units &middot;
          closes with <b>${t(lv.gate.title)}</b></p>
      </div>
${units.map((u) => unit(u, st, free)).join('\n')}
    </section>`;
}

/** A stage band on the map: the head, its onward link, then its two levels. */
function band(st, free) {
  return `  <section class="cu-band" id="stage-${st.slug}" data-stage="${st.number}"
    style="--hue:${st.hue}" aria-labelledby="sh-${st.slug}">
    <div class="cu-bh">
      <p class="cu-bn mono"><span class="dot" aria-hidden="true"></span>Stage ${st.number}
        &middot; ${st.sessions.length} sessions</p>
      <h2 id="sh-${st.slug}">${t(st.piece)} Stage &mdash; ${t(st.themeName)}</h2>
      <p class="cu-bt">${t(st.themeBody.charAt(0).toUpperCase() + st.themeBody.slice(1))}.</p>
      <dl class="cu-bd">
        <div><dt class="mono">Entry age</dt><dd>${st.ages}</dd></div>
        <div><dt class="mono">Plays at</dt><dd>${st.rating}</dd></div>
        <div><dt class="mono">Levels</dt><dd>${st.levels.map((l) => l.code).join(' &middot; ')}</dd></div>
        <div><dt class="mono">A session</dt><dd>${minRange(st)}</dd></div>
        <div><dt class="mono">Positions</dt><dd>${fmt(st.puzzles)}</dd></div>
      </dl>
      <a class="pg-go" href="/curriculum/${st.slug}">Read what ${t(st.piece)} Stage teaches,
        session by session<i aria-hidden="true">&rarr;</i></a>
    </div>
${st.levels.map((lv) => level(lv, st, free)).join('\n')}
  </section>`;
}

/**
 * The track control, shared by three pages. Both readouts are in the markup and CSS picks
 * which one is on, exactly as act 6's plate does — so the page states both tracks with the
 * script off, and states one at a time with it on. Every clause is a field of
 * app/data/tracks.json, and each of those fields carries the decision record it was
 * transcribed from; nothing here is composed.
 */
function trackControl(TR, PW, opts = {}) {
  const keys = Object.keys(TR.tracks);
  const bar = keys.map((k) => {
    const tr = TR.tracks[k];
    return `      <button class="pg-way" type="button" data-track="${esc(k)}"
        aria-pressed="${k === 'challenger'}">
        <b>${t(tr.name)}</b><span>ages ${tr.ages}</span>
      </button>`;
  }).join('\n');
  const notes = keys.map((k) => {
    const tr = TR.tracks[k];
    const extra = k === 'challenger' && PW && PW.tracks && PW.tracks.C
      ? ` The compressed Stage&nbsp;1 map runs its ${PW.tracks.B.stage1_classes} sessions as
        ${PW.tracks.C.stage1_classes} classes, pairing the teaching sessions and never merging a
        review or an assessment.` : '';
    return `      <div data-track="${esc(k)}"${k === 'challenger' ? ' class="is-on"' : ''}>
        <b>${t(tr.name)} &middot; ages ${tr.ages}</b>
        <p>${t(tr.blocks.charAt(0).toUpperCase() + tr.blocks.slice(1))}.
          ${t(tr.positions.charAt(0).toUpperCase() + tr.positions.slice(1))}.
          ${t(tr.play.charAt(0).toUpperCase() + tr.play.slice(1))}.${extra}</p>
      </div>`;
  }).join('\n');
  return `  <div class="pg-track" id="tracks">
    <div class="pg-track-bar" role="group" aria-label="Delivery track">
${bar}
    </div>
    <div class="pg-track-note">
${notes}
    </div>
    <p class="pg-from mono">${t(TR.aside)}</p>${opts.foot ? `\n    ${opts.foot}` : ''}
  </div>`;
}

/**
 * The sticky rail. Five stages, ten levels, and the sessions each holds — a table of
 * contents that stays on screen while 213 rows go past it. It is real links, so it works
 * before the script marks the section a reader is in.
 */
function rail(D) {
  const items = D.byStage.map((st) => `    <li style="--hue:${st.hue}">
      <a href="#stage-${st.slug}" data-stage="${st.number}">
        <span class="cu-rn mono">Stage ${st.number}</span>
        <span class="cu-rt">${t(st.piece)}</span>
        <span class="cu-rc mono">${st.sessions.length}</span>
      </a>
      <ul>
${st.levels.map((lv) => `        <li><a href="#l${lv.code}"><span class="mono num">${lv.code}</span>${t(lv.name)}</a></li>`).join('\n')}
      </ul>
    </li>`).join('\n');
  return `  <nav class="cu-rail" aria-label="Jump to a stage">
    <p class="cu-rail-h mono">The five stages</p>
    <ol>
${items}
    </ol>
    <p class="cu-rail-f mono">${fmt(D.sessions)} sessions &middot; ${D.units} units</p>
  </nav>`;
}

/* ============================================================ /curriculum — the map */
function mapPage(ctx) {
  const { D, tracks: TR, pathways: PW } = ctx;
  const g = D.byStage;

  const page = {
    path: '/curriculum',
    parent: '/curriculum',
    skip: 'curriculum map',
    metaTitle: 'Chess Curriculum: 5 Stages, 10 Levels, 213 Sessions | Efhaam',
    metaDesc: `Every session in the Efhaam chess curriculum, in teaching order: five stages, `
      + `ten levels, ${D.units} units, ${D.sessions} ready-to-teach sessions and ${fmt(D.puzzles)} graded positions.`,
    ogTitle: 'The whole chess curriculum, session by session',
    ogAlt: `A map of ${D.sessions} chess sessions across five stages`,
    crumbs: [{ path: '/', title: 'Home' }, { path: '/curriculum', title: 'Curriculum' }],
    css: ['/css/curriculum.css'],
    js: ['/js/pages/curriculum.js'],
    // A Course list, which is the one education-specific rich result Google still
    // consumes: an ItemList of at least three course URLs on a SUMMARY page, with each of
    // those URLs carrying its own Course markup. position and url are both required.
    // Detail pages deliberately carry no ItemList of their own — the spec puts the list on
    // the summary page, and a second list of same-page fragments would only look like a
    // malformed carousel.
    schema: [{
      '@type': 'ItemList',
      '@id': url('/curriculum') + '#stages',
      name: 'The five stages of the Efhaam chess curriculum',
      numberOfItems: g.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: g.map((st, i) => ({
        '@type': 'ListItem', position: i + 1,
        name: `${st.piece} Stage — ${st.themeName}`,
        url: url(`/curriculum/${st.slug}`),
      })),
    }],
  };

  const longest = Math.max(...g.map((st) => st.sessions.length));
  const body = `<section class="pg-sec pg-hero">
  <div class="pg-wrap">
    <div class="pg-hero-2">
      <div>
        <p class="pg-kick mono"><span class="dot" aria-hidden="true"></span>The curriculum</p>
        <h1>Every session, in the order it is&nbsp;taught.</h1>
        <p class="lead">The Efhaam chess curriculum: five stages, ten levels, ${D.units} units,
          ${D.sessions} ready-to-teach sessions &mdash; from naming the squares in the first one to
          sitting a graduation paper in the last. Every session lists the sessions it is taught
          after, so number ${D.sessions} stands on all ${D.sessions - 1} in front of it.</p>
      </div>
      <!-- The shape of the thing, drawn from its own counts: one bar per stage, split at the
           level boundary, with an ink tick where each level's graded session sits. It is the
           only chart on the site and it earns its place by answering something the figures
           below do not — how the 213 are distributed. -->
      <figure class="cu-mini">
        <figcaption class="mono">The five stages, by length</figcaption>
        <ol>
${g.map((st) => `          <li style="--hue:${st.hue}">
            <span class="cu-mt"><b>${t(st.piece)}</b><span class="mono">stage ${st.number}
              &middot; entry ${st.ages}</span></span>
            <span class="cu-mb" style="--w:${((st.sessions.length / longest) * 100).toFixed(1)}%">
${st.levels.map((lv) => `              <i style="flex:${lv.count}" title="Level ${lv.code}, ${lv.count} sessions"></i>`).join('\n')}
            </span>
            <span class="cu-mc num">${st.sessions.length}</span>
          </li>`).join('\n')}
        </ol>
        <p class="cu-mk mono"><span aria-hidden="true"></span>each level ends in a graded
          session</p>
      </figure>
    </div>
    <ul class="pg-figs">
      <li><b class="num">${D.stages}</b><span>stages</span></li>
      <li><b class="num">${D.levels}</b><span>levels</span></li>
      <li><b class="num">${D.units}</b><span>units</span></li>
      <li><b class="num">${fmt(D.sessions)}</b><span>sessions, ready to teach</span></li>
      <li><b class="num">${fmt(D.puzzles)}</b><span>positions, already graded</span></li>
      <li><b class="num">${D.hours}</b><span>hours of class</span></li>
    </ul>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-shape">
  <div class="pg-wrap">
    <h2 id="h-shape">Four words hold the whole&nbsp;shape.</h2>
    <div class="cu-shape">
      <div>
        <p class="mono">Stage</p>
        <h3>${D.stages} of them, named for a piece</h3>
        <p>A stage is one big subject and roughly two years of a child&rsquo;s chess. Pawn is the
          rules and the first tactics; Queen is analysis and style. Each declares the age a child
          usually enters it and the strength that child is usually playing at.</p>
      </div>
      <div>
        <p class="mono">Level</p>
        <h3>${D.levels}, two inside every stage</h3>
        <p>A level is ${Math.min(...g.flatMap((s) => s.levels.map((l) => l.count)))}&ndash;${Math.max(...g.flatMap((s) => s.levels.map((l) => l.count)))}
          sessions, and the last session of every one of the ${D.levels} is a graded one: five are
          called checkpoints, five are stage graduations. Nothing else ends a level.</p>
      </div>
      <div>
        <p class="mono">Unit</p>
        <h3>${D.units}, three inside every level</h3>
        <p>A unit is one idea taught across ${Math.min(...g.flatMap((s) => s.units.map((u) => u.count)))}
          to ${Math.max(...g.flatMap((s) => s.units.map((u) => u.count)))} sessions &mdash; the fork
          family, pawn structure, rook endgames. Every unit has at least one review session inside
          it, and there are ${D.perType.review} of those across the curriculum.</p>
      </div>
      <div>
        <p class="mono">Session</p>
        <h3>${fmt(D.sessions)}, and one is one class</h3>
        <p>One session is one lesson: ${D.minMin} to ${D.maxMin} minutes, most of them
          ${D.modeMin}. Eight parts in a fixed order, up to eight graded puzzle positions, one
          activity, and homework in three forms.
          <a class="pg-body-link" href="/inside-a-session">See what one hour contains</a>.</p>
      </div>
    </div>
    <p class="pg-note"><b class="pg-note-t">Nothing here is optional.</b>Only the first session
      stands on nothing. Every other one names the sessions it comes after &mdash; four of them on
      the median, ${D.maxPrereq} at the deepest &mdash; and there is not a forward reference or a
      dangling one anywhere in the ${D.sessions}. That is what a curriculum is for: a coach never
      has to decide what a group is ready for, and a child never meets an idea before the idea it
      rests on.</p>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-two">
  <div class="pg-wrap">
    <h2 id="h-two">The same sessions, two ways to run&nbsp;them.</h2>
    <div class="cu-two">
      <div>
        <p class="lead">Age is not level. A group of six-year-olds and a group of eleven-year-olds
          are taught the same session; what changes is how long a block runs, which of the
          eight positions are the set for everyone, and how soon a full game replaces a
          mini-game.</p>
        <p class="pg-note"><b class="pg-note-t">A track is a setting, not a second syllabus.</b>Both
          tracks reach the same outcomes &mdash; the difference is how, not what. Every position in
          the curriculum is already graded Foundation, Core or Challenge
          &mdash; ${fmt(D.tiers.Foundation)}, ${fmt(D.tiers.Core)} and ${fmt(D.tiers.Challenge)} of
          the ${fmt(D.puzzles)} puzzle positions &mdash;
          and that grading is what lets one coach hand out five positions and another hand out
          eight from the same page.</p>
      </div>
${trackControl(TR, PW)}
    </div>
  </div>
</section>

<section class="pg-sec cu-map" aria-labelledby="h-map">
  <div class="pg-wide">
    <div class="cu-head">
      <h2 id="h-map">The map</h2>
      <p class="lead">All ${D.sessions} sessions, in teaching order. A title goes to the stage page,
        where its objective is printed in full.</p>
      <div class="cu-filter" role="group" aria-label="Show">
        <button class="pg-way" type="button" data-filter="all" aria-pressed="true">
          <b>Everything</b><span>${D.sessions} sessions</span></button>
        <button class="pg-way" type="button" data-filter="gate" aria-pressed="false">
          <b>The graded ones</b><span>${D.checkpoints.length} gates</span></button>
        <button class="pg-way" type="button" data-filter="review" aria-pressed="false">
          <b>Reviews</b><span>${D.perType.review} sessions</span></button>
        <button class="pg-way" type="button" data-filter="free" aria-pressed="false">
          <b>Free to teach</b><span>${D.free.length} sessions</span></button>
      </div>
      <p class="cu-count mono" role="status"></p>
    </div>
    <div class="cu-grid">
${rail(D)}
      <div class="cu-bands">
${g.map((st) => band(st, D.free.map((s) => s.id))).join('\n')}
      </div>
    </div>
  </div>
  <p class="pg-coord">a1 &rarr; h8</p>
</section>

<section class="pg-sec" aria-labelledby="h-next">
  <div class="pg-wrap">
    <h2 id="h-next">Three of the ${D.sessions} are free to teach right&nbsp;now.</h2>
    <p class="lead">No email, no card, no signup. They open in the console a coach teaches from
      &mdash; the plan minute by minute, every board, the answers behind a reveal.</p>
    <div class="cu-free">
${D.free.map((s) => {
    const st = g.find((x) => x.number === s.stage);
    return `      <a class="cu-fc pg-plate" href="/teach?s=${esc(s.id)}" style="--hue:${st.hue}">
        <p class="mono"><span class="dot" aria-hidden="true"></span>Session ${s.n} &middot;
          ${t(st.piece)} Stage &middot; level ${s.level}</p>
        <h3>${t(s.title)}</h3>
        <p class="cu-fo">${t(s.concept || s.objective)}</p>
        <p class="mono cu-fm">${s.minutes} min &middot; ${s.puzzles} positions &middot;
          entry age ${s.ageBand.replace('-', '–')}</p>
      </a>`;
  }).join('\n')}
    </div>
    <div class="pg-cta-row">
      <a class="cta" href="/teach">Teach a free session</a>
      <a class="cta ghost" href="/inside-a-session">See what an hour contains</a>
      <span class="mono">no email, no card</span>
    </div>
  </div>
</section>`;

  return { page, body };
}

/* ================================================== /curriculum/<stage> — the detail */

/** ISO 8601 duration, for the timeRequired the stage page declares in its schema. */
const iso = (min) => `PT${Math.floor(min / 60)}H${min % 60 ? (min % 60) + 'M' : ''}`;

/** "S112" -> "112". The bundle's id is a handle, not copy; the ordinal is what a reader uses. */
const ord = (id) => String(Number(String(id).replace(/\D/g, '')));

/** One session, in full: what it is about, what it is written to achieve, and what it follows. */
function detail(s, D) {
  const isFree = D.free.some((f) => f.id === s.id);
  const pre = s.prerequisites.length
    ? `taught after ${s.prerequisites.map(ord).join(' &middot; ')}`
    : 'opens the curriculum';
  return `          <li class="st-s${isGate(s) ? ' is-gate' : ''}" id="s${s.n}">
            <p class="st-sh">
              <span class="st-n num">${s.n}</span>
              <b>${t(s.title)}</b>
              <span class="pg-chip">${t(TYPE[s.type] || s.type)}</span>
              <span class="st-m mono">${s.minutes} min${s.puzzles ? ` &middot; ${s.puzzles} positions` : ''}</span>${isFree ? `
              <a class="st-free" href="/teach?s=${esc(s.id)}">Teach it free</a>` : ''}
            </p>${s.concept ? `
            <p class="st-c">${t(s.concept)}</p>` : ''}
            <p class="st-o">${t(s.objective)}</p>
            <p class="st-x mono">${pre}</p>
          </li>`;
}

function stagePage(st, ctx) {
  const { D } = ctx;
  const c = STAGE_COPY[st.slug];
  const prev = D.byStage[st.number - 2];
  const next = D.byStage[st.number];
  const revs = st.sessions.filter((s) => s.type === 'review').length;

  const page = {
    path: `/curriculum/${st.slug}`,
    parent: '/curriculum',
    skip: `${st.piece} Stage sessions`,
    hue: st.hue,
    hueSoft: 'rgb(20 20 28 / 0.05)',
    metaTitle: `${st.piece} Stage: ${st.sessions.length} Chess Sessions on ${st.themeName} | Efhaam`,
    // Kept under ~158 characters: a description is a fallback for the snippet, and what
    // matters is that the whole of it survives the truncation. The bundle's own theme
    // sentence is up to 76 characters on its own, so STAGE_COPY carries a short subject.
    metaDesc: `${st.sessions.length} chess sessions on ${c.subject} — ${st.piece} `
      + `Stage of the Efhaam curriculum. Entry age ${st.ages}, ${fmt(st.puzzles)} graded positions.`,
    ogTitle: `${st.piece} Stage — ${st.themeName}`,
    ogAlt: `${st.piece} Stage: ${st.sessions.length} chess sessions on ${st.themeName}`,
    crumbs: [{ path: '/', title: 'Home' }, { path: '/curriculum', title: 'Curriculum' },
      { path: `/curriculum/${st.slug}`, title: `${st.piece} Stage` }],
    css: ['/css/curriculum.css'],
    js: ['/js/pages/curriculum.js'],
    // The Course half of the Course list whose ItemList sits on /curriculum. Only `name`
    // and `description` are required and `provider` is the one recommended property; the
    // description's first 60 characters are all a Course-list card shows, so the stage's
    // own subject leads it. `teaches` and `typicalAgeRange` are on the page in words, which
    // is the condition for marking them up at all.
    schema: [{
      '@type': 'Course',
      '@id': url(`/curriculum/${st.slug}`) + '#course',
      name: `${st.piece} Stage — ${st.themeName}`,
      description: `${st.themeBody.charAt(0).toUpperCase() + st.themeBody.slice(1)}. `
        + `${st.sessions.length} sessions in teaching order, across `
        + `${st.levels.length} levels and ${st.units.length} units.`,
      url: url(`/curriculum/${st.slug}`),
      provider: { '@id': `${ORIGIN}/#organization` },
      inLanguage: 'en',
      educationalLevel: `Stage ${st.number} of ${D.stages}`,
      typicalAgeRange: st.ageBand,
      timeRequired: iso(st.minutes),
      teaches: st.units.map((u) => u.name),
    }],
  };

  const levelBlocks = st.levels.map((lv) => {
    const units = st.units.filter((u) => u.levels[0] === lv.code);
    return `      <section class="st-l" aria-labelledby="l${lv.code}">
        <div class="st-lh">
          <h3 id="l${lv.code}"><span class="mono num">Level ${lv.code}</span>${t(lv.name)}</h3>
          <p class="mono">${lv.count} sessions &middot; ${units.length} units &middot;
            sessions ${lv.first.n}&ndash;${lv.last.n}</p>
        </div>
${units.map((u) => `        <section class="st-u" aria-labelledby="su${u.number}">
          <h4 id="su${u.number}"><span class="mono">Unit ${u.number}</span>${t(u.name)}
            <span class="mono st-uc">${u.count} sessions</span></h4>
          <ol class="st-list">
${u.sessions.map((s) => detail(s, D)).join('\n')}
          </ol>
        </section>`).join('\n')}
      </section>`;
  }).join('\n');

  const body = `<section class="pg-sec pg-hero st-hero">
  <div class="pg-wrap">
    <p class="pg-kick mono"><span class="dot" aria-hidden="true"></span>Stage ${st.number} of
      ${D.stages} &middot; ${t(st.piece)} &middot; ${t(st.themeName)}</p>
    <h1>${t(c.h1)}.</h1>
    <p class="lead">${t(c.lead)}</p>
    <ul class="pg-figs">
      <li><b class="num">${st.sessions.length}</b><span>sessions</span></li>
      <li><b class="num">${st.levels.length}</b><span>levels &middot; ${st.units.length} units</span></li>
      <li><b class="num">${fmt(st.puzzles)}</b><span>graded positions</span></li>
      <li><b class="num">${st.ages}</b><span>entry age</span></li>
      <li><b class="num">${st.rating}</b><span>usually plays at</span></li>
      <li><b class="num">${minRange(st)}</b><span>a session</span></li>
    </ul>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-arc">
  <div class="pg-wrap">
    <div class="st-arc">
      <div>
        <h2 id="h-arc">How the stage&nbsp;runs</h2>
        <div class="prose"><p>${t(c.arc)}</p></div>
      </div>
      <div class="st-gates">
        <p class="mono">The two graded sessions</p>
${st.levels.map((lv) => `        <div class="pg-plate pg-plate-hue">
          <p class="mono">Level ${lv.code} &middot; ends at session ${lv.gate.n}</p>
          <h3>${t(lv.gate.title)}</h3>
          <p>${t(lv.gate.objective)}</p>
        </div>`).join('\n')}
        <p class="pg-from mono">${revs} review sessions sit inside the ${st.units.length}
          units, so nothing waits for the gate to be revisited.</p>
      </div>
    </div>
  </div>
</section>

<section class="pg-sec" aria-labelledby="h-units">
  <div class="pg-wrap">
    <h2 id="h-units">The ${st.units.length} units, in&nbsp;order</h2>
    <table class="pg-table st-ut">
      <caption>${t(st.piece)} Stage &middot; ${st.units.length} units across
        ${st.levels.length} levels</caption>
      <thead><tr><th scope="col">Unit</th><th scope="col">What it teaches</th>
        <th scope="col">Level</th><th scope="col">Sessions</th><th scope="col">Positions</th></tr></thead>
      <tbody>
${st.units.map((u) => `        <tr><th scope="row" class="n">${u.number}</th>
          <td><a href="#su${u.number}">${t(u.name)}</a></td>
          <td class="n">${u.levels.join(' ')}</td>
          <td class="n">${u.count} &nbsp;<span class="mono">(${u.sessions[0].n}&ndash;${u.sessions[u.count - 1].n})</span></td>
          <td class="n">${u.sessions.reduce((a, s) => a + s.puzzles, 0)}</td></tr>`).join('\n')}
      </tbody>
    </table>
  </div>
</section>

<section class="pg-sec st-all" aria-labelledby="h-all">
  <div class="pg-wrap">
    <h2 id="h-all">Every session in ${t(st.piece)} Stage</h2>
    <p class="lead">In teaching order, with the idea each lesson is about and its stated
      objective &mdash; both in the curriculum&rsquo;s own words.</p>
${levelBlocks}
    <p class="pg-from mono">Titles, objectives, lengths and position counts read off curriculum
      bundle ${esc(D.bundle)}.</p>
  </div>
  <p class="pg-coord">stage ${st.number}</p>
</section>

<section class="pg-sec" aria-labelledby="h-onward">
  <div class="pg-wrap">
    <h2 id="h-onward">What comes&nbsp;next</h2>
    <div class="prose"><p>${t(c.next)}</p></div>
    <nav class="st-onward" aria-label="Other stages">
${prev ? `      <a class="pg-plate st-on" href="/curriculum/${prev.slug}" style="--hue:${prev.hue}">
        <p class="mono"><span class="dot" aria-hidden="true"></span>Before this &middot; stage ${prev.number}</p>
        <h3>${t(prev.piece)} Stage &mdash; ${t(prev.themeName)}</h3>
        <p class="mono">${prev.sessions.length} sessions &middot; entry age ${prev.ages}</p>
      </a>` : `      <a class="pg-plate st-on" href="/curriculum">
        <p class="mono"><span class="dot" aria-hidden="true"></span>This is where it starts</p>
        <h3>The whole curriculum</h3>
        <p class="mono">${D.sessions} sessions &middot; ${D.stages} stages</p>
      </a>`}
${next ? `      <a class="pg-plate st-on" href="/curriculum/${next.slug}" style="--hue:${next.hue}">
        <p class="mono"><span class="dot" aria-hidden="true"></span>After this &middot; stage ${next.number}</p>
        <h3>${t(next.piece)} Stage &mdash; ${t(next.themeName)}</h3>
        <p class="mono">${next.sessions.length} sessions &middot; entry age ${next.ages}</p>
      </a>` : `      <a class="pg-plate st-on" href="/curriculum">
        <p class="mono"><span class="dot" aria-hidden="true"></span>This is the last one</p>
        <h3>Back to the whole curriculum</h3>
        <p class="mono">${D.sessions} sessions &middot; ${D.stages} stages</p>
      </a>`}
    </nav>
    <div class="pg-cta-row">
      <a class="cta" href="/teach">Teach a free session</a>
      <a class="cta ghost" href="/inside-a-session">See what an hour contains</a>
    </div>
  </div>
</section>`;

  return { page, body };
}

module.exports = { STAGE_COPY, minRange, band, level, unit, row, trackControl, rail, mapPage, stagePage };



