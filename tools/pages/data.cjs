/**
 * ONE SOURCE OF TRUTH for every figure the supporting pages print.
 *
 * The rule STATE.md binds every edit to — "every figure must survive a count against
 * app/data/*.json, or trace to a document in CurriculumWebsite/docs/product/" — is
 * satisfied here by never writing a number into a template. Templates call fields of
 * the object this module returns; this module counts them off the bundle.
 *
 * WHICH FILE OWNS WHICH FIGURE, because two of them disagree and the pages must not.
 *
 *  - `catalog.json` (bundle 1.1.0, cut 2026-08-29) owns everything the pages LIST:
 *    the 213 sessions, their titles, objectives, levels, units, minutes, puzzle counts,
 *    age bands and prerequisites. A total printed beside a list has to be that list's
 *    own sum or the page contradicts itself on screen — so minutes, puzzles and session
 *    counts all come from here.
 *  - `stages.json` owns the five stages, their ten levels and their thirty units.
 *  - `inventory.json` (counted off the curriculum repo's 213 files, 2026-09-05) owns the
 *    roll-ups the bundle catalogue cannot give: segments, questions, activities, the
 *    homework fields, the Foundation/Core/Challenge split and the thinking routines.
 *    It is the same file act 6 counts its figures off, so the two agree by construction.
 *  - `tracks.json` owns Explorer/Challenger, and every clause in it carries a `from`
 *    naming the decision record it was transcribed from.
 *
 * The two that disagree: `inventory.minutes.planned` is 12,630 and catalog's own sum is
 * 12,575, because all 213 upstream session files were rewritten after the bundle was cut.
 * The pages print catalog's, for the reason above. Neither number is wrong; printing both
 * would be.
 *
 * `stage_index.json` is deliberately NOT used for per-session content. Its
 * `primary_concepts` array is one concept per session for stages 1-3 but 30 of 44 for
 * stage 4 and 15 of 40 for stage 5, and nine of the entries it does carry disagree with
 * catalog's own `concept` field for the session at that index. It is a partial stage-level
 * list, not a session map, and treating it as one would have printed the wrong concept
 * against nine sessions and nothing against 39.
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', '..', 'app', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

/** 1640 -> "1,640". The site's own numeral convention (util.js's fmt). */
const fmt = (n) => Number(n).toLocaleString('en-US');

/** "5-7" -> "5–7". The bundle writes hyphens; the site sets en dashes. */
const band = (s) => String(s || '').replace(/-/g, '–');

/** The three sessions anyone can teach right now, in /teach. Same list as teach/main.js. */
const FREE = ['S001', 'S042', 'S115'];

/**
 * Session `type` as a reader's word. Eight distinct values are authored across the 213
 * files; the bundle's own snake_case is internal metadata and never printed.
 * Counted: teaching 137, review 34, practice 20, assessment 9, game_review 7,
 * tournament_prep 3, confidence 2, milestone 1.
 */
const TYPE = {
  teaching: 'Teaching',
  review: 'Review',
  practice: 'Guided practice',
  assessment: 'Checkpoint',
  game_review: 'Model game',
  tournament_prep: 'Tournament prep',
  confidence: 'Confidence',
  milestone: 'Graduation',
};

/** The stage hues, which are curriculum data: stage_index.json declares a colour per stage. */
const HUE = { 1: '#3fa57a', 2: '#4a8bd0', 3: '#9070ce', 4: '#d2604b', 5: '#c9a227' };

/**
 * A checkpoint is a session whose type gates a level. `assessment` (9) and `milestone` (1)
 * are the two, and there are exactly ten of them for exactly ten levels — each the last
 * session of its own level. That is what makes "every level ends in a checkpoint" a
 * countable claim rather than a slogan, so it is asserted here rather than assumed.
 */
const isGate = (s) => s.type === 'assessment' || s.type === 'milestone';

function load() {
  const cat = read('catalog.json');
  const stages = read('stages.json');
  const inv = read('inventory.json');
  const tracks = read('tracks.json');
  const pathways = read('pathways.json');
  const pricing = read('pricing.json');
  const showcase = read('showcase.json');

  const S = cat.sessions;
  const tally = (f) => S.reduce((a, s) => { const k = f(s); a[k] = (a[k] || 0) + 1; return a; }, {});
  const sum = (f) => S.reduce((a, s) => a + (f(s) || 0), 0);

  const perLevel = tally((s) => s.level);
  const ages = Object.keys(tally((s) => s.ageBand))
    .flatMap((b) => b.split('-').map(Number));

  // ------------------------------------------------------------------ the hierarchy
  // Five stages, each with its two levels, its six units and its own sessions, resolved
  // once so no template has to filter the catalogue itself.
  const byStage = stages.stages.map((st) => {
    const mine = S.filter((s) => s.stage === st.number);
    const levels = st.levels.map((lv) => {
      const rows = mine.filter((s) => s.level === lv.code);
      return {
        ...lv,
        sessions: rows,
        count: rows.length,
        gate: rows.filter(isGate).slice(-1)[0] || null,
        first: rows[0],
        last: rows[rows.length - 1],
      };
    });
    const units = st.units.map((u) => {
      const rows = mine.filter((s) => s.unit === u.number);
      return { ...u, sessions: rows, count: rows.length, levels: [...new Set(rows.map((r) => r.level))] };
    });
    return {
      ...st,
      hue: HUE[st.number],
      ages: band(st.ageBand),
      rating: band(st.ratingBand),
      // The theme field is "Title — sentence"; the two halves do different jobs on a page.
      themeName: st.theme.split('—')[0].trim(),
      themeBody: (st.theme.split('—')[1] || '').trim(),
      sessions: mine,
      levels,
      units,
      first: mine[0],
      last: mine[mine.length - 1],
      gates: mine.filter(isGate),
      minutes: mine.reduce((a, s) => a + s.minutes, 0),
      puzzles: mine.reduce((a, s) => a + s.puzzles, 0),
      free: mine.filter((s) => FREE.includes(s.id)),
    };
  });

  const checkpoints = S.filter(isGate);
  const levelCount = byStage.reduce((a, st) => a + st.levels.length, 0);

  // The claim is only publishable if it holds session by session, so it is proved here and
  // the generator refuses to build if it ever stops holding.
  const everyLevelGated = byStage.every((st) => st.levels.every((lv) => lv.gate && lv.gate.id === lv.last.id));

  const D = {
    bundle: cat.bundle_version,
    generated: cat.generated,

    sessions: S.length,
    stages: byStage.length,
    levels: levelCount,
    units: byStage.reduce((a, st) => a + st.units.length, 0),
    puzzles: sum((s) => s.puzzles),
    minutes: sum((s) => s.minutes),
    hours: Math.round(sum((s) => s.minutes) / 60),

    ageLo: Math.min(...ages),
    ageHi: Math.max(...ages),
    ageSpan: `${Math.min(...ages)}–${Math.max(...ages)}`,

    // the shortest and longest hour the curriculum plans for, and the one it mostly plans
    minMin: Math.min(...S.map((s) => s.minutes)),
    maxMin: Math.max(...S.map((s) => s.minutes)),
    modeMin: Number(Object.entries(tally((s) => s.minutes)).sort((a, b) => b[1] - a[1])[0][0]),

    perLevel,
    perType: tally((s) => s.type),
    perAge: tally((s) => s.ageBand),

    // off inventory.json — the curriculum-repo roll-ups the catalogue does not carry
    segments: inv.segments,
    questions: inv.questions,
    activities: inv.activities,
    demonstrations: inv.demonstrations,
    outcomes: inv.outcomes,
    tiers: inv.tiers,
    homework: inv.homework,
    coachNotes: inv.coachNotes,
    routines: inv.thinkingRoutines,
    routineNames: Object.keys(inv.thinkingRoutines).filter((k) => k !== 'none'),

    checkpoints,
    everyLevelGated,
    // Only S001 stands on nothing; the deepest session names eleven before it.
    openers: S.filter((s) => !s.prerequisites.length).map((s) => s.id),
    maxPrereq: Math.max(...S.map((s) => s.prerequisites.length)),

    byStage,
    byId: Object.fromEntries(S.map((s) => [s.id, s])),
    free: FREE.map((id) => S.find((s) => s.id === id)),
    freeLessons: FREE.map((id) => showcase.data[id]),

    // check C of `npm run bundle:validate` on the re-exported 1.1.0 bundle (2026-09-06,
    // after the curriculum QA pass): 3,111 FEN legality checks + 1,640 solution lines.
    // The fen_index is the source for unique positions (2,346).
    verified: { checks: 4751, errors: 0, positions: 2346 },
  };

  if (!D.everyLevelGated) throw new Error('a level no longer ends in its checkpoint — fix the copy, not this check');
  if (D.puzzles !== inv.puzzles) throw new Error(`puzzle count drift: catalog ${D.puzzles} vs inventory ${inv.puzzles}`);
  if (D.sessions !== inv.sessions) throw new Error(`session count drift: catalog ${D.sessions} vs inventory ${inv.sessions}`);

  return { cat, stages, inv, tracks, pathways, pricing, showcase, D };
}

module.exports = { load, fmt, band, TYPE, HUE, FREE, isGate };
