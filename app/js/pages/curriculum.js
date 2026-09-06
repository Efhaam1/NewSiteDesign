/**
 * The curriculum map's two enhancements. Both operate on markup that is already complete:
 * remove this file and the page is still the whole syllabus, every row visible.
 *
 * 1. THE READING INDICATOR. The rail marks the stage a reader is in and opens that stage's
 *    two levels. An IntersectionObserver on the five bands, not a scroll listener — the
 *    page is ~19,000px tall and a scroll handler measuring five elements on every frame is
 *    the one thing that would make a document page feel worse than the film.
 *
 * 2. THE FILTER. Four buttons, and the only thing on the page that removes anything. It
 *    hides rows, and then hides any unit, level or band left holding nothing, because a
 *    head over an empty list reads as a bug rather than as a filter.
 */
const rail = document.querySelector('.cu-rail');
const bands = [...document.querySelectorAll('.cu-band')];

if (rail && bands.length) {
  const items = new Map();
  for (const li of rail.querySelectorAll(':scope > ol > li')) {
    const a = li.querySelector(':scope > a[data-stage]');
    if (a) items.set(a.dataset.stage, li);
  }

  let current = null;
  const mark = (stage) => {
    if (stage === current) return;
    current = stage;
    for (const [k, li] of items) li.classList.toggle('is-on', k === stage);
  };

  /**
   * The band whose top is nearest the reading line wins. `rootMargin` puts that line about
   * a third of the way down the viewport rather than at its very top, which is where a
   * reader's eye actually is; without it the indicator flips to the next stage while the
   * previous stage's last unit is still the only thing on screen.
   *
   * The set is what makes it deterministic. An observer callback carries the entries that
   * CHANGED, in no guaranteed order, so a jump that crosses two bands at once delivers both
   * and `for (const e of entries) if (e.isIntersecting) mark(...)` marks whichever happened
   * to be last in the array — measured landing on stage 2 for a scroll into stage 3. So
   * intersection state is kept, and the deepest band currently on the line is the one a
   * reader is in.
   */
  const live = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) live.add(e.target);
      else live.delete(e.target);
    }
    if (!live.size) return;
    const deepest = bands.filter((x) => live.has(x)).pop();
    if (deepest) mark(deepest.dataset.stage);
  }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
  for (const b of bands) io.observe(b);
  mark(bands[0].dataset.stage);

  // Clicking a rail link marks its stage immediately: the smooth scroll takes long enough
  // that waiting for the observer reads as a dead press.
  for (const [k, li] of items) {
    li.querySelector('a[data-stage]').addEventListener('click', () => mark(k));
  }
}

/* ------------------------------------------------------------------------ the filter */
const filters = [...document.querySelectorAll('.cu-filter [data-filter]')];
const count = document.querySelector('.cu-count');

if (filters.length) {
  const rows = [...document.querySelectorAll('.cu-s')];
  const total = rows.length;

  /** What each button means, in terms of a row's own attributes. */
  const TEST = {
    all: () => true,
    // Nine sessions are typed `assessment` and the last one `milestone`; both are gates,
    // and a filter that tested only the first would return nine for ten levels.
    gate: (li) => li.classList.contains('is-gate'),
    review: (li) => li.dataset.type === 'review',
    free: (li) => !!li.querySelector('.pg-chip-free'),
  };

  const apply = (key) => {
    const test = TEST[key] || TEST.all;
    let shown = 0;
    for (const li of rows) {
      const on = test(li);
      li.hidden = !on;
      if (on) shown++;
    }
    // Then collapse whatever is left holding nothing, innermost first.
    for (const sel of ['.cu-u', '.cu-l', '.cu-band']) {
      for (const box of document.querySelectorAll(sel)) {
        box.hidden = !box.querySelector('.cu-s:not([hidden])');
      }
    }
    for (const b of filters) b.setAttribute('aria-pressed', String(b.dataset.filter === key));
    if (count) {
      count.textContent = key === 'all'
        ? `all ${total} sessions`
        : `${shown} of ${total} sessions`;
    }
  };

  for (const b of filters) b.addEventListener('click', () => apply(b.dataset.filter));
  apply('all');
}
