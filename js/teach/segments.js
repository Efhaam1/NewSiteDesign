/**
 * A lesson turned into what a coach actually does, minute by minute.
 *
 * The bundle stores teaching_flow as named fields; a class is experienced as
 * ordered segments, and inside a segment as a sequence of beats — one position or
 * one talking moment at a time. Ported from the previous build, where the shape was
 * already right.
 */
const STARS = { Foundation: 1, Core: 2, Challenge: 3, Mastery: 4 };

/** The stepper needs at least one beat per segment or advancing would stall. */
const orOne = (beats) => (beats.length ? beats : [{}]);

export function buildSegments(lesson) {
  const flow = lesson.teaching_flow || {};
  const out = [];

  // Warm-up survives on its description alone: S001 has no prior content to review,
  // so review_items is empty, but the description is a 300-character opener.
  const review = flow.warmup_review;
  if (review && (review.description || (review.review_items || []).length)) {
    out.push({
      key: 'warmup', label: 'Warm-up', minutes: review.duration_min,
      body: review.description,
      beats: orOne((review.review_items || []).map((it) => ({
        fen: it.fen, prompt: it.prompt, answer: it.answer,
        tag: it.revisits ? `revisits ${it.revisits}` : undefined, gated: true,
      }))),
    });
  }

  const intro = flow.lesson_introduction;
  if (intro) {
    out.push({
      key: 'intro', label: 'Introduction', minutes: intro.duration_min,
      body: intro.hook,
      bullets: [intro.narrative, intro.description].filter(Boolean),
      beats: [{}],
    });
  }

  const core = flow.core_explanation;
  if (core) {
    out.push({
      key: 'core', label: 'Core explanation', minutes: core.duration_min,
      body: core.explanation, bullets: core.key_points,
      beats: orOne((core.demonstrations || []).map((d) => ({
        fen: d.fen, prompt: d.caption, answer: d.explanation,
      }))),
    });
  }

  const disc = flow.guided_discussion;
  if (disc) {
    out.push({
      key: 'discussion', label: 'Discussion', minutes: disc.duration_min,
      body: disc.description, bullets: disc.talking_points,
      questions: flow.questions_to_ask, beats: [{}],
    });
  }

  if ((flow.guided_examples || []).length) {
    out.push({
      key: 'guided', label: 'Guided practice',
      beats: flow.guided_examples.map((g) => ({
        fen: g.fen, prompt: g.prompt, answer: g.answer || g.walkthrough, gated: true,
      })),
    });
  }

  if ((lesson.puzzles || []).length) {
    out.push({
      key: 'puzzles', label: 'Puzzles',
      beats: lesson.puzzles.map((p) => ({
        fen: p.fen, moves: p.solution && p.solution.moves,
        prompt: p.prompt, answer: p.explanation, tag: p.id,
        result: p.solution && p.solution.result,
        sanLine: p.solution && p.solution.san_line,
        sideToMove: p.side_to_move, difficulty: p.difficulty,
        stars: p.difficulty_stars || STARS[p.difficulty] || 1,
        mistakes: p.common_mistakes, themes: p.theme, hint: p.hint, gated: true,
      })),
    });
  }

  const act = lesson.practical_activity;
  if (act) {
    out.push({
      key: 'activity', label: act.name || 'Activity', minutes: act.duration_min,
      body: act.setup || act.learning_objective, bullets: act.instructions,
      // starting_fen exists in 124 of the 213 bundle sessions but in none of the three
      // free ones, so this beat usually has no board. Nothing is invented for it.
      beats: [{ fen: act.starting_fen, answer: act.success_criteria }],
    });
  }

  // Homework happens at home, so it carries no in-class minutes. What it does carry
  // is the work itself, in the bundle's own words.
  const hw = lesson.homework || {};
  out.push({
    key: 'homework', label: 'Homework', minutes: null,
    body: `${(hw.online_practice || []).length} online, ${(hw.over_the_board || []).length} over the board · ${hw.estimated_time_min || 0} min at home`,
    bullets: [...(hw.online_practice || []), ...(hw.over_the_board || [])],
    beats: [{}],
  });
  return out;
}
